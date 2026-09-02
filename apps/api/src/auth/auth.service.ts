import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  fromRequest(header?: string): AuthUser {
    const bypass = this.config.get("DEV_BYPASS_AUTH") === "true";
    if (!header) {
      if (bypass) return { id: "demo-user", email: "demo@clipora.app" };
      throw new UnauthorizedException("Please sign in to continue.");
    }
    const token = header.replace(/^Bearer\s+/i, "");
    const secret = this.config.get<string>("SUPABASE_JWT_SECRET");
    if (!secret) {
      if (bypass) return { id: "demo-user", email: "demo@clipora.app" };
      throw new UnauthorizedException("Please sign in to continue.");
    }
    try {
      const payload = jwt.verify(token, secret) as { sub: string; email?: string };
      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException("Your session expired. Please sign in again.");
    }
  }

  optional(header?: string): AuthUser | null {
    try {
      return this.fromRequest(header);
    } catch {
      return null;
    }
  }
}
