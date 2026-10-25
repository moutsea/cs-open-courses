/**
 * 大学的中文名、SERP 友好短名，以及「用户会怎么搜」的别名。
 *
 * 三个用途：
 * 1. 大学页的 H1 / 正文用全名（`universityChineseNames`）；
 * 2. 大学页的 title 用短名（`universityTitleAliases`），避免被搜索结果截断；
 * 3. 搜索词 → 内容缺口的匹配（`universitySearchAliases`），用户不会输入「卡内基梅隆大学」，
 *    他们更可能输入 cmu、卡内基梅隆。
 */

export const universityChineseNames: Record<string, string> = {
  mit: 'MIT 麻省理工学院',
  stanford: '斯坦福大学',
  'uc-berkeley': '加州大学伯克利分校',
  harvard: '哈佛大学',
  cmu: 'CMU 卡内基梅隆大学',
  princeton: '普林斯顿大学',
  caltech: '加州理工学院',
  columbia: '哥伦比亚大学',
  toronto: '多伦多大学',
  cornell: '康奈尔大学',
  michigan: '密歇根大学',
  wisconsin: '威斯康星大学麦迪逊分校',
  helsinki: '赫尔辛基大学',
  cambridge: '剑桥大学',
  'eth-zurich': '苏黎世联邦理工学院',
  'arizona-state': '亚利桑那州立大学',
  duke: '杜克大学',
  kaist: '韩国科学技术院',
  peking: '北京大学',
  ustc: '中国科学技术大学',
  nanjing: '南京大学',
  ntu: '台湾大学',
  sjtu: '上海交通大学',
  hit: '哈尔滨工业大学',
  ucas: '中国科学院大学',
  hebrew: '希伯来大学',
  amirkabir: '阿米尔卡比尔理工大学',
  syracuse: '雪城大学',
  ucsb: '加州大学圣塔芭芭拉分校',
  umass: '马萨诸塞大学',
  'oregon-state': '俄勒冈州立大学'
}

/** 页面 title 里用的短名，避免 SERP 截断。 */
export const universityTitleAliases: Record<string, { zh: string; en: string }> = {
  mit: { zh: 'MIT', en: 'MIT' },
  stanford: { zh: '斯坦福', en: 'Stanford' },
  'uc-berkeley': { zh: '伯克利', en: 'UC Berkeley' },
  harvard: { zh: '哈佛', en: 'Harvard' },
  cmu: { zh: 'CMU', en: 'CMU' },
  princeton: { zh: '普林斯顿', en: 'Princeton' },
  caltech: { zh: '加州理工', en: 'Caltech' },
  columbia: { zh: '哥伦比亚', en: 'Columbia' },
  toronto: { zh: '多伦多', en: 'U of Toronto' },
  cornell: { zh: '康奈尔', en: 'Cornell' },
  michigan: { zh: '密歇根', en: 'Michigan' },
  wisconsin: { zh: '威斯康星麦迪逊', en: 'UW-Madison' },
  helsinki: { zh: '赫尔辛基', en: 'Helsinki' },
  cambridge: { zh: '剑桥', en: 'Cambridge' },
  'eth-zurich': { zh: '苏黎世联邦理工', en: 'ETH Zurich' },
  'arizona-state': { zh: '亚利桑那州立', en: 'Arizona State' },
  duke: { zh: '杜克', en: 'Duke' },
  kaist: { zh: 'KAIST', en: 'KAIST' },
  peking: { zh: '北京大学', en: 'Peking University' },
  ustc: { zh: '中科大', en: 'USTC' },
  nanjing: { zh: '南京大学', en: 'Nanjing University' },
  ntu: { zh: '台湾大学', en: 'NTU' },
  sjtu: { zh: '上海交大', en: 'SJTU' },
  hit: { zh: '哈工大', en: 'HIT' },
  ucas: { zh: '国科大', en: 'UCAS' },
  hebrew: { zh: '希伯来大学', en: 'Hebrew University' },
  amirkabir: { zh: '阿米尔卡比尔理工', en: 'Amirkabir' },
  syracuse: { zh: '雪城大学', en: 'Syracuse' },
  ucsb: { zh: '加州大学圣塔芭芭拉', en: 'UC Santa Barbara' },
  umass: { zh: '马萨诸塞大学', en: 'UMass' },
  'oregon-state': { zh: '俄勒冈州立', en: 'Oregon State' }
}

/**
 * 用户实际会输入的说法（含英文简称与中文俗称）。
 * 只用于站内搜索词匹配，不影响页面文案。
 */
export const universitySearchAliases: Record<string, string[]> = {
  mit: ['mit', '麻省理工', '麻省理工学院'],
  stanford: ['stanford', '斯坦福'],
  'uc-berkeley': ['berkeley', 'ucb', 'uc berkeley', '伯克利', '加州伯克利'],
  harvard: ['harvard', '哈佛'],
  cmu: ['cmu', '卡内基梅隆', '卡梅'],
  princeton: ['princeton', '普林斯顿'],
  caltech: ['caltech', '加州理工'],
  columbia: ['columbia', '哥伦比亚大学'],
  toronto: ['toronto', '多伦多'],
  cornell: ['cornell', '康奈尔'],
  michigan: ['michigan', 'umich', '密歇根'],
  wisconsin: ['wisconsin', 'madison', '威斯康星'],
  helsinki: ['helsinki', '赫尔辛基'],
  cambridge: ['cambridge', '剑桥'],
  'eth-zurich': ['eth', 'ethz', '苏黎世联邦理工'],
  'arizona-state': ['asu', 'arizona state', '亚利桑那州立'],
  duke: ['duke', '杜克'],
  kaist: ['kaist', '韩国科学技术院'],
  peking: ['pku', 'peking', '北大', '北京大学'],
  ustc: ['ustc', '中科大', '中国科学技术大学'],
  nanjing: ['nju', 'nanjing', '南大', '南京大学'],
  ntu: ['ntu', '台大', '台湾大学'],
  sjtu: ['sjtu', '上交', '上海交大', '上海交通大学'],
  hit: ['hit', '哈工大'],
  ucas: ['ucas', '国科大'],
  hebrew: ['hebrew', '希伯来'],
  amirkabir: ['amirkabir', '阿米尔卡比尔'],
  syracuse: ['syracuse', '雪城'],
  ucsb: ['ucsb', '圣塔芭芭拉'],
  umass: ['umass', '马萨诸塞'],
  'oregon-state': ['oregon state', '俄勒冈州立']
}

export function universityTitleLabel(slug: string, name: string, isZh: boolean): string {
  const alias = universityTitleAliases[slug]
  if (alias) return isZh ? alias.zh : alias.en
  return isZh ? universityChineseNames[slug] || name : name.replace(/\s*\([^)]*\)\s*$/, '')
}
