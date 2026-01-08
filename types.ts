import React from 'react';

// --- Entidades Principais ---

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff' | 'volunteer';
  status: 'active' | 'inactive' | 'pending';
  avatar_url?: string;
  last_access?: string;
  created_at?: string;
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
  category: 'Liderança' | 'Apoiador' | 'Voluntário' | 'Indeciso' | string;
  status: 'active' | 'inactive';
  initial?: string; // Helper para UI
  source?: 'Manual' | 'Auto-cadastro' | 'Importação';

  // UI Specific or Extended
  tags: string[];
  engagement?: number;
  lastContact?: string;
  lastChannel?: string;
  socialStats?: {
    instagram?: { isFollowing: boolean; interactions: number };
    whatsapp?: { status: string; msgCount: number };
  };
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
  notes?: string;
  notifyPolitician?: boolean;
  notifyMedia?: boolean;
  notifyStaff?: boolean;
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

export interface Project {
  id: number;
  type: string;
  number: string;
  year: string;
  author: string;
  summary: string;
  attachments: number;
  status: 'Finalizado' | 'Em Tramitação' | 'Arquivado';
  deadline?: string;
  document_url?: string;
}

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
