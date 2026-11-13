import { BadRequestException, ConflictException, HttpException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { KitchenConversation, KitchenLimit, KitchenMember, KitchenSession } from './kitchen.schema';
import { KitchenLoginDto, KitchenRegisterDto } from './kitchen.dto';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const dummyHash = bcrypt.hashSync('not-a-real-member-password', 12);
export const publicMember = (member: KitchenMember) => ({ id: member._id.toString(), name: member.name, guest: member.guest });

@Injectable()
export class KitchenAuthService implements OnModuleInit {
  constructor(
    @InjectModel(KitchenMember.name) private members: Model<KitchenMember>,
    @InjectModel(KitchenSession.name) private sessions: Model<KitchenSession>,
    @InjectModel(KitchenConversation.name) private conversations: Model<KitchenConversation>,
    @InjectModel(KitchenLimit.name) private limits: Model<KitchenLimit>,
  ) {}
  async onModuleInit() { await Promise.all([this.members.init(), this.sessions.init(), this.limits.init()]); }

  async rate(key: string, maximum: number, seconds = 3600) {
    const slot = Math.floor(Date.now() / (seconds * 1000));
    const _id = digest(`${key}:${slot}`);
    let row;
    try {
      row = await this.limits.findOneAndUpdate({ _id }, {
        $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((slot + 2) * seconds * 1000) },
      }, { upsert: true, new: true }).lean();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      row = await this.limits.findOneAndUpdate({ _id }, { $inc: { count: 1 } }, { new: true }).lean();
    }
    if (!row || row.count > maximum) throw new HttpException('درخواست‌های زیادی فرستاده‌ای. کمی بعد دوباره امتحان کن.', 429);
  }

  token(header?: string) { return header?.match(/^Bearer ([a-f0-9]{64})$/)?.[1]; }
  async optional(header?: string) {
    const token = this.token(header);
    if (!token) return null;
    const session = await this.sessions.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } }).lean();
    return session ? this.members.findById(session.memberId).lean() : null;
  }
  async require(header?: string) {
    const member = await this.optional(header);
    if (!member) throw new UnauthorizedException('برای ادامه، گفتگو را دوباره باز کن.');
    return member;
  }
  private async issue(member: KitchenMember) {
    const token = randomBytes(32).toString('hex');
    await this.sessions.create({ tokenHash: digest(token), memberId: member._id, expiresAt: new Date(Date.now() + 30 * 86400000) });
    return { user: publicMember(member), token };
  }
  async ensure(header?: string) {
    const member = await this.optional(header);
    if (member) return { user: publicMember(member) };
    return this.issue(await this.members.create({ guest: true }));
  }
  async register(dto: KitchenRegisterDto, header?: string) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('رمز عبور کوتاه‌تری انتخاب کن.');
    const current = await this.optional(header);
    if (current && !current.guest) throw new ConflictException('هم‌اکنون وارد حساب شده‌ای.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    let member;
    try {
      member = current
        ? await this.members.findOneAndUpdate({ _id: current._id, guest: true }, { $set: { name: dto.name, email: dto.email, passwordHash, guest: false } }, { new: true })
        : await this.members.create({ name: dto.name, email: dto.email, passwordHash, guest: false });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictException('ساخت حساب با این ایمیل ممکن نیست. اگر حساب داری، وارد شو.');
      throw error;
    }
    if (!member) throw new ConflictException('حساب تغییر کرده است؛ صفحه را تازه کن.');
    await this.logout(header);
    return this.issue(member);
  }
  async login(dto: KitchenLoginDto, header?: string) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('رمز عبور بیش از حد بلند است.');
    const member = await this.members.findOne({ email: dto.email, guest: false }).select('+passwordHash');
    const valid = await bcrypt.compare(dto.password, member?.passwordHash ?? dummyHash);
    if (!member || !valid) throw new UnauthorizedException('ایمیل یا رمز عبور درست نیست.');
    const guest = await this.optional(header);
    if (guest?.guest) {
      // Only the bearer-owned guest history can move into the authenticated account.
      await this.conversations.updateMany({ memberId: guest._id }, { $set: { memberId: member._id } });
      await this.sessions.deleteMany({ memberId: guest._id });
      await this.members.deleteOne({ _id: guest._id, guest: true });
    } else await this.logout(header);
    return this.issue(member);
  }
  async logout(header?: string) {
    const token = this.token(header);
    if (token) await this.sessions.deleteOne({ tokenHash: digest(token) });
    return { ok: true };
  }
}
