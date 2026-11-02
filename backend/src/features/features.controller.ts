import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { FeaturesService } from './features.service';
import { FeatureFlagDocument } from './schemas/feature-flag.schema';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @ApiOperation({ summary: 'وضعیت فیچرها برای کاربر لاگین‌شده' })
  @Get('me')
  getMyFeatures(@CurrentUser() user: UserDocument): Promise<Record<string, boolean>> {
    return this.featuresService.getEnabledMap(user);
  }

  @ApiOperation({ summary: 'لیست همه فیچرها (فقط سوپر ادمین)' })
  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll(): Promise<FeatureFlagDocument[]> {
    return this.featuresService.findAll();
  }

  @ApiOperation({ summary: 'فعال/غیرفعال کردن یک فیچر (فقط سوپر ادمین)' })
  @Patch(':key')
  @Roles(Role.SUPER_ADMIN)
  setEnabled(@Param('key') key: string, @Body('enabled') enabled: boolean): Promise<FeatureFlagDocument> {
    return this.featuresService.setEnabled(key, enabled);
  }
}
