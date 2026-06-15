# 知拌 设计规范

## 1. 品牌定位

**产品名**：知拌 — 用智慧调配好关系

**设计理念**：了解一个人就像拌一道菜，把不同的食材调和在一起，找到最合适的配比。产品不是冷冰冰的"对象管理器"，而是帮助用户用心经营关系的智能助手。

**设计风格**：清爽薄荷 — 自然日光下的鲜活感，像薄荷冰淇淋一样清爽而不冰冷

**核心原则**：
- 清爽克制：纯白为主，薄荷绿点睛，拒绝浓妆艳抹
- 流程驱动：每个页面引导用户完成一个核心动作
- 信息聚焦：突出关键信息，弱化次要信息
- 组件优先：通用 UI 组件优先使用 `@/components/ui/*`，禁止手搓

---

## 2. 信息架构（硬件/软件框架）

### 硬件信息（外在/固定属性）
硬件信息是**可见的、相对固定的**外在属性，通常可以直接观察或简单询问获得。

| 分类 | 字段 | 说明 |
|------|------|------|
| **基本信息** | 年龄、身高、生日、星座、血型 | 基础人口学信息 |
| **外貌特征** | 体型、穿搭风格 | 外观相关属性 |
| **联系方式** | 微信、电话、所在地 | 联络渠道 |
| **职业信息** | 职业、公司、职位 | 社会身份 |

### 软件信息（内在/需探索属性）
软件信息是**内在的、需要互动探索**的特质，需要通过交流和相处逐步了解。

| 分类 | 字段 | 说明 |
|------|------|------|
| **性格特质** | MBTI、性格描述、情绪特点 | 心理特征 |
| **兴趣爱好** | 兴趣标签、具体爱好 | 休闲偏好 |
| **行为习惯** | 作息、消费观、沟通风格 | 日常模式 |
| **情感需求** | 喜欢/讨厌、恋爱期待、雷区 | 情感偏好 |

---

## 3. 配色方案（纯白+薄荷绿）

### 基础色

| 用途 | 颜色值 | Tailwind 类名 | 说明 |
|------|--------|---------------|------|
| 主色（强调/选中） | `#4ECB71` | `text-green-500` / `bg-green-500` | 薄荷绿，按钮、选中态、图标着色 |
| 深绿（图标/标签） | `#2E9E5A` | `text-green-600` / `bg-green-600` | 深薄荷，图标着色、hover 态 |
| 浅绿底（标签/徽章） | `#ECFDF5` | `bg-green-50` | 极淡薄荷底色 |
| 薄荷绿透明底 | `#4ECB71` + `15` 透明度 | inline style `backgroundColor: '#4ECB7115'` | 评分圆圈、状态徽章底色 |
| 页面背景（冷灰） | `#F7F8FA` | `style={{ backgroundColor: '#F7F8FA' }}` | 冷淡浅灰，卡片浮在背景上 |
| 卡片背景 | `#FFFFFF` | `bg-white` | 纯白卡片，靠阴影区分层次 |
| 灰底信息区 | `#F9FAFB` | `bg-gray-50` | 嵌套信息区底色（指标卡、详情块） |
| 卡片阴影 | 柔和弥散 | `shadow-soft` 或 `style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}` | 大范围低透明度，卡片浮起感 |
| 轻阴影 | 更轻微 | `style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}` | 内嵌卡片、结果区 |
| 标题文字 | `#111827` | `text-gray-900` | 深黑 |
| 正文文字 | `#374151` | `text-gray-700` | 中灰 |
| 辅助文字 | `#6B7280` | `text-gray-500` | 浅灰 |
| 占位文字 | `#9CA3AF` | `text-gray-400` | 淡灰 |
| 边框/分割 | `#E5E7EB` | `border-gray-200` | 极淡边框 |
| 头部分割线 | `rgba(0,0,0,0.06)` | inline style | 头部底部极淡分割 |

### 辅助色（仅用于功能分类，不作为页面主色）

| 用途 | 颜色值 | Tailwind 类名 | 说明 |
|------|--------|---------------|------|
| 暖金（警示/提醒） | `#F0C75E` | `text-amber-500` | 重要提醒、时间标记 |
| 珊瑚（紧急/标记） | `#E87461` | `text-orange-500` | 错误、紧急、负面标记 |
| 薰衣草（周期/情绪） | `#A78BFA` | `text-violet-400` | 周期、情绪相关 |
| 天蓝（信息提示） | `#60A5FA` | `text-blue-400` | 信息类提示 |

### 评分色（三档体系）

| 分值 | 颜色 | 标签 | 使用场景 |
|------|------|------|----------|
| ≥80 | `#4ECB71` 薄荷绿 | 优秀 | 评分圆圈、进度条、标签 |
| 60-79 | `#F5A623` 琥珀 | 良好 | 评分圆圈、进度条、标签 |
| <60 | `#FF6B6B` 珊瑚红 | 待提升 | 评分圆圈、进度条、标签 |

### 状态色

| 状态 | 颜色 | Tailwind 类名 | 使用场景 |
|------|------|---------------|----------|
| 成功/完成 | `#4ECB71` | `text-green-500` | 任务完成、关系进展 |
| 警示 | `#F0C75E` | `text-amber-500` | 重要提醒 |
| 错误/紧急 | `#E87461` | `text-orange-500` | 错误、超时 |

---

## 4. 字体规范

| 层级 | 字号 | 字重 | Tailwind 类名 | 使用场景 |
|------|------|------|---------------|----------|
| 页面标题 | 20px | Bold | `text-xl font-bold text-gray-900` | CustomHeader title |
| 卡片标题 | 16px | Semibold | `text-base font-semibold text-gray-900` | 卡片内标题、分组标题 |
| 小节标题 | 14px | Semibold | `text-sm font-semibold text-gray-900` | 信息区标题 |
| 正文 | 14px | Regular | `text-sm text-gray-700` | 正文内容、列表项 |
| 辅助文字 | 12px | Regular | `text-xs text-gray-500` | 标签说明、次要信息 |
| 占位文字 | 12px | Regular | `text-xs text-gray-400` | placeholder、引导文字 |
| 评分数字 | 24px | Bold | `text-2xl font-bold` | 评分圆圈内数字 |

---

## 5. 间距与圆角系统

### 间距

| 用途 | 间距 | Tailwind 类名 |
|------|------|---------------|
| 页面边距 | 16px | `px-4` |
| 卡片间距 | 16px | `mb-4` / `gap-4` |
| 内容间距 | 12px | `gap-3` / `mb-3` |
| 紧凑间距 | 4px | `gap-1` |
| 卡片内边距 | 16-20px | `p-4` / `p-5` |
| 标签内边距 | 水平8-16px 垂直4px | `px-2 py-1` / `px-4 py-1` |
| 底部安全区 | `calc(12px + env(safe-area-inset-bottom))` | inline style |

### 圆角

| 元素 | 圆角 | Tailwind 类名 |
|------|------|---------------|
| 卡片 | 16px | `rounded-2xl` |
| 按钮/输入框 | 12px | `rounded-xl` |
| 标签/徽章 | 8px | `rounded-lg` |
| 胶囊标签 | 全圆 | `rounded-full` |
| 图标容器 | 全圆 | `rounded-full` |
| 结果区块 | 12px | `rounded-xl` |

---

## 6. 组件选型与样式规范

通用 UI 组件优先使用 `@/components/ui/*`，禁止用 View/Text 手搓按钮、输入框、卡片、标签、弹窗等。

### 6.1 卡片

```
bg-white rounded-2xl shadow-soft p-4
```
- 无边框，柔和弥散阴影与纯白背景区分层次
- 阴影：`style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}`
- 轻阴影变体：`style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}`
- 使用 `@/components/ui/card` 的 `Card` + `CardContent`

### 6.2 按钮

```
主按钮：bg-green-500 text-white rounded-xl
次按钮：bg-gray-100 text-gray-700 rounded-xl
文字按钮：text-gray-500
危险按钮：bg-red-50 text-red-500
```
- 使用 `@/components/ui/button`
- 按钮内图标统一白色 `color="#fff"`

### 6.3 标签/徽章

```
薄荷绿标签：bg-green-50 text-green-600 text-xs rounded-full
状态标签：bg-{color}-50 text-{color}-600 text-xs rounded-full
评分标签：bg-{scoreColor}15 text-xs rounded-full，字体色用对应评分色
```
- 使用 `@/components/ui/badge`

### 6.4 图标容器（圆形图标按钮）

```
// 快捷操作/功能入口
w-10 h-10 rounded-full bg-green-50 flex items-center justify-center
图标色：color="#2E9E5A"（深薄荷绿）

// 大号功能入口
w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center
图标色：color="#2E9E5A"

// 分组标题图标
w-6 h-6 rounded-md bg-green-50 flex items-center justify-center
图标色：color="#4ECB71" 或 color="#2E9E5A"
```

### 6.5 信息分组标题

```
<View className="flex items-center gap-2 mb-3">
  <Icon size={14} color="#2E9E5A" />
  <Text className="block text-sm font-semibold text-gray-900">分组名</Text>
  <Text className="block text-xs text-gray-400">分组说明</Text>
</View>
```
- 使用 `@/components/section-header` 或直接手写（icon + title + description 三件套）

### 6.6 评分圆圈

```
<View
  className="flex items-center justify-center rounded-full"
  style={{ width: '64px', height: '64px', backgroundColor: `${scoreColor}15` }}
>
  <Text className="block text-2xl font-bold" style={{ color: scoreColor }}>
    {score}
  </Text>
</View>
```
- 底色：评分色 + `15` 透明度
- 数字：评分色 + `text-2xl font-bold`

### 6.7 进度条

```
<View className="h-2 bg-gray-100 rounded-full overflow-hidden">
  <View
    className="h-full rounded-full"
    style={{ width: `${value}%`, backgroundColor: scoreColor }}
  />
</View>
```
- 使用 `@/components/ui/progress`
- 底色 `bg-gray-100`，填充色根据分数档位

### 6.8 Tab 切换器（胶囊）

```
<View className="flex flex-row bg-gray-100 rounded-2xl p-1">
  <View className={`flex-1 py-2 rounded-xl ${active ? 'bg-white' : ''}`}
    style={active ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : {}}>
    <Text className={`block text-center text-sm font-medium ${active ? 'text-gray-800' : 'text-gray-400'}`}>
      标签名
    </Text>
  </View>
</View>
```
- 或使用 `@/components/ui/tabs`

### 6.9 胶囊选择器（平台/类型）

```
<View className="flex flex-row flex-wrap gap-2">
  <View className={`px-4 py-1 rounded-full ${selected ? 'bg-green-500' : 'bg-white'}`}
    style={selected ? { boxShadow: '0 2px 8px rgba(78,203,113,0.3)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
    <Text className={`block text-sm ${selected ? 'text-white font-medium' : 'text-gray-600'}`}>
      选项
    </Text>
  </View>
</View>
```
- 选中态：`bg-green-500 text-white` + 薄荷绿投影
- 未选中态：`bg-white text-gray-600` + 灰色投影

### 6.10 空状态

```
<View className="flex items-center justify-center py-20">
  <Icon size={48} color="#d1d5db" />
  <Text className="block text-sm text-gray-400 mt-4">主提示</Text>
  <Text className="block text-xs text-gray-300 mt-1">副说明</Text>
</View>
```
- 使用 `@/components/empty-state`

### 6.11 加载态

```
// 骨架屏
<View className="bg-white rounded-2xl p-5">
  <Skeleton className="h-6 w-32 mb-4" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-3/4" />
</View>
```
- 使用 `@/components/ui/skeleton` 或 `@/components/skeleton`

### 6.12 底部固定操作栏

```
<View style={{
  position: 'fixed', bottom: 0, left: 0, right: 0,
  display: 'flex',
  padding: '12px 16px',
  backgroundColor: '#fff',
  borderTop: '1px solid #E5E7EB',
  paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  zIndex: 100
}}>
  <Button className="w-full bg-green-500">操作</Button>
</View>
```
- 必须 inline style（Fixed+Flex 在 H5 Tailwind 失效）
- `bottom: 0` 会被 TabBar 遮挡时改为 `bottom: 50`

### 6.13 分割线

```
// 简单分割
<View className="h-px bg-gray-200" />

// 带文字分割
<View className="flex flex-row items-center gap-3 my-6">
  <View className="flex-1 h-px bg-gray-200" />
  <Text className="block text-xs text-gray-400">文字</Text>
  <View className="flex-1 h-px bg-gray-200" />
</View>
```
- 使用 `@/components/ui/separator`

### 6.14 弹窗/抽屉

- 非危险确认：`@/components/ui/dialog`（Dialog + DialogContent）
- 危险操作确认：`@/components/ui/alert-dialog`
- 底部选择面板：`@/components/ui/drawer`（Drawer + DrawerContent）
- AI 对话：`@/components/chat-dialog`

### 6.15 提示反馈

- 轻提示：`Taro.showToast({ title, icon: 'none' })`
- Toast：`@/components/ui/toast` 或 `@/components/ui/sonner`

---

## 7. 页面结构规范

### 7.1 通用页面骨架

```
<View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
  <CustomHeader title="页面标题" />
  <View className="px-4 pt-4">
    {/* 页面内容 */}
  </View>
</View>
```
- 使用 `CustomHeader` 的页面**必须**配置 `navigationStyle: 'custom'`
- 页面配置：
```ts
export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '页面标题', navigationStyle: 'custom' })
  : { navigationBarTitleText: '页面标题', navigationStyle: 'custom' }
```

### 7.2 档案详情页（detail）结构

```
CustomHeader → 基本信息卡 → 快捷操作（4宫格）→ 智能助手（8宫格）→ 数据概览 → 维度数据 → 备注 → 底部AI助手按钮
```

### 7.3 AI 功能页通用结构

```
CustomHeader → [Tab切换/对象选择] → 输入区 → 操作按钮 → 加载骨架 → 结果展示（评分卡+分项卡+建议）→ 对话区
```

### 7.4 列表页结构

```
CustomHeader → 列表项（卡片式）→ 空状态
```

---

## 8. 导航结构

### TabBar 页面

| 页面 | 路径 | 图标 | 文字 |
|------|------|------|------|
| 对象列表 | pages/index/index | users | 对象 |
| 发现 | pages/discover/index | sparkles | 发现 |
| 我的 | pages/profile/index | user | 我的 |

### TabBar 配色

- 未选中：`#9CA3AF`（gray-400）
- 选中：`#4ECB71`（薄荷绿）
- 背景：`#FFFFFF`

### 页面跳转规范

- TabBar 页面间跳转：`Taro.switchTab()`
- 非 TabBar 页面跳转：`Taro.navigateTo()`
- 携带对象上下文：URL 加 `?matchId=xxx`
- 携带数据上下文：URL 加 `?id=xxx`

---

## 9. 图标使用规范

- 图标库：`lucide-react-taro`
- 着色方式：使用 `color` prop（`<Icon size={18} color="#2E9E5A" />`），**禁止**用 `className` 的 `text-*` 改色
- 常用图标色：
  - 深薄荷绿 `#2E9E5A`：快捷操作、功能入口、分组标题
  - 薄荷绿 `#4ECB71`：选中态、成功态
  - 灰色 `#9CA3AF`：辅助箭头、折叠图标
  - 白色 `#fff`：按钮内图标、深色底上的图标

---

## 10. 交互原则

1. **一页一事**：每个页面只做一件事
2. **减少选择**：提供明确的行动路径
3. **即时反馈**：操作后立即显示结果
4. **渐进展示**：先看概览，再深入详情
5. **信息分层**：硬件在前，软件在后
6. **自动保存**：分析/诊断完成后自动保存历史
7. **历史回溯**：AI 功能页提供"诊断/历史"Tab 切换

---

## 11. 数据展示规范

### 指标卡

```
<View className="flex-1 bg-gray-50 rounded-lg p-3">
  <View className="flex items-center gap-1 mb-1">
    <Icon size={12} color="#2E9E5A" />
    <Text className="block text-xs text-gray-500">指标名</Text>
  </View>
  <View className="flex items-baseline gap-1">
    <Text className="block text-lg font-bold text-gray-900">数值</Text>
    <Text className="block text-xs text-gray-400">单位</Text>
  </View>
</View>
```

### 列表项

```
<View className="bg-white rounded-2xl p-4 mb-3"
  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
  <View className="flex flex-row items-center gap-3">
    {/* 左侧评分圆/图标 */}
    {/* 中间信息 */}
    <View className="flex-1 min-w-0">
      <Text className="block text-sm text-gray-600 truncate">摘要</Text>
    </View>
    {/* 右侧箭头 */}
    <ChevronRight size={18} color="#d1d5db" />
  </View>
</View>
```

---

## 12. 关系类型视觉映射

| 关系类型 | 标签色 | 底色 | 说明 |
|----------|--------|------|------|
| 长期关系 | `#2E9E5A` | `bg-green-50` | 深薄荷绿 |
| 短期关系 | `#374151` | `bg-gray-100` | 深灰 |
| 灵活关系 | `#4ECB71` | `bg-green-50` | 薄荷绿 |
| 未设置 | `#9CA3AF` | `bg-gray-50` | 灰色 |

---

## 13. 周期阶段视觉映射

| 阶段 | 图标 | 颜色 | 底色 |
|------|------|------|------|
| 月经期 | Moon | `#6B7280` | `bg-gray-50` |
| 卵泡期 | Sun | `#4ECB71` | `bg-green-50` |
| 排卵期 | Heart | `#2E9E5A` | `bg-green-50` |
| 黄体早期 | Sun | `#4ECB71` | `bg-green-50` |
| 黄体中期 | Cloud | `#374151` | `bg-gray-50` |
| 黄体晚期 | Moon | `#6B7280` | `bg-gray-50` |

---

## 14. 小程序约束

- 图片/视频走 TOS 对象存储，禁止打包本地资源（TabBar 图标除外）
- TabBar 图标使用本地 PNG，通过 `npx taro-lucide-tabbar` 生成
- `project.config.json` / `project.tt.json` 必须配置 `packOptions.ignore` 排除 assets
- 注意 H5/小程序跨端兼容（Text block、Input 包裹、Fixed+Flex 等）

---

## 15. Textarea 跨端样式方案

### 问题

Taro H5 端渲染 `<Textarea>` 时会自动生成 `<taro-textarea-core>` 外层容器：

```html
<taro-textarea-core class="taro-textarea-core">
  <textarea class="用户传入的 className"></textarea>
</taro-textarea-core>
```

`className` 只作用于内层 `<textarea>`，**外层容器无法接收任何样式**，导致背景色、圆角、内边距、边框等视觉样式全部失效。

### 解决方案

使用 `@/components/ui/textarea` 组件，通过 `wrapperClassName` 将视觉样式应用到外层容器：

```tsx
import { Textarea } from '@/components/ui/textarea'

// ✅ 正确：wrapperClassName 控制外层容器样式
<Textarea
  wrapperClassName="bg-gray-50 rounded-2xl p-4 border border-gray-200"
  style={{ width: '100%', minHeight: '100px' }}
  placeholder="请输入内容..."
  maxlength={500}
/>

// ❌ 错误：直接用 Taro Textarea + className，样式在 H5 端不生效
import { Textarea } from '@tarojs/components'
<Textarea
  className="bg-gray-50 rounded-2xl p-4"  // 这些样式不会生效
  placeholder="请输入内容..."
/>
```

### API

| 属性 | 类型 | 说明 |
|------|------|------|
| `wrapperClassName` | `string` | 外层容器的 CSS 类名（背景色、圆角、内边距、边框等） |
| `wrapperStyle` | `React.CSSProperties` | 外层容器的 inline style |
| 其余属性 | - | 透传给 Taro 原生 Textarea |

### 样式分配原则

| 样式类型 | 放在哪 | 原因 |
|----------|--------|------|
| 背景色 `bg-*` | `wrapperClassName` | 作用于外层容器 |
| 圆角 `rounded-*` | `wrapperClassName` | 作用于外层容器 |
| 内边距 `p-*` / `px-*` / `py-*` | `wrapperClassName` | 作用于外层容器 |
| 边框 `border-*` | `wrapperClassName` | 作用于外层容器 |
| 阴影 `shadow-*` | `wrapperClassName` | 作用于外层容器 |
| 宽高 `width` / `minHeight` | `style`（内联） | 作用于内层 textarea |
| 字体 `fontSize` | `style`（内联） | 作用于内层 textarea |
| 文字色 `text-*` | `className` | 作用于内层 textarea |

### 禁止事项

- ❌ 禁止直接使用 `@tarojs/components` 的 `<Textarea>`（H5 端样式不生效）
- ❌ 禁止手动用 `<View>` 包裹 `<Textarea>` 再加样式（冗余，且外层 View 不等于 taro-textarea-core）
- ✅ 必须使用 `@/components/ui/textarea` 的 `<Textarea>` + `wrapperClassName`

---

## 16. 设计禁忌

- ❌ 禁止使用 `bg-white bg-opacity-20`（Taro 不生效），改用 `rgba(255,255,255,0.2)` inline style
- ❌ 禁止使用硬编码 px 值（`w-[340px]`、`text-[14px]`），使用 Tailwind 预设类名
- ❌ 禁止在 className 模板字面量中使用插值（`className="...${expr}..."`），改用条件表达式
- ❌ 禁止 `{0 && <Component/>}` 渲染文本 "0"，初始值用 `undefined` 代替 `0`
- ❌ 禁止 Tailwind 的 `fixed` + `flex` 组合（H5 失效），改用 inline style
- ❌ 禁止用 `View/Text` 手搓按钮、输入框、弹窗、标签页等通用组件
- ❌ 禁止在 `@Controller` 路径中手动添加 `api` 前缀
- ❌ 禁止硬编码 `http://localhost:3000` 到请求 URL
