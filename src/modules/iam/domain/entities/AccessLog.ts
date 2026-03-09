export interface AccessLogMetadata {
  ip?: string;
  userAgent?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  cabinetId: string;
  accessedAt: string;
  metadata?: AccessLogMetadata;
}
