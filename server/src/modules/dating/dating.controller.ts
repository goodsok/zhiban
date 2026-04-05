import { Controller, Post, Get, Delete, Body, Param, Query, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { DatingService, ProfileAnalysis, PhotoScore, OpenerResponse, OptimizedPhoto, ProfileHistory } from './dating.service'

@Controller('dating')
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post('profile/optimize')
  @HttpCode(HttpStatus.OK)
  async optimizeProfile(
    @Body() body: { nickname?: string; bio?: string; interests?: string; platform?: string },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: ProfileAnalysis }> {
    console.log('[DatingController] optimizeProfile called with:', body)
    const result = await this.datingService.optimizeProfile(body, req)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

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
    return {
      code: 200,
      msg: 'success',
      data: { url },
    }
  }

  @Post('photo/evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluatePhotos(
    @Body() body: { photoUrls: string[] },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: PhotoScore }> {
    console.log('[DatingController] evaluatePhotos called with:', body.photoUrls?.length, 'photos')
    const result = await this.datingService.evaluatePhotos(body.photoUrls, req)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Post('photo/generate-optimized')
  @HttpCode(HttpStatus.OK)
  async generateOptimizedPhoto(
    @Body() body: { originalPhotoUrl: string; suggestions: string[] },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: OptimizedPhoto }> {
    console.log('[DatingController] generateOptimizedPhoto called')
    const result = await this.datingService.generateOptimizedPhoto(
      body.originalPhotoUrl,
      body.suggestions,
      req
    )
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Post('opener/generate')
  @HttpCode(HttpStatus.OK)
  async generateOpener(
    @Body() body: { targetProfile: string },
    @Req() req: Request,
  ): Promise<{ code: number; msg: string; data: OpenerResponse }> {
    console.log('[DatingController] generateOpener called with profile length:', body.targetProfile?.length)
    const result = await this.datingService.generateOpener(body.targetProfile, req)
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Post('profile/chat')
  @HttpCode(HttpStatus.OK)
  async chatProfile(
    @Body() body: {
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
    return {
      code: 200,
      msg: 'success',
      data: { reply },
    }
  }

  @Post('profile/history')
  @HttpCode(HttpStatus.OK)
  async saveProfileHistory(
    @Body() body: {
      platform: string
      nickname?: string
      bio?: string
      interests?: string
      analysisResult: ProfileAnalysis
    },
  ): Promise<{ code: number; msg: string; data: { id: number } }> {
    console.log('[DatingController] saveProfileHistory called')
    const id = await this.datingService.saveProfileHistory(body)
    return {
      code: 200,
      msg: 'success',
      data: { id },
    }
  }

  @Get('profile/history')
  async getProfileHistoryList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ code: number; msg: string; data: { list: ProfileHistory[]; total: number } }> {
    console.log('[DatingController] getProfileHistoryList called')
    const limitNum = parseInt(limit || '20', 10)
    const offsetNum = parseInt(offset || '0', 10)
    const list = await this.datingService.getProfileHistoryList(limitNum, offsetNum)
    return {
      code: 200,
      msg: 'success',
      data: { list, total: list.length },
    }
  }

  @Get('profile/history/:id')
  async getProfileHistoryById(
    @Param('id') id: string,
  ): Promise<{ code: number; msg: string; data: ProfileHistory | null }> {
    console.log('[DatingController] getProfileHistoryById called with id:', id)
    const history = await this.datingService.getProfileHistoryById(parseInt(id, 10))
    return {
      code: 200,
      msg: 'success',
      data: history,
    }
  }

  @Delete('profile/history/:id')
  async deleteProfileHistory(
    @Param('id') id: string,
  ): Promise<{ code: number; msg: string }> {
    console.log('[DatingController] deleteProfileHistory called with id:', id)
    const success = await this.datingService.deleteProfileHistory(parseInt(id, 10))
    return {
      code: success ? 200 : 404,
      msg: success ? 'success' : 'Not found',
    }
  }
}
