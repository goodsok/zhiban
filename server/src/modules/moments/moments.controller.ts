import { Controller, Post, Get, Delete, Param, Body, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { MomentsService } from './moments.service'

@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  /**
   * 生成发圈建议
   */
  @Post('suggest')
  async generateSuggestion(
    @Body() body: {
      matchId?: number
      postType: string
      purpose: string
      inputContent: string
      personaTags?: string[]
    },
    @Req() req: Request
  ) {
    return this.momentsService.generateSuggestion(body, req)
  }

  /**
   * 保存发布记录
   */
  @Post('publish')
  async savePost(
    @Body() body: {
      matchId?: number
      content: string
      postType: string
      purpose: string
      personaTags?: string[]
      publishTime?: string
    },
    @Req() req: Request
  ) {
    return this.momentsService.savePost(body, req)
  }

  /**
   * 获取发布历史
   */
  @Get('posts')
  async getPosts(
    @Query('matchId') matchId?: number,
    @Req() req: Request = {} as Request
  ) {
    return this.momentsService.getPosts(matchId, req)
  }

  /**
   * 分析对方朋友圈
   */
  @Post('analyze')
  async analyzeMoments(
    @Body() body: {
      matchId?: number
      inputContent: string
    },
    @Req() req: Request
  ) {
    return this.momentsService.analyzeMoments(body, req)
  }

  /**
   * 获取分析历史
   */
  @Get('analysis')
  async getAnalysisList(
    @Query('matchId') matchId?: number,
    @Req() req: Request = {} as Request
  ) {
    return this.momentsService.getAnalysisList(matchId, req)
  }

  /**
   * 删除建议记录
   */
  @Delete('suggestion/:id')
  async deleteSuggestion(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.momentsService.deleteSuggestion(Number(id), req)
  }

  /**
   * 删除发布记录
   */
  @Delete('post/:id')
  async deletePost(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.momentsService.deletePost(Number(id), req)
  }
}
