import { Controller, Post, Get, Delete, Body, Query, Req } from '@nestjs/common'
import { TwinService } from './twin.service'
import { Request } from 'express'

@Controller('twin')
export class TwinController {
  constructor(private readonly twinService: TwinService) {}

  /**
   * POST /api/twin/chat
   * 与数字孪生体对话
   */
  @Post('chat')
  async chat(
    @Body() body: { matchId: number; message: string },
    @Req() req: Request,
  ) {
    const { matchId, message } = body
    if (!matchId || !message) {
      return { code: 400, msg: '参数错误', data: null }
    }

    const result = await this.twinService.chat(matchId, message, req)
    return { code: 200, msg: 'success', data: result }
  }

  /**
   * GET /api/twin/history?matchId=1&limit=100
   * 获取聊天历史
   */
  @Get('history')
  async getHistory(
    @Query('matchId') matchId: number,
    @Query('limit') limit: number = 100,
  ) {
    if (!matchId) {
      return { code: 400, msg: '参数错误', data: null }
    }

    const result = await this.twinService.getHistory(matchId, limit)
    return { code: 200, msg: 'success', data: result }
  }

  /**
   * DELETE /api/twin/history
   * 清空聊天历史
   */
  @Delete('history')
  async clearHistory(@Body() body: { matchId: number }) {
    if (!body.matchId) {
      return { code: 400, msg: '参数错误', data: null }
    }

    const result = await this.twinService.clearHistory(body.matchId)
    return { code: 200, msg: 'success', data: result }
  }
}
