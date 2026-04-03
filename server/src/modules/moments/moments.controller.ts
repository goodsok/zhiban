import { Controller, Post, Get, Delete, Param, Body, Query, Req, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { MomentsService } from './moments.service'

// 定义文件类型，兼容小程序和H5
type UploadedFileType = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer?: Buffer
  size: number
  destination?: string
  filename?: string
  path?: string
}

@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  /**
   * 上传图片
   */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: UploadedFileType,
    @Req() req: Request
  ) {
    return this.momentsService.uploadImage(file, req)
  }

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
      inputContent?: string
      imageUrls?: string[]
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
