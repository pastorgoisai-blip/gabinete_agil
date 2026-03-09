import type { AgentConversation, ConversationStatus } from '../entities/AgentConversation';
import type { AgentMessage } from '../entities/AgentMessage';

export interface ConversationFilters {
  status?: ConversationStatus;
  platform?: string;
}

export interface IAgentConversationRepository {
  findById(id: string): Promise<AgentConversation | null>;
  findByCabinetId(cabinetId: string, filters?: ConversationFilters): Promise<AgentConversation[]>;
  save(conversation: Omit<AgentConversation, 'id'>): Promise<AgentConversation>;
  updateStatus(id: string, status: ConversationStatus): Promise<void>;
  addMessage(message: Omit<AgentMessage, 'id' | 'createdAt'>): Promise<AgentMessage>;
  getMessages(conversationId: string): Promise<AgentMessage[]>;
}
