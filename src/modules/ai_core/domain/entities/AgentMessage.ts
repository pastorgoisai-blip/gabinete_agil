export type SenderType = 'user' | 'agent' | 'system';

export interface AgentMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
