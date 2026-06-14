import { Controller, Post, Get, Delete, Body, Param, Query, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { DatingService, ProfileAnalysis, PhotoScore, OpenerResponse, OptimizedPhoto, ProfileHistory, PhotoHistory, OpenerHistory, FeatureStatus } from './dating.service'

@Controller('dating')
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  // ========== 功能状态 ==========

  @Get('status')
  async getFeatureStatus(): Promise<{ code: number; msg: string; data: FeatureStatus }> {
    console.log('[DatingController] getFeatureStatus called')
    const data = await this.datingService.getFeatureStatus()
    return { code: 200, msg: 'success', data }
  }

  // ========== 资料优化 ==========

  @Post('profile/optimize')
  @HttpCode(HttpStatus.OK)
  async optimizeProfile(
    @Body() body: { nickname?: string; bio?: string; interests?: string; platform?: string },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: ProfileAnalysis & { isFallback?: boolean } }> {
    console.log('[DatingController] optimizeProfile called with:', body)
    const result = await this.datingService.optimizeProfile(body, req)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('profile/chat')
  @HttpCode(HttpStatus.OK)
  async chatProfile(
    @Body()
    body: {
      nickname?: string
      bio?: string
      interests?: string
      platform?: string
      analysis: ProfileAnalysis
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      currentMessage: string
    },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: { reply: string } }> {
    console.log('[DatingController] chatProfile called with message:', body.currentMessage?.substring(0, 50))
    const reply = await this.datingService.chatProfile(body, req)
    return { code: 200, msg: 'success', data: { reply } }
  }

  // ========== 照片上传 ==========

  @Post('upload-photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File): Promise<{ code: number; msg: string; data: { url: string } }> {
    console.log('[DatingController] uploadPhoto called')
    const url = await this.datingService.uploadPhoto(file)
    return { code: 200, msg: 'success', data: { url } }
  }

  // ========== 照片评分 ==========

  @Post('photo/evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluatePhotos(
    @Body() body: { photoUrls: string[]; platform?: string },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: PhotoScore & { isFallback?: boolean } }> {
    console.log('[DatingController] evaluatePhotos called with:', body.photoUrls?.length, 'photos, platform:', body.platform)
    const result = await this.datingService.evaluatePhotos(body.photoUrls, req, body.platform)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('photo/generate-optimized')
  @HttpCode(HttpStatus.OK)
  async generateOptimizedPhoto(
    @Body() body: { originalPhotoUrl: string; suggestions: string[] },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: OptimizedPhoto }> {
    console.log('[DatingController] generateOptimizedPhoto called')
    const result = await this.datingService.generateOptimizedPhoto(body.originalPhotoUrl, body.suggestions, req)
    return { code: 200, msg: 'success', data: result }
  }

  // ========== 开场白生成 ==========

  @Post('opener/generate')
  @HttpCode(HttpStatus.OK)
  async generateOpener(
    @Body() body: { targetProfile: string; platform?: string; selfProfile?: string; matchId?: number },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: OpenerResponse & { isFallback?: boolean; dimensionSummary?: string } }> {
    console.log('[DatingController] generateOpener called with profile length:', body.targetProfile?.length, 'platform:', body.platform, 'matchId:', body.matchId)
    const result = await this.datingService.generateOpener(body.targetProfile, req, body.platform, body.selfProfile, body.matchId)
    return { code: 200, msg: 'success', data: result }
  }

  // ========== 资料优化历史 ==========

  @Post('profile/history')
  @HttpCode(HttpStatus.OK)
  async saveProfileHistory(
    @Body()
    body: {
      platform: string
      nickname?: string
      bio?: string
      interests?: string
      analysisResult: ProfileAnalysis
    },
  ): Promise<{ code: number; msg: string; data: { id: number } }> {
    console.log('[DatingController] saveProfileHistory called')
    const id = await this.datingService.saveProfileHistory(body)
    return { code: 200, msg: 'success', data: { id } }
  }

  @Get('profile/history')
  async getProfileHistoryList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ code: number; msg: string; data: { list: ProfileHistory[]; total: number } }> {
    console.log('[DatingController] getProfileHistoryList called')
    const limitNum = parseInt(limit || '20', 10)
    const offsetNum = parseInt(offset || '0', 10)
    const { list, total } = await this.datingService.getProfileHistoryList(limitNum, offsetNum)
    return { code: 200, msg: 'success', data: { list, total } }
  }

  @Get('profile/history/:id')
  async getProfileHistoryById(
    @Param('id') id: string,
  ): Promise<{ code: number; msg: string; data: ProfileHistory | null }> {
    console.log('[DatingController] getProfileHistoryById called with id:', id)
    const history = await this.datingService.getProfileHistoryById(parseInt(id, 10))
    return { code: 200, msg: 'success', data: history }
  }

  @Delete('profile/history/:id')
  async deleteProfileHistory(@Param('id') id: string): Promise<{ code: number; msg: string }> {
    console.log('[DatingController] deleteProfileHistory called with id:', id)
    const success = await this.datingService.deleteProfileHistory(parseInt(id, 10))
    return { code: success ? 200 : 404, msg: success ? 'success' : 'Not found' }
  }

  // ========== 照片评分历史 ==========

  @Post('photo/history')
  @HttpCode(HttpStatus.OK)
  async savePhotoHistory(
    @Body() body: { platform: string; photoUrls: string[]; analysisResult: PhotoScore },
  ): Promise<{ code: number; msg: string; data: { id: number } }> {
    console.log('[DatingController] savePhotoHistory called')
    const id = await this.datingService.savePhotoHistory(body)
    return { code: 200, msg: 'success', data: { id } }
  }

  @Get('photo/history')
  async getPhotoHistoryList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ code: number; msg: string; data: { list: PhotoHistory[]; total: number } }> {
    console.log('[DatingController] getPhotoHistoryList called')
    const limitNum = parseInt(limit || '20', 10)
    const offsetNum = parseInt(offset || '0', 10)
    const { list, total } = await this.datingService.getPhotoHistoryList(limitNum, offsetNum)
    return { code: 200, msg: 'success', data: { list, total } }
  }

  @Delete('photo/history/:id')
  async deletePhotoHistory(@Param('id') id: string): Promise<{ code: number; msg: string }> {
    console.log('[DatingController] deletePhotoHistory called with id:', id)
    const success = await this.datingService.deletePhotoHistory(parseInt(id, 10))
    return { code: success ? 200 : 404, msg: success ? 'success' : 'Not found' }
  }

  // ========== 开场白历史 ==========

  @Post('opener/history')
  @HttpCode(HttpStatus.OK)
  async saveOpenerHistory(
    @Body() body: { platform: string; targetProfile: string; selfProfile?: string; result: OpenerResponse },
  ): Promise<{ code: number; msg: string; data: { id: number } }> {
    console.log('[DatingController] saveOpenerHistory called')
    const id = await this.datingService.saveOpenerHistory(body)
    return { code: 200, msg: 'success', data: { id } }
  }

  @Get('opener/history')
  async getOpenerHistoryList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ code: number; msg: string; data: { list: OpenerHistory[]; total: number } }> {
    console.log('[DatingController] getOpenerHistoryList called')
    const limitNum = parseInt(limit || '20', 10)
    const offsetNum = parseInt(offset || '0', 10)
    const { list, total } = await this.datingService.getOpenerHistoryList(limitNum, offsetNum)
    return { code: 200, msg: 'success', data: { list, total } }
  }

  @Delete('opener/history/:id')
  async deleteOpenerHistory(@Param('id') id: string): Promise<{ code: number; msg: string }> {
    console.log('[DatingController] deleteOpenerHistory called with id:', id)
    const success = await this.datingService.deleteOpenerHistory(parseInt(id, 10))
    return { code: success ? 200 : 404, msg: success ? 'success' : 'Not found' }
  }
}
