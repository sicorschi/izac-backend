/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
