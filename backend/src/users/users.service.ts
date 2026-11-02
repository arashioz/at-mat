import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { isValidObjectId, Model } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { isEmailIdentifier, normalizePhone } from '../common/utils/phone.util';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureInitialAdmin();
    await this.ensureInitialSuperAdmin();
  }

  private async ensureInitialSuperAdmin(): Promise<void> {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL')?.toLowerCase();
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (!email || !password) return;

    const exists = await this.userModel.exists({ email });
    if (exists) return;

    await this.userModel.create({
      fullName: this.configService.get<string>('SUPER_ADMIN_FULL_NAME') ?? 'Super Admin',
      email,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: Role.SUPER_ADMIN,
      isActive: true,
    });
    this.logger.log(`Initial super admin created: ${email}`);
  }

  private async ensureInitialAdmin(): Promise<void> {
    const email = this.configService.getOrThrow<string>('ADMIN_EMAIL').toLowerCase();
    const exists = await this.userModel.exists({ email });
    if (exists) return;

    const password = this.configService.getOrThrow<string>('ADMIN_PASSWORD');
    await this.userModel.create({
      fullName: this.configService.get<string>('ADMIN_FULL_NAME') ?? 'System Admin',
      email,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: Role.ADMIN,
      isActive: true,
    });
    this.logger.log(`Initial admin created: ${email}`);
  }

  async create(dto: CreateUserDto, actor: UserDocument): Promise<UserDocument> {
    const email = dto.email ? dto.email.toLowerCase().trim() : undefined;
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    if (!email && !phone) {
      throw new BadRequestException('حداقل ایمیل یا شماره موبایل باید وارد شود');
    }
    this.assertCanAssignRole(actor, dto.role);
    await this.ensureUniqueContact({ email, phone });

    return this.userModel.create({
      fullName: dto.fullName,
      email,
      phone,
      passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      role: dto.role,
      isActive: true,
    });
  }

  async findAll(query: ListUsersQueryDto): Promise<UserDocument[]> {
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    return user;
  }

  async findByIdentifierWithPassword(identifier: string): Promise<UserDocument | null> {
    const value = identifier.trim();
    const filter = isEmailIdentifier(value)
      ? { email: value.toLowerCase() }
      : { phone: normalizePhone(value) };
    return this.userModel.findOne(filter).select('+passwordHash').exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    const user = await this.userModel.findById(id).select('+passwordHash').exec();
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: UserDocument): Promise<UserDocument> {
    const user = await this.findById(id);
    const actorId = actor._id.toString();
    const isSelf = user._id.toString() === actorId;

    if (isSelf && user.role === Role.ADMIN) {
      if (dto.isActive === false) {
        throw new BadRequestException('ادمین نمی‌تواند حساب خودش را غیرفعال کند');
      }
      if (dto.role && dto.role !== Role.ADMIN) {
        throw new BadRequestException('ادمین نمی‌تواند نقش خودش را تغییر دهد');
      }
    }
    if (dto.role !== undefined) {
      this.assertCanAssignRole(actor, dto.role);
    }
    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('فقط سوپر ادمین می‌تواند سوپر ادمین دیگر را ویرایش کند');
    }

    const email = dto.email !== undefined ? dto.email.toLowerCase().trim() : user.email;
    const phone = dto.phone !== undefined ? normalizePhone(dto.phone) : user.phone;
    if (!email && !phone) {
      throw new BadRequestException('حداقل ایمیل یا شماره موبایل باید وجود داشته باشد');
    }
    await this.ensureUniqueContact({ email, phone }, user._id.toString());

    user.email = email || undefined;
    user.phone = phone || undefined;
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    return user.save();
  }

  async remove(id: string, actor: UserDocument): Promise<void> {
    if (id === actor._id.toString()) {
      throw new BadRequestException('نمی‌توانید حساب خودتان را حذف کنید');
    }
    const target = await this.findById(id);
    if (target.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('فقط سوپر ادمین می‌تواند سوپر ادمین دیگر را حذف کند');
    }
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
  }

  private assertCanAssignRole(actor: UserDocument, role: Role): void {
    if (role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('فقط سوپر ادمین می‌تواند نقش سوپر ادمین را تخصیص دهد');
    }
  }

  private async ensureUniqueContact(
    contact: { email?: string; phone?: string },
    excludeId?: string,
  ): Promise<void> {
    const conditions: Record<string, unknown>[] = [];
    if (contact.email) conditions.push({ email: contact.email });
    if (contact.phone) conditions.push({ phone: contact.phone });
    if (conditions.length === 0) return;

    const filter: Record<string, unknown> = { $or: conditions };
    if (excludeId) filter._id = { $ne: excludeId };

    const existing = await this.userModel.findOne(filter).lean().exec();
    if (!existing) return;
    if (contact.email && existing.email === contact.email) {
      throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }
    throw new ConflictException('این شماره موبایل قبلاً ثبت شده است');
  }
}
