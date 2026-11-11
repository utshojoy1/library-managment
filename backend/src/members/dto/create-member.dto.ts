import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { PASSWORD_RULE } from '../../auth/dto/register.dto.js'
import { Trim } from '../../common/transforms.js'

export class CreateMemberDto {
  @Trim()
  @IsString({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string

  @Trim()
  @IsOptional()
  @IsString()
  email?: string

  @Trim()
  @IsOptional()
  @IsString()
  phone?: string

  /** Optional: when given, the member also gets a login account (needs an email). Never trimmed. */
  @IsOptional()
  @IsString({ message: PASSWORD_RULE })
  @MinLength(8, { message: PASSWORD_RULE })
  password?: string
}
