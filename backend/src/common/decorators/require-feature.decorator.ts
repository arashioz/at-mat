import { SetMetadata } from '@nestjs/common';

export interface FeatureMeta {
  key: string;
  label: string;
  group: string;
  description?: string;
}

export const FEATURE_KEY = 'feature';
// هر کنترلر/هندلری که با این دکوریتور مشخص شود، به‌صورت خودکار در لیست فیچرهای سوپر ادمین ثبت می‌شود
export const RequireFeature = (meta: FeatureMeta) => SetMetadata(FEATURE_KEY, meta);
