import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CollaborationListDto, CreateCollaborationDto } from './collaboration.dto';
import { CollaborationRequest } from './collaboration.schema';

const pageSize = 24;

@Injectable()
export class CollaborationService {
  constructor(@InjectModel(CollaborationRequest.name) private readonly requests: Model<CollaborationRequest>) {}

  async submit(dto: CreateCollaborationDto) {
    const { requestId, kind, name, phone, city, email, details } = dto;
    const specific = kind === 'sales'
      ? { company: dto.company || undefined }
      : { jobArea: dto.jobArea, resumeUrl: dto.resumeUrl };
    try {
      // Retrying a submission with the same ID preserves the original request.
      await this.requests.updateOne(
        { _id: requestId },
        { $setOnInsert: { kind, name, phone, city, email, details, ...specific } },
        { upsert: true, runValidators: true },
      ).exec();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    return { accepted: true };
  }

  async list({ kind, status, page = 1 }: CollaborationListDto) {
    const filter = {
      ...(kind && { kind }),
      ...(status && { reviewed: status === 'reviewed' }),
    };
    const [items, total] = await Promise.all([
      this.requests.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.requests.countDocuments(filter).exec(),
    ]);
    return { items, total, pageSize };
  }

  async review(id: string, reviewed: boolean) {
    const result = await this.requests.updateOne({ _id: id }, { $set: { reviewed } }).exec();
    if (!result.matchedCount) throw new NotFoundException('درخواست پیدا نشد.');
    return { reviewed };
  }
}
