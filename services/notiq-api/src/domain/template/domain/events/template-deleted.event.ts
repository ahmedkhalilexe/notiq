import { DomainEvent } from "../../../shared/events";

export class TemplateDeletedEvent extends DomainEvent {
  public constructor(
    public readonly templateId: string,
    public readonly deletedAt: Date,
  ) {
    super();
  }
}
