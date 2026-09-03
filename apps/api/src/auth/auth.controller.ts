import { Controller, Get, Headers } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: user.name ?? null,
        role: user.role,
      },
    };
  }
}
