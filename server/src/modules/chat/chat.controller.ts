import { Controller, Post, Get, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { ChatService, ChatMessage, ChatContext } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body() body: {
      messages: ChatMessage[]
      context?: ChatContext
    },
    @Req() req: Request
  ) {
    return this.chatService.chat(
      body.messages || [],
      body.context || null,
      req
    )
  }

  @Get('history/:matchId')
  async getHistory(
    @Param('matchId') matchId: string,
    @Query('limit') limit?: string
  ) {
    return this.chatService.getHistory(
      Number(matchId),
      limit ? Number(limit) : 50
    )
  }

  @Delete('history/:matchId')
  async clearHistory(@Param('matchId') matchId: string) {
    return this.chatService.clearHistory(Number(matchId))
  }
}
