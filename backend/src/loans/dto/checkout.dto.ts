import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'
import { ToUpperCase } from '../../common/transforms.js'

export class CheckoutDto {
  @ToUpperCase()
  @IsString({ message: 'Copy barcode is required' })
  @IsNotEmpty({ message: 'Copy barcode is required' })
  barcode!: string

  @ToUpperCase()
  @IsString({ message: 'Member number is required' })
  @IsNotEmpty({ message: 'Member number is required' })
  memberNo!: string

  /** Optional custom due date (YYYY-MM-DD); defaults to the standard loan period. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Due date must be a date (YYYY-MM-DD)' })
  dueDate?: string
}
