import { Controller, Post, Get, Delete, Body, Param, Query, Req, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common'
import { Request } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ChatRecordService, CreateChatRecordDto } from './chat-record.service'

@Controller('chat-record')
export class ChatRecordController {
  constructor(private readonly chatRecordService: ChatRecordService) {}

  /**
   * 同步分析聊天内容（不入库，返回推断的话题/心情/摘要/时长）
   * POST /api/chat-record/match/:matchId/analyze
   */
  @Post('match/:matchId/analyze')
  @HttpCode(200)
  async analyzeContent(
    @Param('matchId') matchId: string,
    @Body() body: { rawContent: string },
    @Req() req: Request,
  ) {
    return this.chatRecordService.analyzeContent(body.rawContent, req)
  }

  /**
   * 创建聊天记录（文本粘贴）
   * POST /api/chat-record/match/:matchId/text
   */
  @Post('match/:matchId/text')
  @HttpCode(200)
  async createFromText(
    @Param('matchId') matchId: string,
    @Body() body: CreateChatRecordDto,
    @Req() req: Request,
  ) {
    return this.chatRecordService.createFromText(parseInt(matchId), body, req)
  }

  /**
   * 创建聊天记录（图片上传）
   * POST /api/chat-record/match/:matchId/image
   */
  @Post('match/:matchId/image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async createFromImage(
    @Param('matchId') matchId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateChatRecordDto,
    @Req() req: Request,
  ) {
    if (!file) {
      return { code: 400, data: null, message: '请上传图片文件' }
    }

    console.log('Chat record image upload:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      hasBuffer: !!file.buffer,
      hasPath: !!file.path,
    })

    return this.chatRecordService.createFromImage(parseInt(matchId), file, body, req)
  }

  /**
   * 获取聊天记录列表
   * GET /api/chat-record/match/:matchId
   */
  @Get('match/:matchId')
  async getRecordsByMatchId(
    @Param('matchId') matchId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatRecordService.getRecordsByMatchId(parseInt(matchId), {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  }

  /**
   * 获取聊天记录详情
   * GET /api/chat-record/:id
   */
  @Get(':id')
  async getRecordById(@Param('id') id: string) {
    return this.chatRecordService.getRecordById(parseInt(id))
  }

  /**
   * 删除聊天记录
   * DELETE /api/chat-record/:id
   */
  @Delete(':id')
  async deleteRecord(@Param('id') id: string) {
    return this.chatRecordService.deleteRecord(parseInt(id))
  }
}
