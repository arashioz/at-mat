import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class KitchenLoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(10) @MaxLength(72) password: string;
}
export class KitchenRegisterDto extends KitchenLoginDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(60) name: string;
}
export class KitchenMessageDto {
  @IsUUID('4') requestId: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(2000) text: string;
}
export class KitchenSaveDto {
  @IsUUID('4') conversationId: string;
  @IsUUID('4') messageId: string;
}
