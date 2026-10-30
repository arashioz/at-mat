import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';
import { CustomerDocument } from './schemas/customer.schema';

@ApiTags('CRM: Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'ثبت مشتری (ادمین و مدیر فروش)' })
  @Post()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  create(@Body() dto: CreateCustomerDto): Promise<CustomerDocument> {
    return this.customersService.create(dto);
  }

  @ApiOperation({ summary: 'لیست مشتریان' })
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.MARKETER)
  findAll(): Promise<CustomerDocument[]> {
    return this.customersService.findAll();
  }

  @ApiOperation({ summary: 'دریافت یک مشتری' })
  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.MARKETER)
  findOne(@Param('id') id: string): Promise<CustomerDocument> {
    return this.customersService.findOne(id);
  }

  @ApiOperation({ summary: 'فعال/غیرفعال کردن مشتری (ادمین و مدیر فروش)' })
  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean): Promise<CustomerDocument> {
    return this.customersService.setActive(id, isActive);
  }
}
