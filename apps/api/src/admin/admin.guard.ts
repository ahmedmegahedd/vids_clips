import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { isAdminRole } from "@clipora/shared";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: unknown }>();
    const user = this.auth.fromRequest(req.headers.authorization);
    if (!isAdminRole(user.role)) {
      throw new ForbiddenException("You don't have permission to access this area.");
    }
    req.user = user;
    return true;
  }
}
