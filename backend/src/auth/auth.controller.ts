import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'ورود همه نقش‌ها با ایمیل و رمز عبور' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ accessToken: string; user: UserDocument }> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'اطلاعات کاربر لاگین‌شده' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: UserDocument): UserDocument {
    return user;
  }

  @ApiOperation({ summary: 'تغییر رمز عبور توسط خود کاربر' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: UserDocument,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user._id.toString(), dto);
  }
}
