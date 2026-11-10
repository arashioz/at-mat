import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  @Get() list(@Query('summary') summary?: string) { return this.service.adminList(summary === '1'); }
  @Get(':id') one(@Param('id') id: string) { return this.service.adminOne(id); }
  @Post() create(@Body() dto: CreateArticleDto, @CurrentUser() actor: UserDocument) { return this.service.create(dto, actor._id.toString()); }
  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: ArticleStatusDto, @CurrentUser() actor: UserDocument, @Headers('if-match') version?: string) {
    return this.service.status(id, dto.status, actor._id.toString(), version);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @CurrentUser() actor: UserDocument, @Headers('if-match') version?: string) {
    return this.service.update(id, dto, actor._id.toString(), version);
  }
  @Delete(':id') remove(@Param('id') id: string, @Headers('if-match') version?: string) { return this.service.remove(id, version); }
}
