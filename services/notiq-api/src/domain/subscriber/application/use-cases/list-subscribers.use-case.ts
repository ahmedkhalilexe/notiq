import type { Subscriber } from "../../domain/entities/subscriber.entity";
import type { ISubscriberRepository } from "../../domain/repositories/subscriber-repository.interface";
import type { ListSubscribersDTO } from "../dtos/list-subscribers.dto";

export class ListSubscribersUseCase {
  public constructor(
    private readonly subscriberRepository: ISubscriberRepository,
  ) {}

  public async execute(dto: ListSubscribersDTO): Promise<Subscriber[]> {
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 10;

    return this.subscriberRepository.list({
      tenantId: dto.tenantId,
      page,
      limit,
      channel: dto.channel,
      enabled: dto.enabled,
    });
  }
}
