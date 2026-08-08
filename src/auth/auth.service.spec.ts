import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
//Mockeamos Bycript fuera del describe ya que es una dependecia
jest.mock('bcrypt')
describe('AuthService Register', () => {
  //declaramos las variables
  let service: AuthService
  let userRepository: Repository<User>

  //Mockeamos la dependencia externa que es el REPO
  //Para que no toque la base de datos
  const mockUserRepository = {
    //funciones falsas 
    findOne: jest.fn(),
    save: jest.fn(),
  }
  //MockdeJwtService
  const mockJwtService = {
    //definimos este metdo de jwt
    signAsync: jest.fn()
  }



  //Antes de cada prueba creamos un mi-modulo para Testing
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          // Cuando el service pida el repo de User, le damos el mock
          provide: getRepositoryToken(User),
          //Cuando el servicio pida el repositorio le vamos pasar el objeto falso
          useValue: mockUserRepository,
        },
        {
          //Conectamos el Mock al service real
          provide: JwtService,
          useValue: mockJwtService

        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });
  //Limpieza de Test
  afterEach(() => {
    jest.clearAllMocks();
  })


  //usar JestMock para mockera las funciones
  it('Auth service Register 201 Created', async () => {
    //espec lo que esperamos de los ecenarios
    //Preparamos el ecenario con destruturaciom
    const dto = { email: 'test@test.com', password: '12345678' }

    //el email Todavia no existe hasta este punto por eso esta null
    mockUserRepository.findOne.mockResolvedValue(null)

    //resolvemos el valor
    mockUserRepository.save.mockResolvedValue({
      id: 'un-uuid',
      email: dto.email,
      passwordHash: 'hash_falso',
    })

    //Ejecutamos el metodo real
    const resultado = await service.register(dto)

    //Verificamos lo que esperamos
    expect(resultado).toEqual({ message: 'Cuenta Creada exitosamente' });
    //Esperamos que se llamado
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });
    //esperamos que el metodo de save se mandado a llamar
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
  it('should return error if the email is register', async () => {
    //ya el emial existe asi que rsolvemos los valores
    const dto = { email: 'test@test.com', password: '12345678' };

    //resolvemos los valores
    mockUserRepository.findOne.mockResolvedValue({
      id: 'ya-existe',
      email: dto.email,
      passwordHash: 'hash_existente',
    });

    // ACT + ASSERT: esperamos que LANCE la excepción
    await expect(service.register(dto)).rejects.toThrow(ConflictException);

    // Y verificamos que NUNCA llamó a save (cortó antes)
    expect(mockUserRepository.save).not.toHaveBeenCalled()

  })
  it('should return a token with valid credentials', async () => {
    //Tecnica de Preparar,Actuar y Comprobar
    const dto = { email: 'test@test.com', password: '12345678' }

    //simulamos en la base de datos resolviendo el Valor que le pasamos un objeto
    mockUserRepository.findOne.mockResolvedValue({
      id: 'user-uuid',
      email: dto.email,
      passwordHash: 'hashed_password',
    });
    //simulamos que la contraseña es la correcta con el True
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    //simulamos la creacion del token
    //le pasamos un token falso solo simulamos el comportamiento
    mockJwtService.signAsync.mockResolvedValue('fake-jwt-token')

    //Ejuctamos la logica que testeamos de forma asincronica
    const result = await service.login(dto)

    //esperamos lon que hciera
    expect(result).toEqual({ accessToken: 'fake-jwt-token' });

    //se llamaron con los datos de prueba
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-uuid',
      email: dto.email,
    });
    //esperamos que la contraseña se haya comprado con el hash
    expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, 'hashed_password');

  })
  it('should throw error with invalid credentials', async () => {
    //definimos el request de Prueba
    const dto = { email: 'test@test.com', password: 'wrongpassword' };

    //resolvemos el valor con el Objeto
    mockUserRepository.findOne.mockResolvedValue({
      id: 'user-uuid',
      email: dto.email,
      passwordHash: 'hashed_password',
    });

    //le pasamos false al mcokresolved value para que falle
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    //esperamos que no se llame ya que fallo la autenticacion
    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  })

});
