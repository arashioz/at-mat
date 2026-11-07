import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { ArticlesService } from './articles.service';
import { ArticleStatusDto, CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@ApiTags('Public Articles')
@Controller('public/articles')
export class PublicArticlesController {
  constructor(private readonly service: ArticlesService) {}
  @Get() list() { return this.service.publicList(); }
  @Get('categories') categories() { return this.service.categories(); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.service.publicOne(slug); }
}
@ApiTags('Articles CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}
  @Get() list() { return this.service.adminList(); }
  @Get(':id') one(@Param('id') id: string) { return this.service.adminOne(id); }
  @Post() create(@Body() dto: CreateArticleDto, @CurrentUser() actor: UserDocument) { return this.service.create(dto, actor._id.toString()); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() dto: ArticleStatusDto, @CurrentUser() actor: UserDocument) { return this.service.status(id, dto.status, actor._id.toString()); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @CurrentUser() actor: UserDocument) { return this.service.update(id, dto, actor._id.toString()); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
