import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { normalizePhone } from '../common/utils/phone.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async create(dto: CreateCustomerDto): Promise<CustomerDocument> {
    return this.customerModel.create({
      ...dto,
      phone: normalizePhone(dto.phone),
      assignedTo: dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : undefined,
    });
  }

  async findAll(): Promise<CustomerDocument[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CustomerDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('مشتری پیدا نشد');
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) throw new NotFoundException('مشتری پیدا نشد');
    return customer;
  }

  async setActive(id: string, isActive: boolean): Promise<CustomerDocument> {
    const customer = await this.findOne(id);
    customer.isActive = isActive;
    return customer.save();
  }
}
