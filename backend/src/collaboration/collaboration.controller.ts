import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CollaborationListDto, CreateCollaborationDto, ReviewCollaborationDto } from './collaboration.dto';
import { CollaborationService } from './collaboration.service';

@ApiTags('Public Collaboration')
@Controller('public/collaboration')
export class PublicCollaborationController {
  constructor(private readonly collaboration: CollaborationService) {}

  @Post()
  submit(@Body() dto: CreateCollaborationDto) {
    return this.collaboration.submit(dto);
  }
}

@ApiTags('Collaboration Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaboration: CollaborationService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query() query: CollaborationListDto) {
    return this.collaboration.list(query);
  }

  @Patch(':id/review')
  review(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: ReviewCollaborationDto) {
    return this.collaboration.review(id, dto.reviewed);
  }
}
