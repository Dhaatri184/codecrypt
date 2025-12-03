import { Rule } from './types';
import { ghostRule } from './ghost';
import { zombieRule } from './zombie';
import { vampireRule } from './vampire';
import { skeletonRule } from './skeleton';
import { monsterRule } from './monster';

export const allRules: Rule[] = [
  ghostRule,
  zombieRule,
  vampireRule,
  skeletonRule,
  monsterRule,
];

export { Rule, RuleContext, DetectedIssue } from './types';
export { ghostRule } from './ghost';
export { zombieRule } from './zombie';
export { vampireRule } from './vampire';
export { skeletonRule } from './skeleton';
export { monsterRule } from './monster';
