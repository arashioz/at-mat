import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FEATURE_KEY, FeatureMeta } from '../common/decorators/require-feature.decorator';
import { Role } from '../common/enums/role.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { FeatureFlag, FeatureFlagDocument } from './schemas/feature-flag.schema';

@Injectable()
export class FeaturesService implements OnModuleInit {
  constructor(
    @InjectModel(FeatureFlag.name) private readonly featureModel: Model<FeatureFlagDocument>,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncDiscoveredFeatures();
  }

  // اسکن خودکار همه کنترلرها و هندلرها: هر چیزی که @RequireFeature داشته باشد، بدون تغییر دستی ثبت می‌شود
  private discoverFeatures(): FeatureMeta[] {
    const found = new Map<string, FeatureMeta>();
    const providers = this.discoveryService.getControllers();

    for (const wrapper of providers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const classMeta = this.reflector.get<FeatureMeta>(FEATURE_KEY, metatype);
      if (classMeta) found.set(classMeta.key, classMeta);

      const proto = Object.getPrototypeOf(instance);
      for (const name of this.metadataScanner.getAllMethodNames(proto)) {
        const handler = proto[name];
        const meta = this.reflector.get<FeatureMeta>(FEATURE_KEY, handler);
        if (meta) found.set(meta.key, meta);
      }
    }
    return [...found.values()];
  }

  // فیچرهای جدید با enabled=true ساخته می‌شوند و وضعیت قبلی فیچرهای موجود حفظ می‌شود
  private async syncDiscoveredFeatures(): Promise<void> {
    for (const meta of this.discoverFeatures()) {
      await this.featureModel
        .updateOne(
          { key: meta.key },
          {
            $set: { label: meta.label, group: meta.group, description: meta.description ?? '' },
            $setOnInsert: { enabled: true },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  findAll(): Promise<FeatureFlagDocument[]> {
    return this.featureModel.find().sort({ group: 1, key: 1 }).exec();
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.featureModel.findOne({ key }).lean().exec();
    return flag?.enabled ?? true;
  }

  async getEnabledMap(user: UserDocument): Promise<Record<string, boolean>> {
    const flags = await this.featureModel.find().lean().exec();
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    return Object.fromEntries(flags.map((flag) => [flag.key, isSuperAdmin || flag.enabled]));
  }

  async setEnabled(key: string, enabled: boolean): Promise<FeatureFlagDocument> {
    const flag = await this.featureModel.findOneAndUpdate({ key }, { enabled }, { new: true }).exec();
    if (!flag) {
      throw new NotFoundException('فیچر پیدا نشد');
    }
    return flag;
  }
}
