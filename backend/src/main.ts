import './env.js'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module.js'

const app = await NestFactory.create<NestExpressApplication>(AppModule)
// The Next.js rewrite doesn't set X-Forwarded-For, so there is no client IP to trust by default.
// Set TRUST_PROXY (e.g. "loopback") only when a front proxy writes the real client IP into it.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY)
app.use(cookieParser())
app.setGlobalPrefix('api')
// Request bodies are untrusted: DTOs transform (trim, case, numbers), then validate.
// Unknown fields are stripped; the first failing rule per field is reported.
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
app.enableShutdownHooks()

const port = Number(process.env.PORT ?? 4000)
await app.listen(port)
console.log(`API listening on http://localhost:${port}/api`)
