import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  login(@Request() req: { user: { userId: number; email: string } }) {
    return this.authService.login({
      id: req.user.userId,
      email: req.user.email,
    });
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req: { user: { userId: number; email: string } }) {
    return req.user;
  }
}
