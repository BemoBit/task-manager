import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ITemplateContent,
  IRenderContext,
  IRenderResult,
  ITemplateSection,
  VariableValue,
  HelperFunction,
} from '../interfaces/template.interface';
import Handlebars from 'handlebars';

@Injectable()
export class TemplateRenderService {
  private readonly logger = new Logger(TemplateRenderService.name);
  private readonly handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerDefaultHelpers();
  }

  /**
   * Render template with provided context
   */
  async render(content: ITemplateContent, context: IRenderContext): Promise<IRenderResult> {
    try {
      const errors: IRenderResult['errors'] = [];
      const warnings: string[] = [];
      const renderedSections: IRenderResult['sections'] = [];

      // Register custom helpers if provided
      if (context.helpers) {
        for (const [name, helper] of Object.entries(context.helpers)) {
          this.handlebars.registerHelper(name, helper as any);
        }
      }

      // Register partials if provided
      if (context.partials) {
        for (const [name, partial] of Object.entries(context.partials)) {
          this.handlebars.registerPartial(name, partial);
        }
      }

      // Merge global variables with provided variables
      const variables = this.mergeVariables(content, context.variables);

      // Render each section
      for (const section of content.sections) {
        try {
          const shouldRender = this.evaluateConditionalLogic(section, variables);

          if (shouldRender) {
            const rendered = await this.renderSection(section, variables, context);
            renderedSections.push({
              id: section.id,
              title: section.title,
              content: rendered,
            });
          }
        } catch (error) {
          errors.push({
            type: 'render',
            message: `Failed to render section ${section.id}: ${error}`,
            location: `sections.${section.id}`,
          });
        }
      }

      // Generate output
      let output = '';
      if (renderedSections.length > 0) {
        output = renderedSections
          .map((section) => {
            return `# ${section.title}\n\n${section.content}\n`;
          })
          .join('\n');
      }

      return {
        success: errors.length === 0,
        output,
        sections: renderedSections,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.logger.error(`Render failed: ${error}`);
      return {
        success: false,
        errors: [
          {
            type: 'fatal',
            message: `Rendering failed: ${error}`,
          },
        ],
      };
    }
  }

  /**
   * Render a single section
   */
  private async renderSection(
    section: ITemplateSection,
    variables: Record<string, VariableValue>,
    context: IRenderContext,
  ): Promise<string> {
    // Add section-specific variables
    const sectionVariables = { ...variables };
    if (section.variables) {
      for (const variable of section.variables) {
        if (!(variable.name in sectionVariables)) {
          sectionVariables[variable.name] = variable.defaultValue || null;
        }
      }
    }

    // Compile and render content
    let renderedContent = this.interpolateVariables(section.content, sectionVariables, context);

    // Render subsections recursively
    if (section.subsections && section.subsections.length > 0) {
      const subsectionsContent: string[] = [];

      for (const subsection of section.subsections) {
        const shouldRender = this.evaluateConditionalLogic(subsection, sectionVariables);

        if (shouldRender) {
          const rendered = await this.renderSection(subsection, sectionVariables, context);
          subsectionsContent.push(`## ${subsection.title}\n\n${rendered}`);
        }
      }

      if (subsectionsContent.length > 0) {
        renderedContent += '\n\n' + subsectionsContent.join('\n\n');
      }
    }

    return renderedContent;
  }

  /**
   * Interpolate variables in text
   */
  private interpolateVariables(
    text: string,
    variables: Record<string, VariableValue>,
    context: IRenderContext,
  ): string {
    try {
      const template = this.handlebars.compile(text, {
        strict: context.options?.strict || false,
        noEscape: !context.options?.escapeHtml,
      });

      return template(variables);
    } catch (error) {
      this.logger.warn(`Variable interpolation failed: ${error}`);
      return text;
    }
  }

  /**
   * Merge global variables with provided variables
   */
  private mergeVariables(
    content: ITemplateContent,
    providedVariables: Record<string, VariableValue>,
  ): Record<string, VariableValue> {
    const merged: Record<string, VariableValue> = {};

    // Add global variables with their default values
    if (content.globalVariables) {
      for (const variable of content.globalVariables) {
        merged[variable.name] = variable.defaultValue || null;
      }
    }

    // Override with provided variables
    Object.assign(merged, providedVariables);

    return merged;
  }

  /**
   * Evaluate conditional logic for a section
   */
  private evaluateConditionalLogic(
    section: ITemplateSection,
    variables: Record<string, VariableValue>,
  ): boolean {
    if (!section.conditionalLogic || section.conditionalLogic.length === 0) {
      return true;
    }

    // Evaluate all conditional logic rules
    for (const logic of section.conditionalLogic) {
      const conditionMet = this.evaluateCondition(logic.condition, variables);

      if (conditionMet && logic.action === 'hide') {
        return false;
      }

      if (!conditionMet && logic.action === 'show') {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    condition: any,
    variables: Record<string, VariableValue>,
  ): boolean {
    if (condition.type === 'simple') {
      const variableValue = variables[condition.variable];

      switch (condition.comparison) {
        case 'equals':
          return variableValue === condition.value;
        case 'notEquals':
          return variableValue !== condition.value;
        case 'contains':
          return (
            typeof variableValue === 'string' &&
            typeof condition.value === 'string' &&
            variableValue.includes(condition.value)
          );
        case 'greaterThan':
          return (
            typeof variableValue === 'number' &&
            typeof condition.value === 'number' &&
            variableValue > condition.value
          );
        case 'lessThan':
          return (
            typeof variableValue === 'number' &&
            typeof condition.value === 'number' &&
            variableValue < condition.value
          );
        case 'exists':
          return variableValue !== undefined && variableValue !== null;
        default:
          return false;
      }
    }

    if (condition.type === 'compound') {
      const results = condition.conditions.map((c: any) => this.evaluateCondition(c, variables));

      if (condition.operator === 'AND') {
        return results.every((r: boolean) => r);
      }

      if (condition.operator === 'OR') {
        return results.some((r: boolean) => r);
      }
    }

    return false;
  }

  /**
   * Register default Handlebars helpers
   */
  private registerDefaultHelpers(): void {
    // Uppercase helper
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : str;
    });

    // Lowercase helper
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : str;
    });

    // Capitalize helper
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (typeof str !== 'string') return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Date format helper
    this.handlebars.registerHelper('dateFormat', (date: Date | string, format?: string) => {
      const d = date instanceof Date ? date : new Date(date);
      // Simple date formatting
      return d.toLocaleDateString();
    });

    // JSON stringify helper
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // Default value helper
    this.handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value !== undefined && value !== null ? value : defaultValue;
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    this.handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    this.handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    this.handlebars.registerHelper('gte', (a: any, b: any) => a >= b);

    // Array helpers
    this.handlebars.registerHelper('join', (arr: any[], separator: string) => {
      return Array.isArray(arr) ? arr.join(separator || ', ') : '';
    });

    this.handlebars.registerHelper('length', (arr: any[] | string) => {
      return arr ? arr.length : 0;
    });

    // String helpers
    this.handlebars.registerHelper('trim', (str: string) => {
      return typeof str === 'string' ? str.trim() : str;
    });

    this.handlebars.registerHelper('replace', (str: string, search: string, replace: string) => {
      if (typeof str !== 'string') return str;
      return str.replace(new RegExp(search, 'g'), replace);
    });

    // Math helpers
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b);
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    this.handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    this.handlebars.registerHelper('divide', (a: number, b: number) => (b !== 0 ? a / b : 0));
    this.handlebars.registerHelper('mod', (a: number, b: number) => a % b);
  }
}
