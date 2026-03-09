export type NotificationType = 'success' | 'warning' | 'info' | 'error';
export type NotificationCategory = 'system' | 'event' | 'task' | 'finance';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
}
