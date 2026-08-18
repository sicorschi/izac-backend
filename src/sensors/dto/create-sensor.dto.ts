import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateSensorDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsNotEmpty()
  @IsNumber()
  threshold!: number;

  @IsNotEmpty()
  @IsString()
  unit!: string;
}
