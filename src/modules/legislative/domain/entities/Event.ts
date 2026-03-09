export type EventType = 'Sessão Ordinária' | 'Evento' | 'Reunião' | 'Audiência Pública';
export type EventStatus = 'hoje' | 'chegando' | 'distante' | 'concluido';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  description?: string;
  responsible?: string;
  createdBy?: string;
}
