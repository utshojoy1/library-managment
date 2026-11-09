import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ToLowerCase, Trim } from '../../common/transforms.js'

export const PASSWORD_RULE = 'Password must be at least 8 characters'

export class RegisterDto {
  @Trim()
  @IsString({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string

  @ToLowerCase()
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string

  // Passwords are used exactly as typed: never trimmed.
  @IsString({ message: PASSWORD_RULE })
  @MinLength(8, { message: PASSWORD_RULE })
  password!: string
}
