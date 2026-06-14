import * as React from "react"
import { Textarea as TaroTextarea, View } from "@tarojs/components"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.ComponentPropsWithoutRef<typeof TaroTextarea> {
  className?: string
  autoFocus?: boolean
}

const Textarea = React.forwardRef<
  React.ElementRef<typeof TaroTextarea>,
  TextareaProps
>(({ className, autoFocus, focus, onFocus, onBlur, style, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const disabled = !!(props as any).disabled

  React.useEffect(() => {
    if (autoFocus || focus) setIsFocused(true)
  }, [autoFocus, focus])

  // Extract height-related styles for the container View,
  // so both the outer border and inner textarea share the same height
  const styleObj = typeof style === 'object' ? style : {}
  const containerStyle: React.CSSProperties = {
    minHeight: (styleObj as React.CSSProperties).minHeight || (styleObj as React.CSSProperties).height,
    height: (styleObj as React.CSSProperties).height,
  }

  const textareaStyle: React.CSSProperties = {
    ...(typeof style === 'object' ? style : {}),
    minHeight: '100%',
    height: '100%',
  }

  return (
    <View
      className={cn(
        "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:border-ring focus-within:ring-4 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        isFocused && "border-ring ring-4 ring-ring ring-offset-2 ring-offset-background",
        className
      )}
      style={containerStyle}
      onTouchStart={() => {
        if (disabled) return
        setIsFocused(true)
      }}
    >
      <TaroTextarea
        className="flex-1 w-full h-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm selection:bg-selection selection:text-selection-foreground"
        placeholderClass="text-muted-foreground"
        style={textareaStyle}
        ref={ref}
        focus={autoFocus || focus}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
        {...props}
      />
    </View>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
