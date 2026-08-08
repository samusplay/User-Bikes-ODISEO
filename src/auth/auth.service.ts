import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
    //1.Crear un constructor para inyectar Repo default
    constructor(
        //Le pedimos a Nest el Repo de la entidad
        @InjectRepository(User)
        //<User> Nos trae los metodos del repo
        private readonly userRepository: Repository<User>,
        //injectamos el JWT service
        private readonly jwtservice: JwtService
    ) { }
    //METODO REGISTER
    async register(dto: RegisterDto) {
        //1 Verificar que el Email no este registrado
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email }
        })

        //Si esto se cumple muestra este mensaje
        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        //2.HASHEO PASSWORD
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // 3. Guardar en la base de datos
        await this.userRepository.save({
            email: dto.email,
            passwordHash: passwordHash
        });

        //5.Devolvemos mensaje de exito
        return {
            message: 'Cuenta Creada exitosamente'
        }

    }
    //le pasamos los Parametros del dto 
    async login(dto: LoginDto) {
        //1.Buscamos el usuario
        const user = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        //2.Excepcion si el usario no existe da un 401
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        //3.comparamos el password Con bcrypt con dos parametros
        const passwordValida = await bcrypt.compare(dto.password, user.passwordHash)

        //4.Validacion si no Coinciden
        if (!passwordValida) {
            throw new UnauthorizedException('Credenciales inválidas')
        }
        //5.Generamos el jwt con el payload
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtservice.signAsync(payload);

        //devolvemos Token al cliente
        return{
            accessToken
        };


    }
}
