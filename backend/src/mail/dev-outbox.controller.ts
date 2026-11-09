import { Controller, Get, NotFoundException } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator.js'
import { DEV_INBOX, MailService } from './mail.service.js'

/** Development inbox: what would have been emailed, including the links. */
@Controller('dev/outbox')
export class DevOutboxController {
  constructor(private readonly mail: MailService) {}

  @Public()
  @Get()
  list() {
    if (!DEV_INBOX) throw new NotFoundException()
    return this.mail.recent()
  }
}
