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
      imageContext?: string
    },
    @Req() req: Request
  ) {
    return this.chatService.chat(
      body.messages || [],
      body.context || null,
      req,
      body.imageContext
    )
  }

  @Post('analyze-image')
  async analyzeImage(
    @Body() body: {
      base64Data: string
      context?: string
    },
    @Req() req: Request
  ) {
    if (!body.base64Data) {
      return {
        code: 400,
        data: null,
        message: '请提供图片数据',
      }
    }
    return this.chatService.analyzeImage(body.base64Data, body.context || '', req)
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
