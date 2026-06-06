import { Controller, Post, Get, Delete, Patch, Body, Query, Req } from '@nestjs/common'
import { TwinService } from './twin.service'
import type { Request } from 'express'

@Controller('twin')
export class TwinController {
  constructor(private readonly twinService: TwinService) {}

  @Post('chat')
  async chat(
    @Body() body: { matchId: number; message: string; hintsEnabled?: boolean },
    @Req() req: Request,
  ) {
    const result = await this.twinService.chat(body.matchId, body.message, req, body.hintsEnabled !== false)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('history')
  async getHistory(
    @Query('matchId') matchId: number,
    @Query('limit') limit: number = 100,
  ) {
    const result = await this.twinService.getHistory(Number(matchId), Number(limit))
    return { code: 200, msg: 'success', data: result }
  }

  @Delete('history')
  async clearHistory(@Body() body: { matchId: number }) {
    const result = await this.twinService.clearHistory(body.matchId)
    return { code: 200, msg: 'success', data: result }
  }

  @Patch('relationship')
  async updateRelationship(
    @Body() body: {
      matchId: number
      safety?: number
      desire?: number
      closeness?: number
      emotion?: string
      emotionIntensity?: number
      attitudeAnchor?: string
    },
  ) {
    const result = await this.twinService.updateRelationshipManually(body.matchId, body)
    return { code: 200, msg: 'success', data: result }
  }
}
