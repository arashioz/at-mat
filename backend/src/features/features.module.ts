import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { FeatureFlag, FeatureFlagSchema } from './schemas/feature-flag.schema';

@Module({
  imports: [
    DiscoveryModule,
    MongooseModule.forFeature([{ name: FeatureFlag.name, schema: FeatureFlagSchema }]),
    UsersModule,
  ],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
