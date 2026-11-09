import { IsNotEmpty, IsString } from 'class-validator'
import { ToLowerCase } from '../../common/transforms.js'

const REQUIRED = 'Email and password are required'

export class LoginDto {
  @ToLowerCase()
  @IsString({ message: REQUIRED })
  @IsNotEmpty({ message: REQUIRED })
  email!: string

  @IsString({ message: REQUIRED })
  @IsNotEmpty({ message: REQUIRED })
  password!: string
}
