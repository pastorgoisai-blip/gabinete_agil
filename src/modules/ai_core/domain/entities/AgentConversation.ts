export type ConversationStatus = 'open' | 'closed' | 'human_needed';

export interface AgentConversation {
  id: string;
  cabinetId: string;
  externalId: string;
  platform: string;
  userName: string;
  status: ConversationStatus;
  lastMessageAt: string;
  tags: string[];
}
