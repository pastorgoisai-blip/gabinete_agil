export type RuleActionType = 'text_response' | 'human_handoff' | 'register_demand';

export interface AgentRule {
  id: string;
  cabinetId: string;
  keywords: string[];
  actionType: RuleActionType;
  responseText: string;
  isActive: boolean;
  usageCount: number;
}
