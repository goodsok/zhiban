import { Controller, Post, Get, Delete, Param, Body, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { StoryService } from './story.service'

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * 创建故事并生成初始内容
   */
  @Post('create')
  async createStory(
    @Body() body: {
      matchId?: number
      storyType: string
      relationshipStage?: string
      originalContent?: string
      keyElements?: {
        time?: string
        place?: string
        characters?: string
        keyEvent?: string
        emotionalTurn?: string
        [key: string]: string | undefined
      }
    },
    @Req() req: Request
  ) {
    return this.storyService.createStory(body, req)
  }

  /**
   * 获取故事列表
   */
  @Get('list')
  async getStoryList(
    @Query('matchId') matchId?: number,
    @Req() req: Request = {} as Request
  ) {
    return this.storyService.getStoryList(matchId, req)
  }

  /**
   * 获取故事详情（含聊天记录）
   */
  @Get(':id')
  async getStoryDetail(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.storyService.getStoryDetail(Number(id), req)
  }

  /**
   * 继续对话
   */
  @Post(':id/chat')
  async continueChat(
    @Param('id') id: number,
    @Body() body: { message: string },
    @Req() req: Request
  ) {
    return this.storyService.continueChat(Number(id), body.message, req)
  }

  /**
   * 删除故事
   */
  @Delete(':id')
  async deleteStory(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.storyService.deleteStory(Number(id), req)
  }
}
