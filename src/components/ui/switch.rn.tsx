import * as React from "react"
import { View } from "@tarojs/components"
import { Animated } from "react-native"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> & {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
  }
>(({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
  const [localChecked, setLocalChecked] = React.useState(defaultChecked || false)
  const isControlled = checked !== undefined
  const currentChecked = isControlled ? checked : localChecked

  const translateX = React.useRef(new Animated.Value(currentChecked ? 20 : 0))

  React.useEffect(() => {
    Animated.timing(translateX.current, {
      toValue: currentChecked ? 20 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [currentChecked])

  return (
    <View
      className={cn(
        "h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent",
        disabled && "opacity-50",
        currentChecked ? "bg-primary" : "bg-input",
        className
      )}
      {...props}
      ref={ref}
      onClick={(e) => {
        if (disabled) return
        e.stopPropagation()
        const newChecked = !currentChecked
        if (!isControlled) {
            setLocalChecked(newChecked)
        }
        onCheckedChange?.(newChecked)
      }}
    >
      <Animated.View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fff',
          marginLeft: 0,
          transform: [{ translateX: translateX.current }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}
      />
    </View>
  )
})
Switch.displayName = "Switch"

export { Switch }
