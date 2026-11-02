import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY, FeatureMeta } from '../decorators/require-feature.decorator';
import { Role } from '../enums/role.enum';
import { FeaturesService } from '../../features/features.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featuresService: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<FeatureMeta>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return true;

    const { user } = context.switchToHttp().getRequest();
    if (user?.role === Role.SUPER_ADMIN) return true;

    if (!(await this.featuresService.isEnabled(meta.key))) {
      throw new ForbiddenException('این قابلیت در حال حاضر غیرفعال است');
    }
    return true;
  }
}
