import { Controller, Get } from '@nestjs/common'
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
}
