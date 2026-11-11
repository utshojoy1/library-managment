import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF } from '../common/roles.js'
import { StatsService } from './stats.service.js'

@Controller('stats')
@Roles(...STAFF)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  summary() {
    return this.stats.summary()
  }

  @Get('activity')
  async activity(
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Res({ passthrough: true }) res: Response,
    @Query('scope') scope?: string,
  ) {
    // `?scope=books`: only events about a book (added/edited/deleted, issued, returned).
    const booksOnly = scope === 'books'
    // Total in a header so the body stays a plain array for existing callers.
    res.setHeader('X-Total-Count', String(await this.stats.activityCount(booksOnly)))
    return this.stats.activity(Math.min(Math.max(limit, 1), 200), booksOnly, Math.max(offset, 0))
  }
}
