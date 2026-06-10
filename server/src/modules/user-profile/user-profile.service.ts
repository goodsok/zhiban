import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 用户完整档案
export interface FullUserProfile {
  // 基本信息
  nickname: string | null
  gender: 'male' | 'female' | null
  birthYear: number | null
  height: number | null
  occupation: string | null
  education: string | null
  location: string | null
  // MBTI 类型
  mbti: string | null
  // 性格自评 (0-100)
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  // 情感特点
  emotional: {
    stability: number
    expression: number
    empathy: number
  }
  // 恋爱观
  relationshipGoal: 'serious' | 'casual' | 'marriage' | null
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | null
  loveLanguage: string[]
  // 兴趣爱好
  hobbies: string[]
  interests: string[]
  // 期望
  preferredTraits: string[]
  dealBreakers: string[]
  // 自我介绍
  bio: string | null
  // 置信度
  confidence: number
  // 行为偏好
  behavior?: {
    communicationStyle: 'direct' | 'indirect' | 'balanced' | null
    communicationStyleOnline: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable' | null
    communicationStyleOffline: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable' | null
    responseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | null
    activeTimeSlots: string[]
    socialEnergy: 'high' | 'medium' | 'low' | null
    expressionStyle: 'expressive' | 'reserved' | null
    preferredTopics: string[]
    topicAvoid: string[]
  }
  lastUpdated: string
}

@Injectable()
export class UserProfileService {
  /**
   * 确保用户档案存在
   */
  private async ensureProfileExists(userId: number): Promise<void> {
    const client = getSupabaseClient()

    const { data: existingProfile, error: checkError } = await client
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('ensureProfileExists check error:', checkError)
    }

    if (!existingProfile) {
      const defaultProfile = this.getDefaultProfile()
      
      // 使用 upsert 而不是 insert，避免重复插入问题
      const { error: upsertError } = await client
        .from('user_profiles')
        .upsert({
          id: userId,
          nickname: null,
          gender: 'male',
          ...defaultProfile.personality,
          ...defaultProfile.emotional,
          relationship_goal: defaultProfile.relationshipGoal,
          attachment_style: defaultProfile.attachmentStyle,
          love_language: defaultProfile.loveLanguage,
          hobbies: defaultProfile.hobbies,
          interests: defaultProfile.interests,
          preferred_traits: defaultProfile.preferredTraits,
          deal_breakers: defaultProfile.dealBreakers,
          confidence: 0,
        }, { onConflict: 'id' })

      if (upsertError) {
        console.error('ensureProfileExists upsert error:', upsertError)
      }

      // 同时确保行为偏好记录存在
      const { error: behaviorError } = await client
        .from('user_behavior_preferences')
        .upsert({
          user_id: userId,
          active_time_slots: [],
          preferred_topics: [],
          topic_avoid: [],
        }, { onConflict: 'user_id' })

      if (behaviorError) {
        console.error('ensureProfileExists behavior upsert error:', behaviorError)
      }
    }
  }

  /**
   * 获取或创建用户档案
   */
  async getOrCreateProfile(userId: number): Promise<FullUserProfile> {
    const client = getSupabaseClient()

    // 获取档案
    const { data: profile } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // 获取行为偏好
    const { data: behavior } = await client
      .from('user_behavior_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      return this.dbToFullProfile(profile, behavior)
    }

    // 创建默认档案
    const defaultProfile = this.getDefaultProfile()
    const { data: newProfile } = await client
      .from('user_profiles')
      .insert({
        id: userId,
        ...defaultProfile.personality,
        ...defaultProfile.emotional,
        relationship_goal: defaultProfile.relationshipGoal,
        attachment_style: defaultProfile.attachmentStyle,
        love_language: defaultProfile.loveLanguage,
        hobbies: defaultProfile.hobbies,
        interests: defaultProfile.interests,
        preferred_traits: defaultProfile.preferredTraits,
        deal_breakers: defaultProfile.dealBreakers,
        confidence: 0,
      })
      .select()
      .single()

    // 创建默认行为偏好
    const { data: newBehavior } = await client
      .from('user_behavior_preferences')
      .insert({
        user_id: userId,
        active_time_slots: [],
        preferred_topics: [],
        topic_avoid: [],
      })
      .select()
      .single()

    return this.dbToFullProfile(newProfile, newBehavior)
  }

  /**
   * 更新用户档案
   */
  async updateProfile(
    userId: number,
    data: Partial<FullUserProfile>,
    req: Request
  ): Promise<FullUserProfile> {
    const client = getSupabaseClient()

    // 先确保记录存在
    await this.ensureProfileExists(userId)

    // 准备更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // 基本信息
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.birthYear !== undefined) updateData.birth_year = data.birthYear
    if (data.height !== undefined) updateData.height = data.height
    if (data.occupation !== undefined) updateData.occupation = data.occupation
    if (data.education !== undefined) updateData.education = data.education
    if (data.location !== undefined) updateData.location = data.location
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.mbti !== undefined) updateData.mbti = data.mbti

    // 性格
    if (data.personality) {
      if (data.personality.openness !== undefined) updateData.personality_openness = data.personality.openness
      if (data.personality.conscientiousness !== undefined) updateData.personality_conscientiousness = data.personality.conscientiousness
      if (data.personality.extraversion !== undefined) updateData.personality_extraversion = data.personality.extraversion
      if (data.personality.agreeableness !== undefined) updateData.personality_agreeableness = data.personality.agreeableness
      if (data.personality.neuroticism !== undefined) updateData.personality_neuroticism = data.personality.neuroticism
    }

    // 情感
    if (data.emotional) {
      if (data.emotional.stability !== undefined) updateData.emotional_stability = data.emotional.stability
      if (data.emotional.expression !== undefined) updateData.emotional_expression = data.emotional.expression
      if (data.emotional.empathy !== undefined) updateData.emotional_empathy = data.emotional.empathy
    }

    // 恋爱观
    if (data.relationshipGoal !== undefined) updateData.relationship_goal = data.relationshipGoal
    if (data.attachmentStyle !== undefined) updateData.attachment_style = data.attachmentStyle
    if (data.loveLanguage !== undefined) updateData.love_language = data.loveLanguage

    // 兴趣
    if (data.hobbies !== undefined) updateData.hobbies = data.hobbies
    if (data.interests !== undefined) updateData.interests = data.interests

    // 期望
    if (data.preferredTraits !== undefined) updateData.preferred_traits = data.preferredTraits
    if (data.dealBreakers !== undefined) updateData.deal_breakers = data.dealBreakers

    // 更新档案
    const { data: profile, error } = await client
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
    }

    // 如果有行为偏好，也更新
    if (data.behavior) {
      await this.updateBehaviorPreferences(userId, data.behavior as any)
    }

    // 重新计算置信度
    await this.recalculateConfidence(userId)

    // 获取行为偏好
    const { data: behavior } = await client
      .from('user_behavior_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    return this.dbToFullProfile(profile, behavior)
  }

  /**
   * 更新行为偏好
   */
  async updateBehaviorPreferences(
    userId: number,
    data: {
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
  ): Promise<void> {
    const client = getSupabaseClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.communicationStyle !== undefined) updateData.communication_style = data.communicationStyle
    if (data.communicationStyleOnline !== undefined) updateData.communication_style_online = data.communicationStyleOnline
    if (data.communicationStyleOffline !== undefined) updateData.communication_style_offline = data.communicationStyleOffline
    if (data.responseSpeed !== undefined) updateData.response_speed = data.responseSpeed
    if (data.activeTimeSlots !== undefined) updateData.active_time_slots = data.activeTimeSlots
    if (data.socialEnergy !== undefined) updateData.social_energy = data.socialEnergy
    if (data.aloneTime !== undefined) updateData.alone_time = data.aloneTime
    if (data.expressionStyle !== undefined) updateData.expression_style = data.expressionStyle
    if (data.affectionStyle !== undefined) updateData.affection_style = data.affectionStyle
    if (data.preferredTopics !== undefined) updateData.preferred_topics = data.preferredTopics
    if (data.topicAvoid !== undefined) updateData.topic_avoid = data.topicAvoid

    await client
      .from('user_behavior_preferences')
      .upsert({
        user_id: userId,
        ...updateData,
      }, { onConflict: 'user_id' })
  }

  /**
   * 获取用户画像（供AI建议使用）
   */
  async getUserPortrait(userId: number): Promise<Record<string, unknown>> {
    const profile = await this.getOrCreateProfile(userId)

    return {
      // 基本信息
      gender: profile.gender,
      ageRange: profile.birthYear ? this.getAgeRange(profile.birthYear) : null,
      occupation: profile.occupation,
      location: profile.location,

      // 性格画像
      personality: {
        openness: profile.personality.openness,
        conscientiousness: profile.personality.conscientiousness,
        extraversion: profile.personality.extraversion,
        agreeableness: profile.personality.agreeableness,
        neuroticism: profile.personality.neuroticism,
        // 描述性标签
        traits: this.getPersonalityTraits(profile.personality),
      },

      // 情感画像
      emotional: {
        stability: profile.emotional.stability,
        expression: profile.emotional.expression,
        empathy: profile.emotional.empathy,
        style: this.getEmotionalStyle(profile.emotional),
      },

      // 恋爱观
      relationship: {
        goal: profile.relationshipGoal,
        attachmentStyle: profile.attachmentStyle,
        loveLanguage: profile.loveLanguage,
      },

      // 行为偏好
      behavior: {
        communicationStyle: profile.behavior?.communicationStyle,
        communicationStyleOnline: profile.behavior?.communicationStyleOnline,
        communicationStyleOffline: profile.behavior?.communicationStyleOffline,
        responseSpeed: profile.behavior?.responseSpeed,
        activeTimeSlots: profile.behavior?.activeTimeSlots,
        socialEnergy: profile.behavior?.socialEnergy,
        expressionStyle: profile.behavior?.expressionStyle,
        preferredTopics: profile.behavior?.preferredTopics,
      },

      // 兴趣爱好
      interests: {
        hobbies: profile.hobbies,
        interests: profile.interests,
      },

      // 期望
      expectations: {
        preferredTraits: profile.preferredTraits,
        dealBreakers: profile.dealBreakers,
      },

      // 置信度
      confidence: profile.confidence,
    }
  }

  /**
   * 根据档案生成画像（AI辅助）
   */
  async generatePortraitFromProfile(userId: number, req: Request): Promise<Record<string, unknown>> {
    const profile = await this.getOrCreateProfile(userId)

    // 如果基本信息太少，返回默认
    if (!profile.nickname && !profile.occupation && profile.hobbies.length === 0) {
      return this.getUserPortrait(userId)
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = `基于用户档案信息，分析并补充完善用户画像。

用户档案：
- 昵称: ${profile.nickname || '未填写'}
- 性别: ${profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '未填写'}
- 职业: ${profile.occupation || '未填写'}
- 所在地: ${profile.location || '未填写'}
- 兴趣爱好: ${profile.hobbies.join('、') || '未填写'}
- 自我介绍: ${profile.bio || '未填写'}

性格自评：
- 开放性: ${profile.personality.openness}（0-100）
- 外向性: ${profile.personality.extraversion}（0-100）
- 宜人性: ${profile.personality.agreeableness}（0-100）

恋爱观：
- 目标: ${profile.relationshipGoal || '未填写'}
- 依恋类型: ${profile.attachmentStyle || '未填写'}
- 爱的语言: ${profile.loveLanguage.join('、') || '未填写'}

请分析并返回以下JSON格式的画像补充：
{
  "personalityTraits": ["性格特点1", "性格特点2", "性格特点3"],
  "communicationStyle": "direct/indirect/balanced（沟通风格）",
  "emotionalStyle": "理性/感性/平衡（情感风格）",
  "socialStyle": "外向/内向/平衡（社交风格）",
  "strengths": ["优势1", "优势2"],
  "challenges": ["可能的挑战1", "可能的挑战2"],
  "idealPartnerTraits": ["理想对象的特质1", "理想对象的特质2"],
  "suggestions": ["恋爱建议1", "恋爱建议2"]
}`

      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { model: 'doubao-seed-2-0-pro-260215', temperature: 0.7 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0])

        // 合并到用户画像
        return {
          ...await this.getUserPortrait(userId),
          aiAnalysis,
        }
      }
    } catch (error) {
      console.error('Generate portrait from profile error:', error)
    }

    return this.getUserPortrait(userId)
  }

  /**
   * 重新计算置信度
   */
  private async recalculateConfidence(userId: number): Promise<void> {
    const client = getSupabaseClient()

    const { data: profile } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: behavior } = await client
      .from('user_behavior_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) return

    let score = 0

    // 基本信息（每个5分，最多30分）
    if (profile.nickname) score += 5
    if (profile.gender) score += 5
    if (profile.birth_year) score += 5
    if (profile.occupation) score += 5
    if (profile.location) score += 5
    if (profile.bio) score += 5

    // 性格自评（每个3分，最多15分）
    if (profile.personality_openness !== 50) score += 3
    if (profile.personality_extraversion !== 50) score += 3
    if (profile.personality_agreeableness !== 50) score += 3
    if (profile.personality_conscientiousness !== 50) score += 3
    if (profile.personality_neuroticism !== 50) score += 3

    // MBTI（5分）
    if (profile.mbti) score += 5

    // 恋爱观（每个5分，最多15分）
    if (profile.relationship_goal) score += 5
    if (profile.attachment_style) score += 5
    if (profile.love_language?.length > 0) score += 5

    // 兴趣（最多20分）
    if (profile.hobbies?.length > 0) score += Math.min(10, profile.hobbies.length * 2)
    if (profile.interests?.length > 0) score += Math.min(10, profile.interests.length * 2)

    // 行为偏好（最多20分）
    if (behavior) {
      if (behavior.communication_style) score += 5
      if (behavior.response_speed) score += 5
      if (behavior.active_time_slots?.length > 0) score += 5
      if (behavior.preferred_topics?.length > 0) score += 5
    }

    // 更新置信度
    await client
      .from('user_profiles')
      .update({ confidence: Math.min(100, score) })
      .eq('id', userId)
  }

  /**
   * 数据库格式转换为前端格式
   */
  private dbToFullProfile(
    profile: Record<string, unknown> | null,
    behavior: Record<string, unknown> | null
  ): FullUserProfile {
    return {
      nickname: (profile?.nickname as string) || null,
      gender: (profile?.gender as 'male' | 'female') || null,
      birthYear: (profile?.birth_year as number) || null,
      height: (profile?.height as number) || null,
      occupation: (profile?.occupation as string) || null,
      education: (profile?.education as string) || null,
      location: (profile?.location as string) || null,
      mbti: (profile?.mbti as string) || null,
      personality: {
        openness: (profile?.personality_openness as number) || 50,
        conscientiousness: (profile?.personality_conscientiousness as number) || 50,
        extraversion: (profile?.personality_extraversion as number) || 50,
        agreeableness: (profile?.personality_agreeableness as number) || 50,
        neuroticism: (profile?.personality_neuroticism as number) || 50,
      },
      emotional: {
        stability: (profile?.emotional_stability as number) || 50,
        expression: (profile?.emotional_expression as number) || 50,
        empathy: (profile?.emotional_empathy as number) || 50,
      },
      relationshipGoal: (profile?.relationship_goal as 'serious' | 'casual' | 'marriage') || null,
      attachmentStyle: (profile?.attachment_style as 'secure' | 'anxious' | 'avoidant') || null,
      loveLanguage: (profile?.love_language as string[]) || [],
      hobbies: (profile?.hobbies as string[]) || [],
      interests: (profile?.interests as string[]) || [],
      preferredTraits: (profile?.preferred_traits as string[]) || [],
      dealBreakers: (profile?.deal_breakers as string[]) || [],
      bio: (profile?.bio as string) || null,
      confidence: (profile?.confidence as number) || 0,
      behavior: behavior ? {
        communicationStyle: (behavior.communication_style as 'direct' | 'indirect' | 'balanced') || null,
        communicationStyleOnline: (behavior.communication_style_online as 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable') || null,
        communicationStyleOffline: (behavior.communication_style_offline as 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable') || null,
        responseSpeed: (behavior.response_speed as 'instant' | 'fast' | 'normal' | 'slow') || null,
        activeTimeSlots: (behavior.active_time_slots as string[]) || [],
        socialEnergy: (behavior.social_energy as 'high' | 'medium' | 'low') || null,
        expressionStyle: (behavior.expression_style as 'expressive' | 'reserved') || null,
        preferredTopics: (behavior.preferred_topics as string[]) || [],
        topicAvoid: (behavior.topic_avoid as string[]) || [],
      } : undefined,
      lastUpdated: (profile?.updated_at as string) || new Date().toISOString(),
    }
  }

  /**
   * 获取默认档案
   */
  private getDefaultProfile(): Omit<FullUserProfile, 'lastUpdated'> {
    return {
      nickname: null,
      gender: null,
      birthYear: null,
      height: null,
      occupation: null,
      education: null,
      location: null,
      mbti: null,
      personality: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
      emotional: {
        stability: 50,
        expression: 50,
        empathy: 50,
      },
      relationshipGoal: null,
      attachmentStyle: null,
      loveLanguage: [],
      hobbies: [],
      interests: [],
      preferredTraits: [],
      dealBreakers: [],
      bio: null,
      confidence: 0,
    }
  }

  /**
   * 获取年龄范围
   */
  private getAgeRange(birthYear: number): string {
    const age = new Date().getFullYear() - birthYear
    if (age < 25) return '25岁以下'
    if (age < 30) return '25-30岁'
    if (age < 35) return '30-35岁'
    if (age < 40) return '35-40岁'
    return '40岁以上'
  }

  /**
   * 获取性格特质标签
   */
  private getPersonalityTraits(personality: { openness: number; extraversion: number; agreeableness: number }): string[] {
    const traits: string[] = []

    if (personality.openness >= 70) traits.push('思维开放')
    else if (personality.openness <= 30) traits.push('稳重传统')

    if (personality.extraversion >= 70) traits.push('外向活跃')
    else if (personality.extraversion <= 30) traits.push('内敛沉稳')

    if (personality.agreeableness >= 70) traits.push('温和友善')
    else if (personality.agreeableness <= 30) traits.push('有主见')

    return traits
  }

  /**
   * 获取情感风格
   */
  private getEmotionalStyle(emotional: { stability: number; expression: number; empathy: number }): string {
    if (emotional.expression >= 70) return '善于表达'
    if (emotional.expression <= 30) return '含蓄内敛'
    return '平衡适中'
  }
}
