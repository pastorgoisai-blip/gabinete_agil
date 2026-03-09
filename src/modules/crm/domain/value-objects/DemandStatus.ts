import type { DemandStatusValue } from '../entities/Demand';

const VALID_TRANSITIONS: Record<DemandStatusValue, DemandStatusValue[]> = {
  'Pendente': ['Em Andamento'],
  'Em Andamento': ['Concluída', 'Pendente'],
  'Concluída': ['Em Andamento'],
};

export class DemandStatus {
  private constructor(private readonly value: DemandStatusValue) {}

  static create(status: DemandStatusValue): DemandStatus {
    const valid: DemandStatusValue[] = ['Pendente', 'Em Andamento', 'Concluída'];
    if (!valid.includes(status)) {
      throw new Error(`Status de demanda inválido: ${status}`);
    }
    return new DemandStatus(status);
  }

  static pending(): DemandStatus {
    return new DemandStatus('Pendente');
  }

  canTransitionTo(next: DemandStatusValue): boolean {
    return VALID_TRANSITIONS[this.value].includes(next);
  }

  transitionTo(next: DemandStatusValue): DemandStatus {
    if (!this.canTransitionTo(next)) {
      throw new Error(`Transição inválida: ${this.value} → ${next}`);
    }
    return DemandStatus.create(next);
  }

  get current(): DemandStatusValue {
    return this.value;
  }

  get isPending(): boolean {
    return this.value === 'Pendente';
  }

  get isInProgress(): boolean {
    return this.value === 'Em Andamento';
  }

  get isCompleted(): boolean {
    return this.value === 'Concluída';
  }

  equals(other: DemandStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
