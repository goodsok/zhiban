import { Controller, Post, Get, Param, Req, HttpCode } from '@nestjs/common'
import { Request } from 'express'
import { ChatReviewService } from './chat-review.service'

@Controller('chat-review')
export class ChatReviewController {
  constructor(private readonly chatReviewService: ChatReviewService) {}

  /**
   * 对某个对象进行聊天复盘（触发 AI 分析）
   * POST /api/chat-review/match/:matchId
   */
  @Post('match/:matchId')
  @HttpCode(200)
  async reviewByMatchId(
    @Param('matchId') matchId: string,
    @Req() req: Request,
  ) {
    return this.chatReviewService.reviewByMatchId(parseInt(matchId), req)
  }

  /**
   * 获取某个对象最近的聊天复盘结果
   * GET /api/chat-review/match/:matchId/latest
   */
  @Get('match/:matchId/latest')
  async getLatestReview(@Param('matchId') matchId: string) {
    return this.chatReviewService.getLatestReview(parseInt(matchId))
  }

  /**
   * 获取所有对象列表（含聊天记录数量，用于选择复盘对象）
   * GET /api/chat-review/matches
   */
  @Get('matches')
  async getMatchList() {
    return this.chatReviewService.getMatchList()
  }
}
