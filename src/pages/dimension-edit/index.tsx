import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack, eventCenter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomHeader from '@/components/custom-header'
import { Check, Loader, Search, Plus, X } from 'lucide-react-taro'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [customInputValue, setCustomInputValue] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isCustomSelected, setIsCustomSelected] = useState(false)

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
            // 判断当前值是否不在预设选项中（自定义值）
            const currentDimValue = dimData.value?.value
            if (defRes.data.input_type === 'select' && currentDimValue) {
              const isPreset = defRes.data.enum_options?.some(
                (opt: { value: string }) => opt.value === currentDimValue
              )
              if (!isPreset) {
                setIsCustomSelected(true)
              }
            }
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
        // 通知档案页刷新维度数据
        eventCenter.trigger('dimension:saved', { matchId, dimensionKey })
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

  const handleAddCustomValue = () => {
    if (customInputValue.trim() && !multiSelectValues.includes(customInputValue.trim())) {
      setMultiSelectValues(prev => [...prev, customInputValue.trim()])
      setCustomInputValue('')
      // 有预设选项时折叠输入框，无预设选项时保持输入框打开方便连续添加
      if (definition?.enum_options?.length) {
        setShowCustomInput(false)
      }
    }
  }

  const handleRemoveValue = (value: string) => {
    setMultiSelectValues(prev => prev.filter(v => v !== value))
  }

  const handleEnumSelect = (optionValue: string) => {
    setInputValue(optionValue)
    setIsCustomSelected(false)
    setShowCustomInput(false)
    setCustomInputValue('')
  }

  const handleCustomConfirm = () => {
    if (customInputValue.trim()) {
      setInputValue(customInputValue.trim())
      setIsCustomSelected(true)
      setShowCustomInput(false)
    }
  }

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!definition?.enum_options || !searchQuery) {
      return definition?.enum_options || []
    }
    return definition.enum_options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [definition?.enum_options, searchQuery])

  // 是否显示搜索框（选项超过10个时显示）
  const showSearch = (definition?.enum_options?.length || 0) > 10

  const renderInput = () => {
    if (!definition) return null
    
    switch (definition.input_type) {
      case 'select':
        return (
          <View className="space-y-2">
            {/* 搜索框 */}
            {showSearch && (
              <View className="bg-gray-50 rounded-lg px-4 py-3 mb-3 flex items-center gap-2">
                <Search size={16} color="#9CA3AF" />
                <View className="flex-1">
                  <Input
                    value={searchQuery}
                    onInput={(e) => setSearchQuery(e.detail.value)}
                    placeholder="搜索..."
                    className="w-full bg-transparent text-sm"
                  />
                </View>
              </View>
            )}
            
            {/* 选项列表 */}
            <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {filteredOptions.map((option, index) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between px-4 py-3 ${
                    index !== filteredOptions.length - 1 ? 'border-b border-gray-50' : ''
                  } ${!isCustomSelected && inputValue === option.value ? 'bg-gray-50' : ''}`}
                  onClick={() => handleEnumSelect(option.value)}
                >
                  <Text className="text-sm text-gray-900">{option.label}</Text>
                  {!isCustomSelected && inputValue === option.value && (
                    <Check size={16} color="#000" />
                  )}
                </View>
              ))}

              {/* 自定义选项入口 */}
              {!showCustomInput ? (
                <View
                  className={`flex items-center gap-2 px-4 py-3 ${
                    filteredOptions.length > 0 ? 'border-t border-gray-50' : ''
                  } ${isCustomSelected ? 'bg-gray-50' : ''}`}
                  onClick={() => {
                    setShowCustomInput(true)
                    if (isCustomSelected) {
                      setCustomInputValue(inputValue)
                    }
                  }}
                >
                  <Plus size={16} color="#9CA3AF" />
                  <Text className={`text-sm ${isCustomSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                    {isCustomSelected ? inputValue : '自定义'}
                  </Text>
                  {isCustomSelected && (
                    <View className="ml-auto">
                      <Check size={16} color="#000" />
                    </View>
                  )}
                </View>
              ) : (
                <View
                  className={`flex items-center gap-2 px-4 py-3 ${
                    filteredOptions.length > 0 ? 'border-t border-gray-50' : ''
                  } bg-gray-50`}
                >
                  <View className="flex-1">
                    <Input
                      value={customInputValue}
                      onInput={(e) => setCustomInputValue(e.detail.value)}
                      placeholder="输入自定义内容..."
                      className="w-full bg-transparent text-sm"
                      focus
                    />
                  </View>
                  <Button
                    size="sm"
                    className="bg-black"
                    onClick={handleCustomConfirm}
                    disabled={!customInputValue.trim()}
                  >
                    <Text className="text-white text-xs">确定</Text>
                  </Button>
                  <View onClick={() => { setShowCustomInput(false); setCustomInputValue('') }}>
                    <X size={20} color="#9CA3AF" />
                  </View>
                </View>
              )}

              {filteredOptions.length === 0 && !showCustomInput && (
                <View className="px-4 py-8 flex items-center justify-center">
                  <Text className="text-sm text-gray-400">没有找到匹配项，试试自定义</Text>
                </View>
              )}
            </View>
          </View>
        )
      
      case 'multiselect': {
        const hasEnumOptions = (definition.enum_options?.length || 0) > 0
        return (
          <View>
            {/* 搜索框 */}
            {showSearch && hasEnumOptions && (
              <View className="bg-gray-50 rounded-lg px-4 py-3 mb-3 flex items-center gap-2">
                <Search size={16} color="#9CA3AF" />
                <View className="flex-1">
                  <Input
                    value={searchQuery}
                    onInput={(e) => setSearchQuery(e.detail.value)}
                    placeholder="搜索..."
                    className="w-full bg-transparent text-sm"
                  />
                </View>
              </View>
            )}
            
            {/* 已选择的标签 */}
            {multiSelectValues.length > 0 && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-500 mb-2">已选择 ({multiSelectValues.length})</Text>
                <View className="flex flex-wrap gap-2">
                  {multiSelectValues.map(value => {
                    const option = definition.enum_options?.find(o => o.value === value)
                    return (
                      <View
                        key={value}
                        className="flex items-center gap-1 bg-black rounded-full px-3 py-2"
                      >
                        <Text className="text-sm text-white">{option?.label || value}</Text>
                        <View onClick={() => handleRemoveValue(value)}>
                          <X size={14} color="#fff" />
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}
            
            {/* 预设可选标签（仅在有预设选项时显示） */}
            {hasEnumOptions && (
              <View className="mb-2">
                <Text className="block text-xs text-gray-500 mb-2">可选项</Text>
                <View className="flex flex-wrap gap-2">
                  {filteredOptions
                    .filter(option => !multiSelectValues.includes(option.value))
                    .map(option => (
                      <Badge
                        key={option.value}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={() => handleMultiSelect(option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  {filteredOptions.filter(option => !multiSelectValues.includes(option.value)).length === 0 && (
                    <Text className="text-sm text-gray-400">暂无可选项</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* 自定义输入（无预设选项时直接展开输入框） */}
            <View className={hasEnumOptions ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
              {!showCustomInput && hasEnumOptions ? (
                <View 
                  className="flex items-center gap-2 text-gray-500"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus size={16} color="#9CA3AF" />
                  <Text className="text-sm">添加自定义选项</Text>
                </View>
              ) : (
                <View>
                  {!hasEnumOptions && multiSelectValues.length === 0 && (
                    <Text className="block text-xs text-gray-500 mb-2">输入后按回车或点击添加</Text>
                  )}
                  <View className="flex items-center gap-2">
                    <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                      <Input
                        value={customInputValue}
                        onInput={(e) => setCustomInputValue(e.detail.value)}
                        placeholder={hasEnumOptions ? '输入自定义内容...' : `添加${definition.display_name}标签...`}
                        className="w-full bg-transparent text-sm"
                        onConfirm={handleAddCustomValue}
                        focus={!hasEnumOptions && multiSelectValues.length === 0}
                      />
                    </View>
                    <Button
                      size="sm"
                      className="bg-black"
                      onClick={handleAddCustomValue}
                      disabled={!customInputValue.trim()}
                    >
                      <Text className="text-white text-xs">添加</Text>
                    </Button>
                    {hasEnumOptions && showCustomInput && (
                      <View onClick={() => { setShowCustomInput(false); setCustomInputValue('') }}>
                        <X size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )
      }
      
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
      <View className="p-4 bg-white border-b border-gray-100">
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
      <View className="p-4">
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
