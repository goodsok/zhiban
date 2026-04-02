/**
 * 维度定义数据
 * 按层级组织，每个维度包含完整的元数据定义
 */

import {
  occupationOptions,
  industryOptions,
  hobbiesOptions,
  coreValuesOptions,
  loveLanguageOptions,
  languagesOptions,
  musicalInstrumentsOptions,
  sportsSkillsOptions,
  artisticSkillsOptions,
  technicalSkillsOptions,
  appearanceStyleOptions,
  fashionStyleOptions,
  distinctiveFeaturesOptions,
  musicTypeOptions,
  movieTypeOptions,
  bookTypeOptions,
  foodPreferenceOptions,
  dateTypeOptions,
  currentFocusOptions,
  humorStyleOptions,
  marriageNonNegotiablesOptions,
  relationshipFormOptions,
  contactMethodOptions
} from './dimension-enum-options'

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
  /** 是否允许自定义输入（在选项基础上额外输入） */
  allow_custom_input?: boolean
  weight: number
  importance: 'critical' | 'important' | 'optional'
  source_allowed: string[]
  sort_order: number
  /**
   * 关系适用性
   * - short_term: 仅适用于短期关系（约会、暧昧、FWB等）
   * - long_term: 仅适用于长期关系（认真恋爱、婚姻）
   * - universal: 通用，适用于所有关系类型
   */
  relationship_applicability?: 'short_term' | 'long_term' | 'universal'
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
    enum_options: occupationOptions,
    input_type: 'select',
    placeholder: '请选择职业',
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
    enum_options: industryOptions,
    input_type: 'select',
    placeholder: '请选择行业',
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
    enum_options: [
      { value: 'only_child', label: '独生子女' },
      { value: 'older_sibling', label: '长子/长女' },
      { value: 'younger_sibling', label: '次子/次女' },
      { value: 'middle_child', label: '中间子女' },
      { value: 'youngest', label: '最小子女' },
      { value: 'twins', label: '双胞胎' },
      { value: 'single_parent', label: '单亲家庭' },
      { value: 'recombined', label: '重组家庭' }
    ],
    input_type: 'select',
    placeholder: '请选择家庭结构',
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
    enum_options: [
      { value: 'traditional', label: '传统型' },
      { value: 'moderate', label: '中庸型' },
      { value: 'open', label: '开明型' },
      { value: 'modern', label: '现代型' },
      { value: 'conservative', label: '保守型' },
      { value: 'liberal', label: '自由型' }
    ],
    input_type: 'select',
    placeholder: '请选择家庭观念倾向',
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
    data_type: 'string[]',
    enum_options: appearanceStyleOptions,
    input_type: 'multiselect',
    placeholder: '请选择外形风格',
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
    data_type: 'string[]',
    enum_options: fashionStyleOptions,
    input_type: 'multiselect',
    placeholder: '请选择穿搭风格',
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
    enum_options: [
      { value: 'true', label: '是' },
      { value: 'false', label: '否' }
    ],
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
    enum_options: distinctiveFeaturesOptions,
    input_type: 'multiselect',
    placeholder: '请选择鲜明特征',
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
    enum_options: [
      { value: 'true', label: '有孩子' },
      { value: 'false', label: '没有孩子' }
    ],
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
    description: 'MBTI是一种性格类型指标，包含16种不同类型',
    layer: 1,
    category: 'core_personality',
    data_type: 'string',
    enum_options: [
      { value: 'INTJ', label: 'INTJ建筑师' },
      { value: 'INTP', label: 'INTP逻辑学家' },
      { value: 'ENTJ', label: 'ENTJ指挥官' },
      { value: 'ENTP', label: 'ENTP辩论家' },
      { value: 'INFJ', label: 'INFJ提倡者' },
      { value: 'INFP', label: 'INFP调停者' },
      { value: 'ENFJ', label: 'ENFJ主人公' },
      { value: 'ENFP', label: 'ENFP竞选者' },
      { value: 'ISTJ', label: 'ISTJ物流师' },
      { value: 'ISFJ', label: 'ISFJ守卫者' },
      { value: 'ESTJ', label: 'ESTJ总经理' },
      { value: 'ESFJ', label: 'ESFJ执政官' },
      { value: 'ISTP', label: 'ISTP鉴赏家' },
      { value: 'ISFP', label: 'ISFP探险家' },
      { value: 'ESTP', label: 'ESTP企业家' },
      { value: 'ESFP', label: 'ESFP表演者' }
    ],
    input_type: 'select',
    placeholder: '请选择MBTI类型',
    help_text: 'I内向/E外向 | S实感/N直觉 | T思考/F情感 | J判断/P感知',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 50
  },
  {
    dimension_key: 'enneagram',
    display_name: '九型人格',
    description: '九型人格是一种性格分类系统，每种类型有不同的核心动机和行为模式',
    layer: 1,
    category: 'core_personality',
    data_type: 'string',
    enum_options: [
      { value: '1', label: '1号-完美型' },
      { value: '2', label: '2号-助人型' },
      { value: '3', label: '3号-成就型' },
      { value: '4', label: '4号-自我型' },
      { value: '5', label: '5号-理智型' },
      { value: '6', label: '6号-疑惑型' },
      { value: '7', label: '7号-活跃型' },
      { value: '8', label: '8号-领袖型' },
      { value: '9', label: '9号-和平型' }
    ],
    input_type: 'select',
    placeholder: '请选择九型人格类型',
    help_text: '1完美型:有原则、完美主义 | 2助人型:关心他人、慷慨 | 3成就型:适应力强、追求成功 | 4自我型:独特、敏感 | 5理智型:观察力强、分析型 | 6疑惑型:忠诚、谨慎 | 7活跃型:乐观、爱冒险 | 8领袖型:自信、果断 | 9和平型:温和、包容',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual', 'questionnaire'],
    sort_order: 51
  },
  {
    dimension_key: 'bigFive',
    display_name: '大五人格',
    description: '大五人格是心理学最主流的性格模型，包含五个核心维度',
    layer: 1,
    category: 'core_personality',
    data_type: 'string[]',
    enum_options: [
      { value: 'openness_high', label: '高开放性' },
      { value: 'openness_low', label: '低开放性' },
      { value: 'conscientiousness_high', label: '高尽责性' },
      { value: 'conscientiousness_low', label: '低尽责性' },
      { value: 'extraversion_high', label: '高外向性' },
      { value: 'extraversion_low', label: '低外向性' },
      { value: 'agreeableness_high', label: '高宜人性' },
      { value: 'agreeableness_low', label: '低宜人性' },
      { value: 'neuroticism_high', label: '高神经质' },
      { value: 'neuroticism_low', label: '低神经质' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择突出的性格特征',
    help_text: '开放性:好奇心/创造力 | 尽责性:自律/可靠 | 外向性:社交/热情 | 宜人性:信任/合作 | 神经质:情绪波动/敏感',
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
    enum_options: coreValuesOptions,
    input_type: 'multiselect',
    placeholder: '请选择核心价值观',
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
    data_type: 'string',
    enum_options: [
      { value: 'serious_marriage', label: '认真恋爱，以结婚为目标' },
      { value: 'serious_longterm', label: '认真恋爱，长期关系' },
      { value: 'serious_dating', label: '认真恋爱，顺其自然' },
      { value: 'casual_dating', label: '轻松约会，不急着确定关系' },
      { value: 'casual_fun', label: '轻松相处，享受当下' },
      { value: 'exploring', label: '还在探索，不确定' },
      { value: 'friendship_first', label: '先做朋友，慢慢了解' },
      { value: 'no_rush', label: '随缘不强求' }
    ],
    input_type: 'select',
    placeholder: '请选择恋爱目标',
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
    enum_options: marriageNonNegotiablesOptions,
    input_type: 'multiselect',
    placeholder: '请选择婚姻底线',
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
    enum_options: [
      { value: 'same_age', label: '同龄 ±2岁' },
      { value: 'slightly_older', label: '稍大 3-5岁' },
      { value: 'older', label: '大 5-10岁' },
      { value: 'much_older', label: '大 10岁以上' },
      { value: 'slightly_younger', label: '稍小 3-5岁' },
      { value: 'younger', label: '小 5-10岁' },
      { value: 'flexible', label: '年龄不重要' },
      { value: 'no_limit', label: '没有特别要求' }
    ],
    input_type: 'select',
    placeholder: '请选择理想年龄范围',
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
    enum_options: [
      { value: 'taller', label: '比我高' },
      { value: 'much_taller', label: '比我高10cm以上' },
      { value: 'similar', label: '身高相近 ±5cm' },
      { value: 'shorter', label: '比我矮' },
      { value: 'much_shorter', label: '比我矮10cm以上' },
      { value: 'flexible', label: '身高不重要' },
      { value: 'no_limit', label: '没有特别要求' }
    ],
    input_type: 'select',
    placeholder: '请选择理想身高范围',
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
    enum_options: [
      { value: 'settled', label: '已定居，不打算变动' },
      { value: 'likely_stay', label: '大概率留下，小概率变动' },
      { value: 'undecided', label: '还在考虑中' },
      { value: 'may_move', label: '可能去其他城市' },
      { value: 'return_hometown', label: '计划回老家发展' },
      { value: 'follow_partner', label: '愿意随伴侣迁移' },
      { value: 'abroad', label: '计划出国' },
      { value: 'flexible', label: '看机会，比较灵活' }
    ],
    input_type: 'select',
    placeholder: '请选择未来城市计划',
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
    enum_options: languagesOptions,
    input_type: 'multiselect',
    placeholder: '请选择语言能力',
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
    enum_options: musicalInstrumentsOptions,
    input_type: 'multiselect',
    placeholder: '请选择乐器',
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
    enum_options: artisticSkillsOptions,
    input_type: 'multiselect',
    placeholder: '请选择艺术技能',
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
    enum_options: sportsSkillsOptions,
    input_type: 'multiselect',
    placeholder: '请选择运动技能',
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
    enum_options: technicalSkillsOptions,
    input_type: 'multiselect',
    placeholder: '请选择技术技能',
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
    enum_options: humorStyleOptions,
    input_type: 'multiselect',
    placeholder: '请选择幽默风格',
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
    enum_options: loveLanguageOptions,
    input_type: 'multiselect',
    placeholder: '请选择爱的语言',
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
    enum_options: hobbiesOptions,
    input_type: 'multiselect',
    placeholder: '请选择兴趣爱好',
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
    enum_options: musicTypeOptions,
    input_type: 'multiselect',
    placeholder: '请选择音乐类型',
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
    enum_options: movieTypeOptions,
    input_type: 'multiselect',
    placeholder: '请选择电影类型',
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
    enum_options: bookTypeOptions,
    input_type: 'multiselect',
    placeholder: '请选择书籍类型',
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
    enum_options: sportsSkillsOptions,
    input_type: 'multiselect',
    placeholder: '请选择运动偏好',
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
    data_type: 'string[]',
    enum_options: [
      { value: 'nature', label: '自然风光' },
      { value: 'cultural', label: '人文历史' },
      { value: 'food_tour', label: '美食探索' },
      { value: 'adventure', label: '冒险探险' },
      { value: 'relaxation', label: '休闲度假' },
      { value: 'city_tour', label: '城市漫游' },
      { value: 'beach', label: '海滨沙滩' },
      { value: 'mountain', label: '登山徒步' },
      { value: 'photography', label: '摄影采风' },
      { value: 'road_trip', label: '自驾游' },
      { value: 'backpacking', label: '背包穷游' },
      { value: 'luxury', label: '豪华舒适' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择旅行偏好',
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
    enum_options: foodPreferenceOptions,
    input_type: 'multiselect',
    placeholder: '请选择饮食偏好',
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
    data_type: 'string[]',
    enum_options: [
      { value: 'cat_owner', label: '养猫' },
      { value: 'dog_owner', label: '养狗' },
      { value: 'other_pet', label: '养其他宠物' },
      { value: 'like_cats', label: '喜欢猫' },
      { value: 'like_dogs', label: '喜欢狗' },
      { value: 'like_all', label: '都喜欢' },
      { value: 'allergy', label: '宠物过敏' },
      { value: 'no_pet', label: '不养宠物' },
      { value: 'dislike', label: '不喜欢宠物' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择宠物偏好',
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
    enum_options: dateTypeOptions,
    input_type: 'multiselect',
    placeholder: '请选择约会类型',
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
    data_type: 'string[]',
    enum_options: [
      { value: 'coffee', label: '咖啡厅聊天' },
      { value: 'dinner', label: '浪漫晚餐' },
      { value: 'lunch', label: '轻松午餐' },
      { value: 'movie', label: '看电影' },
      { value: 'walk', label: '散步/公园' },
      { value: 'museum', label: '看展/博物馆' },
      { value: 'activity', label: '活动互动(如密室、桌游)' },
      { value: 'outdoor', label: '户外活动' },
      { value: 'sports', label: '运动健身' },
      { value: 'concert', label: '演出/演唱会' },
      { value: 'creative', label: 'DIY手工/陶艺' },
      { value: 'simple', label: '简单随意' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择第一次约会偏好（可自定义）',
    allow_custom_input: true,
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
    data_type: 'string[]',
    enum_options: [
      { value: 'practical', label: '实用为主' },
      { value: 'romantic', label: '浪漫惊喜' },
      { value: 'handmade', label: '手工制作' },
      { value: 'experience', label: '体验式礼物' },
      { value: 'luxury', label: '奢侈品' },
      { value: 'tech', label: '科技数码' },
      { value: 'books', label: '书籍知识' },
      { value: 'food', label: '美食零食' },
      { value: 'flowers', label: '鲜花绿植' },
      { value: 'jewelry', label: '首饰饰品' },
      { value: 'fashion', label: '服饰美妆' },
      { value: 'collectibles', label: '收藏品' },
      { value: 'no_preference', label: '没有特别偏好' },
      { value: 'no_gift', label: '不喜欢收礼物' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择礼物偏好',
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
    enum_options: contactMethodOptions,
    input_type: 'multiselect',
    placeholder: '请选择联系方式',
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
    enum_options: currentFocusOptions,
    input_type: 'multiselect',
    placeholder: '请选择当前关注点',
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

// ==================== Layer 4: 短期关系属性 ====================
// 适用于约会对象、暧昧对象、FWB等短期关系场景的维度

export const layer4Dimensions: DimensionDefinition[] = [
  // ==================== 4.1 性观念与亲密 ====================
  {
    dimension_key: 'sexualAttitude',
    display_name: '性观念',
    description: '对性和身体亲密的态度与价值观',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'conservative', label: '传统保守' },
      { value: 'moderate', label: '开放适中' },
      { value: 'liberal', label: '开放自由' },
      { value: 'casual', label: '随意开放' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 300,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'physicalIntimacyTimeline',
    display_name: '身体亲密时间线',
    description: '对发生身体亲密的时间预期',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'first_date', label: '第一次约会即可' },
      { value: 'few_dates', label: '几次约会后' },
      { value: 'after_trust', label: '建立信任后' },
      { value: 'after_commitment', label: '确定关系后' },
      { value: 'after_marriage', label: '婚后' }
    ],
    input_type: 'select',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 301,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'sexualExperienceLevel',
    display_name: '性经验丰富度',
    description: '过往性经验的丰富程度',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'inexperienced', label: '经验很少' },
      { value: 'limited', label: '经验有限' },
      { value: 'moderate', label: '经验适中' },
      { value: 'experienced', label: '经验丰富' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 302,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'safeSexAttitude',
    display_name: '安全性行为态度',
    description: '对安全性行为的重视程度',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'very_strict', label: '非常严格' },
      { value: 'careful', label: '比较谨慎' },
      { value: 'flexible', label: '灵活视情况' },
      { value: 'casual', label: '不太在意' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 303,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'sexualCompatibilityImportance',
    display_name: '性契合度重要性',
    description: '认为性契合在关系中的重要程度',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'not_important', label: '不重要' },
      { value: 'somewhat_important', label: '有一定重要性' },
      { value: 'important', label: '比较重要' },
      { value: 'very_important', label: '非常重要' },
      { value: 'crucial', label: '决定性因素' }
    ],
    input_type: 'select',
    placeholder: '请选择性契合度重要性',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 304,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'physicalAffectionStyle',
    display_name: '肢体亲密度偏好',
    description: '在公开场合和私下对身体接触的舒适度',
    layer: 4,
    category: 'sexual_intimacy',
    data_type: 'enum',
    enum_options: [
      { value: 'very_affectionate', label: '非常喜欢肢体接触' },
      { value: 'moderate', label: '适度亲昵' },
      { value: 'private_only', label: '私下亲密' },
      { value: 'reserved', label: '比较含蓄' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 305,
    relationship_applicability: 'universal'
  },

  // ==================== 4.2 关系形式偏好 ====================
  {
    dimension_key: 'relationshipFormPreference',
    display_name: '关系形式偏好',
    description: '对关系形式的接受和偏好',
    layer: 4,
    category: 'relationship_form',
    data_type: 'string[]',
    enum_options: relationshipFormOptions,
    input_type: 'multiselect',
    placeholder: '请选择关系形式偏好',
    weight: 1.4,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 310,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'exclusivityExpectation',
    display_name: '独占性期望',
    description: '对关系排他性的期望程度',
    layer: 4,
    category: 'relationship_form',
    data_type: 'enum',
    enum_options: [
      { value: 'strictly_exclusive', label: '必须排他' },
      { value: 'prefer_exclusive', label: '偏好排他' },
      { value: 'flexible', label: '可以协商' },
      { value: 'open_acceptable', label: '接受开放' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 311,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'labelingPreference',
    display_name: '关系标签化偏好',
    description: '对给关系贴标签（如男女朋友）的态度',
    layer: 4,
    category: 'relationship_form',
    data_type: 'enum',
    enum_options: [
      { value: 'need_label', label: '需要明确标签' },
      { value: 'prefer_label', label: '偏好有标签' },
      { value: 'flexible', label: '标签不重要' },
      { value: 'avoid_label', label: '不想贴标签' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 312,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'casualDatingAcceptance',
    display_name: '随意约会接受度',
    description: '对没有长期承诺的约会关系的态度',
    layer: 4,
    category: 'relationship_form',
    data_type: 'enum',
    enum_options: [
      { value: 'prefer_casual', label: '偏好随意约会' },
      { value: 'accept', label: '可以接受' },
      { value: 'hesitant', label: '有些犹豫' },
      { value: 'reject', label: '不接受' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 313,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'fwbAcceptance',
    display_name: '朋友变恋人接受度',
    description: '对从朋友发展为亲密关系的态度',
    layer: 4,
    category: 'relationship_form',
    data_type: 'enum',
    enum_options: [
      { value: 'open_to_it', label: '可以接受' },
      { value: 'case_by_case', label: '视情况而定' },
      { value: 'prefer_separate', label: '朋友恋人分开' },
      { value: 'uncomfortable', label: '不太舒服' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 314,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'multiplePartnerAcceptance',
    display_name: '多伴侣接受度',
    description: '对同时与多人约会或保持关系的态度',
    layer: 4,
    category: 'relationship_form',
    data_type: 'enum',
    enum_options: [
      { value: 'open_to_it', label: '可以接受' },
      { value: 'with_transparency', label: '坦诚前提下可接受' },
      { value: 'case_by_case', label: '视情况而定' },
      { value: 'not_acceptable', label: '不能接受' }
    ],
    input_type: 'select',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 315,
    relationship_applicability: 'short_term'
  },

  // ==================== 4.3 情感投入与边界 ====================
  {
    dimension_key: 'emotionalBoundaryStyle',
    display_name: '情感边界设定',
    description: '在关系中对情感投入的边界控制方式',
    layer: 4,
    category: 'emotional_investment',
    data_type: 'enum',
    enum_options: [
      { value: 'all_in', label: '全情投入' },
      { value: 'gradual', label: '逐步开放' },
      { value: 'guarded', label: '有保留' },
      { value: 'compartmentalized', label: '情感隔离' }
    ],
    input_type: 'select',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 320,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'emotionalInvestmentSpeed',
    display_name: '情感投入速度',
    description: '在感情中投入情感的快慢节奏',
    layer: 4,
    category: 'emotional_investment',
    data_type: 'enum',
    enum_options: [
      { value: 'very_fast', label: '很快投入' },
      { value: 'fast', label: '比较快' },
      { value: 'moderate', label: '循序渐进' },
      { value: 'slow', label: '慢热型' },
      { value: 'very_slow', label: '非常慢热' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 321,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'emotionalDetachmentAbility',
    display_name: '情感抽离能力',
    description: '在关系结束后或需要时抽离情感的能力',
    layer: 4,
    category: 'emotional_investment',
    data_type: 'enum',
    enum_options: [
      { value: 'very_difficult', label: '很难抽离' },
      { value: 'difficult', label: '比较困难' },
      { value: 'moderate', label: '一般' },
      { value: 'easy', label: '比较容易' },
      { value: 'very_easy', label: '很容易抽离' }
    ],
    input_type: 'select',
    placeholder: '请选择情感抽离能力',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 322,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'feelingsExpressionTiming',
    display_name: '表达感觉的时机',
    description: '多久之后会表达喜欢或爱的感觉',
    layer: 4,
    category: 'emotional_investment',
    data_type: 'enum',
    enum_options: [
      { value: 'early', label: '很早就说' },
      { value: 'when_sure', label: '确定后说' },
      { value: 'wait_for_partner', label: '等对方先说' },
      { value: 'rarely', label: '很少表达' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 323,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'emotionalAvailabilityLevel',
    display_name: '情感可用性',
    description: '当前能够投入感情的程度',
    layer: 4,
    category: 'emotional_investment',
    data_type: 'enum',
    enum_options: [
      { value: 'fully_available', label: '完全可用' },
      { value: 'mostly_available', label: '大部分可用' },
      { value: 'partially_available', label: '部分可用' },
      { value: 'limited', label: '情感受限' },
      { value: 'unavailable', label: '暂时不可用' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 324,
    relationship_applicability: 'universal'
  },

  // ==================== 4.4 时间可用性 ====================
  {
    dimension_key: 'availabilityForDating',
    display_name: '恋爱时间可用性',
    description: '当前可用于恋爱的时间和精力',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'fully_available', label: '充分可用' },
      { value: 'mostly_available', label: '大部分可用' },
      { value: 'limited', label: '时间有限' },
      { value: 'irregular', label: '时间不规律' },
      { value: 'mostly_unavailable', label: '很少有时间' }
    ],
    input_type: 'select',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 330,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'meetingFrequencyExpectation',
    display_name: '见面频率期望',
    description: '期望与约会对象见面的频率',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'daily', label: '每天都见' },
      { value: 'few_times_week', label: '每周几次' },
      { value: 'weekly', label: '每周一次' },
      { value: 'biweekly', label: '每两周一次' },
      { value: 'flexible', label: '灵活安排' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 331,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'responseTimePreference',
    display_name: '回复消息偏好',
    description: '自己回复消息的习惯速度',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'instant', label: '基本秒回' },
      { value: 'within_hour', label: '一小时内' },
      { value: 'within_day', label: '当天回复' },
      { value: 'when_available', label: '有空才回' },
      { value: 'unpredictable', label: '不太稳定' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 332,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'schedulingFlexibility',
    display_name: '日程安排灵活性',
    description: '临时约会的可接受程度',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'very_flexible', label: '非常灵活' },
      { value: 'somewhat_flexible', label: '比较灵活' },
      { value: 'needs_notice', label: '需要提前约' },
      { value: 'strict_schedule', label: '日程固定' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 333,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'longDistanceAcceptance',
    display_name: '异地恋接受度',
    description: '对异地关系的接受程度',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'open_to_it', label: '可以接受' },
      { value: 'with_end_date', label: '有结束日期可以' },
      { value: 'hesitant', label: '有些犹豫' },
      { value: 'not_acceptable', label: '不接受' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 334,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'travelWillingness',
    display_name: '见面出行意愿',
    description: '为了见面愿意付出的出行代价',
    layer: 4,
    category: 'time_availability',
    data_type: 'enum',
    enum_options: [
      { value: 'very_willing', label: '愿意长途奔波' },
      { value: 'willing', label: '可以跨城市' },
      { value: 'moderate', label: '同城内可以' },
      { value: 'limited', label: '附近最好' },
      { value: 'prefer_close', label: '只想见附近的' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 335,
    relationship_applicability: 'short_term'
  },

  // ==================== 4.5 隐私与公开 ====================
  {
    dimension_key: 'privacyProtectionLevel',
    display_name: '隐私保护倾向',
    description: '在关系中对隐私的重视程度',
    layer: 4,
    category: 'privacy_public',
    data_type: 'enum',
    enum_options: [
      { value: 'very_open', label: '非常开放' },
      { value: 'selective', label: '选择性开放' },
      { value: 'compartmentalized', label: '严格区隔' },
      { value: 'very_private', label: '高度保密' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 340,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'socialMediaPublicStatus',
    display_name: '社交媒体公开偏好',
    description: '是否愿意在社交媒体上公开关系状态',
    layer: 4,
    category: 'privacy_public',
    data_type: 'enum',
    enum_options: [
      { value: 'like_to_share', label: '喜欢分享' },
      { value: 'okay_to_post', label: '可以发' },
      { value: 'keep_private', label: '保持私密' },
      { value: 'avoid_completely', label: '完全避免' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 341,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'friendsIntroductionTiming',
    display_name: '介绍给朋友时机',
    description: '多久后会介绍约会对象给朋友认识',
    layer: 4,
    category: 'privacy_public',
    data_type: 'enum',
    enum_options: [
      { value: 'early', label: '很早就介绍' },
      { value: 'after_stable', label: '稳定后介绍' },
      { value: 'after_commitment', label: '确定关系后' },
      { value: 'hesitant', label: '比较犹豫' },
      { value: 'prefer_not', label: '不想介绍' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 342,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'familyIntroductionTiming',
    display_name: '介绍给家人时机',
    description: '多久后会介绍约会对象给家人认识',
    layer: 4,
    category: 'privacy_public',
    data_type: 'enum',
    enum_options: [
      { value: 'early', label: '比较早介绍' },
      { value: 'after_serious', label: '认真后介绍' },
      { value: 'after_commitment', label: '确定关系后' },
      { value: 'before_marriage', label: '谈婚论嫁时' },
      { value: 'hesitant', label: '比较犹豫' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 343,
    relationship_applicability: 'long_term'
  },
  {
    dimension_key: 'phonePrivacyBoundary',
    display_name: '手机隐私边界',
    description: '对伴侣使用自己手机的态度',
    layer: 4,
    category: 'privacy_public',
    data_type: 'enum',
    enum_options: [
      { value: 'fully_open', label: '完全开放' },
      { value: 'mostly_open', label: '大部分开放' },
      { value: 'selective', label: '选择性开放' },
      { value: 'private', label: '保持私密' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 344,
    relationship_applicability: 'short_term'
  },

  // ==================== 4.6 短期关系模式 ====================
  {
    dimension_key: 'shortTermRelationshipExperience',
    display_name: '短期关系经历',
    description: '过往短期关系的经历情况',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'extensive', label: '经历丰富' },
      { value: 'some', label: '有一些经历' },
      { value: 'limited', label: '经历有限' },
      { value: 'none', label: '没有经历' }
    ],
    input_type: 'select',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 350,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'typicalRelationshipDuration',
    display_name: '典型关系持续时长',
    description: '过往恋爱关系通常维持的时间',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'weeks', label: '几周' },
      { value: 'months', label: '几个月' },
      { value: 'half_year', label: '半年左右' },
      { value: 'year_plus', label: '一年以上' },
      { value: 'varies', label: '差异很大' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 351,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'relationshipEndingStyle',
    display_name: '关系结束风格',
    description: '通常如何结束一段关系',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'direct_talk', label: '直接沟通' },
      { value: 'gradual_distance', label: '逐渐疏远' },
      { value: 'ghosting', label: '消失断联' },
      { value: 'mutual_discussion', label: '协商结束' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 352,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'postBreakupContactAttitude',
    display_name: '分手后联系态度',
    description: '对分手后保持联系的态度',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'stay_friends', label: '可以做朋友' },
      { value: 'casual_contact', label: '偶尔联系' },
      { value: 'no_contact', label: '不再联系' },
      { value: 'case_by_case', label: '视情况而定' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 353,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'reboundRelationshipAttitude',
    display_name: '反弹关系态度',
    description: '对分手后快速开始新关系的态度',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'quick_to_date', label: '很快开始新关系' },
      { value: 'takes_time', label: '需要时间恢复' },
      { value: 'depends', label: '看情况' },
      { value: 'avoids', label: '避免反弹关系' }
    ],
    input_type: 'select',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 354,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'datingMultiplePeopleStyle',
    display_name: '多人约会风格',
    description: '同时与多人约会时的处理方式',
    layer: 4,
    category: 'short_term_patterns',
    data_type: 'enum',
    enum_options: [
      { value: 'transparent', label: '坦诚告知' },
      { value: 'dont_ask_dont_tell', label: '不问不说' },
      { value: 'exclusive_focus', label: '一次只专注一人' },
      { value: 'not_applicable', label: '不适用' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 355,
    relationship_applicability: 'short_term'
  },

  // ==================== 4.7 约会节奏与信号 ====================
  {
    dimension_key: 'datingPacePreference',
    display_name: '约会节奏偏好',
    description: '希望关系发展的快慢节奏',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'enum',
    enum_options: [
      { value: 'very_fast', label: '快速发展' },
      { value: 'fast', label: '比较快' },
      { value: 'moderate', label: '适中节奏' },
      { value: 'slow', label: '慢慢来' },
      { value: 'very_slow', label: '非常慢' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 360,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'initiativeStyle',
    display_name: '主动程度',
    description: '在约会中主动发起的倾向',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'enum',
    enum_options: [
      { value: 'very_initiative', label: '非常主动' },
      { value: 'initiative', label: '比较主动' },
      { value: 'balanced', label: '有来有往' },
      { value: 'passive', label: '比较被动' },
      { value: 'very_passive', label: '非常被动' }
    ],
    input_type: 'select',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 361,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'signalSensitivity',
    display_name: '信号敏感度',
    description: '对对方释放的约会信号的敏感程度',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'enum',
    enum_options: [
      { value: 'very_sensitive', label: '非常敏感' },
      { value: 'sensitive', label: '比较敏感' },
      { value: 'moderate', label: '一般' },
      { value: 'oblivious', label: '不太敏感' },
      { value: 'clueless', label: '完全不懂' }
    ],
    input_type: 'select',
    weight: 0.9,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 362,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'gamesPlayingAttitude',
    display_name: '恋爱游戏态度',
    description: '对"欲擒故纵"等约会策略的态度',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'enum',
    enum_options: [
      { value: 'plays_games', label: '会玩套路' },
      { value: 'sometimes', label: '偶尔为之' },
      { value: 'straightforward', label: '直接坦诚' },
      { value: 'hates_games', label: '讨厌套路' }
    ],
    input_type: 'select',
    weight: 1.0,
    importance: 'optional',
    source_allowed: ['manual'],
    sort_order: 363,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'flirtingStyle',
    display_name: '调情风格',
    description: '表达兴趣和吸引力的方式',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'string[]',
    input_type: 'multiselect',
    placeholder: '如: 言语挑逗、肢体接触、眼神交流、送礼物',
    weight: 0.8,
    importance: 'optional',
    source_allowed: ['manual', 'chat_analysis'],
    sort_order: 364,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'dealbreakerList',
    display_name: '约会底线清单',
    description: '绝对不能接受的约会对象特质',
    layer: 4,
    category: 'dating_dynamics',
    data_type: 'string[]',
    enum_options: [
      { value: 'smoking', label: '吸烟' },
      { value: 'heavy_drinking', label: '酗酒' },
      { value: 'gambling', label: '赌博' },
      { value: 'disrespectful', label: '不尊重人' },
      { value: 'lying', label: '撒谎' },
      { value: 'cheating', label: '出轨史' },
      { value: 'violence', label: '暴力倾向' },
      { value: 'control_freak', label: '控制欲强' },
      { value: 'jealousy', label: '嫉妒心重' },
      { value: 'irresponsible', label: '不负责任' },
      { value: 'mama_boy', label: '妈宝男/女' },
      { value: 'bad_hygiene', label: '卫生习惯差' },
      { value: 'no_ambition', label: '没有上进心' },
      { value: 'stingy', label: '过于吝啬' },
      { value: 'lazy', label: '懒惰' },
      { value: 'selfish', label: '自私' },
      { value: 'negative', label: '负能量' },
      { value: 'bad_temper', label: '脾气暴躁' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择约会底线',
    weight: 1.3,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 365,
    relationship_applicability: 'universal'
  },

  // ==================== 4.8 生活状态 ====================
  {
    dimension_key: 'currentDatingStatus',
    display_name: '当前约会状态',
    description: '目前是否在与其他人约会',
    layer: 4,
    category: 'current_status',
    data_type: 'enum',
    enum_options: [
      { value: 'single', label: '单身，未约会' },
      { value: 'casually_dating', label: '随意约会中' },
      { value: 'seeing_someone', label: '在接触某人' },
      { value: 'in_relationship', label: '恋爱中' },
      { value: 'complicated', label: '关系复杂' }
    ],
    input_type: 'select',
    weight: 1.5,
    importance: 'critical',
    source_allowed: ['manual'],
    sort_order: 370,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'readinessForRelationship',
    display_name: '恋爱准备度',
    description: '心理和现实层面准备好进入关系的程度',
    layer: 4,
    category: 'current_status',
    data_type: 'enum',
    enum_options: [
      { value: 'not_ready', label: '完全没准备好' },
      { value: 'considering', label: '开始考虑' },
      { value: 'somewhat_ready', label: '有些准备' },
      { value: 'mostly_ready', label: '基本准备好' },
      { value: 'fully_ready', label: '完全准备好了' }
    ],
    input_type: 'select',
    placeholder: '请选择恋爱准备度',
    weight: 1.4,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 371,
    relationship_applicability: 'universal'
  },
  {
    dimension_key: 'recentBreakupStatus',
    display_name: '近期分手状态',
    description: '最近是否刚结束一段关系',
    layer: 4,
    category: 'current_status',
    data_type: 'enum',
    enum_options: [
      { value: 'no_recent_breakup', label: '近期没有' },
      { value: 'within_month', label: '一个月内' },
      { value: 'within_three_months', label: '三个月内' },
      { value: 'within_six_months', label: '半年内' },
      { value: 'still_healing', label: '还在疗伤' }
    ],
    input_type: 'select',
    weight: 1.2,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 372,
    relationship_applicability: 'short_term'
  },
  {
    dimension_key: 'lifePriorityRanking',
    display_name: '生活优先级排序',
    description: '当前生活中各项事务的优先级，可拖拽调整顺序',
    layer: 4,
    category: 'current_status',
    data_type: 'string[]',
    enum_options: [
      { value: 'career', label: '事业' },
      { value: 'education', label: '学业' },
      { value: 'relationship', label: '恋爱' },
      { value: 'family', label: '家庭' },
      { value: 'self_growth', label: '自我成长' },
      { value: 'health', label: '健康' },
      { value: 'social', label: '社交' },
      { value: 'hobbies', label: '兴趣爱好' },
      { value: 'finance', label: '财务' },
      { value: 'leisure', label: '休闲娱乐' }
    ],
    input_type: 'multiselect',
    placeholder: '请选择并排序生活优先级',
    weight: 1.1,
    importance: 'important',
    source_allowed: ['manual'],
    sort_order: 373,
    relationship_applicability: 'universal'
  }
]

// 导出所有维度
export const allDimensions: DimensionDefinition[] = [
  ...layer1Dimensions,
  ...layer2Dimensions,
  ...layer3Dimensions,
  ...layer4Dimensions
]
