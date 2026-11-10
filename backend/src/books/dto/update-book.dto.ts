import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { ToOptionalNumber, Trim } from '../../common/transforms.js'

/** A book's own fields. Editing replaces all of them; copies are managed separately. */
export class UpdateBookDto {
  @Trim()
  @IsString({ message: 'Title is required' })
  @IsNotEmpty({ message: 'Title is required' })
  title!: string

  @Trim()
  @IsString({ message: 'Author is required' })
  @IsNotEmpty({ message: 'Author is required' })
  author!: string

  @Trim()
  @IsOptional()
  @IsString()
  isbn?: string

  @Trim()
  @IsOptional()
  @IsString()
  category?: string

  @ToOptionalNumber()
  @IsOptional()
  @IsInt({ message: 'Published year must be a whole number' })
  @Min(1, { message: 'Published year must be between 1 and 9999' })
  @Max(9999, { message: 'Published year must be between 1 and 9999' })
  publishedYear?: number
}
