export type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'VALIDATION'
  | 'PERMISSION_DENIED'
  | 'CONNECTION'
  | 'UNKNOWN';

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: RepositoryErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }

  static notFound(entity: string, id: string): RepositoryError {
    return new RepositoryError(
      `${entity} com id "${id}" não encontrado.`,
      'NOT_FOUND'
    );
  }

  static fromSupabase(operation: string, error: unknown): RepositoryError {
    const message = error instanceof Error ? error.message : String(error);
    const pgError = error as { code?: string };

    if (pgError.code === '23505') {
      return new RepositoryError(
        `Registro duplicado em ${operation}: ${message}`,
        'DUPLICATE',
        error
      );
    }

    if (pgError.code === '42501') {
      return new RepositoryError(
        `Permissão negada em ${operation}: ${message}`,
        'PERMISSION_DENIED',
        error
      );
    }

    return new RepositoryError(
      `Erro em ${operation}: ${message}`,
      'UNKNOWN',
      error
    );
  }
}
