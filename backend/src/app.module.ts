import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module.js'
import { BooksModule } from './books/books.module.js'
import { dataSourceOptions } from './database/data-source.js'
import { LoansModule } from './loans/loans.module.js'
import { MailModule } from './mail/mail.module.js'
import { MembersModule } from './members/members.module.js'
import { StatsModule } from './stats/stats.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),
    AuthModule,
    UsersModule,
    MembersModule,
    BooksModule,
    LoansModule,
    StatsModule,
    MailModule,
  ],
})
export class AppModule {}
