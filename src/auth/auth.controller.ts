import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}
  //Registrarse
  @Post('register')
  //decorador para que nest maneje la solictud HTTP
  register(@Body()dto:RegisterDto){
    return this.authService.register(dto)
  }

  //Login
  @Post('login')
  login(@Body()dto:LoginDto){
    return this.authService.login(dto)
  }
}
