import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const sku = dto.sku.trim().toUpperCase();
    const exists = await this.productModel.exists({ sku });
    if (exists) throw new BadRequestException('این SKU قبلاً ثبت شده است');
    return this.productModel.create({ ...dto, sku, stockQuantity: dto.stockQuantity ?? 0, unit: dto.unit ?? 'piece' });
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('محصول پیدا نشد');
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('محصول پیدا نشد');
    return product;
  }
}
