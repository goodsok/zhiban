import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Loader, Send, Sparkles, ImagePlus, X, ArrowLeft } from 'lucide-react-taro'

// 消息类型
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

// 对话上下文
interface ChatContext {
  matchId: number
  matchName: string
  hardware: Record<string, unknown> | { age?: number; height?: string; [key: string]: unknown }
  software: Record<string, unknown> | { mbti?: string; interests?: string[]; [key: string]: unknown }
  cycleInfo?: {
    day: number
    phase: string
    phaseName: string
    description: string
  }
  relationshipStage: string
  interactionStatus: string
}

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: ChatContext | null
}

// 本地存储的 key 前缀
const CHAT_HISTORY_KEY_PREFIX = 'chat_history_'

// 获取本地存储的 key
const getLocalHistoryKey = (matchId: number) => `${CHAT_HISTORY_KEY_PREFIX}${matchId}`

const ChatDialog: React.FC<ChatDialogProps> = ({ open, onOpenChange, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [quickQuestions, setQuickQuestions] = useState<string[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  
  // 计算快捷问题区域高度（动态）
  const quickQuestionsHeight = quickQuestions.length > 0 
    ? 44 + Math.ceil(quickQuestions.length / 2) * 32 + (questionsLoading ? 36 : 0)
    : 0

  // 获取状态栏高度
  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
  }, [])

  // 保存消息到本地存储
  const saveMessagesToLocal = (matchId: number, msgs: ChatMessage[]) => {
    try {
      Taro.setStorageSync(getLocalHistoryKey(matchId), JSON.stringify(msgs))
    } catch (error) {
      console.error('Save to local storage error:', error)
    }
  }

  // 从本地存储加载消息
  const loadMessagesFromLocal = (matchId: number): ChatMessage[] | null => {
    try {
      const data = Taro.getStorageSync(getLocalHistoryKey(matchId))
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Load from local storage error:', error)
    }
    return null
  }

  // 加载历史记录
  useEffect(() => {
    if (open && context?.matchId) {
      loadHistory()
      loadQuickQuestions()
    } else if (open) {
      setMessages([{ 
        role: 'assistant', 
        content: '你好！我是小助手，请先选择一个对象，我才能给你针对性的建议哦~' 
      }])
      setQuickQuestions(['如何开始使用？', '怎么创建对象档案？', '这个应用能帮我什么？'])
    }
  }, [open, context?.matchId])

  // 加载快捷问题
  const loadQuickQuestions = async () => {
    if (!context) {
      setQuickQuestions(['如何开始使用？', '怎么创建对象档案？', '这个应用能帮我什么？'])
      return
    }

    setQuestionsLoading(true)
    try {
      const res = await Network.request({
        url: '/api/chat/quick-questions',
        method: 'POST',
        data: { context }
      })
      
      console.log('Load quick questions response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data?.questions?.length > 0) {
        setQuickQuestions(res.data.data.questions)
      } else {
        // 使用默认问题
        setQuickQuestions(['给我一些聊天话题建议', '如何推进关系？', '帮我分析一下TA的性格'])
      }
    } catch (error) {
      console.error('Load quick questions error:', error)
      // 网络错误时使用默认问题
      setQuickQuestions(['给我一些聊天话题建议', '如何推进关系？', '帮我分析一下TA的性格'])
    } finally {
      setQuestionsLoading(false)
    }
  }

  const loadHistory = async () => {
    if (!context?.matchId) return
    
    // 1. 先从本地加载，立即显示
    const localMessages = loadMessagesFromLocal(context.matchId)
    if (localMessages && localMessages.length > 0) {
      setMessages(localMessages)
      setHistoryLoading(false)
    } else {
      setHistoryLoading(true)
    }

    // 2. 再从服务器同步
    try {
      const res = await Network.request({
        url: `/api/chat/history/${context.matchId}`,
        method: 'GET'
      })
      
      console.log('Load history response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data?.messages?.length > 0) {
        const serverMessages = res.data.data.messages
        setMessages(serverMessages)
        // 更新本地缓存
        saveMessagesToLocal(context.matchId, serverMessages)
      } else {
        // 服务器无数据，显示欢迎语
        if (!localMessages || localMessages.length === 0) {
          const welcomeMsg = [{ 
            role: 'assistant' as const, 
            content: `你好！我是小助手，可以帮你分析${context.matchName}的情况，或者给你一些建议。有什么想聊的吗？` 
          }]
          setMessages(welcomeMsg)
        }
      }
    } catch (error) {
      console.error('Load history error:', error)
      // 网络错误时，如果本地无数据，显示欢迎语
      if (!localMessages || localMessages.length === 0) {
        setMessages([{ 
          role: 'assistant', 
          content: `你好！我是小助手，可以帮你分析${context.matchName}的情况，或者给你一些建议。有什么想聊的吗？` 
        }])
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  // 选择图片
  const handleChooseImage = async () => {
    if (selectedImages.length >= 3) {
      Taro.showToast({ title: '最多选择3张图片', icon: 'none' })
      return
    }

    try {
      const res = await Taro.chooseImage({
        count: 3 - selectedImages.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setSelectedImages([...selectedImages, ...res.tempFilePaths])
      }
    } catch (error) {
      console.error('Choose image error:', error)
    }
  }

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // 发送消息
  const handleSend = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || loading) return

    const userMessage = inputValue.trim()
    const userImages = [...selectedImages]
    setInputValue('')
    setSelectedImages([])
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { 
        role: 'user', 
        content: userMessage,
        images: userImages.length > 0 ? userImages : undefined
      }
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      let imageAnalysisText = ''
      if (userImages.length > 0) {
        const analysisResults: string[] = []
        for (const imagePath of userImages) {
          try {
            const fileSystemManager = Taro.getFileSystemManager()
            const base64Data = fileSystemManager.readFileSync(imagePath, 'base64') as string
            
            const res = await Network.request({
              url: '/api/chat/analyze-image',
              method: 'POST',
              data: {
                base64Data: `data:image/jpeg;base64,${base64Data}`,
                context: userMessage || '请分析这张图片的内容'
              }
            })
            
            if (res.data?.code === 200 && res.data?.data?.analysis) {
              analysisResults.push(res.data.data.analysis)
            }
          } catch (error) {
            console.error('Analyze image error:', error)
          }
        }
        
        if (analysisResults.length > 0) {
          imageAnalysisText = `\n\n【图片分析结果】\n${analysisResults.join('\n')}`
        }
      }

      const res = await Network.request({
        url: '/api/chat',
        method: 'POST',
        data: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content + (m.images && m.images.length > 0 ? ' [包含图片]' : '')
          })),
          context,
          imageContext: imageAnalysisText || undefined
        }
      })

      console.log('Chat response:', res.data)

      if (res.data?.code === 200 && res.data?.data?.content) {
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: res.data.data.content }]
        setMessages(finalMessages)
        // 保存到本地存储
        if (context?.matchId) {
          saveMessagesToLocal(context.matchId, finalMessages)
        }
        // 发送消息后重新获取快捷问题
        loadQuickQuestions()
      } else {
        const finalMessages = [...newMessages, { 
          role: 'assistant' as const, 
          content: '抱歉，我暂时无法回应，请稍后再试。' 
        }]
        setMessages(finalMessages)
        // 保存到本地存储
        if (context?.matchId) {
          saveMessagesToLocal(context.matchId, finalMessages)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const finalMessages = [...newMessages, { 
        role: 'assistant' as const, 
        content: '网络出了点问题，请稍后再试。' 
      }]
      setMessages(finalMessages)
      // 保存到本地存储
      if (context?.matchId) {
        saveMessagesToLocal(context.matchId, finalMessages)
      }
    } finally {
      setLoading(false)
    }
  }

  // 快捷问题点击后直接发送
  const handleQuickQuestion = async (q: string) => {
    if (loading) return
    
    const userMessage = q
    const newMessages: ChatMessage[] = [
      ...messages,
      { 
        role: 'user', 
        content: userMessage
      }
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await Network.request({
        url: '/api/chat',
        method: 'POST',
        data: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          context
        }
      })

      console.log('Chat response:', res.data)

      if (res.data?.code === 200 && res.data?.data?.content) {
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: res.data.data.content }]
        setMessages(finalMessages)
        // 保存到本地存储
        if (context?.matchId) {
          saveMessagesToLocal(context.matchId, finalMessages)
        }
        // 发送消息后重新获取快捷问题
        loadQuickQuestions()
      } else {
        const finalMessages = [...newMessages, { 
          role: 'assistant' as const, 
          content: '抱歉，我暂时无法回应，请稍后再试。' 
        }]
        setMessages(finalMessages)
        if (context?.matchId) {
          saveMessagesToLocal(context.matchId, finalMessages)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const finalMessages = [...newMessages, { 
        role: 'assistant' as const, 
        content: '网络出了点问题，请稍后再试。' 
      }]
      setMessages(finalMessages)
      if (context?.matchId) {
        saveMessagesToLocal(context.matchId, finalMessages)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!open) return null

  // 导航栏高度 44px
  const navBarHeight = 44
  const headerHeight = statusBarHeight + navBarHeight

  return (
    <View 
      className="fixed inset-0 z-[100] bg-white"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* 自定义头部 */}
      <View 
        className="fixed left-0 right-0 z-[101] bg-white border-b border-gray-100"
        style={{ top: 0 }}
      >
        {/* 状态栏占位 */}
        <View style={{ height: `${statusBarHeight}px` }} />
        
        {/* 导航栏 */}
        <View 
          className="flex items-center justify-between px-4"
          style={{ height: `${navBarHeight}px` }}
        >
          <View 
            className="w-10 h-10 flex items-center justify-center -ml-2"
            onClick={handleClose}
          >
            <ArrowLeft size={24} color="#374151" />
          </View>
          <View className="flex items-center gap-2 flex-1 justify-center">
            <Sparkles size={18} color="#000" />
            <Text className="text-base font-semibold text-gray-900">AI 助手</Text>
          </View>
          <View className="w-10 h-10" />
        </View>
        
        {/* 副标题 */}
        {context && (
          <View className="px-4 pb-2 -mt-1">
            <Text className="text-xs text-gray-400 text-center">
              当前：{context.matchName}
              {context.cycleInfo && ` · ${context.cycleInfo.phaseName}`}
            </Text>
          </View>
        )}
      </View>

      {/* 消息列表区域 */}
      <ScrollView 
        className="bg-gray-50"
        scrollY
        scrollIntoView={messages.length > 0 ? `msg-${messages.length}` : ''}
        scrollWithAnimation
        style={{ 
          position: 'fixed',
          top: `${headerHeight + (context ? 20 : 0)}px`,
          left: 0,
          right: 0,
          bottom: `${120 + quickQuestionsHeight}px`
        }}
      >
        <View className="p-4">
          {historyLoading ? (
            <View className="flex items-center justify-center py-8">
              <Loader size={20} color="#6B7280" className="animate-spin" />
              <Text className="text-sm text-gray-400 ml-2">加载历史记录...</Text>
            </View>
          ) : (
            messages.map((msg, i) => (
              <View 
                key={i}
                id={`msg-${i + 1}`}
                className={`mb-3 ${msg.role === 'user' ? 'flex justify-end' : ''}`}
              >
                {msg.role === 'assistant' ? (
                  <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                    <Text className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</Text>
                  </View>
                ) : (
                  <View className="max-w-[85%]">
                    {msg.images && msg.images.length > 0 && (
                      <View className="flex flex-wrap gap-1 mb-2 justify-end">
                        {msg.images.map((img, imgIndex) => (
                          <Image 
                            key={imgIndex}
                            src={img}
                            className="w-24 h-24 rounded-lg"
                            mode="aspectFill"
                          />
                        ))}
                      </View>
                    )}
                    {msg.content && (
                      <View className="bg-black rounded-2xl rounded-tr-sm px-4 py-3">
                        <Text className="text-sm text-white">{msg.content}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
          
          {loading && (
            <View className="mb-3">
              <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-2 shadow-sm">
                <Loader size={14} color="#6B7280" className="animate-spin" />
                <Text className="text-sm text-gray-400">思考中...</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部输入区域 */}
      <View 
        className="fixed left-0 right-0 z-[101] bg-white border-t border-gray-100"
        style={{ bottom: 0 }}
      >
        {/* 快捷问题 - 始终显示 */}
        {!historyLoading && quickQuestions.length > 0 && (
          <View className="px-4 pt-3 pb-2">
            {questionsLoading ? (
              <View className="flex items-center justify-center py-2">
                <Loader size={14} color="#6B7280" className="animate-spin" />
                <Text className="text-xs text-gray-400 ml-2">加载推荐问题...</Text>
              </View>
            ) : (
              <View className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <View
                    key={i}
                    className="bg-gray-100 rounded-full px-3 py-2 active:bg-gray-200"
                    onClick={() => handleQuickQuestion(q)}
                  >
                    <Text className="text-xs text-gray-600">{q}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 已选图片预览 */}
        {selectedImages.length > 0 && (
          <View className="px-4 pt-2 pb-2">
            <View className="flex flex-wrap gap-2">
              {selectedImages.map((img, index) => (
                <View key={index} className="relative">
                  <Image 
                    src={img}
                    className="w-16 h-16 rounded-lg"
                    mode="aspectFill"
                  />
                  <View 
                    className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X size={12} color="#fff" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 输入框 */}
        <View className="px-4 py-3">
          <View className="flex items-center gap-2">
            {/* 图片上传按钮 */}
            <View 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0"
              onClick={handleChooseImage}
            >
              <ImagePlus size={20} color="#6B7280" />
            </View>
            
            {/* 输入框容器 */}
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 min-h-[40px] flex items-center">
              <Input
                value={inputValue}
                onInput={(e) => setInputValue(e.detail.value)}
                placeholder={selectedImages.length > 0 ? "添加说明（可选）..." : "问我任何问题..."}
                placeholderClass="text-gray-400"
                className="w-full text-sm"
                confirmType="send"
                onConfirm={handleSend}
                adjustPosition
              />
            </View>
            
            {/* 发送按钮 */}
            <View 
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                (inputValue.trim() || selectedImages.length > 0) && !loading ? 'bg-black' : 'bg-gray-200'
              }`}
              onClick={handleSend}
            >
              {loading ? (
                <Loader size={18} color="#6B7280" className="animate-spin" />
              ) : (
                <Send size={18} color={(inputValue.trim() || selectedImages.length > 0) ? '#fff' : '#9CA3AF'} />
              )}
            </View>
          </View>
        </View>
        
        {/* 底部安全区域 */}
        <View className="h-[env(safe-area-inset-bottom)]" />
      </View>
    </View>
  )
}

export default ChatDialog
