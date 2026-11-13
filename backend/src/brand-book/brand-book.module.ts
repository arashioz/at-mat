import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { BrandBookController } from './brand-book.controller';
import { BrandBookService, BrandBookSchema } from './brand-book.service';

@Module({
  imports: [UsersModule, StorageModule, MongooseModule.forFeature([{ name: 'BrandBook', schema: BrandBookSchema }])],
  controllers: [BrandBookController],
  providers: [BrandBookService],
})
export class BrandBookModule {}
