import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [UsersModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
