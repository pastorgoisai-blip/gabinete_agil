export class CPF {
  private constructor(private readonly value: string) {}

  static create(raw: string): CPF {
    const digits = raw.replace(/\D/g, '');

    if (!CPF.isValid(digits)) {
      throw new Error(`CPF inválido: ${raw}`);
    }

    return new CPF(digits);
  }

  static isValid(digits: string): boolean {
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcDigit = (slice: string, factor: number): number => {
      let sum = 0;
      for (let i = 0; i < slice.length; i++) {
        sum += parseInt(slice[i]) * (factor - i);
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calcDigit(digits.slice(0, 9), 10);
    if (parseInt(digits[9]) !== firstDigit) return false;

    const secondDigit = calcDigit(digits.slice(0, 10), 11);
    if (parseInt(digits[10]) !== secondDigit) return false;

    return true;
  }

  get formatted(): string {
    const d = this.value;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: CPF): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.formatted;
  }
}
