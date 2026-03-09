import type { AgentRule } from '../entities/AgentRule';

export interface IAgentRuleRepository {
  findByCabinetId(cabinetId: string): Promise<AgentRule[]>;
  findByKeyword(cabinetId: string, keyword: string): Promise<AgentRule[]>;
  save(rule: Omit<AgentRule, 'id' | 'usageCount'>): Promise<AgentRule>;
  update(id: string, data: Partial<AgentRule>): Promise<AgentRule>;
  incrementUsage(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
