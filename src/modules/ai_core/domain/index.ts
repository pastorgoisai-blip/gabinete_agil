export type { AgentConfiguration } from './entities/AgentConfiguration';
export type { AgentChannel, ChannelType, ChannelStatus } from './entities/AgentChannel';
export type { AgentRule, RuleActionType } from './entities/AgentRule';
export type { AgentConversation, ConversationStatus } from './entities/AgentConversation';
export type { AgentMessage, SenderType } from './entities/AgentMessage';

export type { IAgentConfigurationRepository } from './repositories/IAgentConfigurationRepository';
export type { IAgentConversationRepository, ConversationFilters } from './repositories/IAgentConversationRepository';
export type { IAgentRuleRepository } from './repositories/IAgentRuleRepository';
