/**
 * 建设项目前期工作咨询费（工程可研费）计算标准
 *
 * 数据出处：
 * 1. 〔2000〕湘价房字第 95 号
 *    《关于转发〈国家计委关于印发建设项目前期工作咨询收费暂行规定的通知〉的通知》
 * 2. 浙价服〔2013〕252 号
 *    《浙江省物价局关于公布降低后的编制和评估可行性研究报告等建设项目前期咨询收费的通知》
 * 3. 桂价经字〔2000〕88 号
 *    《广西区计委、物价局转发国家纪委关于印发建设项目前期工作咨询收费暂行规定的通知》
 * 4. 上位文件：计价格〔1999〕1283 号《建设项目前期工作咨询收费暂行规定》（附件一 / 附件二 / 附件三）
 *
 * 三地统一计费方式（档位区间 + 档内线性插值）：
 *   定位比例 t = (估算投资额 − 档位下限) / (档位上限 − 档位下限)
 *   基准费用   = 收费下限 + (收费上限 − 收费下限) × t
 *   最终费用   = 基准费用 × 行业调整系数 × 工程复杂程度系数 × 其他系数
 *
 * 说明：国家表 / 湖南附表一 / 广西附表均为连续折线，该式与「按折线插值」结果完全等价；
 *       浙江 252 号表为协商区间（不连续），按档内线性取值得到确定性结果。
 */

/** 档位区间：min 不含、max 含；max = Infinity 表示无上限（顶档） */
export interface FeeBracket {
  /** 档位下限（万元） */
  min: number;
  /** 档位上限（万元） */
  max: number;
  /** 该档收费下限（万元） */
  lo: number;
  /** 该档收费上限（万元） */
  hi: number;
  /** 该档说明（如「国家表区间 × 80%」） */
  note?: string;
}

/** 经济适用住房等固定值收费标准 */
export interface FixedFee {
  /** 估算投资额 ≤ 3000 万元 */
  atOrBelow3000: number;
  /** 估算投资额 > 3000 万元 */
  above3000: number;
}

export interface FeasibilityServiceItem {
  key: string;
  name: string;
  /** 档位区间表（一般项目） */
  brackets?: FeeBracket[];
  /** 固定值表（经济适用住房项目，按湖南附表二） */
  fixed?: FixedFee;
  /** 是否为经济适用住房专项 */
  affordable?: boolean;
  /** 补充说明（报告中展示） */
  basis?: string;
}

export interface FeasibilityStandard {
  key: string;
  /** 省份显示名 */
  name: string;
  /** 报告标题中的标准名，如「湖南省标准」 */
  label: string;
  /** 收费标准依据（报告第 4 行） */
  source: string;
  /** 计费档位标签（报告第 5 行） */
  tierLabels: string[];
  /** 咨询服务类型（含经济适用住房专项，仅湖南） */
  services: FeasibilityServiceItem[];
  /** 其他调整系数预设（如湖南 财政拨款事业性质工程咨询公司 ×80%） */
  otherFactorPresets: { key: string; label: string; factor: number }[];
  remark: string;
}

/** 报告中的「计费基数」口径 */
export const FEASIBILITY_BILLING_BASE_LABEL = '估算投资额';

/** 计费基数说明 */
export const FEASIBILITY_BILLING_BASE_HINT =
  '指项目建议书或者可行性研究报告的估算投资额';

/** 向导步骤（与造价咨询费 / 监理费保持一致的 5 步结构） */
export const FEASIBILITY_STEPS = [
  '1. 测算省份',
  '2. 咨询服务类型',
  '3. 计费基数',
  '4. 调整系数',
  '5. 测算报告',
];

/** 行业调整系数（计价格〔1999〕1283 号 附件二，以国家标准为 1） */
export const INDUSTRY_FACTORS = [
  { key: 'i1', label: '1、石化、化工、钢铁', factor: 1.3 },
  { key: 'i2', label: '2、石油、天然气、水利、水电、交通（水运）、化纤', factor: 1.2 },
  {
    key: 'i3',
    label:
      '3、有色、黄金、纺织、轻工、邮电、广播、电视、医药、煤炭、火电（含核电）、机械（含船舶、航空、航天、兵器）',
    factor: 1.0,
  },
  { key: 'i4', label: '4、林业、商业、粮食、建筑', factor: 0.8 },
  { key: 'i5', label: '5、建材、交通（公路）、铁道、市政公用工程', factor: 0.7 },
];

/** 工程复杂程度调整系数取值范围 */
export const COMPLEXITY_MIN = 0.8;
export const COMPLEXITY_MAX = 1.2;

// ==========================================
// 国家计委 计价格〔1999〕1283 号 附件一（估算投资额 3000 万元以上）
// ==========================================

const NAT_PROJECT_PROPOSAL: FeeBracket[] = [
  { min: 3000, max: 10000, lo: 6, hi: 14 },
  { min: 10000, max: 50000, lo: 14, hi: 37 },
  { min: 50000, max: 100000, lo: 37, hi: 55 },
  { min: 100000, max: 500000, lo: 55, hi: 100 },
  { min: 500000, max: Infinity, lo: 100, hi: 125 },
];

const NAT_FEASIBILITY_REPORT: FeeBracket[] = [
  { min: 3000, max: 10000, lo: 12, hi: 28 },
  { min: 10000, max: 50000, lo: 28, hi: 75 },
  { min: 50000, max: 100000, lo: 75, hi: 110 },
  { min: 100000, max: 500000, lo: 110, hi: 200 },
  { min: 500000, max: Infinity, lo: 200, hi: 250 },
];

const NAT_PROPOSAL_EVAL: FeeBracket[] = [
  { min: 3000, max: 10000, lo: 4, hi: 8 },
  { min: 10000, max: 50000, lo: 8, hi: 12 },
  { min: 50000, max: 100000, lo: 12, hi: 15 },
  { min: 100000, max: 500000, lo: 15, hi: 17 },
  { min: 500000, max: Infinity, lo: 17, hi: 20 },
];

const NAT_REPORT_EVAL: FeeBracket[] = [
  { min: 3000, max: 10000, lo: 5, hi: 10 },
  { min: 10000, max: 50000, lo: 10, hi: 15 },
  { min: 50000, max: 100000, lo: 15, hi: 20 },
  { min: 100000, max: 500000, lo: 20, hi: 25 },
  { min: 500000, max: Infinity, lo: 25, hi: 35 },
];

/** 把国家表区间整体乘以系数（湖南 3000 万元以上按 80% 执行） */
const scaleBrackets = (brackets: FeeBracket[], k: number, note?: string): FeeBracket[] =>
  brackets.map((b) => ({
    min: b.min,
    max: b.max,
    lo: Math.round(b.lo * k * 10000) / 10000,
    hi: Math.round(b.hi * k * 10000) / 10000,
    note,
  }));

const HUNAN_NOTE = '国家表区间 × 80%（〔2000〕湘价房字第95号 第四条）';

const HUNAN_TIER_LABELS = [
  '≤500',
  '500–1500',
  '1500–3000',
  '3000–10000',
  '10000–50000',
  '50000–100000',
  '100000–500000',
  '≥500000',
];

// ==========================================
// 各省标准
// ==========================================

export const FEASIBILITY_STANDARDS: Record<string, FeasibilityStandard> = {
  湖南省: {
    key: '湖南省',
    name: '湖南省',
    label: '湖南省标准',
    source:
      '〔2000〕湘价房字第95号《关于转发〈国家计委关于印发建设项目前期工作咨询收费暂行规定的通知〉的通知》第四条、第六条 附表一、附表二（3000万元以上按计价格〔1999〕1283号 附件一标准的 80% 执行）',
    tierLabels: HUNAN_TIER_LABELS,
    services: [
      {
        key: 'proposal',
        name: '编制项目建议书',
        brackets: [
          { min: 0, max: 500, lo: 0.8, hi: 1.6, note: '附表一' },
          { min: 500, max: 1500, lo: 1.6, hi: 2.4, note: '附表一' },
          { min: 1500, max: 3000, lo: 2.4, hi: 4.8, note: '附表一' },
          ...scaleBrackets(NAT_PROJECT_PROPOSAL, 0.8, HUNAN_NOTE),
        ],
      },
      {
        key: 'report',
        name: '编制可行性研究报告',
        brackets: [
          { min: 0, max: 500, lo: 1.6, hi: 3.2, note: '附表一' },
          { min: 500, max: 1500, lo: 3.2, hi: 4.8, note: '附表一' },
          { min: 1500, max: 3000, lo: 4.8, hi: 9.6, note: '附表一' },
          ...scaleBrackets(NAT_FEASIBILITY_REPORT, 0.8, HUNAN_NOTE),
        ],
      },
      {
        key: 'proposal_eval',
        name: '评估项目建议书',
        brackets: [
          { min: 0, max: 500, lo: 0.4, hi: 0.8, note: '附表一' },
          { min: 500, max: 1500, lo: 0.8, hi: 1.6, note: '附表一' },
          { min: 1500, max: 3000, lo: 1.6, hi: 3.2, note: '附表一' },
          ...scaleBrackets(NAT_PROPOSAL_EVAL, 0.8, HUNAN_NOTE),
        ],
      },
      {
        key: 'report_eval',
        name: '评估可行性研究报告',
        brackets: [
          { min: 0, max: 500, lo: 0.8, hi: 1.6, note: '附表一' },
          { min: 500, max: 1500, lo: 1.6, hi: 2.4, note: '附表一' },
          { min: 1500, max: 3000, lo: 2.4, hi: 4, note: '附表一' },
          ...scaleBrackets(NAT_REPORT_EVAL, 0.8, HUNAN_NOTE),
        ],
      },
      // —— 经济适用住房项目（附表二，固定值） ——
      {
        key: 'aff_proposal',
        name: '编制项目建议书（经济适用住房）',
        affordable: true,
        fixed: { atOrBelow3000: 0.6, above3000: 1.0 },
        basis: '〔2000〕湘价房字第95号 第六条 附表二',
      },
      {
        key: 'aff_report',
        name: '编制可行性研究报告（经济适用住房）',
        affordable: true,
        fixed: { atOrBelow3000: 0.9, above3000: 1.5 },
        basis: '〔2000〕湘价房字第95号 第六条 附表二',
      },
      {
        key: 'aff_proposal_eval',
        name: '评估项目建议书（经济适用住房）',
        affordable: true,
        fixed: { atOrBelow3000: 0.4, above3000: 0.5 },
        basis: '〔2000〕湘价房字第95号 第六条 附表二',
      },
      {
        key: 'aff_report_eval',
        name: '评估可行性研究报告（经济适用住房）',
        affordable: true,
        fixed: { atOrBelow3000: 0.6, above3000: 1.0 },
        basis: '〔2000〕湘价房字第95号 第六条 附表二',
      },
    ],
    otherFactorPresets: [
      {
        key: 'hunan_public',
        label: '财政拨款的事业性质工程咨询公司（第五条，按以上收费标准的 80% 收取）',
        factor: 0.8,
      },
    ],
    remark:
      '估算投资额是指项目建议书或者可行性研究报告的估算投资额；具体收费标准根据估算投资额在相对应的区间内用插入法计算，再乘以行业调整系数与工程复杂程度调整系数。项目需要勘察、试验或工作量明显增加的，加收费用由双方另行协商；优质优价幅度由双方在规定标准基础上协商确定。',
  },

  浙江省: {
    key: '浙江省',
    name: '浙江省',
    label: '浙江省标准',
    source:
      '浙价服〔2013〕252号《浙江省物价局关于公布降低后的编制和评估可行性研究报告等建设项目前期咨询收费的通知》（按计价格〔1999〕1283号 及 浙价房〔1999〕411号 规定标准平均降低 20% 后的收费标准）',
    tierLabels: [
      '≤1000',
      '1000–3000',
      '3000–10000',
      '10000–50000',
      '50000–100000',
      '100000–500000',
      '≥500000',
    ],
    services: [
      {
        key: 'proposal',
        name: '编制项目建议书',
        brackets: [
          { min: 0, max: 1000, lo: 0.8, hi: 2 },
          { min: 1000, max: 3000, lo: 1.7, hi: 4.8 },
          { min: 3000, max: 10000, lo: 4, hi: 11.2 },
          { min: 10000, max: 50000, lo: 9.5, hi: 30 },
          { min: 50000, max: 100000, lo: 25, hi: 44 },
          { min: 100000, max: 500000, lo: 37.5, hi: 80 },
          { min: 500000, max: Infinity, lo: 68, hi: 100 },
        ],
      },
      {
        key: 'report',
        name: '编制可行性研究报告',
        brackets: [
          { min: 0, max: 1000, lo: 1.6, hi: 4 },
          { min: 1000, max: 3000, lo: 3.4, hi: 9.6 },
          { min: 3000, max: 10000, lo: 8, hi: 22.4 },
          { min: 10000, max: 50000, lo: 19, hi: 60 },
          { min: 50000, max: 100000, lo: 50, hi: 88 },
          { min: 100000, max: 500000, lo: 75, hi: 160 },
          { min: 500000, max: Infinity, lo: 136, hi: 200 },
        ],
      },
      {
        key: 'proposal_eval',
        name: '评估项目建议书',
        brackets: [
          { min: 0, max: 1000, lo: 0.5, hi: 1.2 },
          { min: 1000, max: 3000, lo: 1, hi: 3.2 },
          { min: 3000, max: 10000, lo: 2.7, hi: 6.4 },
          { min: 10000, max: 50000, lo: 5.4, hi: 9.6 },
          { min: 50000, max: 100000, lo: 8, hi: 12 },
          { min: 100000, max: 500000, lo: 10, hi: 13.6 },
          { min: 500000, max: Infinity, lo: 11.5, hi: 16 },
        ],
      },
      {
        key: 'report_eval',
        name: '评估可行性研究报告',
        brackets: [
          { min: 0, max: 1000, lo: 0.8, hi: 2 },
          { min: 1000, max: 3000, lo: 1.7, hi: 4 },
          { min: 3000, max: 10000, lo: 3.4, hi: 8 },
          { min: 10000, max: 50000, lo: 6.8, hi: 12 },
          { min: 50000, max: 100000, lo: 10, hi: 16 },
          { min: 100000, max: 500000, lo: 13.6, hi: 20 },
          { min: 500000, max: Infinity, lo: 17, hi: 28 },
        ],
      },
      {
        key: 'design_eval',
        name: '评估咨询初步设计文件',
        brackets: [
          { min: 0, max: 1000, lo: 0.8, hi: 2 },
          { min: 1000, max: 3000, lo: 1.7, hi: 4 },
          { min: 3000, max: 10000, lo: 3.4, hi: 8 },
          { min: 10000, max: 50000, lo: 6.8, hi: 12 },
          { min: 50000, max: 100000, lo: 10, hi: 16 },
          { min: 100000, max: 500000, lo: 13.6, hi: 20 },
          { min: 500000, max: Infinity, lo: 17, hi: 28 },
        ],
        basis: '浙价服〔2013〕252号 表 第五项',
      },
    ],
    otherFactorPresets: [],
    remark:
      '以上收费按估算投资额分档计费，具体收费根据项目的复杂程度、工作要求和工作量由委托方双方在上述规定范围内协商确定（本工具按档内线性插值给出测算值）。估算投资额是指项目建议书或者可行性研究报告的估算投资额。',
  },

  广西壮族自治区: {
    key: '广西壮族自治区',
    name: '广西壮族自治区',
    label: '广西壮族自治区标准',
    source:
      '桂价经字〔2000〕88号《广西区计委、物价局转发国家纪委关于印发建设项目前期工作咨询收费暂行规定的通知》第一条、第二条 附表（3000万元以上按计价格〔1999〕1283号 附件一标准执行）',
    tierLabels: [
      '≤500',
      '500–1000',
      '1000–3000',
      '3000–10000',
      '10000–50000',
      '50000–100000',
      '100000–500000',
      '≥500000',
    ],
    services: [
      {
        key: 'proposal',
        name: '编制项目建议书',
        brackets: [
          { min: 0, max: 500, lo: 1, hi: 1.5, note: '桂价经字〔2000〕88号 附表' },
          { min: 500, max: 1000, lo: 1.5, hi: 2.5, note: '桂价经字〔2000〕88号 附表' },
          { min: 1000, max: 3000, lo: 2.5, hi: 6, note: '桂价经字〔2000〕88号 附表' },
          ...NAT_PROJECT_PROPOSAL,
        ],
      },
      {
        key: 'report',
        name: '编制可行性研究报告',
        brackets: [
          { min: 0, max: 500, lo: 2, hi: 4, note: '桂价经字〔2000〕88号 附表' },
          { min: 500, max: 1000, lo: 4, hi: 6, note: '桂价经字〔2000〕88号 附表' },
          { min: 1000, max: 3000, lo: 6, hi: 12, note: '桂价经字〔2000〕88号 附表' },
          ...NAT_FEASIBILITY_REPORT,
        ],
      },
      {
        key: 'proposal_eval',
        name: '评估项目建议书',
        brackets: [
          { min: 0, max: 500, lo: 0.5, hi: 1, note: '桂价经字〔2000〕88号 附表' },
          { min: 500, max: 1000, lo: 1, hi: 1.5, note: '桂价经字〔2000〕88号 附表' },
          { min: 1000, max: 3000, lo: 1.5, hi: 4, note: '桂价经字〔2000〕88号 附表' },
          ...NAT_PROPOSAL_EVAL,
        ],
      },
      {
        key: 'report_eval',
        name: '评估可行性研究报告',
        brackets: [
          { min: 0, max: 500, lo: 1, hi: 1.5, note: '桂价经字〔2000〕88号 附表' },
          { min: 500, max: 1000, lo: 1.5, hi: 2.5, note: '桂价经字〔2000〕88号 附表' },
          { min: 1000, max: 3000, lo: 2.5, hi: 5, note: '桂价经字〔2000〕88号 附表' },
          ...NAT_REPORT_EVAL,
        ],
      },
      {
        key: 'design_eval',
        name: '评估咨询初步设计文件',
        brackets: [
          { min: 0, max: 500, lo: 1, hi: 1.5, note: '按可研评估执行' },
          { min: 500, max: 1000, lo: 1.5, hi: 2.5, note: '按可研评估执行' },
          { min: 1000, max: 3000, lo: 2.5, hi: 5, note: '按可研评估执行' },
          ...NAT_REPORT_EVAL.map((b) => ({ ...b, note: '按可研评估执行' })),
        ],
        basis: '桂价经字〔2000〕88号 第二条：初步设计文件评估咨询按可行性研究报告评估咨询收费标准执行',
      },
    ],
    otherFactorPresets: [],
    remark:
      '估算投资额是指项目建议书或可行性研究报告的估算总投资额；建设项目的具体收费标准，根据估算总投资额在相对应的区间内用插入法计算，再乘以行业调整系数和工程复杂程度调整系数。',
  },
};

export const FEASIBILITY_PROVINCES = Object.keys(FEASIBILITY_STANDARDS);

// ==========================================
// 计算逻辑
// ==========================================

/** 万元数值展示：最多保留 4 位小数 */
export const fmtWan = (value: number) => String(Math.round(value * 10000) / 10000);

/** 比例百分比展示：最多保留 4 位小数 */
const fmtPct = (v: number) => String(Math.round(v * 100 * 10000) / 10000);

/** 元展示 */
export const toYuan = (wan: number) => Math.round(wan * 10000);

export interface BracketLocation {
  bracket: FeeBracket;
  index: number;
  /** 档内定位比例 0~1 */
  ratio: number;
  /** 基准费用（万元） */
  base: number;
  /** 顶档（无上限），按该档上限封顶 */
  isTopCapped: boolean;
}

/**
 * 档位判定规则：估算投资额 x ∈ (min, max]，首个满足 x ≤ max 的档位；
 * 顶档（max = Infinity）按该档收费上限（hi）封顶。
 */
export const locateBracket = (amount: number, brackets: FeeBracket[]): BracketLocation => {
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (amount <= b.max) {
      if (!Number.isFinite(b.max)) {
        return { bracket: b, index: i, ratio: 1, base: b.hi, isTopCapped: true };
      }
      const t = b.max === b.min ? 1 : (amount - b.min) / (b.max - b.min);
      const ratio = Math.min(Math.max(t, 0), 1);
      return { bracket: b, index: i, ratio, base: b.lo + (b.hi - b.lo) * ratio, isTopCapped: false };
    }
  }
  const last = brackets[brackets.length - 1];
  return { bracket: last, index: brackets.length - 1, ratio: 1, base: last.hi, isTopCapped: true };
};

export interface FeasibilityCalcInput {
  standard: FeasibilityStandard;
  /** 估算投资额（万元） */
  amount: number;
  /** 选中的咨询服务类型 key */
  serviceKeys: string[];
  /** 行业调整系数 */
  industryFactor: number;
  /** 行业调整系数对应的行业名称 */
  industryLabel: string;
  /** 工程复杂程度调整系数 */
  complexityFactor: number;
  /** 其他调整系数 */
  otherFactor: number;
  /** 其他调整系数说明（勾选/自定义） */
  otherLabels: string[];
}

export interface FeasibilityItemResult {
  key: string;
  name: string;
  /** 是否经济适用住房专项（不乘调整系数） */
  affordable: boolean;
  /** 基准费用（万元） */
  base: number;
  /** 最终费用（万元） */
  final: number;
  /** 档位说明（一般项目） */
  location?: BracketLocation;
}

export interface FeasibilityCalcResult {
  items: FeasibilityItemResult[];
  /** 综合调整系数 */
  totalFactor: number;
  /** 合计（万元） */
  totalWan: number;
  /** 合计（元） */
  totalYuan: number;
  reportText: string;
}

export const calculateFeasibility = (input: FeasibilityCalcInput): FeasibilityCalcResult => {
  const {
    standard,
    amount,
    serviceKeys,
    industryFactor,
    industryLabel,
    complexityFactor,
    otherFactor,
    otherLabels,
  } = input;

  const selected = standard.services.filter((s) => serviceKeys.includes(s.key));
  const totalFactor = industryFactor * complexityFactor * otherFactor;

  const items: FeasibilityItemResult[] = selected.map((s) => {
    if (s.affordable && s.fixed) {
      const base = amount <= 3000 ? s.fixed.atOrBelow3000 : s.fixed.above3000;
      return { key: s.key, name: s.name, affordable: true, base, final: base };
    }
    const loc = locateBracket(amount, s.brackets!);
    return {
      key: s.key,
      name: s.name,
      affordable: false,
      base: loc.base,
      final: loc.base * totalFactor,
      location: loc,
    };
  });

  const totalWan = items.reduce((sum, it) => sum + it.final, 0);
  const totalYuan = toYuan(totalWan);

  const hasAffordable = items.some((it) => it.affordable);
  const hasNormal = items.some((it) => !it.affordable);

  const lines: string[] = [];
  lines.push(`【建设项目前期工作咨询费测算结果 (${standard.label})】`);
  lines.push(`1. 咨询服务类型：${items.map((it) => it.name).join('；')}`);
  lines.push(`2. 计费基数 (${FEASIBILITY_BILLING_BASE_LABEL})：${fmtWan(amount)} 万元`);
  if (hasNormal) {
    const otherText =
      otherFactor === 1 && otherLabels.length === 0
        ? '1.00'
        : `${otherFactor.toFixed(2)}（${otherLabels.join('；') || '手工输入'}）`;
    lines.push(
      `3. 调整系数：行业调整系数 ${industryFactor.toFixed(2)}（${industryLabel}）；工程复杂程度系数 ${complexityFactor.toFixed(2)}；其他系数 ${otherText}`
    );
    lines.push(
      `   —— 综合调整系数 = ${industryFactor.toFixed(2)} × ${complexityFactor.toFixed(2)} × ${otherFactor.toFixed(2)} = ${totalFactor.toFixed(4)}`
    );
  } else {
    lines.push('3. 调整系数：经济适用住房项目按附表二固定标准计取，不适用行业与复杂程度调整系数');
  }
  lines.push(`4. 收费标准依据：${standard.source}`);
  lines.push('——————————————————');
  lines.push('计算过程说明：');
  if (hasNormal) {
    lines.push(
      `5. 计费档位（${FEASIBILITY_BILLING_BASE_LABEL}，万元）：${standard.tierLabels.join(' ｜ ')}`
    );
    lines.push('6. 逐项计算：');
  } else {
    lines.push('5. 逐项计算：');
  }

  items.forEach((it, idx) => {
    lines.push(`   ── 【${idx + 1}】${it.name} ──`);
    if (it.affordable) {
      lines.push(
        `   经济适用住房项目按固定标准计取：估算投资额 ${fmtWan(amount)} 万元 ${amount <= 3000 ? '≤' : '＞'} 3000 万元`
      );
      lines.push(`   固定收费标准 = ${fmtWan(it.base)} 万元（¥${toYuan(it.base).toLocaleString()} 元）`);
      return;
    }

    const loc = it.location!;
    const b = loc.bracket;
    const maxText = Number.isFinite(b.max) ? `${fmtWan(b.max)} 万元` : '无上限';
    lines.push(
      `   估算投资额 ${fmtWan(amount)} 万元位于「${fmtWan(b.min)} 万元 – ${maxText}」档，该档收费区间为 ${fmtWan(b.lo)} – ${fmtWan(b.hi)} 万元`
    );
    if (b.note) lines.push(`      （${b.note}）`);

    if (loc.isTopCapped) {
      lines.push('   估算投资额已达最高档且无上限，按该档收费上限封顶计取');
      lines.push(
        `   基准费用 = ${fmtWan(b.hi)} 万元（¥${toYuan(b.hi).toLocaleString()} 元）`
      );
    } else {
      lines.push(
        `   定位比例 = (${fmtWan(amount)} − ${fmtWan(b.min)}) / (${Number.isFinite(b.max) ? fmtWan(b.max) : '∞'} − ${fmtWan(b.min)}) = ${fmtPct(loc.ratio)}%`
      );
      lines.push(
        `   基准费用 = ${fmtWan(b.lo)} + (${fmtWan(b.hi)} − ${fmtWan(b.lo)}) × ${fmtPct(loc.ratio)}% = ${fmtWan(loc.base)} 万元`
      );
    }

    lines.push(
      `   计算式：${fmtWan(loc.base)} 万元 × ${industryFactor.toFixed(2)}（行业） × ${complexityFactor.toFixed(2)}（复杂程度） × ${otherFactor.toFixed(2)}（其他） = ${fmtWan(it.final)} 万元（¥${toYuan(it.final).toLocaleString()} 元）`
    );
  });

  lines.push('——————————————————');
  lines.push(`项目总前期工作咨询费用：¥${totalYuan.toLocaleString()} 元`);
  if (items.length > 1) {
    lines.push(
      `（${items.map((it) => `${it.name} ${fmtWan(it.final)} 万元`).join(' + ')} = ${fmtWan(totalWan)} 万元）`
    );
  }
  if (hasAffordable && hasNormal) {
    lines.push('说明：经济适用住房项目按附表二固定标准计取，未计入行业与工程复杂程度调整系数。');
  }
  lines.push(`备注：${standard.remark}`);

  return { items, totalFactor, totalWan, totalYuan, reportText: lines.join('\n') };
};
