import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common'
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
  activity(@Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number, @Query('scope') scope?: string) {
    // `?scope=books`: only events about a book (added/edited/deleted, issued, returned).
    return this.stats.activity(Math.min(Math.max(limit, 1), 200), scope === 'books')
  }
}
