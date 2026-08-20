import { IsNotEmpty, IsString, IsIP } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsNotEmpty()
  @IsIP()
  ip!: string;
}
