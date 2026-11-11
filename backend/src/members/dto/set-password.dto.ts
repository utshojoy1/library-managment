import { IsString, MinLength } from 'class-validator'
import { PASSWORD_RULE } from '../../auth/dto/register.dto.js'

export class SetMemberPasswordDto {
  @IsString({ message: PASSWORD_RULE })
  @MinLength(8, { message: PASSWORD_RULE })
  password!: string
}
