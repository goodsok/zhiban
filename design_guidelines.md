# 知拌 设计指南

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
| 页面背景（冷灰） | `#F7F8FA` | `style={{ backgroundColor: '#F7F8FA' }}` | 冷淡浅灰，卡片浮在背景上 |
| 卡片背景 | `#FFFFFF` | `bg-white` | 纯白卡片，靠阴影区分层次 |
| 卡片阴影 | 柔和弥散 `0 2px 12px rgba(0,0,0,0.08)` | `shadow-soft` | 大范围低透明度，卡片浮起感 |
| 标题文字 | `#111827` | `text-gray-900` | 深黑 |
| 正文文字 | `#374151` | `text-gray-700` | 中灰 |
| 辅助文字 | `#6B7280` | `text-gray-500` | 浅灰 |
| 占位文字 | `#9CA3AF` | `text-gray-400` | 淡灰 |
| 边框/分割 | `#E5E7EB` | `border-gray-200` | 极淡边框 |
| 头部分割线 | `rgba(0,0,0,0.06)` | inline style | 头部底部极淡分割 |

### 辅助色

| 用途 | 颜色值 | Tailwind 类名 | 说明 |
|------|--------|---------------|------|
| 暖金（警示/提醒） | `#F0C75E` | `text-amber-500` | 重要提醒、时间标记 |
| 珊瑚（紧急/标记） | `#E87461` | `text-orange-500` | 错误、紧急、负面标记 |
| 薰衣草（周期/情绪） | `#A78BFA` | `text-violet-400` | 周期、情绪相关 |
| 天蓝（信息提示） | `#60A5FA` | `text-blue-400` | 信息类提示 |

### 状态色

| 状态 | 颜色 | Tailwind 类名 | 使用场景 |
|------|------|---------------|----------|
| 成功/完成 | `#4ECB71` | `text-green-500` | 任务完成、关系进展 |
| 警示 | `#F0C75E` | `text-amber-500` | 重要提醒 |
| 错误/紧急 | `#E87461` | `text-orange-500` | 错误、超时 |

---

## 4. 字体规范

| 层级 | 字号 | 字重 | Tailwind 类名 |
|------|------|------|---------------|
| 页面标题 | 20px | Bold | `text-xl font-bold text-gray-900` |
| 卡片标题 | 16px | Semibold | `text-base font-semibold text-gray-900` |
| 正文 | 14px | Regular | `text-sm text-gray-700` |
| 辅助文字 | 12px | Regular | `text-xs text-gray-500` |
| 占位文字 | 12px | Regular | `text-xs text-gray-400` |

---

## 5. 间距系统

| 用途 | 间距 | Tailwind 类名 |
|------|------|---------------|
| 页面边距 | 16px | `px-4` |
| 卡片间距 | 16px | `mb-4` / `gap-4` |
| 内容间距 | 12px | `gap-3` |
| 紧凑间距 | 4px | `gap-1` |

---

## 6. 组件选型原则

通用 UI 组件优先使用 `@/components/ui/*`，禁止用 View/Text 手搓按钮、输入框、卡片、标签、弹窗等。

### 卡片
```
bg-white rounded-2xl shadow-soft
```
无边框，柔和弥散阴影与纯白背景区分层次

### 按钮
```
主按钮：bg-green-500 text-white rounded-xl
次按钮：bg-gray-100 text-gray-700 rounded-xl
文字按钮：text-gray-500
```

### 标签
```
bg-green-50 text-green-600 text-xs rounded-lg
```

### 信息分组标题
```
<View className="flex items-center gap-2 mb-2">
  <Icon size={14} color="#4ECB71" />
  <Text className="block text-xs text-gray-500">分组名</Text>
  <Text className="block text-xs text-gray-400">分组说明</Text>
</View>
```

---

## 7. 导航结构

### TabBar 页面
| 页面 | 路径 | 图标 | 文字 |
|------|------|------|------|
| 对象列表 | pages/index/index | users | 对象 |
| 发现 | pages/discover/index | sparkles | 发现 |
| 我的 | pages/profile/index | user | 我的 |

### TabBar 配色
- 未选中：`#A8A29E`（gray-400）
- 选中：`#4ECB71`（薄荷绿）
- 背景：`#FFFFFF`

---

## 8. 交互原则

1. **一页一事**：每个页面只做一件事
2. **减少选择**：提供明确的行动路径
3. **即时反馈**：操作后立即显示结果
4. **渐进展示**：先看概览，再深入详情
5. **信息分层**：硬件在前，软件在后

---

## 9. 小程序约束

- 图片/视频走 TOS 对象存储，禁止打包本地资源（TabBar 图标除外）
- TabBar 图标使用本地 PNG，通过 `npx taro-lucide-tabbar` 生成
- 注意 H5/小程序跨端兼容（Text block、Input 包裹、Fixed+Flex 等）

---

## 10. Textarea 跨端样式方案

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
