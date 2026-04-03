import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { DatingService, ProfileAnalysis, PhotoScore, OpenerResponse } from './dating.service'

@Controller('dating')
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post('profile/optimize')
  @HttpCode(HttpStatus.OK)
  async optimizeProfile(
    @Body() body: { nickname?: string; bio?: string; interests?: string },
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
}
