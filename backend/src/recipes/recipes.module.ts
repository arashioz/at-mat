import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { PublicRecipesController, RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeOverlay, RecipeOverlaySchema } from './schemas/recipe-overlay.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RecipeOverlay.name, schema: RecipeOverlaySchema }]), StorageModule, UsersModule],
  controllers: [RecipesController, PublicRecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
