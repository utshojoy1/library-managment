import { IsBoolean } from 'class-validator'
import { CreateMemberDto } from './create-member.dto.js'

/** Editing replaces a member's contact details (name, email, phone). */
export class UpdateMemberDto extends CreateMemberDto {}

export class SetMemberStatusDto {
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive!: boolean
}
