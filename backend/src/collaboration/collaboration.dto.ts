import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { collaborationKinds, employmentAreas, type CollaborationKind } from '../common/collaboration';
import { normalizePhone, PHONE_REGEX } from '../common/utils/phone.util';

const trim = ({ value }: TransformFnParams) => typeof value === 'string' ? value.trim() : value;

export class CreateCollaborationDto {
  @IsUUID('4')
  requestId: string;

  @IsIn(collaborationKinds)
  kind: CollaborationKind;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'نام و نام خانوادگی را وارد کنید.' })
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => typeof value === 'string' ? normalizePhone(value) : value)
  @Matches(PHONE_REGEX, { message: 'شمارهٔ موبایل را با ۰۹ یا ‎+۹۸ وارد کنید.' })
  phone: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'شهر را وارد کنید.' })
  @MaxLength(100)
  city: string;

  @Transform(trim)
  @IsOptional()
  @IsEmail({}, { message: 'نشانی ایمیل معتبر وارد کنید.' })
  @MaxLength(150)
  email?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ValidateIf((request: CreateCollaborationDto) => request.kind === 'employment' || request.jobArea !== undefined)
  @IsIn(employmentAreas, { message: 'حوزهٔ کاری موردنظر را انتخاب کنید.' })
  jobArea?: string;

  @Transform(trim)
  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, disallow_auth: true }, { message: 'لینک رزومه را به صورت یک نشانی معتبر وارد کنید.' })
  @MaxLength(800)
  resumeUrl?: string;

  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'کمی بیشتر دربارهٔ سابقه یا درخواست‌تان بنویسید.' })
  @MaxLength(1600)
  details: string;
}

export class CollaborationListDto {
  @IsOptional()
  @IsIn(collaborationKinds)
  kind?: CollaborationKind;

  @IsOptional()
  @IsIn(['new', 'reviewed'])
  status?: 'new' | 'reviewed';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
}

export class ReviewCollaborationDto {
  @IsBoolean()
  reviewed: boolean;
}
