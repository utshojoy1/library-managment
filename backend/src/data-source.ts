// Data source and all connection configuration, shared by the Nest app (TypeOrmModule)
// and the TypeORM CLI (`typeorm -d dist/data-source.js`).
import './env.js'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { Book } from './entities/book.entity.js'
import { Copy } from './entities/copy.entity.js'
import { Email } from './entities/email.entity.js'
import { EmailToken } from './entities/email-token.entity.js'
import { Loan } from './entities/loan.entity.js'
import { Member } from './entities/member.entity.js'
import { Session } from './entities/session.entity.js'
import { User } from './entities/user.entity.js'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library',
  poolSize: 5,
  // The schema only changes through migrations, never by syncing entities.
  synchronize: false,
  logging: false,
  entities: [User, Session, EmailToken, Member, Book, Copy, Loan, Email],
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
  subscribers: [],
})
