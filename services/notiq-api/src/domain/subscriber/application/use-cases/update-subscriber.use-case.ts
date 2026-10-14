import type { IEventDispatcher } from "../../../shared/ports";
import type { Subscriber } from "../../domain/entities/subscriber.entity";
import { SubscriberEmailExistsError } from "../../domain/errors/subscriber-email-exists.error";
import { SubscriberExternalIdExistsError } from "../../domain/errors/subscriber-external-id-exists.error";
import { SubscriberNotFoundError } from "../../domain/errors/subscriber-not-found.error";
import type { ISubscriberRepository } from "../../domain/repositories/subscriber-repository.interface";
import type { UpdateSubscriberDTO } from "../dtos/update-subscriber.dto";

export class UpdateSubscriberUseCase {
  public constructor(
    private readonly subscriberRepository: ISubscriberRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: UpdateSubscriberDTO): Promise<Subscriber> {
    const subscriber = await this.subscriberRepository.findById(
      dto.id,
      dto.tenantId,
    );

    if (!subscriber) {
      throw new SubscriberNotFoundError();
    }

    if (dto.email && dto.email.toLowerCase() !== subscriber.email?.toLowerCase()) {
      const existing = await this.subscriberRepository.findByEmail(
        dto.email,
        subscriber.tenantId,
      );
      if (existing && existing.id !== subscriber.id) {
        throw new SubscriberEmailExistsError();
      }
    }

    if (dto.externalId && dto.externalId !== subscriber.externalId) {
      const existing = await this.subscriberRepository.findByExternalId(
        dto.externalId,
        subscriber.tenantId,
      );
      if (existing && existing.id !== subscriber.id) {
        throw new SubscriberExternalIdExistsError();
      }
    }

    subscriber.updateProfile({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      externalId: dto.externalId,
    });

    if (dto.channels) {
      for (const ch of dto.channels) {
        subscriber.setChannelPreference(
          ch.channel,
          ch.enabled ?? true,
          ch.value,
        );
      }
    }

    await this.subscriberRepository.update(subscriber);

    await this.eventDispatcher.dispatch(subscriber.events);
    subscriber.clearEvents();

    return subscriber;
  }
}
