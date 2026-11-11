import { IsNotEmpty, IsString } from 'class-validator'
import { ToUpperCase } from '../../common/transforms.js'

export class ReturnCopyDto {
  @ToUpperCase()
  @IsString({ message: 'Book code is required' })
  @IsNotEmpty({ message: 'Book code is required' })
  barcode!: string
}
