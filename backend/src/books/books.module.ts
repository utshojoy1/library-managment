import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Book } from '../entities/book.entity.js'
import { BooksController } from './books.controller.js'
import { BooksService } from './books.service.js'
import { Copy } from '../entities/copy.entity.js'

@Module({
  imports: [TypeOrmModule.forFeature([Book, Copy])],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
