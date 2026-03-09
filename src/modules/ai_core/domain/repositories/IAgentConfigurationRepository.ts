import type { AgentConfiguration } from '../entities/AgentConfiguration';

export interface IAgentConfigurationRepository {
  findByCabinetId(cabinetId: string): Promise<AgentConfiguration | null>;
  save(config: Omit<AgentConfiguration, 'id'>): Promise<AgentConfiguration>;
  update(id: string, data: Partial<AgentConfiguration>): Promise<AgentConfiguration>;
}
