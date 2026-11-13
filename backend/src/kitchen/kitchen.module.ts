import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipesModule } from '../recipes/recipes.module';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';
import { KitchenAgentService } from './kitchen-agent.service';
import { KitchenAuthService } from './kitchen-auth.service';
import * as schemas from './kitchen.schema';
@Module({
  imports: [RecipesModule, MongooseModule.forFeature([
    { name: schemas.KitchenMember.name, schema: schemas.KitchenMemberSchema },
    { name: schemas.KitchenSession.name, schema: schemas.KitchenSessionSchema },
    { name: schemas.KitchenConversation.name, schema: schemas.KitchenConversationSchema },
    { name: schemas.KitchenSavedRecipe.name, schema: schemas.KitchenSavedRecipeSchema },
    { name: schemas.KitchenLimit.name, schema: schemas.KitchenLimitSchema },
  ])],
  controllers: [KitchenController], providers: [KitchenService, KitchenAuthService, KitchenAgentService],
})
export class KitchenModule {}
