import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { jwtConfigFactory } from './auth.jwt.config';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([User]),
    //Inyeccion Modulo de JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      //Registramos la configuracion del JWT
      useFactory:jwtConfigFactory,
    })
],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
