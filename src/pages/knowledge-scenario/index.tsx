import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useCallback } from 'react'
import type { FC } from 'react'
import CustomHeader from '@/components/custom-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Search, ChevronDown, ChevronUp, X, Check, BookOpen } from 'lucide-react-taro'
import { scenarios, type Scenario } from '@/data/scenarios'

const STORAGE_KEY = 'knowledge_scenario_read'

function getReadCases(): Set<string> {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    if (data) {
      return new Set(JSON.parse(data))
    }
  } catch { /* ignore */ }
  return new Set()
}

function saveReadCases(readSet: Set<string>) {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify([...readSet]))
  } catch { /* ignore */ }
}

const KnowledgeScenarioPage: FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [readCases, setReadCases] = useState<Set<string>>(getReadCases)

  const markCaseRead = useCallback((caseId: string) => {
    setReadCases(prev => {
      if (prev.has(caseId)) return prev
      const next = new Set(prev)
      next.add(caseId)
      saveReadCases(next)
      return next
    })
  }, [])

  const toggleScenario = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setExpandedCaseId(null)
  }

  const toggleCase = (caseId: string) => {
    const willExpand = expandedCaseId !== caseId
    setExpandedCaseId(willExpand ? caseId : null)
    if (willExpand) {
      markCaseRead(caseId)
    }
  }

  const filteredScenarios = useMemo(() => {
    if (!searchQuery.trim()) return scenarios
    const q = searchQuery.trim().toLowerCase()
    return scenarios
      .map(scenario => {
        const titleMatch = scenario.title.toLowerCase().includes(q)
        const descMatch = scenario.description.toLowerCase().includes(q)
        const matchedCases = scenario.cases.filter(c =>
          c.scene.toLowerCase().includes(q) ||
          c.context.toLowerCase().includes(q) ||
          c.taSays.toLowerCase().includes(q) ||
          c.wrongReply.toLowerCase().includes(q) ||
          c.rightReply.toLowerCase().includes(q) ||
          c.analysis.toLowerCase().includes(q)
        )
        if (titleMatch || descMatch || matchedCases.length > 0) {
          return {
            ...scenario,
            cases: titleMatch || descMatch ? scenario.cases : matchedCases,
          }
        }
        return null
      })
      .filter((s): s is Scenario => s !== null)
  }, [searchQuery])

  const totalCases = scenarios.reduce((sum, s) => sum + s.cases.length, 0)
  const readCount = scenarios.reduce(
    (sum, s) => sum + s.cases.filter(c => readCases.has(c.id)).length,
    0
  )
  const readProgress = totalCases > 0 ? Math.round((readCount / totalCases) * 100) : 0

  return (
    <View style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      <CustomHeader title="场景演练" />

      <ScrollView scrollY style={{ flex: 1 }}>
        {/* 搜索栏 + 进度 */}
        <View className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
          <View className="bg-gray-50 rounded-xl px-3 py-2">
            <Input
              placeholder="搜索场景、案例..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.detail.value)}
              className="bg-transparent border-0"
            />
          </View>
          {!searchQuery && (
            <View className="flex items-center gap-2 mt-3">
              <BookOpen size={14} color="#6B7280" />
              <Text className="block text-xs text-gray-500">
                已阅读 {readCount}/{totalCases} 个案例
              </Text>
              <View className="flex-1">
                <Progress value={readProgress} className="h-1" />
              </View>
              <Text className="block text-xs text-gray-400">{readProgress}%</Text>
            </View>
          )}
        </View>

        {/* 场景列表 */}
        <View className="p-4">
          {filteredScenarios.length === 0 && (
            <View className="flex items-center justify-center py-20">
              <Search size={32} color="#9CA3AF" />
              <Text className="block text-sm text-gray-400 mt-3">
                没有找到匹配的场景
              </Text>
            </View>
          )}

          {filteredScenarios.map((scenario) => {
            const ScenarioIcon = scenario.icon
            const isExpanded = expandedId === scenario.id
            const scenarioReadCount = scenario.cases.filter(c => readCases.has(c.id)).length
            const scenarioTotal = scenario.cases.length
            const isScenarioComplete = scenarioReadCount === scenarioTotal

            return (
              <Card key={scenario.id} className="mb-3 overflow-hidden border-gray-100">
                {/* 场景标题 */}
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleScenario(scenario.id)}
                >
                  <CollapsibleTrigger className="p-4">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-3">
                        <View className={`w-10 h-10 ${scenario.bgColor} rounded-xl flex items-center justify-center`}>
                          <ScenarioIcon size={20} color={scenario.color} />
                        </View>
                        <View>
                          <View className="flex items-center gap-2">
                            <Text className="block text-base font-semibold text-gray-900">
                              {scenario.title}
                            </Text>
                            {isScenarioComplete && (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-xs px-2 py-0 border-0">
                                已完成
                              </Badge>
                            )}
                          </View>
                          <Text className="block text-xs text-gray-500 mt-1">
                            {scenario.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs px-2 py-0 border-0">
                          {scenarioReadCount}/{scenarioTotal}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp size={18} color="#9CA3AF" />
                        ) : (
                          <ChevronDown size={18} color="#9CA3AF" />
                        )}
                      </View>
                    </View>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="px-4 pb-4 pt-0">
                      {scenario.cases.map((dialogueCase, index) => {
                        const isCaseExpanded = expandedCaseId === dialogueCase.id
                        const isRead = readCases.has(dialogueCase.id)

                        return (
                          <View key={dialogueCase.id} className="mb-3 last:mb-0">
                            <Collapsible
                              open={isCaseExpanded}
                              onOpenChange={() => toggleCase(dialogueCase.id)}
                            >
                              {/* 案例标题 */}
                              <CollapsibleTrigger>
                                <View className="bg-gray-50 rounded-xl p-3">
                                  <View className="flex items-center justify-between">
                                    <View className="flex items-center gap-2">
                                      <View className={`w-6 h-6 rounded-full flex items-center justify-center ${isRead ? 'bg-emerald-100' : 'bg-white'}`}>
                                        {isRead ? (
                                          <Check size={12} color="#10B981" />
                                        ) : (
                                          <Text className="block text-xs text-gray-500">{index + 1}</Text>
                                        )}
                                      </View>
                                      <Text className={`block text-sm font-medium ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                                        {dialogueCase.scene}
                                      </Text>
                                    </View>
                                    {isCaseExpanded ? (
                                      <ChevronUp size={14} color="#9CA3AF" />
                                    ) : (
                                      <ChevronDown size={14} color="#9CA3AF" />
                                    )}
                                  </View>
                                  {!isCaseExpanded && (
                                    <Text className="block text-xs text-gray-500 mt-2 ml-8">
                                      {dialogueCase.context}
                                    </Text>
                                  )}
                                </View>
                              </CollapsibleTrigger>

                              {/* 展开的案例详情 */}
                              <CollapsibleContent>
                                <View className="bg-gray-50 rounded-xl p-4 mt-2">
                                  {/* 场景背景 */}
                                  <View className="flex items-center gap-1 mb-3">
                                    <View className="w-1 h-1 rounded-full bg-gray-400" />
                                    <Text className="block text-xs text-gray-500">
                                      {dialogueCase.context}
                                    </Text>
                                  </View>

                                  {/* TA说的话 */}
                                  <View className="mb-4">
                                    <View className="flex items-start gap-2 mb-1">
                                      <View className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Text className="block text-xs text-gray-600 font-medium">TA</Text>
                                      </View>
                                      <View className="flex-1 bg-white rounded-xl rounded-tl-sm p-3">
                                        <Text className="block text-sm text-gray-800">{dialogueCase.taSays}</Text>
                                      </View>
                                    </View>
                                  </View>

                                  {/* 错误回复 */}
                                  <View className="mb-3">
                                    <View className="flex items-center gap-1 mb-2">
                                      <X size={14} color="#EF4444" />
                                      <Text className="block text-xs font-medium text-red-500">错误回复</Text>
                                    </View>
                                    <View className="bg-red-50 rounded-xl p-3 border border-red-100">
                                      <Text className="block text-sm text-gray-700">{dialogueCase.wrongReply}</Text>
                                    </View>
                                  </View>

                                  {/* 正确回复 */}
                                  <View className="mb-3">
                                    <View className="flex items-center gap-1 mb-2">
                                      <Check size={14} color="#10B981" />
                                      <Text className="block text-xs font-medium text-green-600">正确回复</Text>
                                    </View>
                                    <View className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                      <Text className="block text-sm text-gray-700">{dialogueCase.rightReply}</Text>
                                    </View>
                                  </View>

                                  {/* 解析 */}
                                  <View className="bg-white rounded-xl p-3">
                                    <Text className="block text-xs font-medium text-gray-500 mb-1">解析</Text>
                                    <Text className="block text-sm text-gray-700">{dialogueCase.analysis}</Text>
                                  </View>
                                </View>
                              </CollapsibleContent>
                            </Collapsible>
                          </View>
                        )
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </View>

        {/* 底部提示 */}
        <View className="px-4 pb-8">
          <Text className="block text-xs text-gray-400 text-center">
            更多场景演练内容持续更新中...
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default KnowledgeScenarioPage
