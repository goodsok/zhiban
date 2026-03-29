import { Controller, Post, Body, Req } from '@nestjs/common'
import { Request } from 'express'
import { ProfileAnalysisService } from './profile-analysis.service'

@Controller('profile-analysis')
export class ProfileAnalysisController {
  constructor(private readonly profileAnalysisService: ProfileAnalysisService) {}

  @Post('from-url')
  async analyzeFromUrl(
    @Body() body: { imageUrl: string },
    @Req() req: Request
  ) {
    if (!body.imageUrl) {
      return {
        code: 400,
        data: null,
        message: '请提供图片URL',
      }
    }
    return this.profileAnalysisService.analyzeFromUrl(body.imageUrl, req)
  }

  @Post('from-base64')
  async analyzeFromBase64(
    @Body() body: { base64Data: string },
    @Req() req: Request
  ) {
    if (!body.base64Data) {
      return {
        code: 400,
        data: null,
        message: '请提供图片数据',
      }
    }
    return this.profileAnalysisService.analyzeFromBase64(body.base64Data, req)
  }
}
