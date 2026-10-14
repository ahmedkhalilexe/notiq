import { DomainEvent } from "../../../shared/events";

export class TemplateCreatedEvent extends DomainEvent {
  public constructor(public readonly templateId: string) {
    super();
  }
}
