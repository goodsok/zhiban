# 页面规范违规审计报告

> 审计基准：`design_guidelines.md` v2.0  
> 审计范围：`src/pages/` 下全部 51 个页面

---

## 一、全局性违规（跨页面共性问题）

### 1.1 配色不一致 — 未使用薄荷绿主色

规范要求：主色 `#4ECB71`（Tailwind `bg-green-500`/`text-green-*`），辅色 `#2E9E5A`。

| 页面 | 违规描述 | 当前使用 |
|------|----------|----------|
| dating-opener | 全面使用紫色系 | `bg-purple-500`、`bg-purple-50`、`bg-purple-100` |
| quiz | 全面使用粉色系 | `bg-pink-500`、`bg-pink-600` |
| interactive-games | 使用紫色系 | `bg-purple-200`、`bg-purple-500` |
| sweet-talk | 分类图标使用紫/蓝色 | `bg-purple-50`、`bg-blue-50` |
| discover | 部分图标使用靛蓝/紫色 | `bg-violet-50`、`bg-blue-50` |
| profile | 性格维度使用非主色 | `bg-pink-500`、`#8B5CF6` |
| game-truth-dare | 真心话/大冒险用粉色 | `bg-pink-500` |

### 1.2 圆角不统一 — 使用 rounded-lg / rounded-md

规范要求：卡片 `rounded-2xl`、按钮 `rounded-xl`、标签 `rounded-full`、输入框 `rounded-xl`。

**使用 rounded-lg 的页面**（应改为 rounded-2xl 或 rounded-xl）：

| 页面 | 出现次数 |
|------|----------|
| detail | 7 处 |
| dimension-edit | 8 处 |
| create | 4 处 |
| date-edit | 3 处 |
| story | 2 处 |
| knowledge-cycle | 1 处 |
| interaction-detail | 1 处 |
| portrait | 1 处 |

### 1.3 阴影不规范

规范要求：统一使用 `shadow-soft`（`0 1px 3px rgba(0,0,0,0.06)`），或 style 内写 `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'`。

| 页面 | 违规 |
|------|------|
| grow | 使用 `shadow-lg` |
| interactions | 使用 `shadow-lg` |
| dating-photo | 无阴影但应有轻阴影的卡片 |

### 1.4 底部安全区间距不一致

规范要求：有底部固定栏用 `pb-28`，TabBar 页面用 `pb-20`。

| 页面 | 当前值 | 应调整 |
|------|--------|--------|
| detail | pb-24 | 应为 pb-28（有底部操作栏） |
| date-edit | pb-24 | 应为 pb-28（有底部操作栏） |
| create | pb-24 | 应为 pb-28（有底部操作栏） |
| dimension-edit | pb-24 | 需根据是否有底部栏调整 |
| dates | pb-24 | 需根据是否有底部栏调整 |
| interaction-detail | pb-24 | 需根据是否有底部栏调整 |

---

## 二、逐页面违规明细

### 2.1 dating-opener（开场白生成）— 严重违规

| 违规项 | 详情 |
|--------|------|
| **主色全错** | 整个页面使用 `bg-purple-500` 系，应改为 `bg-green-500` / `#4ECB71` |
| 圆角 | 部分用 `rounded-lg`，应统一 `rounded-2xl` |
| 标签样式 | `bg-purple-100 rounded-full`，应改为 `bg-green-50 rounded-full` |
| 按钮 | `bg-purple-500`，应改为 `bg-green-500` |
| 输入区背景 | `bg-purple-50`，应改为 `bg-green-50` |

### 2.2 quiz（恋爱测试）— 严重违规

| 违规项 | 详情 |
|--------|------|
| **主色全错** | 使用 `bg-pink-500`、`bg-pink-600`，应改为薄荷绿 |
| 缺少 CustomHeader | 未使用 CustomHeader |
| 缺少 navigationStyle: custom | 配置文件中无 `navigationStyle: 'custom'` |

### 2.3 interactive-games（互动游戏列表）— 违规

| 违规项 | 详情 |
|--------|------|
| 主色错 | 使用 `bg-purple-200`、`bg-purple-500` |
| 缺少 CustomHeader | 无自定义导航栏 |
| 缺少 navigationStyle: custom | 配置文件中无 `navigationStyle: 'custom'` |

### 2.4 twin-chat（数字孪生体）— 特殊情况

| 违规项 | 详情 |
|--------|------|
| 独立暗色主题 | 整体是暗色设计，大量硬编码 px 值 |
| 硬编码 px | 30+ 处 `fontSize: '11px'`、`height: '44px'` 等 |
| 说明 | 此页面有独立的暗色 UI 风格，可能需要保留差异化设计，但应消除硬编码 px |

### 2.5 moments（朋友圈入口页）— 违规

| 违规项 | 详情 |
|--------|------|
| 缺少 CustomHeader | 使用原生导航栏 + 自定义顶部区域 |
| 顶部区域 | `<View className="bg-white px-4 py-6 border-b">` 不符合页面结构规范 |
| 缺少 navigationStyle: custom | |

### 2.6 discover（发现页）— 轻微违规

| 违规项 | 详情 |
|--------|------|
| 部分图标色 | `bg-violet-50`、`bg-blue-50` 应按分类使用薄荷绿为主 |
| 缺少 CustomHeader | TabBar 页面可以没有 CustomHeader，但顶部标题样式需统一 |

### 2.7 dating-app（交友软件助手）— 违规

| 违规项 | 详情 |
|--------|------|
| 缺少 CustomHeader | |
| 顶部自定义区域 | 使用 `<View className="bg-gradient-to-br from-green-500 to-teal-500">` 渐变非薄荷绿 |
| 缺少 navigationStyle: custom | |

### 2.8 dating-photo（照片评分）— 轻微违规

| 违规项 | 详情 |
|--------|------|
| 缺少 CustomHeader | |
| 卡片无阴影 | `bg-white rounded-xl overflow-hidden` 缺少 shadow-soft |

### 2.9 cycle（生理周期）— 轻微违规

| 违规项 | 详情 |
|--------|------|
| 缺少 CustomHeader | |
| 圆角 | 部分用 `rounded-lg` |
| 缺少 navigationStyle: custom | |

### 2.10 progress（进展）— 轻微违规

| 违规项 | 详情 |
|--------|------|
| 缺少 CustomHeader | |
| 主色 | 里程碑用 `bg-pink-500`，应按评分三档体系 |

### 2.11 游戏类页面（11个）— 集体违规

| 页面 | 违规项 |
|------|--------|
| game-blind | 缺少 CustomHeader，缺少 navigationStyle: custom |
| game-breath | 同上 |
| game-challenge | 同上 |
| game-distance | 同上 |
| game-mirror | 同上 |
| game-pulse | 同上 |
| game-quick | 同上 |
| game-scenario | 同上 |
| game-tacit | 同上 |
| game-touch | 同上 |
| game-truth-dare | 同上，且使用 `bg-pink-500` |

---

## 三、缺少 navigationStyle: 'custom' 的页面

以下页面使用了 CustomHeader 但可能配置缺失，或未使用 CustomHeader 但应使用：

**已确认缺失配置（无 navigationStyle: 'custom'）的页面**：

| 页面 | 使用 CustomHeader | 有 navigationStyle |
|------|-------------------|-------------------|
| dating-profile | ✅ | ❌（需确认） |
| dating-photo | ❌ | ❌ |
| cycle | ❌ | ❌ |
| quiz | ❌ | ❌ |
| dating-app | ❌ | ❌ |
| moments | ❌ | ❌ |
| game-*（11个） | ❌ | ❌ |
| progress | ❌ | ❌ |

---

## 四、硬编码 px 值（跨端不兼容）

规范要求：禁止 `w-[340px]`、`text-[14px]`、`style={{ width: '200px' }}` 等硬编码 px。

| 页面 | 违规数量 | 典型示例 |
|------|----------|----------|
| twin-chat | 30+ | `fontSize: '11px'`、`height: '44px'`、`width: '6px'` |
| detail | 2 | `width: '25%'`、`paddingLeft: '8px'` |
| grow | 多处 | `width: 40`、`height: 40`（JS 数字值） |
| dating-profile | 少量 | `width: '48px'`、`width: '64px'` |
| interaction-create | 少量 | 内联 style 中 px 值 |

> 注：部分 inline style 的 px 值是因 H5 兼容性需要（如 flex 布局），可接受。但 fontSize、width/height 尺寸类应优先用 Tailwind 类名。

---

## 五、组件使用违规

### 5.1 应使用 @/components/ui 但未使用的

| 页面 | 缺失组件 | 当前做法 |
|------|----------|----------|
| dating-opener | Tabs | 自制 Tab 切换 |
| dating-profile | Tabs | 自制胶囊 Tab |
| grow | Tabs（已有） | ✅ 已使用 |
| portrait | Tabs | 自制 Tab `rounded-lg` |

### 5.2 卡片组件未使用

| 页面 | 当前做法 | 应改用 |
|------|----------|--------|
| knowledge-icebreaker | `View className="bg-gray-100 rounded-xl p-4"` | `Card` + `CardContent` |
| story | `View className="bg-gray-50 rounded-xl"` | `Card` |
| game-* | 大量裸 View 卡片 | `Card` |

---

## 六、空状态/加载态不统一

规范要求：空状态使用图标 + 双行文字（主标题 + 副标题），加载态使用 Skeleton。

| 页面 | 空状态 | 加载态 |
|------|--------|--------|
| dating-opener | 自定义空状态 | ❌ 无 |
| knowledge-icebreaker | 自定义空状态 | ❌ 无 |
| moments | 无空状态 | ❌ 无 |
| dating-app | 自定义空状态 | ❌ 无 |
| game-* | 各自不同 | ❌ 无 |

---

## 七、优先级排序（修复建议）

### P0 - 必须立即修复（影响品牌一致性）

1. **dating-opener**：全面改紫色为薄荷绿
2. **quiz**：全面改粉色为薄荷绿 + 补 CustomHeader
3. **interactive-games**：改紫色为薄荷绿 + 补 CustomHeader
4. **game-truth-dare**：改粉色为薄荷绿

### P1 - 应尽快修复（影响视觉一致性）

5. 全局 **rounded-lg → rounded-2xl/rounded-xl** 统一
6. 全局 **shadow-lg → shadow-soft** 统一
7. **底部安全区间距**统一（pb-24 → pb-28/pb-20）
8. **dating-app**：补 CustomHeader + navigationStyle: custom
9. **moments**：补 CustomHeader + navigationStyle: custom
10. **dating-photo**：补 CustomHeader + 卡片阴影

### P2 - 建议修复（提升质量）

11. **twin-chat**：消除硬编码 px，改用 Tailwind 类名
12. 11 个 **game-*** 页面：补 CustomHeader + navigationStyle: custom
13. **cycle/progress**：补 CustomHeader
14. 空状态/加载态统一使用规范模板
15. 部分页面裸 View 卡片改用 Card 组件

### P3 - 可选优化

16. **discover** 页面图标色调整为主色系
17. **sweet-talk** 分类图标色统一
18. **portrait** 自制 Tab 改用 Tabs 组件
