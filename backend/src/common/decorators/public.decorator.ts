import { SetMetadata } from '@nestjs/common'

/** Every route needs a signed-in user unless marked @Public(). */
export const IS_PUBLIC = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC, true)
