import * as React from "react"
import { Textarea as TaroTextarea } from "@tarojs/components"

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

  return (
    <TaroTextarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:border-ring focus-within:ring-4 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        isFocused && "border-ring ring-4 ring-ring ring-offset-2 ring-offset-background",
        className
      )}
      placeholderClass="text-muted-foreground"
      style={style}
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
      onTouchStart={() => {
        if (disabled) return
        setIsFocused(true)
      }}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
