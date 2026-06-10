import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'

// 提取的人物信息
export interface ExtractedProfile {
  name?: string
  age?: number
  gender?: string
  occupation?: string
  location?: string
  zodiac?: string
  risingZodiac?: string
  mbti?: string
  personality?: string
  interests?: string[]
  appearance?: string
  style?: string
  summary?: string
}

@Injectable()
export class ProfileAnalysisService {
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
   * 从图片URL分析人物信息
   */
  async analyzeFromUrl(imageUrl: string, req: Request) {
    try {
      // 先上传到对象存储获取稳定URL
      const key = await this.storage.uploadFromUrl({ url: imageUrl, timeout: 30000 })
      const stableUrl = await this.storage.generatePresignedUrl({ key, expireTime: 600 })

      return this.analyzeImage(stableUrl, req)
    } catch (error) {
      console.error('Upload from URL error:', error)
      // 如果上传失败，直接使用原始URL
      return this.analyzeImage(imageUrl, req)
    }
  }

  /**
   * 从Base64分析人物信息
   */
  async analyzeFromBase64(base64Data: string, req: Request) {
    try {
      // 解析 base64
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        return {
          code: 400,
          data: null,
          message: '无效的图片格式',
        }
      }

      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 上传到对象存储
      const ext = contentType.split('/')[1] || 'jpg'
      const key = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: `profile-analysis/${Date.now()}.${ext}`,
        contentType,
      })

      const imageUrl = await this.storage.generatePresignedUrl({ key, expireTime: 600 })
      return this.analyzeImage(imageUrl, req)
    } catch (error) {
      console.error('Analyze from base64 error:', error)
      return {
        code: 500,
        data: null,
        message: '图片处理失败',
      }
    }
  }

  /**
   * 使用多模态LLM分析图片
   */
  private async analyzeImage(imageUrl: string, req: Request) {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: `请分析这张图片中的人物信息，提取可能的档案数据用于相亲/交友档案。

请从图片中识别以下信息（如果可见/可推断）：
1. 基本信息：姓名（如果有签名、水印、昵称等）、性别、大致年龄、外貌特征
2. 所在地：根据背景地标、定位水印、POI信息等推断
3. 穿搭风格：服装风格、整体气质
4. 可能的兴趣爱好（根据服装、背景、道具等推断）
5. 可能的职业方向
6. 整体印象和性格猜测

请用JSON格式返回，格式如下：
{
  "name": "姓名（如果有签名或可推断）",
  "gender": "female/male",
  "age": 数字,
  "location": "推断的所在地",
  "appearance": "外貌描述",
  "style": "穿搭风格",
  "occupation": "可能职业",
  "interests": ["推断的兴趣1", "推断的兴趣2"],
  "personality": "性格猜测",
  "mbti": "可能的MBTI",
  "summary": "整体印象总结"
}

注意：
- 只提取图片中能合理推断的信息
- 不确定的信息可以省略
- 保持客观，不要过度猜测
- summary 字段请给出一段简短的整体描述
- 姓名：如果图片中有签名、水印昵称、社交账号名等，可以提取
- 所在地：根据背景建筑、地标、定位水印等推断城市或区域`,
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

      // 解析返回的JSON
      const profile = this.parseProfileResponse(response.content)

      return {
        code: 200,
        data: profile,
        message: 'success',
      }
    } catch (error) {
      console.error('Analyze image error:', error)
      return {
        code: 500,
        data: null,
        message: '图片分析失败，请稍后再试',
      }
    }
  }

  /**
   * 解析LLM返回的人物信息
   */
  private parseProfileResponse(content: string): ExtractedProfile {
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          name: parsed.name,
          gender: parsed.gender,
          age: parsed.age,
          location: parsed.location,
          appearance: parsed.appearance,
          style: parsed.style,
          occupation: parsed.occupation,
          interests: parsed.interests,
          personality: parsed.personality,
          mbti: parsed.mbti,
          summary: parsed.summary,
        }
      }
    } catch (error) {
      console.error('Parse profile error:', error)
    }

    // 解析失败，返回空对象
    return {}
  }
}
