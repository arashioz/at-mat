import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال یا یافت نشد');
    }

    request.user = user;
    return true;
  }

  private extractToken(authorization?: string): string | undefined {
    if (!authorization) return undefined;
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
