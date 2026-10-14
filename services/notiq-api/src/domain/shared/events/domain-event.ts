export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly eventType: string;
  constructor() {
    this.occurredAt = new Date();
    this.eventType = this.constructor.name;
  }
}
