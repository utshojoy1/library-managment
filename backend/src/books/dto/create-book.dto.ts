import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { ToOptionalNumber } from '../../common/transforms.js'
import { UpdateBookDto } from './update-book.dto.js'

export class CreateBookDto extends UpdateBookDto {
  @ToOptionalNumber()
  @IsOptional()
  @IsInt({ message: 'Copies must be a whole number' })
  @Min(1, { message: 'Copies must be between 1 and 50' })
  @Max(50, { message: 'Copies must be between 1 and 50' })
  copies?: number
}
