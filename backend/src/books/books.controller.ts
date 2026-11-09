import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF } from '../common/roles.js'
import { BooksService } from './books.service.js'
import { CreateBookDto } from './dto/create-book.dto.js'

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.books.findAll(q)
  }

  @Post()
  @Roles(...STAFF)
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto)
  }
}
