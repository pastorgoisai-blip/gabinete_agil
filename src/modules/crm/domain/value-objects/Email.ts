const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();

    if (!Email.isValid(normalized)) {
      throw new Error(`Email inválido: ${raw}`);
    }

    return new Email(normalized);
  }

  static isValid(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  get address(): string {
    return this.value;
  }

  get domain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
