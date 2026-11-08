import './env.js'
import { Module } from '@nestjs/common'
import { APP_GUARD, NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { AuthController } from './auth/auth.controller.js'
import { AuthGuard } from './auth/auth.guard.js'
import { AdminController } from './admin.controller.js'
import { BooksController } from './books.controller.js'
import { LoansController } from './loans.controller.js'
import { MembersController } from './members.controller.js'
import { MiscController } from './misc.controller.js'

@Module({
  controllers: [AuthController, BooksController, MembersController, LoansController, AdminController, MiscController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class AppModule {}

const app = await NestFactory.create<NestExpressApplication>(AppModule)
// The Next.js rewrite doesn't set X-Forwarded-For, so there is no client IP to trust by default.
// Set TRUST_PROXY (e.g. "loopback") only when a front proxy writes the real client IP into it.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY)
app.use(cookieParser())
app.setGlobalPrefix('api')

const port = Number(process.env.PORT ?? 4000)
await app.listen(port)
console.log(`API listening on http://localhost:${port}/api`)
