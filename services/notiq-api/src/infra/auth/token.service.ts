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
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  /** Signs a token and reports its lifetime in seconds. */
  public issue(payload: AccessTokenPayload): {
    token: string;
    expiresIn: number;
  } {
    const token = this.sign(payload);
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    return { token, expiresIn: decoded.exp - decoded.iat };
  }

  public verify(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: ["HS256"],
      });

      if (typeof decoded === "string" || !decoded.sub) {
        throw new UnauthorizedError("Invalid or expired token");
      }

      if (!UUID_PATTERN.test(decoded.sub)) {
        throw new UnauthorizedError("Invalid or expired token");
      }

      return { tenantId: decoded.sub };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
