import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
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
}
