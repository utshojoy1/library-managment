import { IsOptional, IsString, MinLength } from 'class-validator'
import { ToLowerCase, Trim } from '../../common/transforms.js'
import { PASSWORD_RULE } from './register.dto.js'

const INVALID_LINK = 'This link is invalid or has expired. Request a new one.'

export class VerifyEmailDto {
  @Trim()
  @IsString({ message: INVALID_LINK })
  token!: string
}

export class ForgotPasswordDto {
  // Optional on purpose: the endpoint answers the same whatever is sent.
  @ToLowerCase()
  @IsOptional()
  @IsString()
  email?: string
}

export class ResetPasswordDto {
  // Checked before the token, so a weak password is reported without spending the link.
  @IsString({ message: PASSWORD_RULE })
  @MinLength(8, { message: PASSWORD_RULE })
  password!: string

  @Trim()
  @IsString({ message: INVALID_LINK })
  token!: string
}
