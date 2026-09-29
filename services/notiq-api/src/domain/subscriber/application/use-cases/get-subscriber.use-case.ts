import { SubscriberNotFoundError } from "../../domain/errors/subscriber-not-found.error";
import type { Subscriber } from "../../domain/entities/subscriber.entity";
import type { ISubscriberRepository } from "../../domain/repositories/subscriber-repository.interface";
import type { FindSubscriberDTO } from "../dtos/find-subscriber.dto";

export class GetSubscriberUseCase {
  public constructor(
    private readonly subscriberRepository: ISubscriberRepository,
  ) {}

  public async execute(dto: FindSubscriberDTO): Promise<Subscriber> {
    const subscriber = await this.subscriberRepository.findById(
      dto.id,
      dto.tenantId,
    );

    if (!subscriber) {
      throw new SubscriberNotFoundError();
    }

    return subscriber;
  }
}
