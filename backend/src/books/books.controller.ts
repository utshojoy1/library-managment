import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF, type SessionUser } from '../common/roles.js'
import { BooksService } from './books.service.js'
import { CreateBookDto } from './dto/create-book.dto.js'
import { UpdateBookDto } from './dto/update-book.dto.js'

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.books.findAll(q)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.books.findOne(id)
  }

  @Post()
  @Roles(...STAFF)
  create(@Body() dto: CreateBookDto, @CurrentUser() user: SessionUser) {
    return this.books.create(dto, user)
  }

  @Put(':id')
  @Roles(...STAFF)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto, @CurrentUser() user: SessionUser) {
    return this.books.update(id, dto, user)
  }

  @Delete(':id')
  @Roles(...STAFF)
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser) {
    return this.books.remove(id, user)
  }
}
