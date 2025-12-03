import { TSESTree } from '@typescript-eslint/types';
import { HauntingType, Severity } from '@codecrypt/shared';

export interface RuleContext {
  ast: TSESTree.Program;
  filePath: string;
  content: string;
}

export interface DetectedIssue {
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
}

export interface Rule {
  id: string;
  hauntingType: HauntingType;
  detect(context: RuleContext): DetectedIssue[];
}
