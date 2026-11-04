import jwt, { type SignOptions } from "jsonwebtoken";
import { UnauthorizedError } from "../../domain/shared/errors/unauthorized-error";

export interface TokenServiceConfig {
  secret: string;
  expiresIn: string;
}

export interface AccessTokenPayload {
  tenantId: string;
}

const MIN_SECRET_LENGTH = 32;

export class TokenService {
  public constructor(private readonly config: TokenServiceConfig) {
    if (!config.secret || config.secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`,
      );
    }
  }

  public static fromEnv(env: NodeJS.ProcessEnv = process.env): TokenService {
    return new TokenService({
      secret: env.JWT_SECRET ?? "",
      expiresIn: env.JWT_EXPIRES_IN ?? "1h",
    });
  }

  public sign(payload: AccessTokenPayload): string {
    return jwt.sign({}, this.config.secret, {
      algorithm: "HS256",
      subject: payload.tenantId,
      expiresIn: this.config.expiresIn as SignOptions["expiresIn"],
    });
  }

  public verify(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: ["HS256"],
      });

      if (typeof decoded === "string" || !decoded.sub) {
        throw new UnauthorizedError("Invalid or expired token");
      }

      return { tenantId: decoded.sub };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
