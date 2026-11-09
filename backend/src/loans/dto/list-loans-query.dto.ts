import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator'
import { ToOptionalNumber } from '../../common/transforms.js'

export class ListLoansQueryDto {
  @IsOptional()
  @IsIn(['active', 'returned'], { message: 'Status must be active or returned' })
  status?: 'active' | 'returned'

  @ToOptionalNumber()
  @IsOptional()
  @IsInt({ message: 'Limit must be a whole number' })
  @Min(1, { message: 'Limit must be between 1 and 200' })
  @Max(200, { message: 'Limit must be between 1 and 200' })
  limit?: number
}
