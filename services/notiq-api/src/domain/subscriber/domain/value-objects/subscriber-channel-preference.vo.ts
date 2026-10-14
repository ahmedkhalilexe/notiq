import { SubscriberInvalidChannelError } from "../errors/subscriber-invalid-channel.error";

export type SupportedChannel = "email" | "sms" | "in_app";

export class SubscriberChannelPreference {
  public static readonly ALLOWED_CHANNELS: readonly SupportedChannel[] = [
    "email",
    "sms",
    "in_app",
  ];

  private constructor(
    public readonly channel: SupportedChannel,
    public readonly enabled: boolean = true,
    public readonly value: string | null = null,
  ) {}

  public static create(
    rawChannel: string,
    enabled: boolean = true,
    value: string | null = null,
  ): SubscriberChannelPreference {
    let normalized = rawChannel.toLowerCase().trim();
    if (normalized === "in-app") {
      normalized = "in_app";
    }

    if (
      !SubscriberChannelPreference.ALLOWED_CHANNELS.includes(
        normalized as SupportedChannel,
      )
    ) {
      throw new SubscriberInvalidChannelError(rawChannel);
    }

    const trimmedValue = value ? value.trim() : null;

    return new SubscriberChannelPreference(
      normalized as SupportedChannel,
      Boolean(enabled),
      trimmedValue,
    );
  }

  public withEnabled(enabled: boolean): SubscriberChannelPreference {
    return new SubscriberChannelPreference(this.channel, enabled, this.value);
  }

  public withValue(value: string | null): SubscriberChannelPreference {
    return new SubscriberChannelPreference(this.channel, this.enabled, value ? value.trim() : null);
  }
}
