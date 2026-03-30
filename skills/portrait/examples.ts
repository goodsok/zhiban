/**
 * 人物画像使用示例
 * 
 * 展示如何在后端服务和前端页面中使用画像引擎
 */

// ==================== 后端使用示例 ====================

/**
 * 示例1: 在后端服务中获取画像
 */
// import { PortraitEngineService } from '@/modules/portrait-engine'
// 
// @Injectable()
// export class YourService {
//   constructor(private readonly portraitEngine: PortraitEngineService) {}
//
//   async getMatchPortrait(matchId: number) {
//     const portrait = await this.portraitEngine.getOrCreatePortrait(matchId)
//     console.log('画像置信度:', portrait.confidence)
//     console.log('互动风格:', portrait.interactionStyle)
//     console.log('活跃时段:', portrait.activeTimeSlots)
//     return portrait
//   }
// }

/**
 * 示例2: 上传聊天记录分析
 */
// @Post('chat-record')
// async uploadChatRecord(
//   @Body() body: { matchId: number; base64Data: string },
//   @Req() request: Request
// ) {
//   const result = await this.portraitEngine.uploadAndAnalyzeChatRecord(
//     body.matchId,
//     body.base64Data,
//     request
//   )
//   
//   if (result.success) {
//     console.log('分析成功:', result.analysis)
//   }
//   
//   return result
// }

/**
 * 示例3: 预测关系趋势
 */
// async predictTrend(matchId: number, userId: string) {
//   // 获取用户画像
//   const userPortrait = await this.userProfileService.getUserPortrait(userId)
//   
//   // 预测趋势
//   const prediction = await this.portraitEngine.predictRelationshipTrend(
//     matchId,
//     userPortrait,
//     request
//   )
//   
//   console.log('趋势:', prediction.trend)
//   console.log('置信度:', prediction.confidence)
//   console.log('洞察:', prediction.insights)
//   
//   return prediction
// }

/**
 * 示例4: 获取互动策略
 */
// async getStrategies(matchId: number, userId: string) {
//   const userPortrait = await this.userProfileService.getUserPortrait(userId)
//   
//   const result = await this.portraitEngine.getInteractionStrategy(
//     matchId,
//     userPortrait,
//     request
//   )
//   
//   result.strategies.forEach(s => {
//     console.log(`[${s.category}] ${s.action}`)
//     console.log(`理由: ${s.reason}`)
//     if (s.timing) console.log(`最佳时机: ${s.timing}`)
//   })
//   
//   return result
// }

// ==================== 前端使用示例 ====================

/**
 * 示例5: 前端调用画像接口
 */
// import { Network } from '@/network'
// 
// // 获取画像
// async function getPortrait(matchId: number) {
//   const res = await Network.request({
//     url: `/api/portrait/${matchId}`,
//     method: 'GET'
//   })
//   
//   if (res.data.code === 200) {
//     const portrait = res.data.data.portrait
//     console.log('画像数据:', portrait)
//     return portrait
//   }
// }
// 
// // 上传聊天记录
// async function uploadChatRecord(matchId: number, base64Data: string) {
//   const res = await Network.request({
//     url: '/api/portrait/chat-record',
//     method: 'POST',
//     data: { matchId, base64Data }
//   })
//   
//   if (res.data.code === 200) {
//     const result = res.data.data
//     if (result.success) {
//       console.log('分析结果:', result.analysis)
//     }
//     return result
//   }
// }
// 
// // 获取趋势预测
// async function getTrend(matchId: number) {
//   const res = await Network.request({
//     url: `/api/portrait/${matchId}/trend`,
//     method: 'GET'
//   })
//   
//   if (res.data.code === 200) {
//     const prediction = res.data.data.prediction
//     console.log('趋势预测:', prediction)
//     return prediction
//   }
// }
// 
// // 获取互动策略
// async function getStrategies(matchId: number) {
//   const res = await Network.request({
//     url: `/api/portrait/${matchId}/strategy`,
//     method: 'GET'
//   })
//   
//   if (res.data.code === 200) {
//     const strategies = res.data.data.strategies
//     console.log('互动策略:', strategies)
//     return strategies
//   }
// }

/**
 * 示例6: 前端展示画像数据
 */
// function PortraitCard({ portrait }: { portrait: FullPortrait }) {
//   return (
//     <View className="p-4">
//       <Text className="block text-lg font-semibold mb-2">画像概览</Text>
//       
//       {/* 置信度 */}
//       <View className="mb-4">
//         <Text className="block text-sm text-gray-500">数据置信度</Text>
//         <View className="h-2 bg-gray-200 rounded mt-1">
//           <View 
//             className="h-full bg-blue-500 rounded"
//             style={{ width: `${portrait.confidence}%` }}
//           />
//         </View>
//         <Text className="block text-xs text-gray-400 mt-1">
//           {portrait.confidence >= 70 ? '数据较充分' : '建议上传更多聊天记录'}
//         </Text>
//       </View>
//       
//       {/* 活跃时段 */}
//       {portrait.activeTimeSlots.length > 0 && (
//         <View className="mb-4">
//           <Text className="block text-sm text-gray-500">活跃时段</Text>
//           <View className="flex flex-row flex-wrap gap-2 mt-1">
//             {portrait.activeTimeSlots.map(slot => (
//               <View key={slot} className="px-2 py-1 bg-blue-100 rounded">
//                 <Text className="block text-xs text-blue-700">{slot}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       )}
//       
//       {/* 互动风格 */}
//       <View className="mb-4">
//         <Text className="block text-sm text-gray-500">互动风格</Text>
//         <Text className="block text-base mt-1">
//           {portrait.interactionStyle === 'active' ? '积极主动' :
//            portrait.interactionStyle === 'passive' ? '较为被动' : '平衡互动'}
//         </Text>
//       </View>
//       
//       {/* 数据来源 */}
//       <View className="text-xs text-gray-400">
//         <Text className="block">
//           数据来源: {
//             portrait.dataSourceStatus.hasChatRecords ? '聊天记录分析' :
//             portrait.dataSourceStatus.hasManualData ? '手动填写' : '暂无数据'
//           }
//         </Text>
//         <Text className="block">最后更新: {portrait.lastUpdated}</Text>
//       </View>
//     </View>
//   )
// }

/**
 * 示例7: 前端展示趋势预测
 */
// function TrendPredictionCard({ prediction }: { prediction: TrendPredictionResult }) {
//   const trendColor = {
//     improving: 'text-green-600',
//     stable: 'text-blue-600',
//     declining: 'text-red-600'
//   }[prediction.trend]
//   
//   const trendText = {
//     improving: '关系正在升温',
//     stable: '关系保持稳定',
//     declining: '关系需要关注'
//   }[prediction.trend]
//   
//   return (
//     <View className="p-4">
//       <View className="flex flex-row items-center mb-4">
//         <Text className={`block text-lg font-semibold ${trendColor}`}>
//           {trendText}
//         </Text>
//         <Text className="block text-sm text-gray-400 ml-2">
//           置信度 {prediction.confidence}%
//         </Text>
//       </View>
//       
//       {/* 洞察 */}
//       <View className="mb-4">
//         <Text className="block text-sm font-medium mb-2">分析洞察</Text>
//         {prediction.insights.map((insight, i) => (
//           <Text key={i} className="block text-sm text-gray-600 mb-1">
//             • {insight}
//           </Text>
//         ))}
//       </View>
//       
//       {/* 建议 */}
//       <View>
//         <Text className="block text-sm font-medium mb-2">建议</Text>
//         {prediction.recommendations.map((rec, i) => (
//           <Text key={i} className="block text-sm text-gray-600 mb-1">
//             • {rec}
//           </Text>
//         ))}
//       </View>
//     </View>
//   )
// }

/**
 * 示例8: 前端展示互动策略
 */
// function StrategyList({ strategies }: { strategies: InteractionStrategy[] }) {
//   const categoryNames = {
//     communication: '沟通方式',
//     topic: '话题选择',
//     timing: '时机把握',
//     activity: '活动建议'
//   }
//   
//   return (
//     <View className="p-4">
//       <Text className="block text-lg font-semibold mb-4">互动策略</Text>
//       
//       {strategies.map((strategy, i) => (
//         <View key={i} className="mb-4 p-3 bg-gray-50 rounded-lg">
//           <View className="flex flex-row items-center mb-2">
//             <View className="px-2 py-1 bg-blue-100 rounded mr-2">
//               <Text className="block text-xs text-blue-700">
//                 {categoryNames[strategy.category]}
//               </Text>
//             </View>
//             <Text className="block font-medium">{strategy.action}</Text>
//           </View>
//           
//           <Text className="block text-sm text-gray-600 mb-1">
//             理由: {strategy.reason}
//           </Text>
//           
//           {strategy.timing && (
//             <Text className="block text-sm text-gray-500">
//               最佳时机: {strategy.timing}
//             </Text>
//           )}
//         </View>
//       ))}
//     </View>
//   )
// }

export {}
