/**
 * 聊天记录分析器
 * 
 * 负责分析聊天截图，提取行为数据
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'
import {
  ChatRecordAnalysisResult,
  IAnalyzer,
} from '../types/portrait.types'

/**
 * 聊天记录分析输入
 */
export interface ChatRecordAnalysisInput {
  matchId: number
  base64Data: string
  request: Request
}

@Injectable()
export class ChatRecordAnalyzer implements IAnalyzer<ChatRecordAnalysisInput, {
  success: boolean
  analysis?: ChatRecordAnalysisResult
  imageUrl?: string
  message: string
}> {
  private storage: S3Storage

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  /**
   * 分析聊天记录截图
   */
  async analyze(input: ChatRecordAnalysisInput): Promise<{
    success: boolean
    analysis?: ChatRecordAnalysisResult
    imageUrl?: string
    message: string
  }> {
    const { matchId, base64Data, request } = input

    try {
      // 解析 base64
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        return { success: false, message: '无效的图片格式' }
      }

      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 上传到对象存储
      const ext = contentType.split('/')[1] || 'jpg'
      const key = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: `chat-records/${matchId}/${Date.now()}.${ext}`,
        contentType,
      })

      const imageUrl = await this.storage.generatePresignedUrl({ key, expireTime: 600 })

      // 调用多模态LLM分析
      const analysis = await this.analyzeWithLLM(imageUrl, request)

      return {
        success: analysis.isChatRecord,
        analysis,
        imageUrl,
        message: analysis.isChatRecord ? '聊天记录分析完成' : '上传的图片不是聊天记录',
      }
    } catch (error) {
      console.error('Chat record analysis error:', error)
      return { success: false, message: '分析失败，请稍后再试' }
    }
  }

  /**
   * 使用LLM分析聊天记录图片
   */
  private async analyzeWithLLM(imageUrl: string, request: Request): Promise<ChatRecordAnalysisResult> {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: this.buildAnalysisPrompt(),
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: imageUrl,
                detail: 'high' as const,
              },
            },
          ],
        },
      ]

      const response = await client.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.3,
      })

      // 解析JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ChatRecordAnalysisResult
      }

      return { isChatRecord: false }
    } catch (error) {
      console.error('LLM analysis error:', error)
      return { isChatRecord: false }
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(): string {
    return `请分析这张图片是否为聊天记录截图。如果是聊天记录，请提取以下信息：

1. 判断：这是否是聊天记录截图？（微信、QQ、短信等聊天界面）
2. 如果是聊天记录，请分析：
   - 对方（聊天对象，非用户自己）的平均回复时间（分钟）
   - 对方的活跃时段（哪些小时发消息较多）
   - 消息总数
   - 表情使用频率（大约百分比）
   - 话题关键词

请用JSON格式返回：
{
  "isChatRecord": true/false,
  "avgResponseTime": 数字（分钟，如30表示30分钟）,
  "activeHours": {"9": 5, "10": 8, ...}（对方发送消息的小时分布）,
  "activeDays": {"monday": 10, "tuesday": 8, ...}（对方发送消息的星期分布）,
  "messageCount": 数字,
  "emojiUsageRate": 数字（0-100）,
  "topicKeywords": ["关键词1", "关键词2", ...],
  "summary": "简短描述聊天内容"
}

注意：
- 只分析对方（聊天对象）的消息，不要统计用户自己的消息
- 如果图片不是聊天记录，isChatRecord 设为 false
- 回复时间是指对方收到消息后到回复的时间间隔`
  }
}
