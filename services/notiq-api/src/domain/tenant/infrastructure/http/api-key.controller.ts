import type { Request, Response } from "express";
import { validate } from "../../../shared/validation/validate";
import type { CreateApiKeyUseCase } from "../../application/use-cases/create-api-key.use-case";
import type { RevokeApiKeyUseCase } from "../../application/use-cases/revoke-api-key.use-case";
import type { ListApiKeysUseCase } from "../../application/use-cases/list-api-keys.use-case";
import {
  createApiKeyBodySchema,
  revokeApiKeyParamSchema,
} from "./api-key.validator";
import { getTenantId } from "../../../../infra/http/middleware/jwt-auth";
import { ApiKeyMapper } from "../mappers/api-key.mapper";

export class ApiKeyController {
  public constructor(
    private readonly createApiKeyUseCase: CreateApiKeyUseCase,
    private readonly revokeApiKeyUseCase: RevokeApiKeyUseCase,
    private readonly listApiKeysUseCase: ListApiKeysUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    const body = validate(createApiKeyBodySchema, req.body);

    const { apiKey, rawKey } = await this.createApiKeyUseCase.execute({
      tenantId: getTenantId(req),
      name: body.name,
    });

    res.status(201).json({
      message:
        "API key created successfully. Store this key safely; it will not be shown again.",
      api_key: rawKey,
      key: ApiKeyMapper.toResponse(apiKey),
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const keys = await this.listApiKeysUseCase.execute({
      tenantId: getTenantId(req),
    });

    res.status(200).json({
      api_keys: keys.map((key) => ApiKeyMapper.toResponse(key)),
      message: "API keys retrieved successfully",
    });
  }

  public async revoke(req: Request, res: Response): Promise<void> {
    const params = validate(revokeApiKeyParamSchema, req.params);

    const revokedKey = await this.revokeApiKeyUseCase.execute({
      tenantId: getTenantId(req),
      keyId: params.keyId,
    });

    res.status(200).json({
      message: "API key revoked successfully",
      key: ApiKeyMapper.toResponse(revokedKey),
    });
  }
}
