/**
 * 工程设计费计算标准
 *
 * 内置口径：仅「全国」——计价格〔2002〕10 号《工程勘察设计收费管理规定》及所附《工程设计收费标准》
 *   · 第 7 章 建筑市政工程设计（表 7.2-1 阶段工作量比例、表 7.3-1 ~ 7.3-4 工程复杂程度）
 *   · 附表一 工程设计收费基价表（18 档，封顶 1.6%）
 *   · 附表二 第 6 类 建筑市政工程 专业调整系数（0.8 / 1.0 / 1.1 三档）
 *
 * 扩展方式：不再内置省级口径。各地的基价表与国家表均为固定倍数关系
 * （如湖南 ×1.20、广东 ×0.85、黑龙江 ×1.25/1.20/1.15），
 * 因此用户在界面上通过「+ 新增自定义省份」填「名称 + 基价倍数 + 封顶费率」即可扩展，
 * 详见 `DESIGN_ARCHIVED_PROVINCES` 中已归档的省级参数。
 *
 * 统一公式：
 *   基本设计收费 = 工程设计收费基价 × 专业调整系数 × 工程复杂程度调整系数 × 修正（附加）调整系数 × 计费模式系数
 *   设计收费 = 基本设计收费 + 其他设计收费
 *
 * 修正（附加）调整系数合并规则（计价格〔2002〕10 号 1.0.9）：
 *   两个及以上修正系数不能连乘 → 「各系数之和 − 系数个数 + 1」
 */

// ==========================================
// 类型定义
// ==========================================

export interface DesignComplexityLevel {
  key: string;
  name: string;
  factor: number;
  desc?: string;
}

/** 修正（附加）调整系数选项；group 相同的项互斥 */
export interface DesignFactorOption {
  key: string;
  name: string;
  factor: number;
  /** 同组互斥 */
  group?: string;
  /** 系数可手工调整 */
  editable?: boolean;
  /** 可调范围 [min, max] */
  range?: [number, number];
  note?: string;
  /** 计费额口径特别提示（如弱电系统 / 室内装修 / 特殊声学装修以各自的设计概算为计费额） */
  billingNote?: string;
}

export interface DesignOtherFeeOption {
  key: string;
  name: string;
  /** 占基本设计收费的比例（0.05 = 5%） */
  ratio: number;
  /** 比例可手工调整 */
  editable?: boolean;
  note?: string;
}

export interface DesignStandard {
  key: string;
  name: string;
  /** 报告标题中的标准名，如「湖南省标准」 */
  label: string;
  /** 收费标准依据（报告第 7 行） */
  source: string;
  /** 计费额档位（万元） */
  axis: number[];
  /** 对应收费基价（万元） */
  prices: number[];
  /** 计费额超过末档时的封顶费率（%） */
  capRate: number;
  /** 档位标签（报告第 8 行） */
  tierLabels: string[];
  /** 工程复杂程度等级 */
  complexity: DesignComplexityLevel[];
  /** 修正（附加）调整系数选项 */
  additionalFactors: DesignFactorOption[];
  /** 其他设计收费选项 */
  otherFees: DesignOtherFeeOption[];
  remark: string;
}

/** 报告中的「计费额」口径 */
export const DESIGN_BILLING_BASE_LABEL =
  '建筑安装工程费 + 设备与工器具购置费 + 联合试运转费';

/** 计费额说明 */
export const DESIGN_BILLING_BASE_HINT =
  '按经过批准的建设项目初步设计概算计取（无概算时按可研批复的投资估算额）';

/** 向导步骤 */
export const DESIGN_STEPS = [
  '1. 测算省份',
  '2. 工程类别',
  '3. 计费额',
  '4. 阶段与调整系数',
  '5. 测算报告',
];

/** 计费模式（替代型，不参与修正系数合并） */
export const DESIGN_MODES = [
  { key: 'new', name: '新建项目', factor: 1 },
  { key: 'standard_reuse', name: '采用标准设计或复用设计（同类新建项目基本设计收费的 30%）', factor: 0.3 },
  { key: 'new_foundation', name: '需要重新进行基础设计（同类新建项目基本设计收费的 40%）', factor: 0.4 },
  { key: 'partial_amend', name: '对原设计做局部修改（同类新建项目基本设计收费的 40%~80%）', factor: 0.6 },
];

// ==========================================
// 第 7 章 建筑市政工程设计 —— 工程类别 / 阶段工作量比例表
// 依据：计价格〔2002〕10 号《工程设计收费标准》
//   · 附表二 第 6 类 建筑市政工程 专业调整系数（0.8 / 1.0 / 1.1）
//   · 表 7.2-1 建筑市政工程各阶段工作量比例表
//   · 工程复杂程度调整系数（表 7.3-1 ~ 7.3-4 统一）：Ⅰ级 0.85 / Ⅱ级 1.00 / Ⅲ级 1.15
// ==========================================

/**
 * 第 7 章工程类别。
 * 按《计价格〔2002〕10 号 附表二》第 6 类「建筑市政工程」的专业调整系数分为三档：
 *   邮政工艺工程 0.8 ｜ 建筑、市政、电信工程 1.0 ｜ 人防、园林绿化、广电工艺工程 1.1
 * 每个类别均适用Ⅰ / Ⅱ / Ⅲ 三个工程复杂程度等级（0.85 / 1.00 / 1.15），无需另选复杂程度表。
 */
export interface DesignCategory {
  key: string;
  name: string;
  /** 专业调整系数（附表二 第 6 类 建筑市政工程） */
  professionFactor: number;
  /** 各类别默认选用的表 7.2-1 工程类型（按复杂程度等级键） */
  defaultPhaseKeys: { c1: string; c2: string; c3: string; c4?: string };
  note?: string;
}

export const DESIGN_CATEGORIES: DesignCategory[] = [
  {
    key: 'cat-postal',
    name: '邮政工艺工程',
    professionFactor: 0.8,
    defaultPhaseKeys: {
      c1: 'broadcast-postal',
      c2: 'broadcast-postal',
      c3: 'broadcast-postal',
      c4: 'broadcast-postal',
    },
  },
  {
    key: 'cat-building',
    name: '建筑、市政、电信工程',
    professionFactor: 1.0,
    defaultPhaseKeys: { c1: 'bld-c1', c2: 'bld-c2', c3: 'bld-c3', c4: 'bld-c3' },
  },
  {
    key: 'cat-civil-garden-broadcast',
    name: '人防、园林绿化、广电工艺工程',
    professionFactor: 1.1,
    defaultPhaseKeys: { c1: 'garden-12', c2: 'garden-12', c3: 'garden-3', c4: 'garden-3' },
  },
];

/** 自定义工程类别（手动输入专业系数）下拉的取值标记，与 App.tsx 的 CATEGORY_CUSTOM_VALUE 一致 */
export const DESIGN_CUSTOM_CATEGORY_KEY = '__CUSTOM__';

/** 表 7.2-1 建筑市政工程各阶段工作量比例表 —— 单行（比例均按 100% 合计） */
export interface DesignPhaseRow {
  key: string;
  /** 工程类型名称（表中行名） */
  name: string;
  /** 方案设计（%） */
  p1: number;
  /** 初步设计（%） */
  p2: number;
  /** 施工图设计（%） */
  p3: number;
  /** 适用的工程类别键 */
  categories: string[];
  /** 适用的复杂程度等级键 */
  levels: string[];
}

const ALL_LEVELS = ['c1', 'c2', 'c3', 'c4'];
const BLD = ['cat-building', DESIGN_CUSTOM_CATEGORY_KEY];
const CGB = ['cat-civil-garden-broadcast', DESIGN_CUSTOM_CATEGORY_KEY];

export const DESIGN_PHASE_ROWS: DesignPhaseRow[] = [
  { key: 'bld-c1', name: '建筑与室外工程 Ⅰ级', p1: 10, p2: 30, p3: 60, categories: BLD, levels: ['c1'] },
  { key: 'bld-c2', name: '建筑与室外工程 Ⅱ级', p1: 15, p2: 30, p3: 55, categories: BLD, levels: ['c2'] },
  { key: 'bld-c3', name: '建筑与室外工程 Ⅲ级', p1: 20, p2: 30, p3: 50, categories: BLD, levels: ['c3', 'c4'] },
  { key: 'res-district', name: '住宅小区（组团）工程', p1: 25, p2: 30, p3: 45, categories: BLD, levels: ALL_LEVELS },
  { key: 'residential', name: '住宅工程', p1: 25, p2: 0, p3: 75, categories: BLD, levels: ALL_LEVELS },
  { key: 'historic', name: '古建筑、保护性建筑工程', p1: 30, p2: 20, p3: 50, categories: BLD, levels: ALL_LEVELS },
  { key: 'weak-current', name: '智能建筑弱电系统工程', p1: 0, p2: 40, p3: 60, categories: BLD, levels: ALL_LEVELS },
  { key: 'interior', name: '室内装修工程', p1: 50, p2: 0, p3: 50, categories: BLD, levels: ALL_LEVELS },
  { key: 'municipal-12', name: '市政公用工程 Ⅰ、Ⅱ级', p1: 0, p2: 40, p3: 60, categories: BLD, levels: ['c1', 'c2'] },
  { key: 'municipal-3', name: '市政公用工程 Ⅲ级', p1: 0, p2: 50, p3: 50, categories: BLD, levels: ['c3', 'c4'] },
  { key: 'telecom', name: '电信工程', p1: 0, p2: 60, p3: 40, categories: BLD, levels: ALL_LEVELS },
  { key: 'civil-defense', name: '人防工程', p1: 10, p2: 40, p3: 50, categories: CGB, levels: ALL_LEVELS },
  { key: 'garden-12', name: '园林绿化工程 Ⅰ、Ⅱ级', p1: 30, p2: 0, p3: 70, categories: CGB, levels: ['c1', 'c2'] },
  { key: 'garden-3', name: '园林绿化工程 Ⅲ级', p1: 30, p2: 20, p3: 50, categories: CGB, levels: ['c3', 'c4'] },
  {
    key: 'broadcast-postal',
    name: '广播电视、邮政工程工艺部分',
    p1: 0,
    p2: 40,
    p3: 60,
    categories: ['cat-civil-garden-broadcast', 'cat-postal', DESIGN_CUSTOM_CATEGORY_KEY],
    levels: ALL_LEVELS,
  },
];

/** 按「工程类别 + 复杂程度等级」筛选可用的表 7.2-1 工程类型行 */
export const getDesignPhaseRows = (categoryKey: string, levelKey: string): DesignPhaseRow[] =>
  DESIGN_PHASE_ROWS.filter((r) => r.categories.includes(categoryKey) && r.levels.includes(levelKey));

// ==========================================
// 公共基价表（计价格〔2002〕10号 附表一）
// ==========================================

const AXIS_NAT = [200, 500, 1000, 3000, 5000, 8000, 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000, 2000000];
const PRICES_NAT = [9.0, 20.9, 38.8, 103.8, 163.9, 249.6, 304.8, 566.8, 1054.0, 1515.2, 1960.1, 2393.4, 4450.8, 8276.7, 11897.5, 15391.4, 18793.8, 34948.9];

/** 国家标准计费额档位（万元），供自定义省份预览与逐档编辑使用 */
export const DESIGN_NAT_AXIS = AXIS_NAT;
/** 国家标准收费基价（万元） */
export const DESIGN_NAT_PRICES = PRICES_NAT;

/** 全国标准封顶费率（计费额 > 2,000,000 万元时） */
export const DESIGN_NAT_CAP_RATE = 1.6;

/** 生成档位标签：≤首档 ｜ 中间档 ｜ ≥末档 */
const buildTierLabels = (axis: number[]) => {
  const fmt = (v: number) => (v >= 10000 ? `${v / 10000}亿` : `${v}`);
  return [
    `≤${fmt(axis[0])}`,
    ...axis.slice(1).map((v) => fmt(v)),
  ];
};

// ==========================================
// 工程复杂程度（国家口径：Ⅰ/Ⅱ/Ⅲ 三级）
// ==========================================

const COMPLEXITY_3: DesignComplexityLevel[] = [
  { key: 'c1', name: 'Ⅰ级（一般）', factor: 0.85 },
  { key: 'c2', name: 'Ⅱ级（较复杂）', factor: 1.0 },
  { key: 'c3', name: 'Ⅲ级（复杂）', factor: 1.15 },
];

/** 自定义省份可选：在三级基础上增加「Ⅳ级（特别复杂）」 */
export const COMPLEXITY_4: DesignComplexityLevel[] = [
  ...COMPLEXITY_3,
  { key: 'c4', name: 'Ⅳ级（特别复杂）', factor: 1.3 },
];

// ==========================================
// 修正（附加）调整系数（第 7 章 建筑市政工程设计）
// ==========================================

const FACTORS_CH7: DesignFactorOption[] = [
  {
    key: 'rebuild',
    name: '改扩建和技术改造建设项目（含结构加固）',
    factor: 1.2,
    editable: true,
    range: [1.1, 1.4],
    note: '计价格〔2002〕10号 1.0.12：附加调整系数为 1.1~1.4，根据工程设计复杂程度确定',
  },
  {
    key: 'historic',
    name: '古建筑、仿古建筑、保护性建筑等',
    factor: 1.45,
    editable: true,
    range: [1.3, 1.6],
    note: '表 7.3-1 注 2：根据具体情况，附加调整系数为 1.3~1.6',
  },
  {
    key: 'weak_current',
    name: '智能建筑弱电系统设计',
    factor: 1.3,
    note: '表 7.3-1 注 3：以弱电系统的设计概算为计费额，附加调整系数为 1.3',
  },
  {
    key: 'interior',
    name: '室内装修设计',
    factor: 1.5,
    note: '表 7.3-1 注 4：以室内装修的设计概算为计费额，附加调整系数为 1.5',
    billingNote: '表 7.3-1 注 4：以室内装修的设计概算为计费额',
  },
  {
    key: 'acoustic',
    name: '特殊声学装修设计',
    factor: 2.0,
    note: '表 7.3-1 注 5：以声学装修的设计概算为计费额，附加调整系数为 2.0',
    billingNote: '表 7.3-1 注 5：以声学装修的设计概算为计费额',
  },
];

// ==========================================
// 其他设计收费
// ==========================================

const OTHER_FEES_COMMON: DesignOtherFeeOption[] = [
  { key: 'overall', name: '总体设计费', ratio: 0.05, editable: true, note: '计价格〔2002〕10号 1.0.13：按基本设计收费的 5% 加收' },
  { key: 'coordinate', name: '主体设计协调费', ratio: 0.05, editable: true, note: '计价格〔2002〕10号 1.0.14：按基本设计收费的 5% 加收' },
  { key: 'asbuilt', name: '竣工图编制费', ratio: 0.08, editable: true, note: '可按基本设计收费的一定比例计取，比例可手工调整' },
  { key: 'budget', name: '施工图预算编制费', ratio: 0, editable: true, note: '按当地造价咨询收费规定计取，可手工填写比例' },
];

// ==========================================
// 各省（口径）标准
// ==========================================

export const DESIGN_STANDARDS: Record<string, DesignStandard> = {
  全国: {
    key: '全国',
    name: '全国（计价格〔2002〕10号）',
    label: '国家标准',
    source:
      '计价格〔2002〕10号《工程设计收费标准》第 7 章 建筑市政工程设计 —— 7.2 表 7.2-1 建筑市政工程各阶段工作量比例表、7.3 表 7.3-1 ~ 7.3-4 工程复杂程度表；附表一 工程设计收费基价表；附表二 第 6 类 建筑市政工程 专业调整系数',
    axis: AXIS_NAT,
    prices: PRICES_NAT,
    capRate: 1.6,
    tierLabels: buildTierLabels(AXIS_NAT),
    complexity: COMPLEXITY_3,
    additionalFactors: FACTORS_CH7,
    otherFees: OTHER_FEES_COMMON,
    remark:
      '本工具仅测算《工程设计收费标准》第 7 章「建筑市政工程设计」部分（适用于建筑、人防、市政公用、园林绿化、电信、广播电视、邮政工程）。计费额为经过批准的建设项目初步设计概算中的建筑安装工程费、设备与工器具购置费和联合试运转费之和；计费额处于两个数值区间的，采用直线内插法确定工程设计收费基价；计费额大于 2000000 万元的，以计费额乘以 1.6% 的收费率计算收费基价。工程类别按《附表二》第 6 类「建筑市政工程」的专业调整系数分为邮政工艺工程 0.8、建筑、市政、电信工程 1.0、人防、园林绿化、广电工艺工程 1.1 三档。修正系数为两个或两个以上的不能连乘，按「各系数之和 − 系数个数 + 1」合并。按计价格〔2002〕10 号第六条、第七条，建设项目总投资估算额 500 万元及以上的实行政府指导价，浮动幅度为上下 20%；采用新技术、新工艺、新设备、新材料的可优质优价上浮，本工具均未计入。建筑总平面布置或小区规划设计按每 10000~20000 元/ha 计算收费（表 7.3-1 注 6），本工具不实现。本费用不含工程勘察费与非标准设备设计费。',
  },

};

/**
 * 测算省份下拉中展示的省份名称（仅用于报告标注，统一套用全国规则）。
 * 以后某省出台正式计费文件时，可通过界面「+ 新增自定义省份」录入，或按下表恢复为内置口径。
 */
export const DESIGN_PROVINCE_NAMES = [
  '北京市',
  '天津市',
  '河北省',
  '山西省',
  '内蒙古自治区',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '上海市',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '广西壮族自治区',
  '海南省',
  '重庆市',
  '四川省',
  '贵州省',
  '云南省',
  '西藏自治区',
  '陕西省',
  '甘肃省',
  '青海省',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
];

/** 已归档的省级参数（不参与运行，仅备查；扩展时填「倍数 + 封顶费率」即可） */
export const DESIGN_ARCHIVED_PROVINCES: {
  name: string;
  multiplier: number | string;
  capRate: number;
  note: string;
}[] = [
  { name: '湖南省', multiplier: 1.2, capRate: 1.92, note: '《湖南省工程勘察设计收费指导标准（试行）》2023：复杂程度分Ⅰ/Ⅱ/Ⅲ/Ⅳ（0.85/1.00/1.15/1.30）；另有绿色建筑、BIM、被动式节能、装配式、EPC 等 12 项修正系数' },
  { name: '黑龙江省', multiplier: '1.25（≤1亿）/ 1.20（2–10亿）/ 1.15（≥20亿）', capRate: 1.75, note: '《黑龙江省工程勘察设计收费导则》2023 版：分段倍数，需用「高级 → 逐档编辑基价表」表达' },
  { name: '广东省', multiplier: 0.85, capRate: 1.36, note: '《广东省工程勘察设计行业协会工程勘察设计收费导则（第二版）》2021：累进制（等价档内直线内插）' },
  { name: '新疆维吾尔自治区', multiplier: 1.0, capRate: 1.6, note: '《新疆工程勘察设计计费导则》征求意见稿：复杂程度为 1.00/1.15/1.30' },
  { name: '海南省', multiplier: 1.0, capRate: 1.6, note: '《海南省建设项目总概算组成及其他费用计算规定》：基本设计费含概算编制费 6.5%' },
];

/** 用户自定义省份（localStorage 持久化） */
export interface CustomDesignProvince {
  /** 省份名称（唯一键） */
  name: string;
  /** 相对计价格〔2002〕10号标准的基价倍数 */
  multiplier: number;
  /** 封顶费率（%），计费额 > 2,000,000 万元时适用 */
  capRate: number;
  /** 是否增加「Ⅳ级（特别复杂）」等级 */
  withComplexity4: boolean;
  /** Ⅳ级调整系数（仅 withComplexity4 时生效） */
  complexity4Factor: number;
  /** 自定义逐档基价（留空则按国家标准 × 倍数生成） */
  prices?: number[];
  /** 逐档计费额（一般与国家标准一致） */
  axis?: number[];
}

/** 由「倍数」生成一个完整的设计费标准（自定义省份） */
export const buildStandardFromMultiplier = (p: CustomDesignProvince): DesignStandard => {
  const axis = p.axis && p.axis.length > 1 ? p.axis : AXIS_NAT;
  const prices =
    p.prices && p.prices.length === axis.length
      ? p.prices
      : axis.map((_, i) => {
          const nat = PRICES_NAT[i] ?? PRICES_NAT[PRICES_NAT.length - 1];
          return Math.round(nat * p.multiplier * 10000) / 10000;
        });

  const complexity: DesignComplexityLevel[] = p.withComplexity4
    ? [
        ...COMPLEXITY_3,
        { key: 'c4', name: 'Ⅳ级（特别复杂）', factor: p.complexity4Factor },
      ]
    : COMPLEXITY_3;

  return {
    key: p.name,
    name: p.name,
    label: `${p.name}标准`,
    source: `自定义省份：计价格〔2002〕10号《工程设计收费标准》附表一 工程设计收费基价表 × ${p.multiplier}（用户自定义）`,
    axis,
    prices,
    capRate: p.capRate,
    tierLabels: buildTierLabels(axis),
    complexity,
    additionalFactors: FACTORS_CH7,
    otherFees: OTHER_FEES_COMMON,
    remark: `计费额为经过批准的建设项目初步设计概算中的建筑安装工程费、设备与工器具购置费和联合试运转费之和；计费额为「计价格〔2002〕10号 附表一」标准 × ${p.multiplier}；计费额处于两个数值区间的，采用直线内插法确定工程设计收费基价；计费额大于 2000000 万元的，以计费额乘以 ${p.capRate}% 的收费率计算收费基价。本费用不含工程勘察费与非标准设备设计费。`,
  };
};

export const DESIGN_PROVINCES = Object.keys(DESIGN_STANDARDS);

// ==========================================
// 计算逻辑
// ==========================================

/** 万元数值展示：最多保留 4 位小数 */
export const fmtWan = (value: number) => String(Math.round(value * 10000) / 10000);
/** 比例百分比展示：最多保留 4 位小数 */
const fmtPct = (v: number) => String(Math.round(v * 100 * 10000) / 10000);
/** 元展示 */
export const toYuan = (wan: number) => Math.round(wan * 10000);

export interface DesignBracketLocation {
  index: number;
  /** 命中档位下限（万元） */
  lower: number;
  /** 命中档位上限（万元） */
  upper: number;
  /** 下限对应基价 */
  lowerPrice: number;
  /** 上限对应基价 */
  upperPrice: number;
  /** 基价（万元） */
  base: number;
  /** 低于首档 */
  isBelowFirst: boolean;
  /** 超过末档（按封顶费率计） */
  isAboveLast: boolean;
  /** 封顶时使用的费率（%） */
  capRate?: number;
}

/**
 * 定位基价：
 * - 计费额 ≤ 首档 → 取首档基价
 * - 计费额 ≥ 末档 → 按封顶费率（capRate）计算
 * - 其余 → 相邻两档直线内插
 */
export const locateDesignBracket = (
  amount: number,
  axis: number[],
  prices: number[],
  capRate: number
): DesignBracketLocation => {
  const last = axis.length - 1;
  if (amount <= axis[0]) {
    return {
      index: 0,
      lower: axis[0],
      upper: axis[0],
      lowerPrice: prices[0],
      upperPrice: prices[0],
      base: prices[0],
      isBelowFirst: true,
      isAboveLast: false,
    };
  }
  if (amount >= axis[last]) {
    return {
      index: last,
      lower: axis[last],
      upper: axis[last],
      lowerPrice: prices[last],
      upperPrice: prices[last],
      base: (amount * capRate) / 100,
      isBelowFirst: false,
      isAboveLast: true,
      capRate,
    };
  }
  for (let i = 0; i < last; i++) {
    if (amount >= axis[i] && amount < axis[i + 1]) {
      const base =
        prices[i] + ((prices[i + 1] - prices[i]) * (amount - axis[i])) / (axis[i + 1] - axis[i]);
      return {
        index: i,
        lower: axis[i],
        upper: axis[i + 1],
        lowerPrice: prices[i],
        upperPrice: prices[i + 1],
        base,
        isBelowFirst: false,
        isAboveLast: false,
      };
    }
  }
  return {
    index: last,
    lower: axis[last],
    upper: axis[last],
    lowerPrice: prices[last],
    upperPrice: prices[last],
    base: (amount * capRate) / 100,
    isBelowFirst: false,
    isAboveLast: true,
    capRate,
  };
};

/**
 * 修正（附加）调整系数合并：两个及以上不能连乘
 * 「各系数之和 − 系数个数 + 1」
 */
export const mergeAdditionalFactors = (factors: number[]): number => {
  if (factors.length === 0) return 1;
  if (factors.length === 1) return factors[0];
  return factors.reduce((s, v) => s + v, 0) - factors.length + 1;
};

export interface DesignCalcInput {
  standard: DesignStandard;
  /** 测算省份（仅用于报告标题标注，与计算无关；省略或为「全国」时不展示） */
  provinceLabel?: string;
  /** 计费额（万元） */
  amount: number;
  /** 工程类别名称（第 7 章） */
  categoryName: string;
  /** 计费额口径特别提示（如弱电系统 / 室内装修 / 特殊声学装修以各自的设计概算为计费额） */
  billingNote?: string;
  /** 专业调整系数 */
  professionFactor: number;
  /** 工程复杂程度等级名称 */
  complexityName: string;
  /** 工程复杂程度调整系数 */
  complexityFactor: number;
  /** 修正（附加）调整系数明细 */
  additionalFactors: { name: string; factor: number }[];
  /** 计费模式名称与系数 */
  modeName: string;
  modeFactor: number;
  /** 其他设计收费明细 */
  otherFees: { name: string; ratio: number }[];
  /** 各阶段工作量比例 */
  phase: { name: string; p1: number; p2: number; p3: number };
}

export interface DesignCalcResult {
  location: DesignBracketLocation;
  /** 修正系数合并值 */
  mergedFactor: number;
  /** 基本设计收费（万元） */
  basicWan: number;
  /** 其他设计收费合计（万元） */
  otherFeesWan: number;
  /** 设计收费（万元）= 基本设计收费 + 其他设计收费 */
  finalWan: number;
  /** 设计收费（元） */
  finalYuan: number;
  /** 各阶段金额（万元） */
  phaseAmounts: { name: string; percent: number; wan: number }[];
  reportText: string;
}

export const calculateDesign = (input: DesignCalcInput): DesignCalcResult => {
  const {
    standard,
    amount,
    categoryName,
    billingNote,
    professionFactor,
    complexityName,
    complexityFactor,
    additionalFactors,
    modeName,
    modeFactor,
    otherFees,
    phase,
  } = input;

  const loc = locateDesignBracket(amount, standard.axis, standard.prices, standard.capRate);
  const mergedFactor = mergeAdditionalFactors(additionalFactors.map((f) => f.factor));
  /** 单系数保留 2 位，多系数合并保留 4 位 */
  const mergedText = (additionalFactors.length > 1 ? mergedFactor.toFixed(4) : mergedFactor.toFixed(2));

  const basicWan = loc.base * professionFactor * complexityFactor * mergedFactor * modeFactor;
  const otherFeesWan = otherFees.reduce((s, f) => s + basicWan * f.ratio, 0);
  const finalWan = basicWan + otherFeesWan;
  const finalYuan = toYuan(finalWan);

  const phaseDefs = [
    { name: '方案设计', percent: phase.p1 },
    { name: '初步设计', percent: phase.p2 },
    { name: '施工图设计', percent: phase.p3 },
  ].filter((p) => p.percent > 0);
  const phaseAmounts = phaseDefs.map((p) => ({
    ...p,
    wan: (finalWan * p.percent) / 100,
  }));

  const lines: string[] = [];
  const titleSuffix =
    input.provinceLabel && input.provinceLabel !== '全国' && input.provinceLabel !== standard.key
      ? `测算省份：${input.provinceLabel} ｜ 适用规则：${standard.label}`
      : standard.label;
  lines.push(`【工程设计费测算结果 (${titleSuffix})】`);
  lines.push(`1. 工程类别：${categoryName}（专业调整系数 ${professionFactor.toFixed(2)}）`);
  lines.push(`2. 计费额 (${DESIGN_BILLING_BASE_LABEL})：${fmtWan(amount)} 万元`);
  if (billingNote) lines.push(`   （${billingNote}）`);
  lines.push(`3. 工程复杂程度：${complexityName}，调整系数 ${complexityFactor.toFixed(2)}`);
  if (additionalFactors.length === 0) {
    lines.push('4. 修正（附加）调整系数：1.00（无）');
  } else {
    lines.push(
      `4. 修正（附加）调整系数：${mergedText}（${additionalFactors.map((f) => `${f.name} ${f.factor.toFixed(2)}`).join('、')}）`
    );
    if (additionalFactors.length > 1) {
      lines.push(
        `   —— 合并规则：各系数不能连乘，按「各系数之和 − 系数个数 + 1」= ${additionalFactors.map((f) => f.factor.toFixed(2)).join(' + ')} − ${additionalFactors.length} + 1 = ${mergedText}`
      );
    }
  }
  lines.push(`5. 计费模式：${modeName}${modeFactor === 1 ? '' : `（× ${modeFactor.toFixed(2)}）`}`);
  lines.push(`6. 工程复杂程度取值说明：Ⅰ级 0.85 / Ⅱ级 1.00 / Ⅲ级 1.15（表 7.3-1 ~ 7.3-4）`);
  lines.push(`7. 收费标准依据：${standard.source}`);
  lines.push('——————————————————');
  lines.push('计算过程说明：');
  lines.push(`8. 计费档位（计费额，万元）：${standard.tierLabels.join(' ｜ ')}（＞末档按 ${standard.capRate}% 计）`);
  lines.push('9. 计算工程设计收费基价：');
  if (loc.isBelowFirst) {
    lines.push(
      `   计费额 ${fmtWan(amount)} 万元未达到首档 ${fmtWan(standard.axis[0])} 万元，直接取首档基价 ${fmtWan(loc.base)} 万元`
    );
  } else if (loc.isAboveLast) {
    lines.push(
      `   计费额 ${fmtWan(amount)} 万元已达末档 ${fmtWan(standard.axis[standard.axis.length - 1])} 万元，按封顶费率计算：`
    );
    lines.push(`   收费基价 = ${fmtWan(amount)} × ${standard.capRate}% = ${fmtWan(loc.base)} 万元`);
  } else {
    lines.push(
      `   计费额 ${fmtWan(amount)} 万元位于「${fmtWan(loc.lower)}万元(${fmtWan(loc.lowerPrice)}万元)」与「${fmtWan(loc.upper)}万元(${fmtWan(loc.upperPrice)}万元)」之间`
    );
    lines.push(
      `   收费基价 = ${fmtWan(loc.lowerPrice)} + (${fmtWan(loc.upperPrice)} − ${fmtWan(loc.lowerPrice)}) × (${fmtWan(amount)} − ${fmtWan(loc.lower)}) / (${fmtWan(loc.upper)} − ${fmtWan(loc.lower)}) = ${fmtWan(loc.base)} 万元`
    );
  }
  lines.push(
    `10. 基本设计收费 = ${fmtWan(loc.base)} × ${professionFactor.toFixed(2)}（专业） × ${complexityFactor.toFixed(2)}（复杂程度） × ${mergedText}（修正）${modeFactor === 1 ? '' : ` × ${modeFactor.toFixed(2)}（计费模式）`} = ${fmtWan(basicWan)} 万元`
  );

  let stepIdx = 11;
  if (otherFees.length > 0) {
    lines.push(`${stepIdx}. 其他设计收费：`);
    otherFees.forEach((f) => {
      lines.push(`   · ${f.name}（基本设计收费 × ${fmtPct(f.ratio)}%）：${fmtWan(basicWan * f.ratio)} 万元`);
    });
    lines.push(`   其他设计收费合计：${fmtWan(otherFeesWan)} 万元`);
  } else {
    lines.push(`${stepIdx}. 其他设计收费：无`);
  }
  stepIdx += 1;

  lines.push(
    `${stepIdx}. 设计收费 = 基本设计收费 + 其他设计收费 = ${fmtWan(basicWan)} + ${fmtWan(otherFeesWan)} = ${fmtWan(finalWan)} 万元（¥${finalYuan.toLocaleString()} 元）`
  );
  stepIdx += 1;
  if (phaseAmounts.length > 0) {
    lines.push(
      `${stepIdx}. 各设计阶段分配（表 7.2-1 ${phase.name}：${['方案', '初步', '施工图'].map((n, i) => `${n} ${[phase.p1, phase.p2, phase.p3][i]}%`).join(' / ')}）：`
    );
    phaseAmounts.forEach((p) => {
      lines.push(`   · ${p.name}（${p.percent}%）：${fmtWan(p.wan)} 万元（¥${toYuan(p.wan).toLocaleString()} 元）`);
    });
  }
  lines.push('——————————————————');
  lines.push(`项目总设计费用：¥${finalYuan.toLocaleString()} 元`);
  lines.push(`备注：${standard.remark}`);

  return {
    location: loc,
    mergedFactor,
    basicWan,
    otherFeesWan,
    finalWan,
    finalYuan,
    phaseAmounts,
    reportText: lines.join('\n'),
  };
};
