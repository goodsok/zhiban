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

// 由于文件太长，我会继续创建其他层级的数据
// 这里先导出 Layer 1，后续会添加更多
export const allDimensions: DimensionDefinition[] = [
  ...layer1Dimensions
]
