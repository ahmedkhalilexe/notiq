import { DomainEvent } from "../../../shared/events";

export class TemplateUpdatedEvent extends DomainEvent {
  public constructor(public readonly templateId: string) {
    super();
  }
}
