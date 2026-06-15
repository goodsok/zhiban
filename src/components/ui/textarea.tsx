import * as React from "react"
import { View , Textarea as TaroTextarea } from "@tarojs/components"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.ComponentPropsWithoutRef<typeof TaroTextarea> {
  /** 外层容器样式（背景色、圆角、内边距等视觉样式应放在这里） */
  wrapperClassName?: string
  /** 外层容器 inline style */
  wrapperStyle?: React.CSSProperties
  className?: string
  autoFocus?: boolean
}

/**
 * 封装 Taro Textarea，解决 H5 端 taro-textarea-core 容器样式问题。
 *
 * - 视觉样式（背景色、圆角、内边距、边框等）→ 通过 wrapperClassName 设置
 * - Textarea 本身属性（placeholder、maxlength 等）→ 直接设置
 * - 不需要外层包裹时，不传 wrapperClassName 即可
 */
const Textarea = React.forwardRef<
  React.ElementRef<typeof TaroTextarea>,
  TextareaProps
>(({ className, wrapperClassName, wrapperStyle, autoFocus, focus, onFocus, onBlur, style, ...props }, ref) => {
  const [isFocused, ReactIsFocused] = React.useState(false)
  const disabled = !!(props as any).disabled

  React.useEffect(() => {
    if (autoFocus || focus) ReactIsFocused(true)
  }, [autoFocus, focus])

  const textareaElement = (
    <TaroTextarea
      className={cn(
        "flex min-h-20 w-full bg-transparent px-3 py-2 text-sm",
        isFocused && "border-ring",
        className
      )}
      placeholderClass="text-muted-foreground"
      style={{ ...(style as Record<string, unknown>), backgroundColor: 'transparent' }}
      ref={ref}
      focus={autoFocus || focus}
      onFocus={(e) => {
        ReactIsFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        ReactIsFocused(false)
        onBlur?.(e)
      }}
      onTouchStart={() => {
        if (disabled) return
        ReactIsFocused(true)
      }}
      {...props}
    />
  )

  // 无 wrapper 样式时直接渲染 Textarea
  if (!wrapperClassName && !wrapperStyle) {
    return textareaElement
  }

  return (
    <View className={wrapperClassName} style={wrapperStyle}>
      {textareaElement}
    </View>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
