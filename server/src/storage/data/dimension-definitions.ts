/**
 * 维度定义数据
 * 按层级组织，每个维度包含完整的元数据定义
 */

export interface DimensionDefinition {
  dimension_key: string
  display_name: string
  description?: string
  layer: number
  category: string
  subcategory?: string
  data_type: 'string' | 'int' | 'float' | 'boolean' | 'enum' | 'string[]' | 'object'
  enum_options?: Array<{ value: string; label: string }>
  validation_rules?: {
    min?: number
    max?: number
    pattern?: string
    required?: boolean
  }
  default_value?: any
  input_type?: 'text' | 'select' | 'multiselect' | 'slider' | 'textarea' | 'number'
  placeholder?: string
  help_text?: string
  icon?: string
  weight: number
  importance: 'critical' | 'important' | 'optional'
  source_allowed: string[]
  sort_order: number
}

// ==================== Layer 1: 静态属性 ====================

export const layer1Dimensions: DimensionDefinition[] = [
  // 1.1 身份基础
  {
    dimension_key: 'birthYear',
    display_name: '出生年份',
    description: '出生年份，用于计算年龄',
    layer: 1,
    category: 'identity',
    data_type: 'int',
    validation_rules: { min: 1950, max: 2010 },
    input_type: 'number',
    placeholder: '如: 1995',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 1
  },
  {
    dimension_key: 'gender',
    display_name: '性别',
    layer: 1,
    category: 'identity',
    data_type: 'enum',
    enum_options: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
      { value: 'other', label: '其他' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 2
  },
  {
    dimension_key: 'hometown',
    display_name: '家乡',
    description: '籍贯或成长地',
    layer: 1,
    category: 'identity',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 浙江杭州',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 3
  },
  {
    dimension_key: 'nationality',
    display_name: '国籍',
    layer: 1,
    category: 'identity',
    data_type: 'string',
    input_type: 'text',
    default_value: '中国',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 4
  },
  {
    dimension_key: 'ethnicity',
    display_name: '民族',
    layer: 1,
    category: 'identity',
    data_type: 'string',
    input_type: 'text',
    default_value: '汉族',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 5
  },
  {
    dimension_key: 'religion',
    display_name: '宗教信仰',
    layer: 1,
    category: 'identity',
    data_type: 'enum',
    enum_options: [
      { value: 'none', label: '无' },
      { value: 'buddhism', label: '佛教' },
      { value: 'christianity', label: '基督教' },
      { value: 'islam', label: '伊斯兰教' },
      { value: 'taoism', label: '道教' },
      { value: 'other', label: '其他' }
    ],
    input_type: 'select',
    default_value: 'none',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 6
  },
  {
    dimension_key: 'zodiac',
    display_name: '星座',
    layer: 1,
    category: 'identity',
    data_type: 'enum',
    enum_options: [
      { value: 'aries', label: '白羊座' },
      { value: 'taurus', label: '金牛座' },
      { value: 'gemini', label: '双子座' },
      { value: 'cancer', label: '巨蟹座' },
      { value: 'leo', label: '狮子座' },
      { value: 'virgo', label: '处女座' },
      { value: 'libra', label: '天秤座' },
      { value: 'scorpio', label: '天蝎座' },
      { value: 'sagittarius', label: '射手座' },
      { value: 'capricorn', label: '摩羯座' },
      { value: 'aquarius', label: '水瓶座' },
      { value: 'pisces', label: '双鱼座' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 7
  },
  {
    dimension_key: 'bloodType',
    display_name: '血型',
    layer: 1,
    category: 'identity',
    data_type: 'enum',
    enum_options: [
      { value: 'A', label: 'A型' },
      { value: 'B', label: 'B型' },
      { value: 'AB', label: 'AB型' },
      { value: 'O', label: 'O型' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 8
  },

  // 1.2 教育职业
  {
    dimension_key: 'education',
    display_name: '最高学历',
    layer: 1,
    category: 'education',
    data_type: 'enum',
    enum_options: [
      { value: 'high_school', label: '高中及以下' },
      { value: 'college', label: '大专' },
      { value: 'bachelor', label: '本科' },
      { value: 'master', label: '硕士' },
      { value: 'phd', label: '博士' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 10
  },
  {
    dimension_key: 'university',
    display_name: '毕业院校',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 浙江大学',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 11
  },
  {
    dimension_key: 'major',
    display_name: '专业',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 计算机科学',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 12
  },
  {
    dimension_key: 'occupation',
    display_name: '职业',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 产品经理',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 13
  },
  {
    dimension_key: 'industry',
    display_name: '行业',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 互联网',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 14
  },
  {
    dimension_key: 'company',
    display_name: '公司',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 某科技公司',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 15
  },
  {
    dimension_key: 'companyScale',
    display_name: '公司规模',
    layer: 1,
    category: 'education',
    data_type: 'enum',
    enum_options: [
      { value: 'startup', label: '创业公司' },
      { value: 'sme', label: '中小企业' },
      { value: 'large', label: '大型企业' },
      { value: 'fortune500', label: '世界500强' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 16
  },
  {
    dimension_key: 'jobLevel',
    display_name: '职级',
    layer: 1,
    category: 'education',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: P7',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 17
  },
  {
    dimension_key: 'incomeLevel',
    display_name: '收入水平',
    layer: 1,
    category: 'education',
    data_type: 'enum',
    enum_options: [
      { value: 'below_avg', label: '低于平均' },
      { value: 'avg', label: '平均水平' },
      { value: 'above_avg', label: '高于平均' },
      { value: 'high', label: '较高收入' },
      { value: 'very_high', label: '高收入' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 18
  },
  {
    dimension_key: 'careerStability',
    display_name: '职业稳定性',
    layer: 1,
    category: 'education',
    data_type: 'enum',
    enum_options: [
      { value: 'stable', label: '稳定' },
      { value: 'changing', label: '经常变动' },
      { value: 'exploring', label: '探索中' },
      { value: 'entrepreneur', label: '创业中' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 19
  },

  // 1.3 家庭背景
  {
    dimension_key: 'familyStructure',
    display_name: '家庭结构',
    layer: 1,
    category: 'family',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 独生子女/有弟弟',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 20
  },
  {
    dimension_key: 'parentsOccupation',
    display_name: '父母职业',
    layer: 1,
    category: 'family',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 父亲工程师，母亲教师',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 21
  },
  {
    dimension_key: 'familyAtmosphere',
    display_name: '家庭氛围',
    layer: 1,
    category: 'family',
    data_type: 'enum',
    enum_options: [
      { value: 'harmonious', label: '和谐' },
      { value: 'neutral', label: '一般' },
      { value: 'complex', label: '复杂' },
      { value: 'strained', label: '紧张' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 22
  },
  {
    dimension_key: 'familyEconomic',
    display_name: '家庭经济',
    layer: 1,
    category: 'family',
    data_type: 'enum',
    enum_options: [
      { value: 'below_avg', label: '一般' },
      { value: 'avg', label: '小康' },
      { value: 'above_avg', label: '较好' },
      { value: 'well_off', label: '富裕' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 23
  },
  {
    dimension_key: 'parentsRelationship',
    display_name: '父母关系',
    layer: 1,
    category: 'family',
    data_type: 'enum',
    enum_options: [
      { value: 'married', label: '已婚' },
      { value: 'divorced', label: '离异' },
      { value: 'remarried', label: '再婚' },
      { value: 'single_parent', label: '单亲' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 24
  },
  {
    dimension_key: 'familyValues',
    display_name: '家庭观念倾向',
    layer: 1,
    category: 'family',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 传统/开明/保守',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 25
  },
  {
    dimension_key: 'siblingCount',
    display_name: '兄弟姐妹数量',
    layer: 1,
    category: 'family',
    data_type: 'int',
    validation_rules: { min: 0, max: 10 },
    input_type: 'number',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 26
  },
  {
    dimension_key: 'birthOrder',
    display_name: '出生顺序',
    layer: 1,
    category: 'family',
    data_type: 'enum',
    enum_options: [
      { value: 'eldest', label: '老大' },
      { value: 'middle', label: '中间' },
      { value: 'youngest', label: '老幺' },
      { value: 'only', label: '独生子女' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 27
  },

  // 1.4 外形条件
  {
    dimension_key: 'height',
    display_name: '身高',
    description: '身高（cm）',
    layer: 1,
    category: 'appearance',
    data_type: 'int',
    validation_rules: { min: 140, max: 220 },
    input_type: 'number',
    placeholder: '如: 168',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 30
  },
  {
    dimension_key: 'bodyType',
    display_name: '体型',
    layer: 1,
    category: 'appearance',
    data_type: 'enum',
    enum_options: [
      { value: 'slim', label: '偏瘦' },
      { value: 'average', label: '匀称' },
      { value: 'athletic', label: '健壮' },
      { value: 'curvy', label: '丰满' },
      { value: 'plump', label: '偏胖' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 31
  },
  {
    dimension_key: 'appearance',
    display_name: '外形风格',
    layer: 1,
    category: 'appearance',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 清秀/阳光/知性/酷帅',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 32
  },
  {
    dimension_key: 'fashionStyle',
    display_name: '穿搭风格',
    layer: 1,
    category: 'appearance',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 简约/潮流/商务/休闲',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 33
  },
  {
    dimension_key: 'glasses',
    display_name: '是否戴眼镜',
    layer: 1,
    category: 'appearance',
    data_type: 'boolean',
    input_type: 'select',
    weight: 0.5,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 34
  },
  {
    dimension_key: 'distinctiveFeatures',
    display_name: '鲜明特征',
    layer: 1,
    category: 'appearance',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 梨涡、酒窝、长发',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 35
  },
  {
    dimension_key: 'healthCondition',
    display_name: '健康状况',
    layer: 1,
    category: 'appearance',
    data_type: 'enum',
    enum_options: [
      { value: 'excellent', label: '很好' },
      { value: 'good', label: '良好' },
      { value: 'fair', label: '一般' },
      { value: 'chronic_issues', label: '有慢性病' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 36
  },

  // 1.5 人生阶段
  {
    dimension_key: 'lifeStage',
    display_name: '人生阶段',
    layer: 1,
    category: 'life_stage',
    data_type: 'enum',
    enum_options: [
      { value: 'student', label: '学生' },
      { value: 'career_entry', label: '职场新人' },
      { value: 'mid_career', label: '事业发展期' },
      { value: 'senior', label: '成熟期' },
      { value: 'entrepreneur', label: '创业期' },
      { value: 'transition', label: '转型期' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 40
  },
  {
    dimension_key: 'maritalStatus',
    display_name: '婚姻状态',
    layer: 1,
    category: 'life_stage',
    data_type: 'enum',
    enum_options: [
      { value: 'single', label: '单身' },
      { value: 'divorced', label: '离异' },
      { value: 'widowed', label: '丧偶' },
      { value: 'annulled', label: '婚姻无效' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 41
  },
  {
    dimension_key: 'hasChildren',
    display_name: '是否有孩子',
    layer: 1,
    category: 'life_stage',
    data_type: 'boolean',
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 42
  },
  {
    dimension_key: 'childrenInfo',
    display_name: '孩子信息',
    layer: 1,
    category: 'life_stage',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 有1个女儿3岁',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 43
  },
  {
    dimension_key: 'housing',
    display_name: '住房情况',
    layer: 1,
    category: 'life_stage',
    data_type: 'enum',
    enum_options: [
      { value: 'rent', label: '租房' },
      { value: 'own', label: '自有住房' },
      { value: 'with_parents', label: '与父母同住' },
      { value: 'company_provided', label: '公司提供' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 44
  },
  {
    dimension_key: 'carOwnership',
    display_name: '车辆情况',
    layer: 1,
    category: 'life_stage',
    data_type: 'enum',
    enum_options: [
      { value: 'none', label: '无' },
      { value: 'own', label: '自有' },
      { value: 'shared', label: '共用' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 45
  },

  // 1.6 核心人格
  {
    dimension_key: 'mbti',
    display_name: 'MBTI类型',
    layer: 1,
    category: 'core_personality',
    data_type: 'enum',
    enum_options: [
      { value: 'INTJ', label: 'INTJ - 建筑师' },
      { value: 'INTP', label: 'INTP - 逻辑学家' },
      { value: 'ENTJ', label: 'ENTJ - 指挥官' },
      { value: 'ENTP', label: 'ENTP - 辩论家' },
      { value: 'INFJ', label: 'INFJ - 提倡者' },
      { value: 'INFP', label: 'INFP - 调停者' },
      { value: 'ENFJ', label: 'ENFJ - 主人公' },
      { value: 'ENFP', label: 'ENFP - 竞选者' },
      { value: 'ISTJ', label: 'ISTJ - 物流师' },
      { value: 'ISFJ', label: 'ISFJ - 守卫者' },
      { value: 'ESTJ', label: 'ESTJ - 总经理' },
      { value: 'ESFJ', label: 'ESFJ - 执政官' },
      { value: 'ISTP', label: 'ISTP - 鉴赏家' },
      { value: 'ISFP', label: 'ISFP - 探险家' },
      { value: 'ESTP', label: 'ESTP - 企业家' },
      { value: 'ESFP', label: 'ESFP - 表演者' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 50
  },
  {
    dimension_key: 'enneagram',
    display_name: '九型人格',
    layer: 1,
    category: 'core_personality',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 4号-自我型',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 51
  },
  {
    dimension_key: 'bigFive',
    display_name: '大五人格',
    description: '包含开放性、尽责性、外向性、宜人性、神经质五个维度',
    layer: 1,
    category: 'core_personality',
    data_type: 'object',
    input_type: 'text',
    help_text: '各维度0-100分',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 52
  },
  {
    dimension_key: 'attachmentStyle',
    display_name: '依恋类型',
    layer: 1,
    category: 'core_personality',
    data_type: 'enum',
    enum_options: [
      { value: 'secure', label: '安全型' },
      { value: 'anxious', label: '焦虑型' },
      { value: 'avoidant', label: '回避型' },
      { value: 'disorganized', label: '混乱型' },
      { value: 'fearful', label: '恐惧型' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 53
  },
  {
    dimension_key: 'coreTemperament',
    display_name: '核心气质',
    layer: 1,
    category: 'core_personality',
    data_type: 'enum',
    enum_options: [
      { value: 'melancholic', label: '抑郁质' },
      { value: 'sanguine', label: '多血质' },
      { value: 'choleric', label: '胆汁质' },
      { value: 'phlegmatic', label: '粘液质' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 54
  },

  // 1.7 价值观核心
  {
    dimension_key: 'coreValues',
    display_name: '核心价值观',
    layer: 1,
    category: 'values',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 家庭、自由、成长',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 60
  },
  {
    dimension_key: 'politicalOrientation',
    display_name: '政治倾向',
    layer: 1,
    category: 'values',
    data_type: 'enum',
    enum_options: [
      { value: 'conservative', label: '保守' },
      { value: 'moderate', label: '温和' },
      { value: 'liberal', label: '自由' },
      { value: 'apolitical', label: '不关心政治' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 61
  },
  {
    dimension_key: 'worldview',
    display_name: '世界观倾向',
    layer: 1,
    category: 'values',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 乐观/悲观/务实/理想主义',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 62
  },
  {
    dimension_key: 'moneyPhilosophy',
    display_name: '金钱观',
    layer: 1,
    category: 'values',
    data_type: 'enum',
    enum_options: [
      { value: 'frugal', label: '节俭' },
      { value: 'balanced', label: '平衡' },
      { value: 'enjoyment', label: '享受当下' },
      { value: 'investor', label: '投资导向' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 63
  },
  {
    dimension_key: 'timeOrientation',
    display_name: '时间取向',
    layer: 1,
    category: 'values',
    data_type: 'enum',
    enum_options: [
      { value: 'past_oriented', label: '怀旧型' },
      { value: 'present_oriented', label: '当下型' },
      { value: 'future_oriented', label: '未来型' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 64
  },
  {
    dimension_key: 'riskAttitude',
    display_name: '风险态度',
    layer: 1,
    category: 'values',
    data_type: 'enum',
    enum_options: [
      { value: 'risk_averse', label: '保守' },
      { value: 'moderate', label: '适中' },
      { value: 'risk_seeking', label: '激进' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 65
  },
  {
    dimension_key: 'traditionModernity',
    display_name: '传统与现代',
    layer: 1,
    category: 'values',
    data_type: 'enum',
    enum_options: [
      { value: 'traditional', label: '传统' },
      { value: 'moderate', label: '适中' },
      { value: 'modern', label: '现代' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 66
  },

  // 1.8 婚恋意向
  {
    dimension_key: 'relationshipGoal',
    display_name: '恋爱目标',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'enum',
    enum_options: [
      { value: 'serious', label: '认真恋爱' },
      { value: 'marriage', label: '以结婚为目的' },
      { value: 'casual', label: '轻松相处' },
      { value: 'exploring', label: '探索中' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 70
  },
  {
    dimension_key: 'marriageTimeline',
    display_name: '结婚时间规划',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'enum',
    enum_options: [
      { value: 'within_1y', label: '1年内' },
      { value: '1_3y', label: '1-3年' },
      { value: '3_5y', label: '3-5年' },
      { value: 'no_rush', label: '不着急' },
      { value: 'no_plan', label: '无计划' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 71
  },
  {
    dimension_key: 'childrenPlan',
    display_name: '生育计划',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'enum',
    enum_options: [
      { value: 'want_soon', label: '想要孩子' },
      { value: 'want_later', label: '以后再说' },
      { value: 'undecided', label: '未决定' },
      { value: 'no_children', label: '丁克' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 72
  },
  {
    dimension_key: 'marriageNonNegotiables',
    display_name: '婚姻底线',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 必须丁克/必须生孩子/不接受异地',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 73
  },
  {
    dimension_key: 'idealPartnerAge',
    display_name: '理想伴侣年龄范围',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 25-32岁',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 74
  },
  {
    dimension_key: 'idealPartnerHeight',
    display_name: '理想伴侣身高范围',
    layer: 1,
    category: 'relationship_intent',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 175cm以上',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 75
  },

  // 1.9 地理位置
  {
    dimension_key: 'currentCity',
    display_name: '现居城市',
    layer: 1,
    category: 'location',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 上海',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 80
  },
  {
    dimension_key: 'currentDistrict',
    display_name: '现居区县',
    layer: 1,
    category: 'location',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 浦东新区',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 81
  },
  {
    dimension_key: 'hometownCity',
    display_name: '籍贯城市',
    layer: 1,
    category: 'location',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 杭州',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 82
  },
  {
    dimension_key: 'cityStability',
    display_name: '城市稳定性',
    layer: 1,
    category: 'location',
    data_type: 'enum',
    enum_options: [
      { value: 'rooted', label: '已定居' },
      { value: 'settled', label: '稳定' },
      { value: 'mobile', label: '可流动' },
      { value: 'likely_move', label: '可能离开' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 83
  },
  {
    dimension_key: 'futureCityPlan',
    display_name: '未来城市计划',
    layer: 1,
    category: 'location',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 打算定居上海/可能回老家',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 84
  },

  // 1.10 才艺技能
  {
    dimension_key: 'languages',
    display_name: '语言能力',
    layer: 1,
    category: 'skills',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 中文、英语、日语',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 90
  },
  {
    dimension_key: 'musicalInstruments',
    display_name: '乐器',
    layer: 1,
    category: 'skills',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 钢琴、吉他',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 91
  },
  {
    dimension_key: 'artisticSkills',
    display_name: '艺术技能',
    layer: 1,
    category: 'skills',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 绘画、摄影',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 92
  },
  {
    dimension_key: 'sportsSkills',
    display_name: '运动技能',
    layer: 1,
    category: 'skills',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 游泳、网球',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 93
  },
  {
    dimension_key: 'technicalSkills',
    display_name: '技术技能',
    layer: 1,
    category: 'skills',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 编程、设计',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 94
  },
  {
    dimension_key: 'drivingLicense',
    display_name: '驾照',
    layer: 1,
    category: 'skills',
    data_type: 'enum',
    enum_options: [
      { value: 'none', label: '无' },
      { value: 'car', label: 'C照（汽车）' },
      { value: 'motorcycle', label: '摩托车驾照' },
      { value: 'both', label: '都有' }
    ],
    input_type: 'select',
    weight: 0.6,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 95
  }
]

// ==================== Layer 2: 长期特质 ====================
// 相对稳定但可能随时间缓慢变化的特质

export const layer2Dimensions: DimensionDefinition[] = [
  // 2.1 性格特质
  {
    dimension_key: 'extroversionLevel',
    display_name: '外向程度',
    description: '社交能量的来源：从外部世界还是内心世界获取能量',
    layer: 2,
    category: 'personality',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=极度内向，100=极度外向',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 100
  },
  {
    dimension_key: 'emotionalStabilityLevel',
    display_name: '情绪稳定性',
    description: '情绪波动的频率和幅度',
    layer: 2,
    category: 'personality',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=情绪波动大，100=情绪稳定',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 101
  },
  {
    dimension_key: 'opennessLevel',
    display_name: '开放性',
    description: '对新事物、新观念的接受程度',
    layer: 2,
    category: 'personality',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=保守固执，100=开放好奇',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 102
  },
  {
    dimension_key: 'conscientiousnessLevel',
    display_name: '尽责性',
    description: '做事的认真程度、计划性和自律性',
    layer: 2,
    category: 'personality',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=随性散漫，100=认真自律',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 103
  },
  {
    dimension_key: 'agreeablenessLevel',
    display_name: '宜人性',
    description: '与他人相处时的配合度和友善程度',
    layer: 2,
    category: 'personality',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=独立自我，100=友善配合',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 104
  },

  // 2.2 情感特质
  {
    dimension_key: 'emotionalExpressionStyle',
    display_name: '情感表达方式',
    layer: 2,
    category: 'emotion',
    data_type: 'enum',
    enum_options: [
      { value: 'expressive', label: '直接表达' },
      { value: 'reserved', label: '含蓄内敛' },
      { value: 'selective', label: '因人而异' },
      { value: 'avoidant', label: '回避表达' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 110
  },
  {
    dimension_key: 'empathyLevel',
    display_name: '共情能力',
    description: '理解和感受他人情绪的能力',
    layer: 2,
    category: 'emotion',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=自我中心，100=高度共情',
    weight: 1.5,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire', 'chat_analysis'],
    sort_order: 111
  },
  {
    dimension_key: 'conflictStyle',
    display_name: '冲突处理风格',
    layer: 2,
    category: 'emotion',
    data_type: 'enum',
    enum_options: [
      { value: 'confronting', label: '直面解决' },
      { value: 'compromising', label: '协商妥协' },
      { value: 'avoiding', label: '回避冷处理' },
      { value: 'accommodating', label: '迁就退让' },
      { value: 'competing', label: '争强好胜' }
    ],
    input_type: 'select',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 112
  },
  {
    dimension_key: 'stressResponse',
    display_name: '压力反应模式',
    layer: 2,
    category: 'emotion',
    data_type: 'enum',
    enum_options: [
      { value: 'seeking_support', label: '寻求支持' },
      { value: 'internalizing', label: '内化消化' },
      { value: 'distraction', label: '转移注意力' },
      { value: 'problem_solving', label: '解决问题' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 113
  },

  // 2.3 社交特质
  {
    dimension_key: 'socialEnergy',
    display_name: '社交能量',
    description: '在社交场合获得的能量程度',
    layer: 2,
    category: 'social',
    data_type: 'enum',
    enum_options: [
      { value: 'high', label: '社交达人' },
      { value: 'medium', label: '适可而止' },
      { value: 'low', label: '社交耗能' },
      { value: 'situational', label: '看情况' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 120
  },
  {
    dimension_key: 'friendshipStyle',
    display_name: '交友风格',
    layer: 2,
    category: 'social',
    data_type: 'enum',
    enum_options: [
      { value: 'quality_over_quantity', label: '求精不求多' },
      { value: 'broad_network', label: '广交朋友' },
      { value: 'selective', label: '谨慎交友' },
      { value: 'small_circle', label: '小圈子' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 121
  },
  {
    dimension_key: 'trustLevel',
    display_name: '信任倾向',
    description: '对他人的初始信任程度',
    layer: 2,
    category: 'social',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=防备心重，100=容易信任',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 122
  },
  {
    dimension_key: 'boundariesStyle',
    display_name: '边界感',
    layer: 2,
    category: 'social',
    data_type: 'enum',
    enum_options: [
      { value: 'flexible', label: '边界灵活' },
      { value: 'moderate', label: '适度边界' },
      { value: 'firm', label: '边界清晰' },
      { value: 'rigid', label: '边界严格' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 123
  },

  // 2.4 沟通特质
  {
    dimension_key: 'communicationStyle',
    display_name: '沟通风格',
    layer: 2,
    category: 'communication',
    data_type: 'enum',
    enum_options: [
      { value: 'direct', label: '直接坦率' },
      { value: 'indirect', label: '委婉含蓄' },
      { value: 'balanced', label: '因人而异' },
      { value: 'passive_aggressive', label: '消极被动' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 130
  },
  {
    dimension_key: 'humorStyle',
    display_name: '幽默风格',
    layer: 2,
    category: 'communication',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 自嘲、调侃、冷笑话',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 131
  },
  {
    dimension_key: 'listeningStyle',
    display_name: '倾听风格',
    layer: 2,
    category: 'communication',
    data_type: 'enum',
    enum_options: [
      { value: 'active_listener', label: '积极倾听' },
      { value: 'problem_solver', label: '解决问题型' },
      { value: 'empathetic', label: '共情型' },
      { value: 'distracted', label: '容易分心' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 132
  },
  {
    dimension_key: 'argumentStyle',
    display_name: '争论风格',
    layer: 2,
    category: 'communication',
    data_type: 'enum',
    enum_options: [
      { value: 'logical', label: '讲道理' },
      { value: 'emotional', label: '讲感受' },
      { value: 'avoiding', label: '避免争论' },
      { value: 'compromising', label: '求同存异' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 133
  },

  // 2.5 生活态度
  {
    dimension_key: 'lifeSatisfaction',
    display_name: '生活满意度',
    layer: 2,
    category: 'life_attitude',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=很不满意，100=非常满意',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 140
  },
  {
    dimension_key: 'workLifeBalance',
    display_name: '工作生活平衡',
    layer: 2,
    category: 'life_attitude',
    data_type: 'enum',
    enum_options: [
      { value: 'work_priority', label: '工作优先' },
      { value: 'balanced', label: '平衡' },
      { value: 'life_priority', label: '生活优先' },
      { value: 'flexible', label: '灵活调整' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 141
  },
  {
    dimension_key: 'selfImprovementOrientation',
    display_name: '自我提升倾向',
    layer: 2,
    category: 'life_attitude',
    data_type: 'enum',
    enum_options: [
      { value: 'growth_minded', label: '成长型思维' },
      { value: 'stable', label: '稳定为主' },
      { value: 'selective', label: '选择性提升' },
      { value: 'resistant', label: '安于现状' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 142
  },

  // 2.6 恋爱风格
  {
    dimension_key: 'loveLanguage',
    display_name: '爱的语言',
    description: '表达和感受爱的方式',
    layer: 2,
    category: 'love_style',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 肯定的言语、精心时刻',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 150
  },
  {
    dimension_key: 'intimacyNeeds',
    display_name: '亲密需求程度',
    layer: 2,
    category: 'love_style',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=独立自主，100=需要高亲密',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 151
  },
  {
    dimension_key: 'jealousyLevel',
    display_name: '吃醋程度',
    layer: 2,
    category: 'love_style',
    data_type: 'int',
    validation_rules: { min: 0, max: 100 },
    input_type: 'slider',
    help_text: '0=很少吃醋，100=容易吃醋',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 152
  },
  {
    dimension_key: 'commitmentStyle',
    display_name: '承诺风格',
    layer: 2,
    category: 'love_style',
    data_type: 'enum',
    enum_options: [
      { value: 'quick_commit', label: '快速投入' },
      { value: 'cautious', label: '谨慎慢热' },
      { value: 'selective', label: '因人而异' },
      { value: 'fearful', label: '害怕承诺' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 153
  },
  {
    dimension_key: 'pastRelationshipPatterns',
    display_name: '过往恋爱模式',
    layer: 2,
    category: 'love_style',
    data_type: 'string',
    input_type: 'textarea',
    placeholder: '描述过往恋爱经历中的模式或教训',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 154
  }
]

// ==================== Layer 3: 中期偏好 ====================
// 可能随情境或时间变化的偏好

export const layer3Dimensions: DimensionDefinition[] = [
  // 3.1 兴趣爱好
  {
    dimension_key: 'hobbies',
    display_name: '兴趣爱好',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 阅读、旅行、健身、摄影',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 200
  },
  {
    dimension_key: 'favoriteMusic',
    display_name: '喜欢的音乐类型',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 流行、摇滚、古典',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 201
  },
  {
    dimension_key: 'favoriteMovies',
    display_name: '喜欢的电影类型',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 科幻、爱情、悬疑',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 202
  },
  {
    dimension_key: 'favoriteBooks',
    display_name: '喜欢的书籍类型',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 小说、传记、心理学',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 203
  },
  {
    dimension_key: 'sportsPreferences',
    display_name: '运动偏好',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 跑步、游泳、瑜伽',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 204
  },
  {
    dimension_key: 'travelPreferences',
    display_name: '旅行偏好',
    layer: 3,
    category: 'interests',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 自然风光、人文历史、美食探索',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 205
  },
  {
    dimension_key: 'foodPreferences',
    display_name: '饮食偏好',
    layer: 3,
    category: 'interests',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 中餐、日料、素食',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 206
  },
  {
    dimension_key: 'petPreferences',
    display_name: '宠物偏好',
    layer: 3,
    category: 'interests',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 养猫、喜欢狗、无宠物',
    weight: 0.7,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 207
  },

  // 3.2 生活方式
  {
    dimension_key: 'wakeUpTime',
    display_name: '起床时间',
    layer: 3,
    category: 'lifestyle',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 7点左右、睡到自然醒',
    weight: 0.6,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 210
  },
  {
    dimension_key: 'sleepTime',
    display_name: '睡觉时间',
    layer: 3,
    category: 'lifestyle',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 11点左右、经常熬夜',
    weight: 0.6,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 211
  },
  {
    dimension_key: 'weekendPreferences',
    display_name: '周末偏好',
    layer: 3,
    category: 'lifestyle',
    data_type: 'enum',
    enum_options: [
      { value: 'outdoor', label: '户外活动' },
      { value: 'homebody', label: '宅家休息' },
      { value: 'social', label: '社交聚会' },
      { value: 'flexible', label: '看情况' }
    ],
    input_type: 'select',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 212
  },
  {
    dimension_key: 'exerciseFrequency',
    display_name: '运动频率',
    layer: 3,
    category: 'lifestyle',
    data_type: 'enum',
    enum_options: [
      { value: 'daily', label: '每天' },
      { value: 'often', label: '经常' },
      { value: 'occasional', label: '偶尔' },
      { value: 'rarely', label: '很少' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 213
  },
  {
    dimension_key: 'cookingHabit',
    display_name: '做饭习惯',
    layer: 3,
    category: 'lifestyle',
    data_type: 'enum',
    enum_options: [
      { value: 'love_cooking', label: '喜欢做饭' },
      { value: 'occasional', label: '偶尔做' },
      { value: 'order_out', label: '经常外卖' },
      { value: 'dont_cook', label: '不会做饭' }
    ],
    input_type: 'select',
    weight: 0.7,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 214
  },
  {
    dimension_key: 'socialMediaUsage',
    display_name: '社交媒体使用',
    layer: 3,
    category: 'lifestyle',
    data_type: 'enum',
    enum_options: [
      { value: 'heavy', label: '重度使用' },
      { value: 'moderate', label: '适度使用' },
      { value: 'light', label: '轻度使用' },
      { value: 'minimal', label: '很少使用' }
    ],
    input_type: 'select',
    weight: 0.6,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 215
  },

  // 3.3 约会偏好
  {
    dimension_key: 'idealDateType',
    display_name: '理想约会类型',
    layer: 3,
    category: 'dating',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 看电影、户外徒步、美食探店',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 220
  },
  {
    dimension_key: 'datingFrequency',
    display_name: '期望约会频率',
    layer: 3,
    category: 'dating',
    data_type: 'enum',
    enum_options: [
      { value: 'very_frequent', label: '每周多次' },
      { value: 'weekly', label: '每周一次' },
      { value: 'biweekly', label: '每两周一次' },
      { value: 'flexible', label: '看情况' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 221
  },
  {
    dimension_key: 'firstDatePreferences',
    display_name: '第一次约会偏好',
    layer: 3,
    category: 'dating',
    data_type: 'string',
    input_type: 'textarea',
    placeholder: '描述理想的第一约会场景',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 222
  },
  {
    dimension_key: 'giftPreferences',
    display_name: '礼物偏好',
    layer: 3,
    category: 'dating',
    data_type: 'string',
    input_type: 'text',
    placeholder: '如: 实用为主、浪漫惊喜、手工制作',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 223
  },

  // 3.4 沟通偏好
  {
    dimension_key: 'preferredContactMethod',
    display_name: '偏好联系方式',
    layer: 3,
    category: 'communication_pref',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 微信、电话、视频',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 230
  },
  {
    dimension_key: 'responseTimeExpectation',
    display_name: '回复时间期望',
    layer: 3,
    category: 'communication_pref',
    data_type: 'enum',
    enum_options: [
      { value: 'instant', label: '希望秒回' },
      { value: 'within_hour', label: '一小时内' },
      { value: 'within_day', label: '当天即可' },
      { value: 'flexible', label: '无所谓' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 231
  },
  {
    dimension_key: 'textingStyle',
    display_name: '发消息风格',
    layer: 3,
    category: 'communication_pref',
    data_type: 'enum',
    enum_options: [
      { value: 'frequent', label: '频繁联系' },
      { value: 'moderate', label: '适度联系' },
      { value: 'quality_over_quantity', label: '重质量' },
      { value: 'minimal', label: '必要才联系' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 232
  },
  {
    dimension_key: 'emojiUsage',
    display_name: '表情包使用',
    layer: 3,
    category: 'communication_pref',
    data_type: 'enum',
    enum_options: [
      { value: 'heavy', label: '经常用' },
      { value: 'moderate', label: '适度用' },
      { value: 'rare', label: '很少用' },
      { value: 'none', label: '不用' }
    ],
    input_type: 'select',
    weight: 0.5,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 233
  },

  // 3.5 当前关注
  {
    dimension_key: 'currentFocus',
    display_name: '当前关注点',
    layer: 3,
    category: 'current',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 事业发展、买房、学习',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 240
  },
  {
    dimension_key: 'currentChallenges',
    display_name: '当前困扰',
    layer: 3,
    category: 'current',
    data_type: 'string',
    input_type: 'textarea',
    placeholder: '描述当前面临的主要挑战或压力',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 241
  },
  {
    dimension_key: 'nearTermGoals',
    display_name: '近期目标',
    layer: 3,
    category: 'current',
    data_type: 'string',
    input_type: 'textarea',
    placeholder: '描述近期想要达成的目标',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 242
  }
]

// 导出所有维度
export const allDimensions: DimensionDefinition[] = [
  ...layer1Dimensions,
  ...layer2Dimensions,
  ...layer3Dimensions
]
