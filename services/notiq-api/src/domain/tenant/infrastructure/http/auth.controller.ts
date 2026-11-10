import type { Request, Response } from "express";
import type { TokenService } from "../../../../infra/auth/token.service";
import { validate } from "../../../shared/validation/validate";
import type { LoginTenantUseCase } from "../../application/use-cases/login-tenant.use-case";
import { TenantMapper } from "../mappers/tenant.mapper";
import { loginSchema } from "./auth.validator";

export class AuthController {
  public constructor(
    private readonly loginTenantUseCase: LoginTenantUseCase,
    private readonly tokenService: TokenService,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    const body = validate(loginSchema, req.body);

    const tenant = await this.loginTenantUseCase.execute({
      email: body.email,
      password: body.password,
    });

    const { token, expiresIn } = this.tokenService.issue({
      tenantId: tenant.id,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresIn,
      tenant: TenantMapper.toResponse(tenant),
    });
  }
}
