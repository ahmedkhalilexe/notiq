import type { IEventDispatcher } from "../../../shared/ports";
import type { Subscriber } from "../../domain/entities/subscriber.entity";
import { SubscriberNotFoundError } from "../../domain/errors/subscriber-not-found.error";
import type { ISubscriberRepository } from "../../domain/repositories/subscriber-repository.interface";
import type { UpdateSubscriberPreferenceDTO } from "../dtos/update-subscriber-preference.dto";

export class UpdateSubscriberPreferenceUseCase {
  public constructor(
    private readonly subscriberRepository: ISubscriberRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(
    dto: UpdateSubscriberPreferenceDTO,
  ): Promise<Subscriber> {
    const subscriber = await this.subscriberRepository.findById(
      dto.id,
      dto.tenantId,
    );

    if (!subscriber) {
      throw new SubscriberNotFoundError();
    }

    subscriber.setChannelPreference(dto.channel, dto.enabled, dto.value);

    await this.subscriberRepository.update(subscriber);

    await this.eventDispatcher.dispatch(subscriber.events);
    subscriber.clearEvents();

    return subscriber;
  }
}
