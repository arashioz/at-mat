export const collaborationKinds = ['sales', 'employment'] as const;
export type CollaborationKind = typeof collaborationKinds[number];

export const collaborationLabels: Record<CollaborationKind, string> = {
  sales: 'نمایندگی فروش',
  employment: 'استخدام',
};

export const employmentAreas = [
  'فروش و بازاریابی',
  'تولید و کنترل کیفیت',
  'انبار و توزیع',
  'امور اداری و مالی',
  'سایر حوزه‌ها',
] as const;
