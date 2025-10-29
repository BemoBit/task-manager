/**
 * Template System Interfaces
 */

export type VariableValue = string | number | boolean | object | unknown[] | Date | null;

export interface ITemplateSection {
  id: string;
  title: string;
  type: 'data-model' | 'services' | 'http-api' | 'tests' | 'custom';
  content: string;
  order: number;
  subsections: ITemplateSection[];
  variables: ITemplateVariable[];
  conditionalLogic?: IConditionalLogic[];
  fields?: ICustomField[];
}

export interface ITemplateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  scope: 'global' | 'section';
  defaultValue?: VariableValue;
  required: boolean;
  description?: string;
  validation?: IValidationRule;
  sectionId?: string;
}

export interface IValidationRule {
  type: 'regex' | 'range' | 'length' | 'enum' | 'custom';
  rule: string | number | string[];
  message?: string;
  customValidator?: string; // JavaScript function as string
}

export interface IConditionalLogic {
  id: string;
  condition: ICondition;
  action: 'show' | 'hide' | 'require' | 'disable';
  targetIds: string[]; // IDs of sections/fields affected
}

export interface ICondition {
  type: 'simple' | 'compound';
  operator?: 'AND' | 'OR';
  variable?: string;
  comparison?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
  value?: VariableValue;
  conditions?: ICondition[]; // For compound conditions
}

export interface ICustomField {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  defaultValue?: VariableValue;
  options?: VariableValue[];
}

export interface ITemplateContent {
  sections: ITemplateSection[];
  globalVariables: ITemplateVariable[];
  metadata?: {
    version: string;
    schemaVersion: string;
    [key: string]: string | number | boolean | null;
  };
}

export type HelperFunction = (...args: unknown[]) => string | number | boolean;

export interface IRenderContext {
  variables: Record<string, VariableValue>;
  helpers?: Record<string, HelperFunction>;
  partials?: Record<string, string>;
  options?: {
    strict?: boolean;
    escapeHtml?: boolean;
    preserveWhitespace?: boolean;
  };
}

export interface IRenderResult {
  success: boolean;
  output?: string;
  sections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  errors?: Array<{
    type: string;
    message: string;
    location?: string;
  }>;
  warnings?: string[];
}

export interface IValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    type: 'schema' | 'variable' | 'syntax' | 'custom';
  }>;
  warnings?: Array<{
    path: string;
    message: string;
  }>;
}

export interface IVersionDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    path: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

export interface IMergeResult {
  success: boolean;
  content?: ITemplateContent;
  conflicts?: Array<{
    path: string;
    base: unknown;
    ours: unknown;
    theirs: unknown;
  }>;
}

export type CollaborationEventData =
  | { type: 'cursor'; sectionId: string; position: number }
  | { type: 'selection'; sectionId: string; start: number; end: number }
  | { type: 'edit'; sectionId: string; content: string }
  | { type: 'comment'; sectionId: string; text: string; position?: number };

export interface ICollaborationEvent {
  sessionId: string;
  userId: string;
  action: 'cursor-move' | 'selection' | 'edit' | 'comment';
  data: CollaborationEventData;
  timestamp: Date;
}

export interface IUserPresence {
  userId: string;
  userName: string;
  color: string;
  cursor?: {
    sectionId: string;
    position: number;
  };
  selection?: {
    sectionId: string;
    start: number;
    end: number;
  };
  lastActive: Date;
}

export interface ITemplatePermissions {
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ITemplateStats {
  totalViews: number;
  totalForks: number;
  totalUsages: number;
  averageRating: number;
  ratingCount: number;
  lastUsed?: Date;
}
