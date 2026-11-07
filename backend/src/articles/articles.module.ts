import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../storage/storage.module';
import { ArticlesController, PublicArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Article, ArticleSchema } from './schemas/article.schema';
import { UsersModule } from '../users/users.module';
@Module({ imports: [MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]), StorageModule, UsersModule], controllers: [ArticlesController, PublicArticlesController], providers: [ArticlesService] })
export class ArticlesModule {}
