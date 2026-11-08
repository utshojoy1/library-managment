import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC, ROLES_KEY, type AuthedRequest, type Role } from '../common.js'
import { getSessionUser, SESSION_COOKIE } from './auth.js'

/**
 * Global guard: resolves the session cookie on every request, then denies by
 * default — a route is open only with @Public(), and @Roles() narrows it.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>()
    req.user = (await getSessionUser(req.cookies?.[SESSION_COOKIE])) ?? undefined

    const targets = [ctx.getHandler(), ctx.getClass()]
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true
    if (!req.user) throw new UnauthorizedException('Please sign in to continue')

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets)
    if (roles && !roles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to do that')
    }
    return true
  }
}
