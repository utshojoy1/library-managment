import { IsNotEmpty, IsString } from 'class-validator'
import { ToUpperCase } from '../../common/transforms.js'

export class ReturnCopyDto {
  @ToUpperCase()
  @IsString({ message: 'Copy barcode is required' })
  @IsNotEmpty({ message: 'Copy barcode is required' })
  barcode!: string
}
