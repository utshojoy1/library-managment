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
// The frontend proxies /api/* from the same machine; trust its X-Forwarded-For so
// rate limits see the real client IP. Set TRUST_PROXY if the proxy runs elsewhere.
app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback')
app.use(cookieParser())
app.setGlobalPrefix('api')

const port = Number(process.env.PORT ?? 4000)
await app.listen(port)
console.log(`API listening on http://localhost:${port}/api`)
