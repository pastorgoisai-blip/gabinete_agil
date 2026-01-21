import React from 'react';

// --- Entidades Principais ---

export interface Cabinet {
  id: string;
  name: string;
  created_at: string;
  header_url?: string;
  footer_url?: string;
  official_name?: string;
  // Add other existing columns if known, but these are sufficient for now
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'volunteer' | 'super_admin';
  status: 'active' | 'inactive' | 'pending';
  avatar_url?: string;
  last_access?: string;
  is_super_admin?: boolean; // Super Admin Global
}

export interface Voter {
  id: number | string;
  name: string;
  cpf?: string;
  phone: string;
  address: string;
  city?: string;
  neighborhood?: string;
  birth_date?: string;
  category: 'Liderança' | 'Apoiador' | 'Voluntário' | 'Indeciso';
  status: 'active' | 'inactive';
  initial?: string; // Helper para UI
  source?: 'Manual' | 'Auto-cadastro' | 'Importação';
}

export interface Demand {
  id: number | string;
  title: string;
  description: string;
  beneficiary: string;
  author: string;
  category: 'Infraestrutura' | 'Saúde' | 'Educação' | 'Segurança' | 'Outros';
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
  priority: 'Alta' | 'Média' | 'Baixa';
  created_at?: string;
  updated_at?: string;
  statusColor?: string; // Helper para UI
  alert?: string; // Helper para UI
  obs?: string;
}

export interface Event {
  id: number | string;
  title: string;
  type: 'Sessão Ordinária' | 'Evento' | 'Reunião' | 'Audiência Pública';
  status: 'hoje' | 'chegando' | 'distante' | 'concluido';
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string; // Helper UI combine
  location: string;
  description?: string;
  responsible?: string;
}

export interface Honoree {
  id: number | string;
  name: string;
  socialName?: string;
  type: 'Titulo de Cidadão Anapolino' | 'Moção de Aplauso' | 'Comenda';
  ceremonyDate: string;
  justification?: string;
  bio?: string;
  status: 'Indicado' | 'Confirmado' | 'Entregue' | 'Cancelado';
  phone?: string;
  email?: string;
}

export interface LegislativeMatter {
  id: number | string;
  cabinet_id?: string;
  external_id?: string;
  year: number;
  number: number;
  type_acronym: string;
  type_description: string;
  authors: string;
  pdf_url?: string;
  description: string;
  status: 'filed' | 'processing' | 'approved' | 'rejected' | 'archived';
  created_at?: string;
}

// Deprecated: Keeping for compatibility if needed, but should eventually remove
export type LegislativeProject = LegislativeMatter;

export interface Notification {
  id: number | string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'system' | 'event' | 'task' | 'finance';
  read: boolean;
  created_at: string;
}

// --- Component Props ---


export interface LegislativeOffice {
  id: number | string;
  cabinet_id?: string;
  type?: string;
  number: string;
  year: string;
  recipient: string;
  subject: string;
  status: 'Pendente' | 'Enviado' | 'Respondido' | 'Assinado';
  document_url?: string;
  content_html?: string;
  content_json?: any;
  signed_at?: string;
  signature_hash?: string;
  created_at?: string;
}

export interface DocTemplate {
  id: string;
  title: string;
  type: string;
  content_html?: string;
  cabinet_id?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

// --- Agent Interfaces ---

export interface AgentConfiguration {
  id: string;
  cabinet_id: string;
  agent_name: string;
  tone: string;
  welcome_message: string;
  is_active: boolean;
}

export interface AgentChannel {
  id: string;
  cabinet_id: string;
  type: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'sms';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: any;
}

export interface AgentRule {
  id: string;
  cabinet_id: string;
  keywords: string[];
  action_type: 'text_response' | 'human_handoff' | 'register_demand';
  response_text: string;
  is_active: boolean;
  usage_count: number;
}

export interface AgentConversation {
  id: string;
  cabinet_id: string;
  external_id: string;
  platform: string;
  user_name: string;
  status: 'open' | 'closed' | 'human_needed';
  last_message_at: string;
  tags: string[];
}

export interface AgentMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}
