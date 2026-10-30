import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { UploadImageDto } from './dto/upload-image.dto';
import { ImageCategory, ImageEntry, StorageService } from './storage.service';

@ApiTags('Storage (Images)')
@ApiBearerAuth()
@Controller('storage/images')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({ summary: 'آپلود عکس در یک دسته‌بندی (ادمین، مدیر فروش، بازاریاب)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'category'],
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', enum: ['products', 'customers', 'branding', 'general'] },
        description: { type: 'string' },
      },
    },
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.MARKETER)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
    @CurrentUser() actor: UserDocument,
  ): Promise<ImageEntry> {
    return this.storageService.upload(file, dto.category as ImageCategory, actor._id.toString(), dto.description);
  }

  @ApiOperation({ summary: 'لیست عکس‌ها (با فیلتر دسته‌بندی اختیاری)' })
  @ApiQuery({ name: 'category', required: false, enum: ['products', 'customers', 'branding', 'general'] })
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('category') category?: ImageCategory): Promise<ImageEntry[]> {
    return this.storageService.list(category);
  }

  @ApiOperation({ summary: 'حذف عکس (فقط ادمین)' })
  @ApiQuery({ name: 'key', required: true, description: 'کلید عکس، مثلاً products/uuid.jpg' })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Query('key') key: string): Promise<void> {
    return this.storageService.remove(key);
  }
}
