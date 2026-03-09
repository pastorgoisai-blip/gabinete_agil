export interface AgentConfiguration {
  id: string;
  cabinetId: string;
  agentName: string;
  tone: string;
  welcomeMessage: string;
  isActive: boolean;
  systemPrompt?: string;
  copilotSystemPrompt?: string;
}
