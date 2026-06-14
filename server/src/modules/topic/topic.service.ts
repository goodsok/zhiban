import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { Request } from 'express';
import { MatchService } from '../match/match.service';

@Injectable()
export class TopicService {
  private config = new Config();
  private client = new LLMClient(this.config);

  constructor(
    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,
  ) {}

  // 预设话题库
  private presetTopics = [
    { id: 1, topic: '你觉得什么样的约会最浪漫？', category: '浪漫话题' },
    { id: 2, topic: '你童年最快乐的记忆是什么？', category: '童年回忆' },
    { id: 3, topic: '你最想去哪里旅行？', category: '旅行梦想' },
    { id: 4, topic: '你最喜欢的电影是什么？为什么？', category: '兴趣爱好' },
    { id: 5, topic: '你觉得理想的周末应该怎么过？', category: '生活方式' },
    { id: 6, topic: '你最近学到的新技能是什么？', category: '成长话题' },
    { id: 7, topic: '你最喜欢的美食是什么？', category: '美食话题' },
    { id: 8, topic: '你觉得什么性格特质最重要？', category: '价值观' },
    { id: 9, topic: '你小时候的梦想是什么？', category: '童年回忆' },
    { id: 10, topic: '你最喜欢的一本书是什么？', category: '兴趣爱好' },
  ];

  async getIcebreakerTopics() {
    // 随机返回3个话题
    const shuffled = [...this.presetTopics].sort(() => Math.random() - 0.5);
    const topics = shuffled.slice(0, 3);

    return {
      code: 200,
      data: topics,
      message: 'success',
    };
  }

  async getPersonalizedIcebreakerTopics(req: Request, matchId: number) {
    try {
      // 获取对象详情（含维度数据）
      const matchRes = await this.matchService.getMatchById(req, matchId);
      if (matchRes.code !== 200 || !matchRes.data) {
        // 获取失败时降级为普通话题
        return this.getIcebreakerTopics();
      }

      const match = matchRes.data;
      const dimensions = match.dimensions || [];

      // 构建维度摘要
      const dimensionSummary = dimensions
        .filter((d: any) => d.value)
        .map((d: any) => `${d.dimension_key}: ${d.value}`)
        .join('；');

      const matchInfo = `对象姓名：${match.name || '未知'}；关系类型：${match.relationshipType || '未知'}；${dimensionSummary ? '已知信息：' + dimensionSummary : ''}`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: `你是一个恋爱关系顾问，根据对象的已知信息推荐破冰话题。话题要求：
1. 基于对象的已知信息（如兴趣爱好、性格特点、生活偏好等）推荐话题
2. 话题要自然、具体，让对方觉得你真的在关注TA
3. 每个话题要标注分类
4. 返回JSON数组格式，每个元素包含 topic（话题内容）和 category（分类）
5. 分类只能是：童年回忆、成长话题、价值观、浪漫话题、旅行梦想、兴趣爱好、生活方式、美食话题 中的一个
6. 只返回JSON数组，不要其他文字`,
        },
        {
          role: 'user',
          content: `根据以下对象信息，推荐3个最适合的破冰话题：\n${matchInfo}`,
        },
      ];

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.9,
      });

      // 解析AI返回的JSON
      let aiTopics: Array<{ topic: string; category: string }> = [];
      try {
        const content = response.content.trim();
        // 尝试提取JSON数组
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiTopics = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Parse AI topics error:', parseError);
      }

      if (aiTopics.length === 0) {
        // AI生成失败，降级为普通话题
        return this.getIcebreakerTopics();
      }

      const topics = aiTopics.map((t, index) => ({
        id: Date.now() + index,
        topic: t.topic,
        category: t.category || 'AI生成',
      }));

      return {
        code: 200,
        data: topics,
        message: 'success',
      };
    } catch (error) {
      console.error('Get personalized icebreaker topics error:', error);
      // 降级为普通话题
      return this.getIcebreakerTopics();
    }
  }

  async generateTopic() {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: '你是一个恋爱关系顾问，帮助情侣增进了解。请生成一个适合约会时聊的话题，要求温馨、有趣、能增进感情。只需要返回话题本身，不要其他解释。',
        },
        {
          role: 'user',
          content: '请生成一个适合初次约会或相亲时聊的话题，话题要有趣、温馨，能帮助双方更好地了解彼此。',
        },
      ];

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.9,
      });

      const newTopic = {
        id: Date.now(),
        topic: response.content.trim(),
        category: 'AI生成',
      };

      return {
        code: 200,
        data: newTopic,
        message: 'success',
      };
    } catch (error) {
      // 如果AI生成失败，返回预设话题
      const fallbackTopic = this.presetTopics[Math.floor(Math.random() * this.presetTopics.length)];
      return {
        code: 200,
        data: { ...fallbackTopic, id: Date.now() },
        message: 'success',
      };
    }
  }
}
