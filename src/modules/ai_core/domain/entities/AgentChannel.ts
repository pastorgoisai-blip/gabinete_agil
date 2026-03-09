export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'sms';
export type ChannelStatus = 'connected' | 'disconnected' | 'error';

export interface AgentChannel {
  id: string;
  cabinetId: string;
  type: ChannelType;
  name: string;
  status: ChannelStatus;
}
