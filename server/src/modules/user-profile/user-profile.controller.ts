import { Controller, Get, Post, Body, Req } from '@nestjs/common'
import { Request } from 'express'
import { UserProfileService, FullUserProfile } from './user-profile.service'

@Controller('user-profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  /**
   * 获取用户档案
   */
  @Get()
  async getProfile(): Promise<{ code: number; data: FullUserProfile | null; message: string }> {
    try {
      // 当前系统单用户，固定 userId = 1
      const profile = await this.userProfileService.getOrCreateProfile(1)
      return { code: 200, data: profile, message: 'success' }
    } catch (error) {
      console.error('Get user profile error:', error)
      return { code: 500, data: null, message: '获取档案失败' }
    }
  }

  /**
   * 更新用户档案
   */
  @Post()
  async updateProfile(
    @Body() body: Partial<FullUserProfile>,
    @Req() req: Request
  ): Promise<{ code: number; data: FullUserProfile | null; message: string }> {
    try {
      const profile = await this.userProfileService.updateProfile(1, body, req)
      return { code: 200, data: profile, message: '保存成功' }
    } catch (error) {
      console.error('Update user profile error:', error)
      return { code: 500, data: null, message: '保存失败' }
    }
  }

  /**
   * 获取用户画像（用于AI建议）
   */
  @Get('portrait')
  async getPortrait(): Promise<{ code: number; data: Record<string, unknown> | null; message: string }> {
    try {
      const portrait = await this.userProfileService.getUserPortrait(1)
      return { code: 200, data: portrait, message: 'success' }
    } catch (error) {
      console.error('Get user portrait error:', error)
      return { code: 500, data: null, message: '获取画像失败' }
    }
  }

  /**
   * 更新行为偏好
   */
  @Post('behavior')
  async updateBehavior(
    @Body() body: {
      communicationStyle?: 'direct' | 'indirect' | 'balanced'
      communicationStyleOnline?: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable'
      communicationStyleOffline?: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable'
      responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow'
      activeTimeSlots?: string[]
      socialEnergy?: 'high' | 'medium' | 'low'
      aloneTime?: string
      expressionStyle?: 'expressive' | 'reserved'
      affectionStyle?: string
      preferredTopics?: string[]
      topicAvoid?: string[]
    }
  ): Promise<{ code: number; data: null; message: string }> {
    try {
      await this.userProfileService.updateBehaviorPreferences(1, body)
      return { code: 200, data: null, message: '保存成功' }
    } catch (error) {
      console.error('Update behavior preferences error:', error)
      return { code: 500, data: null, message: '保存失败' }
    }
  }

  /**
   * 根据档案生成画像
   */
  @Post('generate-portrait')
  async generatePortrait(
    @Req() req: Request
  ): Promise<{ code: number; data: Record<string, unknown> | null; message: string }> {
    try {
      const portrait = await this.userProfileService.generatePortraitFromProfile(1, req)
      return { code: 200, data: portrait, message: '画像生成成功' }
    } catch (error) {
      console.error('Generate portrait error:', error)
      return { code: 500, data: null, message: '生成失败' }
    }
  }
}
