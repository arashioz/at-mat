import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: UserDocument }> {
    const user = await this.usersService.findByIdentifierWithPassword(dto.identifier);
    const passwordOk = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      throw new UnauthorizedException('ایمیل/شماره موبایل یا رمز عبور اشتباه است');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    const payload: JwtPayload = { sub: user._id.toString(), role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, user };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByIdWithPassword(userId);
    const ok = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('رمز عبور فعلی اشتباه است');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }
}
