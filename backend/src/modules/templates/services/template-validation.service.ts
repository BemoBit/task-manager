import { Injectable, Logger } from '@nestjs/common';
import { ITemplateContent, IValidationResult, ITemplateVariable } from '../interfaces/template.interface';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

@Injectable()
export class TemplateValidationService {
  private readonly logger = new Logger(TemplateValidationService.name);
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  /**
   * Validate template content
   */
  async validate(content: ITemplateContent): Promise<IValidationResult> {
    const errors: IValidationResult['errors'] = [];
    const warnings: IValidationResult['warnings'] = [];

    // Validate structure
    if (!content.sections || !Array.isArray(content.sections)) {
      errors.push({
        path: 'sections',
        message: 'Sections must be an array',
        type: 'schema',
      });
      return { valid: false, errors, warnings };
    }

    // Validate sections
    for (const [index, section] of content.sections.entries()) {
      const sectionErrors = this.validateSection(section, `sections[${index}]`);
      errors.push(...sectionErrors);
    }

    // Validate global variables
    if (content.globalVariables) {
      for (const [index, variable] of content.globalVariables.entries()) {
        const varErrors = this.validateVariable(variable, `globalVariables[${index}]`);
        errors.push(...varErrors);
      }
    }

    // Check for duplicate variable names
    const duplicateVars = this.findDuplicateVariables(content);
    if (duplicateVars.length > 0) {
      duplicateVars.forEach((varName) => {
        errors.push({
          path: 'globalVariables',
          message: `Duplicate variable name: ${varName}`,
          type: 'variable',
        });
      });
    }

    // Validate variable references in content
    const unresolvedRefs = this.checkVariableReferences(content);
    unresolvedRefs.forEach((ref) => {
      warnings.push({
        path: ref.path,
        message: `Unresolved variable reference: {{${ref.variable}}}`,
      });
    });

    // Validate conditional logic
    for (const section of content.sections) {
      if (section.conditionalLogic) {
        for (const [index, logic] of section.conditionalLogic.entries()) {
          const logicErrors = this.validateConditionalLogic(
            logic,
            content,
            `sections[${section.id}].conditionalLogic[${index}]`,
          );
          errors.push(...logicErrors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a single section
   */
  private validateSection(section: any, path: string): IValidationResult['errors'] {
    const errors: IValidationResult['errors'] = [];

    if (!section.id) {
      errors.push({ path, message: 'Section must have an id', type: 'schema' });
    }

    if (!section.title) {
      errors.push({ path, message: 'Section must have a title', type: 'schema' });
    }

    if (!section.type) {
      errors.push({ path, message: 'Section must have a type', type: 'schema' });
    }

    if (typeof section.order !== 'number') {
      errors.push({ path, message: 'Section order must be a number', type: 'schema' });
    }

    // Validate subsections recursively
    if (section.subsections && Array.isArray(section.subsections)) {
      for (const [index, subsection] of section.subsections.entries()) {
        const subErrors = this.validateSection(subsection, `${path}.subsections[${index}]`);
        errors.push(...subErrors);
      }
    }

    // Validate section variables
    if (section.variables && Array.isArray(section.variables)) {
      for (const [index, variable] of section.variables.entries()) {
        const varErrors = this.validateVariable(variable, `${path}.variables[${index}]`);
        errors.push(...varErrors);
      }
    }

    return errors;
  }

  /**
   * Validate a variable
   */
  private validateVariable(variable: any, path: string): IValidationResult['errors'] {
    const errors: IValidationResult['errors'] = [];

    if (!variable.id) {
      errors.push({ path, message: 'Variable must have an id', type: 'schema' });
    }

    if (!variable.name) {
      errors.push({ path, message: 'Variable must have a name', type: 'schema' });
    }

    // Validate variable name format (alphanumeric and underscores only)
    if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      errors.push({
        path,
        message: 'Variable name must start with letter or underscore and contain only alphanumeric characters and underscores',
        type: 'variable',
      });
    }

    const validTypes = ['string', 'number', 'boolean', 'array', 'object', 'date'];
    if (!validTypes.includes(variable.type)) {
      errors.push({
        path,
        message: `Variable type must be one of: ${validTypes.join(', ')}`,
        type: 'schema',
      });
    }

    const validScopes = ['global', 'section'];
    if (!validScopes.includes(variable.scope)) {
      errors.push({
        path,
        message: `Variable scope must be one of: ${validScopes.join(', ')}`,
        type: 'schema',
      });
    }

    // Validate default value matches type
    if (variable.defaultValue !== undefined && variable.defaultValue !== null) {
      const typeError = this.validateValueType(variable.defaultValue, variable.type);
      if (typeError) {
        errors.push({
          path,
          message: `Default value type mismatch: ${typeError}`,
          type: 'variable',
        });
      }
    }

    // Validate validation rules
    if (variable.validation) {
      const validationErrors = this.validateValidationRule(variable.validation, path);
      errors.push(...validationErrors);
    }

    return errors;
  }

  /**
   * Validate a validation rule
   */
  private validateValidationRule(rule: any, path: string): IValidationResult['errors'] {
    const errors: IValidationResult['errors'] = [];

    const validRuleTypes = ['regex', 'range', 'length', 'enum', 'custom'];
    if (!validRuleTypes.includes(rule.type)) {
      errors.push({
        path: `${path}.validation`,
        message: `Validation rule type must be one of: ${validRuleTypes.join(', ')}`,
        type: 'schema',
      });
    }

    if (!rule.rule) {
      errors.push({
        path: `${path}.validation`,
        message: 'Validation rule must have a rule property',
        type: 'schema',
      });
    }

    // Validate regex patterns
    if (rule.type === 'regex') {
      try {
        new RegExp(rule.rule);
      } catch (error) {
        errors.push({
          path: `${path}.validation`,
          message: `Invalid regex pattern: ${error}`,
          type: 'custom',
        });
      }
    }

    return errors;
  }

  /**
   * Validate conditional logic
   */
  private validateConditionalLogic(
    logic: any,
    content: ITemplateContent,
    path: string,
  ): IValidationResult['errors'] {
    const errors: IValidationResult['errors'] = [];

    if (!logic.id) {
      errors.push({ path, message: 'Conditional logic must have an id', type: 'schema' });
    }

    if (!logic.condition) {
      errors.push({ path, message: 'Conditional logic must have a condition', type: 'schema' });
    }

    if (!logic.action) {
      errors.push({ path, message: 'Conditional logic must have an action', type: 'schema' });
    }

    const validActions = ['show', 'hide', 'require', 'disable'];
    if (!validActions.includes(logic.action)) {
      errors.push({
        path,
        message: `Action must be one of: ${validActions.join(', ')}`,
        type: 'schema',
      });
    }

    // Validate condition
    if (logic.condition) {
      const conditionErrors = this.validateCondition(logic.condition, content, `${path}.condition`);
      errors.push(...conditionErrors);
    }

    return errors;
  }

  /**
   * Validate a condition
   */
  private validateCondition(
    condition: any,
    content: ITemplateContent,
    path: string,
  ): IValidationResult['errors'] {
    const errors: IValidationResult['errors'] = [];

    const validTypes = ['simple', 'compound'];
    if (!validTypes.includes(condition.type)) {
      errors.push({
        path,
        message: `Condition type must be one of: ${validTypes.join(', ')}`,
        type: 'schema',
      });
    }

    if (condition.type === 'simple') {
      if (!condition.variable) {
        errors.push({ path, message: 'Simple condition must reference a variable', type: 'schema' });
      } else {
        // Check if variable exists
        const varExists = this.variableExists(condition.variable, content);
        if (!varExists) {
          errors.push({
            path,
            message: `Referenced variable '${condition.variable}' does not exist`,
            type: 'variable',
          });
        }
      }

      const validComparisons = ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists'];
      if (condition.comparison && !validComparisons.includes(condition.comparison)) {
        errors.push({
          path,
          message: `Comparison must be one of: ${validComparisons.join(', ')}`,
          type: 'schema',
        });
      }
    }

    if (condition.type === 'compound') {
      if (!condition.operator) {
        errors.push({ path, message: 'Compound condition must have an operator', type: 'schema' });
      }

      const validOperators = ['AND', 'OR'];
      if (!validOperators.includes(condition.operator)) {
        errors.push({
          path,
          message: `Operator must be one of: ${validOperators.join(', ')}`,
          type: 'schema',
        });
      }

      if (!condition.conditions || !Array.isArray(condition.conditions)) {
        errors.push({
          path,
          message: 'Compound condition must have an array of conditions',
          type: 'schema',
        });
      } else {
        // Validate nested conditions
        for (const [index, nestedCondition] of condition.conditions.entries()) {
          const nestedErrors = this.validateCondition(
            nestedCondition,
            content,
            `${path}.conditions[${index}]`,
          );
          errors.push(...nestedErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Find duplicate variable names
   */
  private findDuplicateVariables(content: ITemplateContent): string[] {
    const names = new Set<string>();
    const duplicates = new Set<string>();

    // Check global variables
    if (content.globalVariables) {
      for (const variable of content.globalVariables) {
        if (names.has(variable.name)) {
          duplicates.add(variable.name);
        }
        names.add(variable.name);
      }
    }

    return Array.from(duplicates);
  }

  /**
   * Check if variable exists in content
   */
  private variableExists(varName: string, content: ITemplateContent): boolean {
    // Check global variables
    if (content.globalVariables) {
      if (content.globalVariables.some((v) => v.name === varName)) {
        return true;
      }
    }

    // Check section variables
    for (const section of content.sections) {
      if (section.variables && section.variables.some((v) => v.name === varName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for unresolved variable references in content
   */
  private checkVariableReferences(
    content: ITemplateContent,
  ): Array<{ path: string; variable: string }> {
    const unresolvedRefs: Array<{ path: string; variable: string }> = [];
    const variableNames = new Set<string>();

    // Collect all variable names
    if (content.globalVariables) {
      content.globalVariables.forEach((v) => variableNames.add(v.name));
    }

    content.sections.forEach((section) => {
      if (section.variables) {
        section.variables.forEach((v) => variableNames.add(v.name));
      }
    });

    // Check references in section content
    for (const [index, section] of content.sections.entries()) {
      const references = this.extractVariableReferences(section.content);
      for (const ref of references) {
        if (!variableNames.has(ref)) {
          unresolvedRefs.push({
            path: `sections[${index}].content`,
            variable: ref,
          });
        }
      }
    }

    return unresolvedRefs;
  }

  /**
   * Extract variable references from text ({{variableName}})
   */
  private extractVariableReferences(text: string): string[] {
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  /**
   * Validate value type
   */
  private validateValueType(value: any, expectedType: string): string | null {
    switch (expectedType) {
      case 'string':
        return typeof value !== 'string' ? 'Expected string' : null;
      case 'number':
        return typeof value !== 'number' ? 'Expected number' : null;
      case 'boolean':
        return typeof value !== 'boolean' ? 'Expected boolean' : null;
      case 'array':
        return !Array.isArray(value) ? 'Expected array' : null;
      case 'object':
        return typeof value !== 'object' || value === null || Array.isArray(value)
          ? 'Expected object'
          : null;
      case 'date':
        return !(value instanceof Date) && isNaN(Date.parse(value)) ? 'Expected date' : null;
      default:
        return `Unknown type: ${expectedType}`;
    }
  }
}
