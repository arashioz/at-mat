import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { CollaborationController, PublicCollaborationController } from './collaboration.controller';
import { CollaborationRequest, CollaborationRequestSchema } from './collaboration.schema';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CollaborationRequest.name, schema: CollaborationRequestSchema }]),
    UsersModule,
  ],
  controllers: [CollaborationController, PublicCollaborationController],
  providers: [CollaborationService],
})
export class CollaborationModule {}
