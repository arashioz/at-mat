import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { KitchenConversation, KitchenMember, KitchenSavedRecipe } from './kitchen.schema';
import { KitchenAgentService } from './kitchen-agent.service';
import { KitchenAuthService } from './kitchen-auth.service';
import { KitchenMessageDto, KitchenSaveDto } from './kitchen.dto';
import { KitchenMessage } from './kitchen.types';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const view = (row: KitchenConversation) => ({ id: row._id, title: row.title, messages: row.messages, updatedAt: row.updatedAt, pending: !!row.busyUntil && row.busyUntil > new Date() });
const savedView = (row: KitchenSavedRecipe) => ({ id: row._id.toString(), conversationId: row.conversationId, messageId: row.messageId, recipe: row.recipe, createdAt: row.createdAt });

@Injectable()
export class KitchenService implements OnModuleInit {
  constructor(
    @InjectModel(KitchenConversation.name) private conversations: Model<KitchenConversation>,
    @InjectModel(KitchenSavedRecipe.name) private saved: Model<KitchenSavedRecipe>,
    private agent: KitchenAgentService, private auth: KitchenAuthService,
  ) {}
  async onModuleInit() { await Promise.all([this.conversations.init(), this.saved.init()]); }
  private check(id: string) { if (!uuid.test(id)) throw new NotFoundException('گفتگو پیدا نشد.'); }
  async list(member: KitchenMember) {
    const rows = await this.conversations.find({ memberId: member._id }).select('_id title updatedAt').sort({ updatedAt: -1 }).limit(60).lean();
    return rows.map(row => ({ id: row._id, title: row.title, updatedAt: row.updatedAt }));
  }
  async get(member: KitchenMember, id: string) {
    this.check(id);
    const row = await this.conversations.findOne({ _id: id, memberId: member._id }).lean();
    if (!row) throw new NotFoundException('این گفتگو در حساب تو پیدا نشد.');
    return view(row);
  }
  async create(member: KitchenMember, id: string) {
    this.check(id);
    try {
      await this.conversations.updateOne({ _id: id, memberId: member._id }, { $setOnInsert: { memberId: member._id, messages: [], title: 'گفتگوی تازه' } }, { upsert: true });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    return this.get(member, id);
  }
  async send(member: KitchenMember, id: string, dto: KitchenMessageDto) {
    const current = await this.get(member, id);
    const duplicate = current.messages.find(m => m.requestId === dto.requestId && m.role === 'user');
    if (duplicate) {
      if (duplicate.text !== dto.text) throw new ConflictException('شناسهٔ پیام تکراری است.');
      return current;
    }
    if (current.messages.length >= 80) throw new BadRequestException('این گفتگو طولانی شده؛ یک گفتگوی تازه شروع کن.');
    await this.auth.rate(`message:${member._id}`, member.guest ? 30 : 80);
    const lease = randomUUID();
    const lock = await this.conversations.findOneAndUpdate({
      _id: id, memberId: member._id, 'messages.requestId': { $ne: dto.requestId },
      $or: [{ busyUntil: null }, { busyUntil: { $lt: new Date() } }],
    }, { $set: { lease, busyUntil: new Date(Date.now() + 45000) } }, { new: true }).lean();
    if (!lock) throw new ConflictException('پاسخ پیام قبلی هنوز آماده نشده؛ کمی بعد دوباره تلاش کن.');
    try {
      const reply = await this.agent.reply(lock.messages, dto.text);
      const createdAt = new Date().toISOString();
      const messages: KitchenMessage[] = [
        { id: randomUUID(), requestId: dto.requestId, role: 'user', text: dto.text, createdAt },
        { id: randomUUID(), requestId: dto.requestId, role: 'assistant', text: reply.text, reply, createdAt },
      ];
      const updated = await this.conversations.findOneAndUpdate({ _id: id, memberId: member._id, lease }, {
        $push: { messages: { $each: messages } },
        $set: { busyUntil: null, lease: null, ...(lock.messages.length === 0 ? { title: dto.text.slice(0, 65) } : {}) },
      }, { new: true }).lean();
      if (!updated) throw new ConflictException('گفتگو تغییر کرده؛ صفحه را تازه کن.');
      return view(updated);
    } finally {
      await this.conversations.updateOne({ _id: id, memberId: member._id, lease }, { $set: { lease: null, busyUntil: null } });
    }
  }
  async listSaved(member: KitchenMember) {
    if (member.guest) return [];
    return (await this.saved.find({ memberId: member._id }).sort({ createdAt: -1 }).limit(100).lean()).map(savedView);
  }
  async save(member: KitchenMember, dto: KitchenSaveDto) {
    if (member.guest) throw new UnauthorizedException('برای ذخیرهٔ رسپی، وارد حسابت شو.');
    const conversation = await this.get(member, dto.conversationId);
    const recipe = conversation.messages.find(m => m.id === dto.messageId && m.role === 'assistant')?.reply?.recipe;
    if (!recipe) throw new NotFoundException('رسپی قابل ذخیره پیدا نشد.');
    try {
      await this.saved.updateOne({ memberId: member._id, messageId: dto.messageId }, {
        $setOnInsert: { memberId: member._id, messageId: dto.messageId, conversationId: dto.conversationId, recipe },
      }, { upsert: true });
    } catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
    return savedView((await this.saved.findOne({ memberId: member._id, messageId: dto.messageId }).lean())!);
  }
  async removeSaved(member: KitchenMember, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('رسپی پیدا نشد.');
    const result = await this.saved.deleteOne({ _id: id, memberId: member._id });
    if (!result.deletedCount) throw new NotFoundException('رسپی پیدا نشد.');
    return { ok: true };
  }
}
