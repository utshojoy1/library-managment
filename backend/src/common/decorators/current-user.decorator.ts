import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { SessionUser } from '../roles.js'

export type AuthedRequest = Request & { user?: SessionUser }

/** The signed-in user, set by AuthGuard. Only use on routes that aren't @Public(). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user!,
)
