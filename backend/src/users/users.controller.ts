import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';

@ApiTags('Users (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'ایجاد کاربر جدید با هر نقش' })
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: UserDocument): Promise<UserDocument> {
    return this.usersService.create(dto, actor);
  }

  @ApiOperation({ summary: 'لیست کاربران (با فیلتر نقش اختیاری)' })
  @Get()
  findAll(@Query() query: ListUsersQueryDto): Promise<UserDocument[]> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'دریافت یک کاربر' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'ویرایش کاربر (نام، ایمیل، تلفن، نقش، فعال/غیرفعال، رمز)' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: UserDocument,
  ): Promise<UserDocument> {
    return this.usersService.update(id, dto, actor);
  }

  @ApiOperation({ summary: 'حذف کاربر' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: UserDocument): Promise<void> {
    return this.usersService.remove(id, actor);
  }
}
