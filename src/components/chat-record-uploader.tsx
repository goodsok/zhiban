import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Loader, Upload, CircleAlert, CircleCheck } from 'lucide-react-taro'

interface ChatRecordUploaderProps {
  matchId: number
  onSuccess?: () => void
}

interface UploadResult {
  success: boolean
  isChatRecord: boolean
  analysis?: {
    responseSpeed: string
    activeTimeSlots: string[]
    topicPreferences: string[]
    communicationStyle: string
    confidence: number
  }
  message: string
}

const ChatRecordUploader: FC<ChatRecordUploaderProps> = ({
  matchId,
  onSuccess
}) => {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  useDidShow(() => {
    // Reset result when component shows
    setResult(null)
  })

  const handleChooseImage = async () => {
    try {
      const chooseResult = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = chooseResult.tempFilePaths[0]
      await uploadImage(tempFilePath)
    } catch (error) {
      console.log('Choose image cancelled or failed:', error)
    }
  }

  const uploadImage = async (filePath: string) => {
    try {
      setUploading(true)
      setResult(null)

      // Get base64 data
      const fileInfo = await Taro.getFileSystemManager().readFileSync(filePath)
      const base64Data = fileInfo.toString()

      const res = await Network.request({
        url: `/api/portrait/${matchId}/chat-record`,
        method: 'POST',
        data: { base64Data }
      })

      const data = res.data as any
      if (data?.code === 200) {
        setResult({
          success: true,
          isChatRecord: true,
          analysis: data.data,
          message: data.message
        })
        onSuccess?.()
      } else if (data?.code === 400) {
        setResult({
          success: false,
          isChatRecord: false,
          message: data.message || '无法识别为聊天记录'
        })
      } else {
        setResult({
          success: false,
          isChatRecord: false,
          message: '上传失败，请重试'
        })
      }
    } catch (error) {
      console.error('Upload image error:', error)
      setResult({
        success: false,
        isChatRecord: false,
        message: '上传失败，请重试'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <View className="bg-white rounded-xl p-4">
      <Text className="block text-sm font-semibold text-gray-900 mb-2">上传聊天记录截图</Text>
      <Text className="block text-xs text-gray-400 mb-4">
        上传你和Ta的聊天截图，AI会自动分析Ta的行为特征
      </Text>

      {/* 上传按钮 */}
      <View
        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg"
        onClick={uploading ? undefined : handleChooseImage}
      >
        {uploading ? (
          <>
            <Loader size={24} color="#666" className="animate-spin" />
            <Text className="block text-sm text-gray-500 mt-2">分析中...</Text>
          </>
        ) : (
          <>
            <Upload size={24} color="#999" />
            <Text className="block text-sm text-gray-500 mt-2">点击上传截图</Text>
          </>
        )}
      </View>

      {/* 上传结果 */}
      {result && (
        <View
          className={`mt-4 p-3 rounded-lg ${
            result.success && result.isChatRecord
              ? 'bg-green-50'
              : 'bg-red-50'
          }`}
        >
          <View className="flex items-start gap-2">
            {result.success && result.isChatRecord ? (
              <CircleCheck size={16} color="#4ECB71" />
            ) : (
              <CircleAlert size={16} color="#EF4444" />
            )}
            <View className="flex-1">
              <Text
                className={`block text-sm ${
                  result.success && result.isChatRecord
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}
              >
                {result.success && result.isChatRecord ? '分析完成' : '上传失败'}
              </Text>
              <Text
                className={`block text-xs mt-1 ${
                  result.success && result.isChatRecord
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {result.message}
              </Text>

              {/* 显示分析结果 */}
              {result.success && result.isChatRecord && result.analysis && (
                <View className="mt-3 p-2 bg-white rounded">
                  <Text className="block text-xs text-gray-500 mb-2">识别到的特征：</Text>
                  <View className="flex flex-wrap gap-1">
                    {result.analysis.responseSpeed && (
                      <View className="px-2 py-1 bg-gray-100 rounded">
                        <Text className="block text-xs text-gray-600">
                          回复：{result.analysis.responseSpeed}
                        </Text>
                      </View>
                    )}
                    {result.analysis.activeTimeSlots?.length > 0 && (
                      <View className="px-2 py-1 bg-gray-100 rounded">
                        <Text className="block text-xs text-gray-600">
                          活跃：{result.analysis.activeTimeSlots.join('、')}
                        </Text>
                      </View>
                    )}
                    {result.analysis.topicPreferences?.length > 0 && (
                      <View className="px-2 py-1 bg-gray-100 rounded">
                        <Text className="block text-xs text-gray-600">
                          话题：{result.analysis.topicPreferences.join('、')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="block text-xs text-gray-400 mt-2">
                    置信度：{Math.round(result.analysis.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 提示信息 */}
      <View className="mt-3 flex items-start gap-2">
        <CircleAlert size={14} color="#999" />
        <Text className="block text-xs text-gray-400">
          请上传真实的聊天记录截图，AI会自动识别对话内容并提取行为特征
        </Text>
      </View>
    </View>
  )
}

export default ChatRecordUploader
