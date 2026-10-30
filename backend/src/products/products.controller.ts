import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { ProductDocument } from './schemas/product.schema';

@ApiTags('ERP: Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'ثبت محصول (فقط ادمین)' })
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto): Promise<ProductDocument> {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: 'لیست محصولات' })
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.MARKETER, Role.DISTRIBUTION_AGENT)
  findAll(): Promise<ProductDocument[]> {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'دریافت یک محصول' })
  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.MARKETER, Role.DISTRIBUTION_AGENT)
  findOne(@Param('id') id: string): Promise<ProductDocument> {
    return this.productsService.findOne(id);
  }
}
