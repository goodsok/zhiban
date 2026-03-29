import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader, Send, Sparkles, ImagePlus, X } from 'lucide-react-taro'

// 消息类型
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[] // 图片URL列表
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

const ChatDialog: React.FC<ChatDialogProps> = ({ open, onOpenChange, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  // 加载历史记录
  useEffect(() => {
    if (open && context?.matchId) {
      loadHistory()
    } else if (open) {
      setMessages([{ 
        role: 'assistant', 
        content: '你好！我是小助手，请先选择一个对象，我才能给你针对性的建议哦~' 
      }])
    }
  }, [open, context?.matchId])

  const loadHistory = async () => {
    if (!context?.matchId) return
    
    setHistoryLoading(true)
    try {
      const res = await Network.request({
        url: `/api/chat/history/${context.matchId}`,
        method: 'GET'
      })
      
      console.log('Load history response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data?.messages?.length > 0) {
        setMessages(res.data.data.messages)
      } else {
        setMessages([{ 
          role: 'assistant', 
          content: `你好！我是小助手，可以帮你分析${context.matchName}的情况，或者给你一些建议。有什么想聊的吗？` 
        }])
      }
    } catch (error) {
      console.error('Load history error:', error)
      setMessages([{ 
        role: 'assistant', 
        content: `你好！我是小助手，可以帮你分析${context.matchName}的情况，或者给你一些建议。有什么想聊的吗？` 
      }])
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
    
    // 添加用户消息
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
      // 如果有图片，先上传图片并分析
      let imageAnalysisText = ''
      if (userImages.length > 0) {
        // 逐个分析图片
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

      // 调用后端 API
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
        setMessages([...newMessages, { role: 'assistant', content: res.data.data.content }])
      } else {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: '抱歉，我暂时无法回应，请稍后再试。' 
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: '网络出了点问题，请稍后再试。' 
      }])
    } finally {
      setLoading(false)
    }
  }

  // 快捷问题
  const quickQuestions = [
    '她现在适合约会吗？',
    '怎么开启话题？',
    '如何表达关心？'
  ]

  const handleQuickQuestion = (q: string) => {
    setInputValue(q)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-full h-[90vh] max-h-none max-w-full rounded-none sm:rounded-xl sm:max-w-lg sm:h-[80vh] flex flex-col p-0"
        closeClassName="right-3 top-3"
      >
        {/* 标题栏 */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-gray-100 pr-10">
          <View className="flex items-center gap-2">
            <Sparkles size={18} color="#000" />
            <DialogTitle className="text-base font-semibold">AI 助手</DialogTitle>
          </View>
          {context && (
            <Text className="block text-xs text-gray-400 mt-1">
              当前：{context.matchName}
              {context.cycleInfo && ` · ${context.cycleInfo.phaseName}`}
            </Text>
          )}
        </DialogHeader>

        {/* 消息列表 */}
        <ScrollView 
          className="flex-1 px-4 py-3"
          scrollY
          scrollIntoView={`msg-${messages.length}`}
          scrollWithAnimation
        >
          {historyLoading ? (
            <View className="flex items-center justify-center py-8">
              <Loader size={20} color="#6B7280" className="animate-spin" />
              <Text className="block text-sm text-gray-400 ml-2">加载历史记录...</Text>
            </View>
          ) : (
            messages.map((msg, i) => (
              <View 
                key={i}
                id={`msg-${i + 1}`}
                className={`mb-3 ${msg.role === 'user' ? 'flex justify-end' : ''}`}
              >
                {msg.role === 'assistant' ? (
                  <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <Text className="block text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</Text>
                  </View>
                ) : (
                  <View className="max-w-[85%]">
                    {/* 用户图片 */}
                    {msg.images && msg.images.length > 0 && (
                      <View className="flex flex-wrap gap-1 mb-2 justify-end">
                        {msg.images.map((img, imgIndex) => (
                          <Image 
                            key={imgIndex}
                            src={img}
                            className="w-24 h-24 rounded-lg object-cover"
                            mode="aspectFill"
                          />
                        ))}
                      </View>
                    )}
                    {/* 用户文字 */}
                    {msg.content && (
                      <View className="bg-black rounded-2xl rounded-tr-sm px-4 py-3">
                        <Text className="block text-sm text-white">{msg.content}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
          
          {loading && (
            <View className="mb-3">
              <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-2">
                <Loader size={14} color="#6B7280" className="animate-spin" />
                <Text className="block text-sm text-gray-400">思考中...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 快捷问题 */}
        {messages.length <= 1 && !historyLoading && (
          <View className="flex-shrink-0 px-4 pb-2">
            <View className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <View
                  key={i}
                  className="bg-gray-100 rounded-full px-3 py-2"
                  onClick={() => handleQuickQuestion(q)}
                >
                  <Text className="block text-xs text-gray-600">{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 已选图片预览 */}
        {selectedImages.length > 0 && (
          <View className="flex-shrink-0 px-4 pb-2">
            <View className="flex flex-wrap gap-2">
              {selectedImages.map((img, index) => (
                <View key={index} className="relative">
                  <Image 
                    src={img}
                    className="w-16 h-16 rounded-lg object-cover"
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

        {/* 输入区域 */}
        <View className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <View className="flex items-center gap-2">
            {/* 图片上传按钮 */}
            <View 
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0"
              onClick={handleChooseImage}
            >
              <ImagePlus size={18} color="#6B7280" />
            </View>
            {/* 输入框 */}
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedImages.length > 0 ? "添加说明（可选）..." : "问我任何问题..."}
                className="w-full bg-transparent text-sm outline-none"
                style={{ border: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            </View>
            {/* 发送按钮 */}
            <View 
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                (inputValue.trim() || selectedImages.length > 0) && !loading ? 'bg-black' : 'bg-gray-200'
              }`}
              onClick={handleSend}
            >
              {loading ? (
                <Loader size={16} color="#6B7280" className="animate-spin" />
              ) : (
                <Send size={16} color={(inputValue.trim() || selectedImages.length > 0) ? '#fff' : '#9CA3AF'} />
              )}
            </View>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  )
}

export default ChatDialog
