import { Controller, Get, Post, Body } from '@nestjs/common';
import { CoupleService } from './couple.service';

@Controller('couple')
export class CoupleController {
  constructor(private readonly coupleService: CoupleService) {}

  @Get('info')
  getCoupleInfo() {
    return this.coupleService.getCoupleInfo();
  }

  @Post('update')
  updateCoupleInfo(@Body() body: { myName?: string; partnerName?: string }) {
    return this.coupleService.updateCoupleInfo(body);
  }
}
