import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateRecipeCommentDto, RecipeCommentsQueryDto } from './dto/recipe-comment.dto';
import { CreateRecipeDto, RecipeRevisionDto, SaveRecipeDraftDto } from './dto/recipe.dto';
import { RecipeCommentsService } from './recipe-comments.service';
import { RecipesService } from './recipes.service';

@ApiTags('Public Recipes')
@Controller('public/recipes')
export class PublicRecipesController {
  constructor(private readonly recipes: RecipesService, private readonly comments: RecipeCommentsService) {}

  @Get()
  list() { return this.recipes.publicList(); }

  @Get(':slug')
  one(@Param('slug') slug: string) { return this.recipes.publicOne(slug); }

  @Get(':slug/comments')
  @Header('Cache-Control', 'no-store')
  listComments(@Param('slug') slug: string, @Query() query: RecipeCommentsQueryDto) {
    return this.comments.list(slug, query.before);
  }

  @Post(':slug/comments')
  postComment(@Param('slug') slug: string, @Body() dto: CreateRecipeCommentDto) {
    return this.comments.create(slug, dto);
  }
}

@ApiTags('Recipes CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Get()
  list() { return this.recipes.adminList(); }

  @Get(':slug')
  one(@Param('slug') slug: string) { return this.recipes.adminOne(slug); }

  @Post()
  create(@Body() dto: CreateRecipeDto) { return this.recipes.create(dto); }

  @Put(':slug')
  saveDraft(@Param('slug') slug: string, @Body() dto: SaveRecipeDraftDto) {
    return this.recipes.saveDraft(slug, dto);
  }

  @Post(':slug/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('slug') slug: string, @Body() dto: RecipeRevisionDto) {
    return this.recipes.publish(slug, dto?.expectedRevision);
  }

  @Post(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('slug') slug: string, @Body() dto: RecipeRevisionDto) {
    return this.recipes.unpublish(slug, dto?.expectedRevision);
  }
}
