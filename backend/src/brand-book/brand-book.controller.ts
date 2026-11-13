import { Body, Controller, Get, Header, HttpCode, NotFoundException, Param, Post, Put, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BRAND_SOURCES } from './brand-book.content';
import { BrandQuestionDto, UpdateBrandBookDto } from './brand-book.dto';
import { BrandBookService } from './brand-book.service';

@ApiTags('Brand Book')
@ApiBearerAuth()
@Controller('brand-book')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BrandBookController {
  constructor(private readonly book: BrandBookService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  get() { return this.book.get(); }

  @Put()
  update(@Body() dto: UpdateBrandBookDto) { return this.book.update(dto); }

  @Get('assets')
  @Header('Cache-Control', 'private, no-store')
  assets() { return this.book.assets(); }

  @Post('questions')
  @HttpCode(200)
  ask(@Body() dto: BrandQuestionDto) { return this.book.ask(dto.question); }

  @Get('sources/:id')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async source(@Param('id') id: string) {
    const source = BRAND_SOURCES.find(item => item.id === id);
    if (!source) throw new NotFoundException('سند پیدا نشد.');
    const path = resolve(process.cwd(), '..', 'assets', 'brand-book-sources', source.file);
    const file = await stat(path).catch(() => null);
    if (!file?.isFile()) throw new NotFoundException('فایل منبع در این محیط در دسترس نیست.');
    return new StreamableFile(createReadStream(path), {
      type: source.type, disposition: `attachment; filename="${source.file}"`, length: file.size,
    });
  }
}
