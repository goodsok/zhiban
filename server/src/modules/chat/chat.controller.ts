import { Controller, Post, Body, Req } from '@nestjs/common'
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
}
