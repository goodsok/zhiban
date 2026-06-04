import { Controller, Post, Get, Body, Query, Req, HttpCode } from '@nestjs/common'
import { Request } from 'express'
import { SweetTalkService } from './sweet-talk.service'

@Controller('sweet-talk')
export class SweetTalkController {
  constructor(private readonly sweetTalkService: SweetTalkService) {}

  /**
   * 生成情话
   * POST /api/sweet-talk/generate
   */
  @Post('generate')
  @HttpCode(200)
  async generate(
    @Body() body: {
      matchId?: number
      scene: string
      tone?: string
      customContext?: string
    },
    @Req() req: Request,
  ) {
    return this.sweetTalkService.generate(body, req)
  }

  /**
   * 获取历史情话
   * GET /api/sweet-talk/history?matchId=1&scene=flirt
   */
  @Get('history')
  async getHistory(
    @Query('matchId') matchId?: string,
    @Query('scene') scene?: string,
  ) {
    return this.sweetTalkService.getHistory(
      matchId ? parseInt(matchId) : undefined,
      scene,
    )
  }
}
