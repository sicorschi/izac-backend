import { IsNotEmpty, IsString } from 'class-validator';

export class DevicesSmartLightDto {
  @IsNotEmpty()
  @IsString()
  action!: string;
}
