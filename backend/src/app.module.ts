import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { FeaturesModule } from './features/features.module';
import { ProductsModule } from './products/products.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { RecipesModule } from './recipes/recipes.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { BrandBookModule } from './brand-book/brand-book.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    StorageModule,
    CustomersModule,
    ProductsModule,
    FeaturesModule,
    ArticlesModule,
    RecipesModule,
    CollaborationModule,
    KitchenModule,
    BrandBookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
