import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomHeader from '@/components/custom-header'
import { Check, Loader } from 'lucide-react-taro'
import {
  getDimensionDefinition,
  setDimensionValue,
  getMatchDimensions,
  type DimensionDefinition,
  formatDimensionValue
} from '@/services/dimension'

const DimensionEditPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId ? parseInt(router.params.matchId) : 0
  const dimensionKey = router.params.dimensionKey || ''
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [definition, setDefinition] = useState<DimensionDefinition | null>(null)
  const [currentValue, setCurrentValue] = useState<any>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([])

  useLoad(() => {
    if (matchId && dimensionKey) {
      fetchData()
    }
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取维度定义
      const defRes = await getDimensionDefinition(dimensionKey)
      if (defRes.code !== 200 || !defRes.data) {
        console.error('获取维度定义失败')
        return
      }
      setDefinition(defRes.data)
      
      // 获取当前值
      const valuesRes = await getMatchDimensions(matchId)
      if (valuesRes.code === 200 && valuesRes.data) {
        const dimData = valuesRes.data.dimensions[dimensionKey]
        if (dimData?.value) {
          setCurrentValue(dimData.value.value)
          // 根据类型初始化输入值
          if (defRes.data.data_type === 'string[]') {
            setMultiSelectValues(dimData.value.value || [])
          } else {
            setInputValue(dimData.value.value?.toString() || '')
          }
        }
      }
    } catch (err) {
      console.error('获取数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!definition) return
    
    try {
      setSaving(true)
      
      let value: any = inputValue
      
      // 根据数据类型处理值
      switch (definition.data_type) {
        case 'int':
          value = inputValue ? parseInt(inputValue) : null
          break
        case 'float':
          value = inputValue ? parseFloat(inputValue) : null
          break
        case 'boolean':
          value = inputValue === 'true'
          break
        case 'string[]':
          value = multiSelectValues
          break
      }
      
      const res = await setDimensionValue(matchId, dimensionKey, value)
      
      if (res.code === 200) {
        navigateBack()
      } else {
        console.error('保存失败:', res.msg)
      }
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleMultiSelect = (optionValue: string) => {
    setMultiSelectValues(prev => {
      if (prev.includes(optionValue)) {
        return prev.filter(v => v !== optionValue)
      }
      return [...prev, optionValue]
    })
  }

  const handleEnumSelect = (optionValue: string) => {
    setInputValue(optionValue)
  }

  const renderInput = () => {
    if (!definition) return null
    
    switch (definition.input_type) {
      case 'select':
        return (
          <View className="space-y-2">
            {definition.enum_options?.map((option) => (
              <View
                key={option.value}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  inputValue === option.value
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() => handleEnumSelect(option.value)}
              >
                <Text className="text-sm">{option.label}</Text>
                {inputValue === option.value && (
                  <Check size={16} color="#000" />
                )}
              </View>
            ))}
          </View>
        )
      
      case 'multiselect':
        return (
          <View className="flex flex-wrap gap-2">
            {definition.enum_options?.map((option) => (
              <Badge
                key={option.value}
                className={`${
                  multiSelectValues.includes(option.value)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => handleMultiSelect(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </View>
        )
      
      case 'number':
        return (
          <View className="bg-gray-50 rounded-lg px-4 py-3">
            <Input
              type="number"
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              placeholder={definition.placeholder || `请输入${definition.display_name}`}
              className="w-full bg-transparent"
            />
          </View>
        )
      
      case 'textarea':
        return (
          <View className="bg-gray-50 rounded-lg p-3">
            <Input
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              placeholder={definition.placeholder || `请输入${definition.display_name}`}
              className="w-full bg-transparent min-h-24"
            />
          </View>
        )
      
      default:
        return (
          <View className="bg-gray-50 rounded-lg px-4 py-3">
            <Input
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              placeholder={definition.placeholder || `请输入${definition.display_name}`}
              className="w-full bg-transparent"
            />
          </View>
        )
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={24} color="#9CA3AF" className="animate-spin" />
      </View>
    )
  }

  if (!definition) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">维度定义不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <CustomHeader title={definition.display_name} />
      
      {/* 顶部信息 */}
      <View className="p-4">
        <View className="flex items-center gap-2 mb-2">
          <Text className="text-lg font-semibold text-gray-900">{definition.display_name}</Text>
          {definition.importance === 'critical' && (
            <Badge className="bg-red-100 text-red-600 text-xs">必填</Badge>
          )}
          {definition.importance === 'important' && (
            <Badge className="bg-amber-100 text-amber-600 text-xs">重要</Badge>
          )}
        </View>
        
        {definition.description && (
          <Text className="text-sm text-gray-500 mb-2">{definition.description}</Text>
        )}
        
        {definition.help_text && (
          <Text className="text-xs text-gray-400">{definition.help_text}</Text>
        )}
      </View>
      
      {/* 输入区域 */}
      <View className="px-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">当前值</Text>
        {renderInput()}
      </View>
      
      {/* 历史值 */}
      {currentValue !== null && currentValue !== undefined && (
        <View className="px-4 mt-4">
          <Text className="text-xs text-gray-400 mb-1">上次保存的值</Text>
          <Text className="text-sm text-gray-600">
            {formatDimensionValue(definition, currentValue)}
          </Text>
        </View>
      )}
      
      {/* 底部操作 */}
      <View
        className="fixed left-0 right-0 bg-white border-t border-gray-100"
        style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <View className="p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigateBack()}
          >
            取消
          </Button>
          <Button
            className="flex-1 bg-black"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader size={16} color="#fff" className="animate-spin" />
            ) : (
              <Text className="text-white">保存</Text>
            )}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DimensionEditPage
