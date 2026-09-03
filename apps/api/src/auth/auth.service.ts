import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";
import { isAdminRole, type AppRole } from "@clipora/shared";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role: AppRole;
}

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  fromRequest(header?: string): AuthUser {
    const bypass = this.config.get("DEV_BYPASS_AUTH") === "true";
    if (!header) {
      if (bypass) return { id: "demo-user", email: "demo@clipora.app", name: "Demo User", role: "user" };
      throw new UnauthorizedException("Please sign in to continue.");
    }
    const token = header.replace(/^Bearer\s+/i, "");

    if (token.startsWith("demo:")) {
      return this.fromDemoToken(token.slice(5));
    }

    const secret = this.config.get<string>("SUPABASE_JWT_SECRET");
    if (!secret) {
      if (bypass) return this.fromDemoToken(token.includes("admin") ? "admin@clipora.app" : "demo@clipora.app");
      throw new UnauthorizedException("Please sign in to continue.");
    }
    try {
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email?: string;
        user_metadata?: { role?: string; full_name?: string; name?: string };
        app_metadata?: { role?: string };
      };
      const email = payload.email;
      const claimed = payload.app_metadata?.role ?? payload.user_metadata?.role;
      return {
        id: payload.sub,
        email,
        name: payload.user_metadata?.full_name ?? payload.user_metadata?.name,
        role: this.resolveRole(email, claimed),
      };
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

  requireAdmin(header?: string): AuthUser {
    const user = this.fromRequest(header);
    if (!isAdminRole(user.role)) {
      throw new UnauthorizedException("You don't have permission to access this area.");
    }
    return user;
  }

  private fromDemoToken(email: string): AuthUser {
    const normalized = email.trim().toLowerCase() || "demo@clipora.app";
    const admin = this.isAdminEmail(normalized);
    return {
      id: admin ? "usr_1031" : `demo:${normalized}`,
      email: normalized,
      name: admin ? "Admin" : displayName(normalized),
      role: admin ? "admin" : "user",
    };
  }

  private resolveRole(email: string | undefined, claimed?: string): AppRole {
    if (claimed === "super_admin" || claimed === "admin") return claimed;
    if (email && this.isAdminEmail(email)) return "admin";
    if (claimed === "support" || claimed === "finance" || claimed === "moderator") return claimed;
    return "user";
  }

  private isAdminEmail(email: string) {
    const list = (this.config.get<string>("ADMIN_EMAILS") ?? "admin@clipora.app")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }
}

function displayName(email: string) {
  const local = email.split("@")[0] ?? "User";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
