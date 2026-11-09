import { IsBoolean, IsIn, IsOptional } from 'class-validator'
import { ROLES, type Role } from '../../common/roles.js'

export class UpdateUserDto {
  @IsOptional()
  @IsIn(ROLES, { message: 'Unknown role' })
  role?: Role

  @IsOptional()
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive?: boolean
}
