import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { RecipeCommentsService } from './recipe-comments.service';
import { PublicRecipesController, RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeOverlay, RecipeOverlaySchema } from './schemas/recipe-overlay.schema';
import { RecipeComment, RecipeCommentSchema } from './schemas/recipe-comment.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: RecipeOverlay.name, schema: RecipeOverlaySchema },
    { name: RecipeComment.name, schema: RecipeCommentSchema },
  ]), StorageModule, UsersModule],
  controllers: [RecipesController, PublicRecipesController],
  providers: [RecipesService, RecipeCommentsService],
  exports: [RecipesService],
})
export class RecipesModule {}
