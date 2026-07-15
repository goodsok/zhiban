import * as React from "react"
import { View } from "@tarojs/components"

const Portal = ({ children }: { children: React.ReactNode }) => {
  return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>{children}</View>
}

export { Portal }
