/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CreateAuthDto } from './create-auth.dto';
import { IsNumber } from 'class-validator';

export class UpdateAuthDto extends CreateAuthDto {
  @IsNumber()
  id!: number;
}
