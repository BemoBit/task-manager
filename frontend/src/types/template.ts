/**
 * Template Editor Types
 * Defines all types for the template editor system
 */

export type VariableScope = 'global' | 'section';

export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  scope: VariableScope;
  defaultValue?: unknown;
  description?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: unknown[];
  };
}

export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';

export type LogicalOperator = 'AND' | 'OR';

export interface Condition {
  id: string;
  variableName: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface ConditionalLogic {
  id: string;
  operator: LogicalOperator;
  conditions: Condition[];
  action: 'show' | 'hide' | 'require';
}

export interface SectionField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'richtext' | 'select' | 'multiselect';
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
}

export type DefaultSectionType = 'data-model' | 'services' | 'http-api' | 'tests';

export interface Section {
  id: string;
  title: string;
  type?: DefaultSectionType | 'custom';
  content: string;
  fields?: SectionField[];
  subsections?: Section[];
  order: number;
  conditionalLogic?: ConditionalLogic[];
  isCollapsed?: boolean;
  variables?: Variable[];
}

export interface TemplateVersion {
  id: string;
  version: number;
  templateId: string;
  createdAt: Date;
  createdBy: string;
  changes: string;
  snapshot: Template;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  sections: Section[];
  globalVariables: Variable[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  permissions?: {
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
  }[];
}

export interface EditorState {
  selectedSectionId: string | null;
  selectedElementId: string | null;
  isPreviewMode: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}

export interface HistoryState {
  past: Template[];
  present: Template;
  future: Template[];
}
