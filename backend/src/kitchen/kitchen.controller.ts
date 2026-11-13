import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { KitchenAuthService, publicMember } from './kitchen-auth.service';
import { KitchenAgentService } from './kitchen-agent.service';
import { KitchenService } from './kitchen.service';
import { KitchenLoginDto, KitchenMessageDto, KitchenRegisterDto, KitchenSaveDto } from './kitchen.dto';

@Controller('public/kitchen')
export class KitchenController {
  constructor(private auth: KitchenAuthService, private kitchen: KitchenService, private agent: KitchenAgentService) {}
  @Get('session')
  async session(@Headers('authorization') header?: string) {
    const member = await this.auth.optional(header);
    return { user: member ? publicMember(member) : null, mode: this.agent.mode };
  }
  @Post('session')
  async start(@Headers('authorization') header: string | undefined, @Req() req: Request) {
    const current = await this.auth.optional(header);
    if (current) return { user: publicMember(current), mode: this.agent.mode };
    await this.auth.rate(`session:${req.ip}`, 120);
    return { ...await this.auth.ensure(header), mode: this.agent.mode };
  }
  @Post('register')
  async register(@Body() dto: KitchenRegisterDto, @Headers('authorization') header: string | undefined, @Req() req: Request) {
    await this.auth.rate(`register:${req.ip}`, 25);
    return this.auth.register(dto, header);
  }
  @Post('login')
  async login(@Body() dto: KitchenLoginDto, @Headers('authorization') header: string | undefined, @Req() req: Request) {
    await this.auth.rate(`login-ip:${req.ip}`, 60);
    await this.auth.rate(`login-email:${dto.email}`, 12, 900);
    return this.auth.login(dto, header);
  }
  @Post('logout') logout(@Headers('authorization') header?: string) { return this.auth.logout(header); }
  @Get('conversations') async list(@Headers('authorization') header?: string) { return this.kitchen.list(await this.auth.require(header)); }
  @Put('conversations/:id') async create(@Param('id') id: string, @Headers('authorization') header: string) {
    const member = await this.auth.require(header);
    await this.auth.rate(`create:${member._id}`, 60);
    return this.kitchen.create(member, id);
  }
  @Get('conversations/:id') async get(@Param('id') id: string, @Headers('authorization') header: string) { return this.kitchen.get(await this.auth.require(header), id); }
  @Post('conversations/:id/messages') async send(@Param('id') id: string, @Body() dto: KitchenMessageDto, @Headers('authorization') header: string) { return this.kitchen.send(await this.auth.require(header), id, dto); }
  @Get('saved') async saved(@Headers('authorization') header: string) { return this.kitchen.listSaved(await this.auth.require(header)); }
  @Post('saved') async save(@Body() dto: KitchenSaveDto, @Headers('authorization') header: string) { return this.kitchen.save(await this.auth.require(header), dto); }
  @Delete('saved/:id') async remove(@Param('id') id: string, @Headers('authorization') header: string) { return this.kitchen.removeSaved(await this.auth.require(header), id); }
}
