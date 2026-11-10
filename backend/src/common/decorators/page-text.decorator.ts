import { ValidateBy } from 'class-validator';
import { PAGE_TEXT_MAX_LENGTH } from '../content-copy';

export function IsPageText(defaults: Record<string, string>): PropertyDecorator {
  return ValidateBy({
    name: 'isPageText',
    validator: {
      validate(value: unknown) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
        return Object.entries(value).every(([key, text]) =>
          Object.prototype.hasOwnProperty.call(defaults, key) &&
          typeof text === 'string' && text.length <= PAGE_TEXT_MAX_LENGTH);
      },
      defaultMessage: () => 'عنوان‌ها و متن‌های نمایش صفحه نامعتبرند.',
    },
  });
}
