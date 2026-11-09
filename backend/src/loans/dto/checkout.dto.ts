import { IsNotEmpty, IsString } from 'class-validator'
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
}
