import type { IEventDispatcher } from "../../../shared/ports";
import { Subscriber } from "../../domain/entities/subscriber.entity";
import { SubscriberEmailExistsError } from "../../domain/errors/subscriber-email-exists.error";
import { SubscriberExternalIdExistsError } from "../../domain/errors/subscriber-external-id-exists.error";
import type { ISubscriberRepository } from "../../domain/repositories/subscriber-repository.interface";
import { SubscriberChannelPreference } from "../../domain/value-objects/subscriber-channel-preference.vo";
import type { CreateSubscriberDTO } from "../dtos/create-subscriber.dto";

export class CreateSubscriberUseCase {
  public constructor(
    private readonly subscriberRepository: ISubscriberRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: CreateSubscriberDTO): Promise<Subscriber> {
    if (dto.email) {
      const existingByEmail = await this.subscriberRepository.findByEmail(
        dto.email,
        dto.tenantId,
      );
      if (existingByEmail) {
        throw new SubscriberEmailExistsError();
      }
    }

    if (dto.externalId) {
      const existingByExternal =
        await this.subscriberRepository.findByExternalId(
          dto.externalId,
          dto.tenantId,
        );
      if (existingByExternal) {
        throw new SubscriberExternalIdExistsError();
      }
    }

    const channels = dto.channels?.map((ch) =>
      SubscriberChannelPreference.create(ch.channel, ch.enabled ?? true, ch.value),
    );

    const subscriber = Subscriber.create({
      tenantId: dto.tenantId,
      externalId: dto.externalId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      channels,
    });

    await this.subscriberRepository.save(subscriber);

    await this.eventDispatcher.dispatch(subscriber.events);
    subscriber.clearEvents();

    return subscriber;
  }
}
