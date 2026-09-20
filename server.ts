import express from 'express';
import { Request, Response } from 'express';

import { SUPERVISION_STANDARDS, calculateSupervision } from './src/data/supervisionStandards';
import { FEASIBILITY_STANDARDS, calculateFeasibility } from './src/data/feasibilityStandards';
import { DESIGN_STANDARDS, calculateDesign } from './src/data/designStandards';

const app = express();
const port = 3001;

app.use(express.json());

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// CONSTANTS
// ==========================================

// Hunan Constants
const HUNAN_SINGLE_AXIS = [500, 2000, 5000, 10000, 50000]; // 万元
const HUNAN_SINGLE_SERVICE_TYPES = [
  '投资估算编制',
  '投资估算审核',
  '工程概算编制',
  '工程概算审核',
  '编制工程量清单及清单计价',
  '审核工程量清单及清单计价',
  '工程结算编制',
  '工程结算审核（4.2方式）',
  '工程结算审核（4.3基本费用）',
  '工程结算审核（4.3效益费用）',
  '竣工决算编制',
  '竣工决算审核',
  '工程造价纠纷调解',
  '工程造价司法鉴定',
  '工程主材及设备询价（单项）'
];
// Hunan rates are permille (‰)
const HUNAN_SINGLE_SERVICE_RATES = [
  ['1.0%', '0.7%', '0.6%', '0.5%', '0.3%', '0.2%'], // 投资估算编制
  ['0.6%', '0.5%', '0.4%', '0.3%', '0.2%', '0.1%'], // 投资估算审核
  ['2.6%', '1.6%', '1.3%', '1.0%', '0.8%', '0.6%'], // 工程概算编制
  ['1.6%', '1.0%', '0.8%', '0.6%', '0.5%', '0.4%'], // 工程概算审核
  ['6.0%', '4.6%', '3.6%', '2.8%', '2.2%', '1.5%'], // 编制工程量清单及清单计价
  ['5.0%', '3.5%', '2.6%', '2.0%', '1.5%', '1.0%'], // 审核工程量清单及清单计价
  ['6.2%', '4.5%', '3.5%', '1.7%', '1.3%', '1.0%'], // 工程结算编制
  ['8.0%', '6.5%', '6.0%', '4.5%', '3.5%', '2.5%'], // 工程结算审核（4.2方式）
  ['5.0%', '3.5%', '3.0%', '2.5%', '1.5%', '1.0%'], // 工程结算审核（4.3基本费用）
  ['60.0%', '45.0%', '30.0%', '10.0%', '9.0%', '8.0%'], // 工程结算审核（4.3效益费用）- 按效益额差额累进
  ['4.0%', '2.5%', '1.0%', '0.6%', '0.4%', '0.1%'], // 竣工决算编制
  ['2.5%', '2.0%', '0.8%', '0.5%', '0.3%', '0.1%'], // 竣工决算审核
  ['1.5%', '1.3%', '1.1%', '0.82%', '0.65%', '0.48%'], // 工程造价纠纷调解 (保留原设)
  ['10.0%', '8.0%', '6.5%', '5.0%', '4.0%', '3.0%'], // 工程造价司法鉴定
  ['1.5%', '1.3%', '1.1%', '0.82%', '0.65%', '0.48%']  // 工程主材及设备询价（单项）
];

// 湖南省最低收费限额（出处：《湖南省建设工程造价咨询行业服务收费参考标准》）
const HUNAN_MIN_SERVICE_FEE_YUAN = 3000;    // 工程造价咨询服务收费低于 3000 元的，按 3000 元收取
const HUNAN_MIN_APPRAISAL_FEE_YUAN = 10000; // 工程造价鉴定收费不足 1 万元的，按 1 万元收取

const HUNAN_WHOLE_PROCESS_AXIS = [5000, 10000, 50000, 100000]; // 万元（对应 0.5 / 1 / 5 / 10 亿元）
const HUNAN_WHOLE_PROCESS_RATES = {
  // 七、全过程造价咨询服务收费参考标准（不含驻场人员收费价格），单位：‰
  A: [14.0, 12.0, 10.0, 9.0, 8.0],   // A 型，决策阶段至竣工阶段
  B: [13.0, 11.0, 9.0, 8.5, 7.5],    // B 型，设计阶段至竣工阶段
  C: [12.0, 9.5, 8.0, 7.5, 6.5],     // C 型，交易阶段至竣工阶段
  D: [10.0, 8.5, 7.5, 7.0, 6.0]      // D 型，施工阶段至竣工阶段
};

const HUNAN_TRACKING_AUDIT_AXIS = [5000, 10000, 50000, 100000]; // 万元
const HUNAN_TRACKING_AUDIT_RATES = {
  A: [17.0, 15.0, 12.0, 10.0, 9.0],
  B: [15.0, 13.0, 11.0, 9.0, 8.0],
  C: [13.0, 12.0, 10.0, 8.0, 7.0],
  D: [12.0, 10.0, 9.0, 7.0, 6.0]
};

const HUNAN_CATEGORIES = [
  { name: '房屋建筑及其他未涵盖工程', factor: 1.0 },
  { name: '安装工程', factor: 1.3 },
  { name: '装饰装修工程', factor: 1.2 },
  { name: '仿古建筑工程', factor: 1.2 },
  { name: '园林绿化工程', factor: 1.1 },
  { name: '市政工程', factor: 0.8 },
  { name: '公路、道路工程', factor: 0.8 },
  { name: '城市轨道工程', factor: 0.8 },
  { name: '港口工程', factor: 0.8 },
  { name: '机场道路工程', factor: 0.7 },
  { name: '桥梁、隧道工程', factor: 0.7 },
  { name: '水利电力工程', factor: 0.9 },
  { name: '井巷矿山工程', factor: 1.1 }
];

// Guizhou Constants
const GUIZHOU_SINGLE_SERVICE_TYPES = [
  '投资估算编制或审核',
  '设计概算编制或审核',
  '设计概算调整编制或审核',
  '施工图预算编制或审核（定额计价）',
  '工程量清单及招标控制价编制或审核（工程量清单计价）',
  '工程量清单编制或审核',
  '根据工程量清单编制（或审核）招标控制价或投标报价',
  '工程结算编制及核对（依据招标文件等）',
  '工程结算核对直至出具正式结算审核报告',
  '工程结算审核 (基本收费)',
  '工程结算审核 (追加费用)',
  '工程结算复审 (基本收费)',
  '工程结算复审 (追加费用)',
  '项目投资决策和初步阶段全过程造价控制 (可行性研究阶段)',
  '项目投资决策和初步阶段全过程造价控制 (初步设计阶段)',
  '建设项目实施阶段全过程造价控制 (基本收费)',
  '建设项目实施阶段全过程造价控制 (追加费用)',
  '工程造价鉴定',
  '工程造价鉴定 (出庭费)',
  '材料询价（单独委托）',
];
const GUIZHOU_BILLING_BASE_LABELS: Record<string, string> = {
  '投资估算编制或审核': '编制或送审投资估算总额',
  '设计概算编制或审核': '编制或送审设计概算金额',
  '设计概算调整编制或审核': '调整后概算总金额',
  '施工图预算编制或审核（定额计价）': '编制或送审施工图预算金额',
  '工程量清单及招标控制价编制或审核（工程量清单计价）': '编制或送审招标控制价金额',
  '工程量清单编制或审核': '编制或送审招标控制价金额',
  '根据工程量清单编制（或审核）招标控制价或投标报价': '招标控制价或投标报价金额',
  '工程结算编制及核对（依据招标文件等）': '编制工程结算金额',
  '工程结算核对直至出具正式结算审核报告': '经审定的工程结算金额',
  '工程结算审核 (基本收费)': '送审工程结算金额',
  '工程结算审核 (追加费用)': '核减（增）额',
  '工程结算复审 (基本收费)': '送审工程结算金额',
  '工程结算复审 (追加费用)': '核减（增）额',
  '项目投资决策和初步阶段全过程造价控制 (可行性研究阶段)': '投资估算金额',
  '项目投资决策和初步阶段全过程造价控制 (初步设计阶段)': '设计概算金额',
  '建设项目实施阶段全过程造价控制 (基本收费)': '报审工程竣工结算金额',
  '建设项目实施阶段全过程造价控制 (追加费用)': '审减（增）金额',
  '工程造价鉴定': '委托鉴定造价总金额',
  '工程造价鉴定 (出庭费)': '出庭天数/次数',
  '材料询价（单独委托）': '材料询价报告金额',
};
const GUIZHOU_CATEGORIES = [
  { name: '房屋建筑、装配式工程', factor: 1.0 },
  { name: '单独发包的装饰工程', factor: 1.5 },
  { name: '单独发包的安装工程', factor: 1.5 },
  { name: '园林景观工程', factor: 1.2 },
  { name: '单独发包的土石方工程', factor: 0.7 },
  { name: '古建筑保护修复工程', factor: 2.0 },
  { name: '仿古建筑、抗震加固工程', factor: 2.0 },
  { name: '公路、市政（不含桥梁、隧道）工程', factor: 0.8 },
  { name: '桥梁、隧道、水利', factor: 1.0 },
  { name: '给水厂、污水厂、泵站、垃圾厂、通信、电力工程等', factor: 1.3 },
  { name: '机场跑道、城市轨道交通工程', factor: 0.8 },
  { name: '港口工程', factor: 0.8 },
  { name: '市政维护、爆破工程', factor: 1.2 },
  { name: '信息化、大数据等工程', factor: 1.5 },
  { name: '按费率计算的咨询服务费', factor: 0.5 },
  { name: '勘察服务费', factor: 1.0 },
  { name: '其他工程', factor: 1.0 },
];
// Guizhou rates from PDF (permille ‰ except items separately noted)
const GUIZHOU_RATES: Record<string, number[]> = {
  '投资估算编制或审核': [1.3, 1.0, 0.7, 0.5, 0.4, 0.2],
  '设计概算编制或审核': [1.7, 1.5, 1.3, 1.0, 0.8, 0.6],
  '设计概算调整编制或审核': [1.5, 1.25, 1.0, 0.75, 0.5, 0.3],
  '施工图预算编制或审核（定额计价）': [4.0, 3.3, 2.7, 2.3, 2.0, 1.8],
  '工程量清单及招标控制价编制或审核（工程量清单计价）': [5.8, 5.2, 4.4, 3.5, 2.5, 2.0],
  '工程量清单编制或审核': [4.2, 3.6, 3.0, 2.5, 2.0, 1.5],
  '根据工程量清单编制（或审核）招标控制价或投标报价': [2.4, 2.0, 1.6, 1.2, 1.0, 0.8],
  '工程结算编制及核对（依据招标文件等）': [6.0, 5.0, 4.5, 4.0, 3.5, 3.0],
  '工程结算核对直至出具正式结算审核报告': [3.0, 2.5, 2.0, 1.6, 1.3, 1.0],
  '工程结算审核 (基本收费)': [4.0, 3.3, 2.7, 2.3, 2.0, 1.8],
  '工程结算复审 (基本收费)': [3.5, 3.0, 2.5, 2.0, 1.7, 1.5],
  '项目投资决策和初步阶段全过程造价控制 (可行性研究阶段)': [1.8, 1.2, 1.0, 0.8, 0.6, 0.5],
  '项目投资决策和初步阶段全过程造价控制 (初步设计阶段)': [2.2, 1.8, 1.6, 1.2, 1.0, 0.8],
  '建设项目实施阶段全过程造价控制 (基本收费)': [13.4, 12.0, 10.5, 9.0, 7.5, 6.0],
  '工程造价鉴定': [3.0, 2.7, 2.4, 2.0, 1.5, 1.0], // %
  '材料询价（单独委托）': [3.0, 2.5, 2.0, 1.5, 1.0, 0.5]
};

// Zhejiang Constants
const ZHEJIANG_SINGLE_SERVICE_TYPES = [
  '投资估算编制或审核',
  '设计概算编制或审核',
  '方案优化',
  '施工图工程预算编制或审核',
  '工程量清单及招标控制价的编制或审核',
  '工程结算编制',
  '工程结算审核 (基本收费)',
  '工程结算审核 (绩效收费)',
  '竣工决算编制或审核',
  '全过程造价咨询 (基本收费)',
  '全过程造咨询 (绩效收费)',
];
const ZHEJIANG_BILLING_BASE_LABELS: Record<string, string> = {
  '投资估算编制或审核': '估算价',
  '设计概算编制或审核': '概算价',
  '方案优化': '优化节约额',
  '施工图工程预算编制或审核': '预算价',
  '工程量清单及招标控制价的编制或审核': '控制价',
  '工程结算编制': '结算价',
  '工程结算审核 (基本收费)': '送审造价',
  '工程结算审核 (绩效收费)': '核增额及超过5%以外的核减额',
  '竣工决算编制或审核': '项目总投资',
  '全过程造价咨询 (基本收费)': '投资估算',
  '全过程造价咨询 (绩效收费)': '核增额、核减额',
};
// Zhejiang rates are percentage (%)
const ZHEJIANG_RATES: Record<string, number[]> = {
  '投资估算编制或审核': [0.13, 0.11, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04],
  '设计概算编制或审核': [0.17, 0.15, 0.13, 0.11, 0.10, 0.09, 0.08, 0.08],
  '施工图工程预算编制或审核': [0.33, 0.28, 0.25, 0.23, 0.21, 0.19, 0.17, 0.16],
  '工程量清单及招标控制价的编制或审核': [0.40, 0.36, 0.33, 0.30, 0.26, 0.23, 0.20, 0.19],
  '工程结算编制': [0.33, 0.29, 0.25, 0.21, 0.21, 0.17, 0.09, 0.09],
  '工程结算审核 (基本收费)': [0.34, 0.30, 0.26, 0.23, 0.21, 0.18, 0.15, 0.12],
  '竣工决算编制或审核': [0.20, 0.16, 0.12, 0.08, 0.05, 0.03, 0.01, 0.01],
  '全过程造价咨询 (基本收费)': [1.50, 1.38, 1.25, 1.13, 0.88, 0.75, 0.63, 0.55],
};

interface CustomProvince {
  name: string;
  hasCategoryStep: boolean;
  categories: { name: string; factor: number }[];
  services: {
    name: string;
    billingBase: string;
    rateType: 'percentage' | 'progressive';
    rateValue: number;
    progressiveRates?: number[];
    progressiveBrackets?: number[];
  }[];
}

const WHOLE_PROCESS_STAGE_LABELS: Record<string, string> = {
  A: '决策阶段至竣工阶段',
  B: '设计阶段至竣工阶段',
  C: '交易阶段至竣工阶段',
  D: '施工阶段至竣工阶段',
};

// 数值展示：最多保留 2 位小数
const formatNum = (value: number) => String(Math.round(value * 100) / 100);

// 各收费表的阶梯区间描述（与标准原文口径一致）
const WHOLE_PROCESS_TIER_LABELS = ['0.5亿元以下（不含0.5）', '0.5-1亿元', '1-5亿元', '5-10亿元', '10亿元以上'];
const SINGLE_SERVICE_TIER_LABELS = ['500万元以下', '500-2000万元', '2000-5000万元', '5000-10000万元', '10000-50000万元', '50000万元以上'];
const TRACKING_AUDIT_TIER_LABELS = ['5000万元以下', '5000-10000万元', '10000-50000万元', '50000-100000万元', '100000万元以上'];

// 依据阶梯边界返回「所在区间」描述
const describeTierOf = (costWanyuan: number, brackets: number[], labels: string[]) => {
  let idx = brackets.findIndex((b) => costWanyuan < b);
  if (idx === -1) idx = brackets.length;
  return labels[Math.min(idx, labels.length - 1)];
};

// 解析工程类别：前端可显式传入「固定系数」或「自定义系数」，此时以传入值优先
const resolveCategory = (
  fallback: { name: string; factor: number },
  overrideName: unknown,
  overrideFactor: unknown,
) => {
  if (typeof overrideFactor === 'number' && Number.isFinite(overrideFactor)) {
    const name = typeof overrideName === 'string' && overrideName ? overrideName : '自定义系数';
    return { name, factor: overrideFactor };
  }
  return fallback;
};

// 费率单位 → 计算除数映射（‰ 千分比 / % 百分比 / 无单位系数）
const RATE_UNITS = {
  '‰': { divisor: 1000, suffix: '‰' },
  '%': { divisor: 100, suffix: '%' },
  '': { divisor: 1, suffix: '' },
} as const;
type RateUnit = keyof typeof RATE_UNITS;

// 生成差额累进的分段明细（costWanyuan 单位：万元；rateValues 为配置原始值）
const buildProgressiveSegments = (
  costWanyuan: number,
  brackets: number[],
  rateValues: number[],
  rateUnit: RateUnit = '‰',
) => {
  const { divisor } = RATE_UNITS[rateUnit];
  const segments: { from: number; amount: number; rate: number; feeWanyuan: number }[] = [];
  let prev = 0;
  let remaining = costWanyuan;

  for (let i = 0; i < brackets.length && remaining > 0; i++) {
    const limit = brackets[i] - prev;
    const amount = Math.min(remaining, limit);
    const rate = rateValues[i];
    segments.push({ from: prev, amount, rate, feeWanyuan: (amount * rate) / divisor });
    remaining -= amount;
    prev = brackets[i];
  }

  if (remaining > 0) {
    const rate = rateValues[rateValues.length - 1];
    segments.push({ from: prev, amount: remaining, rate, feeWanyuan: (remaining * rate) / divisor });
  }

  return segments;
};

// 生成形如「（5000万*14‰+1000万*12‰）*1.0=82万元」的计算式
// categoryFactor 省略时输出不含类别系数的累进式「（...）=82万元」
const buildProgressiveFormula = (
  segments: { amount: number; rate: number; feeWanyuan: number }[],
  categoryFactor?: number,
  rateUnit: RateUnit = '‰',
) => {
  const suffix = RATE_UNITS[rateUnit].suffix;
  const inner = segments.map((s) => `${formatNum(s.amount)}万*${formatNum(s.rate)}${suffix}`).join('+');
  const baseFeeWanyuan = segments.reduce((sum, s) => sum + s.feeWanyuan, 0);
  if (categoryFactor === undefined) {
    return `（${inner}）=${formatNum(baseFeeWanyuan)}万元`;
  }
  return `（${inner}）*${categoryFactor.toFixed(1)}=${formatNum(baseFeeWanyuan * categoryFactor)}万元`;
};

// 生成「计算过程说明」中差额累进的详细文本块
// categoryFactor 省略时仅输出「累进小计」，由调用方自行拼接最终计算式（如跟踪审计含二类费用）
const buildProgressiveDetailLines = (
  label: string,
  costWanyuan: number,
  brackets: number[],
  rateValues: number[],
  tierLabels: string[],
  categoryFactor?: number,
  rateUnit: RateUnit = '‰',
) => {
  const suffix = RATE_UNITS[rateUnit].suffix;
  const segments = buildProgressiveSegments(costWanyuan, brackets, rateValues, rateUnit);
  const baseFeeWanyuan = segments.reduce((sum, s) => sum + s.feeWanyuan, 0);

  const lines = [
    ` 【${label}】计费基数 ${formatNum(costWanyuan)} 万元，位于「${describeTierOf(costWanyuan, brackets, tierLabels)}」区间`,
    ...segments.map((s, i) =>
      `   第${i + 1}档：${formatNum(s.from)}～${formatNum(s.from + s.amount)}万元 × ${formatNum(s.rate)}${suffix} = ${formatNum(s.feeWanyuan)}万元`
    ),
    `   差额累进小计（未乘类别系数）：${formatNum(baseFeeWanyuan)}万元（¥${Math.round(baseFeeWanyuan * 10000).toLocaleString()} 元）`,
  ];

  if (categoryFactor !== undefined) {
    lines.push(
      `   计算式：${buildProgressiveFormula(segments, categoryFactor, rateUnit)}（¥${Math.round(baseFeeWanyuan * categoryFactor * 10000).toLocaleString()} 元）`
    );
  }

  return lines;
};

// 生成「按固定费率（比例）计费」的明细文本块
const buildFlatRateDetailLines = (
  label: string,
  costWanyuan: number,
  rateDescription: string,
  baseFeeWanyuan: number,
  categoryFactor: number,
) => [
  ` 【${label}】计费基数 ${formatNum(costWanyuan)} 万元`,
  `   按固定费率计算：${formatNum(costWanyuan)}万元 × ${rateDescription} = ${formatNum(baseFeeWanyuan)}万元（¥${Math.round(baseFeeWanyuan * 10000).toLocaleString()} 元）`,
  `   计算式：（${formatNum(costWanyuan)}万*${rateDescription}）*${categoryFactor.toFixed(1)}=${formatNum(baseFeeWanyuan * categoryFactor)}万元（¥${Math.round(baseFeeWanyuan * categoryFactor * 10000).toLocaleString()} 元）`,
];

// 统一测算报告模板（与湖南省保持一致）
const buildConsultingReportText = (opts: {
  title: string;
  provinceLabel: string;
  serviceType: string;
  billingBaseLabel: string;
  projects: { name?: string; cost: string }[];
  categoryFactor: number;
  categoryName: string;
  rateBasisLines: string[];
  tierDescription: string;
  tierLabels: string[];
  detailLines: string[];
  detailHeading?: string;
  adjustedYuan: number;
  minAdjustmentLine?: string;
  footerLabel: string;
  totalYuan: number;
  remark: string;
}) => {
  const lines = [
    `【${opts.title} (${opts.provinceLabel})】`,
    `1. 服务类型：${opts.serviceType}`,
    `2. 计费基数 (${opts.billingBaseLabel})：${opts.projects.map(p => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}`,
    `3. 工程类别调整系数：${opts.categoryFactor.toFixed(1)}（对应类型：${opts.categoryName}）`,
    `4. 费率依据：${opts.rateBasisLines[0]}`,
    ...opts.rateBasisLines.slice(1).map(line => `   ${line}`),
    '——————————————————',
    '计算过程说明：',
    opts.tierLabels.length > 0
      ? `5. 阶梯区间划分（${opts.tierDescription}）：${opts.tierLabels.join('｜')}`
      : `5. 本服务按固定费率计取，无阶梯区间划分（${opts.tierDescription}）`,
    `6. ${opts.detailHeading || '按差额累进方法计算（分段明细）'}：`,
    ...opts.detailLines,
    `7. 类别系数折算后金额：¥${Math.round(opts.adjustedYuan).toLocaleString()} 元`,
  ];

  if (opts.minAdjustmentLine) lines.push(opts.minAdjustmentLine);

  lines.push(
    '——————————————————',
    `${opts.footerLabel}：¥${Math.round(opts.totalYuan).toLocaleString()} 元`,
    `备注：${opts.remark}`,
  );

  return lines.join('\n');
};

// 依据阶梯边界自动生成区间描述（用于非湖南省份的报告）
const buildTierLabels = (brackets: number[]) => {
  const labels: string[] = [];
  let prev = 0;
  const unit = (v: number) => (v >= 10000 ? `${formatNum(v / 10000)}亿元` : `${formatNum(v)}万元`);
  for (const b of brackets) {
    if (prev === 0) {
      labels.push(`${unit(b)}以下`);
    } else if (b >= 10000 && prev >= 10000) {
      labels.push(`${unit(prev)}-${unit(b)}`);
    } else if (b >= 10000) {
      labels.push(`${formatNum(prev)}万-${unit(b)}`);
    } else {
      labels.push(`${formatNum(prev)}-${formatNum(b)}万元`);
    }
    prev = b;
  }
  labels.push(`${unit(prev)}以上`);
  return labels;
};

// ==========================================
// CALCULATION CORE HELPER FUNCTIONS
// ==========================================

const calculateProgressiveFeeWanyuan = (costVal: number, brackets: number[], rates: number[]) => {
  let fee = 0;
  let remaining = costVal;
  let prevLimit = 0;

  for (let i = 0; i < brackets.length; i++) {
    const limit = brackets[i] - prevLimit;
    const rate = rates[i];
    if (remaining <= limit) {
      fee += remaining * rate;
      remaining = 0;
      break;
    } else {
      fee += limit * rate;
      remaining -= limit;
      prevLimit = brackets[i];
    }
  }

  if (remaining > 0) {
    fee += remaining * rates[rates.length - 1];
  }

  return fee;
};

// Hunan Progressive Fee Calculator (Uses 亿元 and divides rates by 1000 for permille ‰)
const calculateHunanProgressiveFee = (value: number, axis: number[], rates: number[]) => {
  let totalFee = 0;
  for (let i = 0; i < axis.length; i++) {
    const start = axis[i];
    const end = i < axis.length - 1 ? axis[i + 1] : Infinity;
    const rate = rates[i];
    
    if (value > start) {
      const amountInTier = Math.min(value, end) - start;
      totalFee += amountInTier * rate;
    } else {
      break;
    }
  }
  return totalFee;
};

// ==========================================
// CONTROLLER (POST /api/calculate)
// ==========================================

app.post('/api/calculate', (req: Request, res: Response) => {
  try {
    const {
      province,
      serviceType,
      specificType,
      categoryIndex,
      categoryName,
      categoryFactor: categoryFactorOverride,
      unitProjects,
      secondCategoryCost,
      customProvince
    } = req.body;

    const validProjects = (unitProjects || []).filter((p: any) => parseFloat(p.cost) > 0);
    if (validProjects.length === 0) {
      return res.status(400).json({ error: '请输入至少一个有效的单位工程造价（计费基数）' });
    }

    // 1. 湖南省 Calculation (Permille, No minimum charge limit)
    if (province === '湖南省') {
      let totalYuan = 0;
      let detailLines: string[] = [];
      const catIdx = categoryIndex !== null ? Number(categoryIndex) : 0;
      const category = resolveCategory(
        HUNAN_CATEGORIES[catIdx] || { name: '通用工程', factor: 1.0 },
        categoryName,
        categoryFactorOverride
      );
      const categoryFactor = category.factor;

      if (serviceType === 1) {
        const typeIndex = HUNAN_SINGLE_SERVICE_TYPES.indexOf(specificType);
        if (typeIndex === -1) {
          return res.status(400).json({ error: `湖南省不支持细分项：${specificType}` });
        }

        // 工程结算审核（4.3效益费用）按效益额差额累进，其余按单项服务费率表（单位：‰）
        const permilleRates = specificType === '工程结算审核（4.3效益费用）'
          ? [60.0, 45.0, 30.0, 10.0, 9.0, 8.0]
          : HUNAN_SINGLE_SERVICE_RATES[typeIndex].map(r => parseFloat(r.replace('%', '')));
        const rates = permilleRates.map(r => r / 1000);
        const brackets = [500, 2000, 5000, 10000, 50000];

        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeInYuan = calculateProgressiveFeeWanyuan(costVal, brackets, rates) * 10000;
          const adjustedFeeInYuan = baseFeeInYuan * categoryFactor;
          totalYuan += adjustedFeeInYuan;

          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              permilleRates,
              SINGLE_SERVICE_TIER_LABELS,
              categoryFactor
            )
          );
        });

        const beforeAdjustYuan = totalYuan;
        const isAppraisal = specificType.includes('鉴定');
        const minFeeYuan = isAppraisal ? HUNAN_MIN_APPRAISAL_FEE_YUAN : HUNAN_MIN_SERVICE_FEE_YUAN;
        let isAdjusted = false;
        let adjustmentMsg = '';
        if (totalYuan < minFeeYuan) {
          totalYuan = minFeeYuan;
          isAdjusted = true;
          adjustmentMsg = isAppraisal
            ? `9. 最低收费限额调整：工程造价鉴定收费不足 1 万元的，按 1 万元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥10,000 元）`
            : `9. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
        }

        const reportText = `【单项造价服务费测算报告 (湖南省)】
1. 服务地区：湖南省
2. 服务类型：${specificType}
3. 计费基数 (估算/概算/结算金额)：${validProjects.map((p: any) => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
4. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
5. 费率依据：湘价协收费价格表（千分比 ‰ 差额累进计算）
   ${specificType} 阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
6. 阶梯区间划分（计费基数，单位：万元）：500以下｜500-2000｜2000-5000｜5000-10000｜10000-50000｜50000以上
7. 按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
8. 类别系数折算后金额：¥${Math.round(beforeAdjustYuan).toLocaleString()} 元
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总造价服务费用：¥${Math.round(totalYuan).toLocaleString()} 元
备注：本费用仅出具造价报告，不含驻场人员收费价格。`;

        return res.json({ totalFee: Math.round(totalYuan), reportText });

      } else if (serviceType === 2) {
        const match = specificType.match(/（([A-D])型）/);
        const packageType = match ? match[1] : 'A';
        const permilleRates = (HUNAN_WHOLE_PROCESS_RATES[packageType as 'A' | 'B' | 'C' | 'D'] || HUNAN_WHOLE_PROCESS_RATES.A);
        const rates = permilleRates.map(r => r / 1000);
        const brackets = [5000, 10000, 50000, 100000]; // in 万元
        const stageLabel = WHOLE_PROCESS_STAGE_LABELS[packageType] || '';

        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeInYuan = calculateProgressiveFeeWanyuan(costVal, brackets, rates) * 10000;
          const adjustedFeeInYuan = baseFeeInYuan * categoryFactor;

          totalYuan += adjustedFeeInYuan;

          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              permilleRates,
              WHOLE_PROCESS_TIER_LABELS,
              categoryFactor
            )
          );
        });

        const beforeAdjustYuan = totalYuan;
        let isAdjusted = false;
        let adjustmentMsg = '';
        if (totalYuan < HUNAN_MIN_SERVICE_FEE_YUAN) {
          totalYuan = HUNAN_MIN_SERVICE_FEE_YUAN;
          isAdjusted = true;
          adjustmentMsg = `9. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
        }

        const reportText = `【全过程造价咨询服务费测算报告 (湖南省)】
1. 服务地区：湖南省
2. 服务类型：${specificType}
3. 计费基数 (项目投资估算/概算金额)：${validProjects.map((p: any) => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
4. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
5. 费率依据：《湖南省建设工程造价咨询行业服务收费参考标准》第七部分「全过程造价咨询服务收费参考标准（不含驻场人员收费价格）」
   ${packageType} 型（${stageLabel}）阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
6. 阶梯区间划分（估算或概算造价，单位：亿元）：0.5以下（不含0.5）｜0.5-1｜1-5｜5-10｜10以上
7. 按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
8. 类别系数折算后金额：¥${Math.round(beforeAdjustYuan).toLocaleString()} 元
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总咨询费用：¥${Math.round(totalYuan).toLocaleString()} 元
备注：本费用为全过程造价咨询服务包干费用，不含驻场人员收费价格。`;

        return res.json({ totalFee: Math.round(totalYuan), reportText });

      } else if (serviceType === 3) {
        const match = specificType.match(/（([A-D])型）/);
        const packageType = match ? match[1] : 'A';
        const permilleRates = (HUNAN_TRACKING_AUDIT_RATES[packageType as 'A' | 'B' | 'C' | 'D'] || HUNAN_TRACKING_AUDIT_RATES.A);
        const rates = permilleRates.map(r => r / 1000);
        const brackets = [5000, 10000, 50000, 100000]; // in 万元

        let buildBaseFeeYuan = 0;
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeInYuan = calculateProgressiveFeeWanyuan(costVal, brackets, rates) * 10000;
          buildBaseFeeYuan += baseFeeInYuan;

          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              permilleRates,
              TRACKING_AUDIT_TIER_LABELS
            )
          );
        });

        const secondCostVal = parseFloat(secondCategoryCost) || 0;
        const secondCostDiscountedYuan = secondCostVal * 10000 * 0.2; // Note: PDF 湘价协附表10备注第4条: "二类费用（如设计费、监理费、咨询费等）可以按20%的折扣计取"!
        const finalFeeYuan = (buildBaseFeeYuan + secondCostDiscountedYuan) * categoryFactor;

        const beforeAdjustYuan = finalFeeYuan;
        let adjustedFinalFeeYuan = finalFeeYuan;
        let isAdjusted = false;
        let adjustmentMsg = '';
        if (adjustedFinalFeeYuan < HUNAN_MIN_SERVICE_FEE_YUAN) {
          adjustedFinalFeeYuan = HUNAN_MIN_SERVICE_FEE_YUAN;
          isAdjusted = true;
          adjustmentMsg = `12. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
        }

        const reportText = `【全过程跟踪审计费测算报告 (湖南省)】
1. 服务地区：湖南省
2. 服务类型：${specificType}
3. 计费基数 (项目建安造价)：${validProjects.map((p: any) => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
4. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
5. 费率依据：湘价协附表10「全过程跟踪审计收费表」（千分比 ‰ 差额累进计算）
   ${packageType} 型阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
6. 阶梯区间划分（建安造价，单位：万元）：5000以下｜5000-10000｜10000-50000｜50000-100000｜100000以上
7. 建安部分按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
8. 二类费用折算（出处：附表10 备注第4条，二类费用可按 20% 折扣计取）：
   二类费用总额 ${formatNum(secondCostVal)}万元 × 20% = ${formatNum(secondCostVal * 0.2)}万元（¥${Math.round(secondCostDiscountedYuan).toLocaleString()} 元）
9. 计算式：（建安部分差额累进合计 ${formatNum(buildBaseFeeYuan / 10000)}万元 + 二类费用折算 ${formatNum(secondCostDiscountedYuan / 10000)}万元）*${categoryFactor.toFixed(1)}=${formatNum(finalFeeYuan / 10000)}万元（¥${Math.round(finalFeeYuan).toLocaleString()} 元）
10. 驻场人员薪酬单独额外累加，不计入本表包干费率
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总跟踪审计费用：¥${Math.round(adjustedFinalFeeYuan).toLocaleString()} 元
备注：本包干费用已包含全部审计工作。`;

        return res.json({ totalFee: Math.round(adjustedFinalFeeYuan), reportText });
      }
    }

    // 2. 贵州省 Calculation (Permille, Minimum 3000 limit, Appraisal minimum 5000 limit)
    if (province === '贵州省') {
      const catIdx = categoryIndex !== null ? Number(categoryIndex) : 0;
      const category = resolveCategory(
        GUIZHOU_CATEGORIES[catIdx] || { name: '通用工程', factor: 1.0 },
        categoryName,
        categoryFactorOverride
      );
      const categoryFactor = category.factor;
      const type = specificType;
      const isAppraisal = type.includes('工程造价鉴定');
      const isAdditional = type.includes('追加费用');
      const isCourtFee = type === '工程造价鉴定 (出庭费)';
      const brackets = [500, 1000, 5000, 10000, 50000];
      const tierLabels = buildTierLabels(brackets);
      let totalYuan = 0;
      const detailLines: string[] = [];
      let rateBasisLines: string[] = [];

      if (isAdditional) {
        const isReview = type === '工程结算复审 (追加费用)';
        const rateText = isReview ? '8.0%' : '6.0%';
        const rateDecimal = isReview ? 0.08 : 0.06;
        rateBasisLines = [
          '贵州省发展改革委/住房城乡建设厅收费指导意见（按固定比例计取）',
          `${type} 计费费率：${rateText}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = costVal * rateDecimal;
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildFlatRateDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              rateText,
              baseFeeWanyuan,
              categoryFactor
            )
          );
        });
      } else if (isCourtFee) {
        rateBasisLines = [
          '贵州省发展改革委/住房城乡建设厅收费指导意见（按出庭人次计取）',
          `${type} 计费标准：3,000 元/人·次`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 人·次
          const baseFeeWanyuan = (costVal * 3000) / 10000;
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ` 【${proj.name || `单位工程 ${idx + 1}`}】出庭天数/次数 ${formatNum(costVal)} 人·次`,
            `   按固定标准计算：${formatNum(costVal)}人·次 × 3,000元/人·次 = ${formatNum(baseFeeWanyuan)}万元（¥${Math.round(baseFeeWanyuan * 10000).toLocaleString()} 元）`,
            `   计算式：（${formatNum(costVal)}人·次*3000元）*${categoryFactor.toFixed(1)}=${formatNum(baseFeeWanyuan * categoryFactor)}万元（¥${Math.round(baseFeeWanyuan * categoryFactor * 10000).toLocaleString()} 元）`,
          );
        });
      } else {
        // 工程造价鉴定按百分比 % 计取，其余按千分比 ‰ 计取
        const rateUnit: RateUnit = isAppraisal ? '%' : '‰';
        const rawRates = GUIZHOU_RATES[type] || [1.3, 1.0, 0.7, 0.5, 0.4, 0.2];
        const divisor = RATE_UNITS[rateUnit].divisor;
        rateBasisLines = [
          `贵州省发展改革委/住房城乡建设厅收费指导意见（${isAppraisal ? '百分比 %' : '千分比 ‰'}差额累进计算）`,
          `${type} 阶梯费率：${rawRates.map(v => `${formatNum(v)}${RATE_UNITS[rateUnit].suffix}`).join(' / ')}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = calculateProgressiveFeeWanyuan(costVal, brackets, rawRates.map(r => r / divisor));
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              rawRates,
              tierLabels,
              categoryFactor,
              rateUnit
            )
          );
        });
      }

      const beforeAdjustYuan = totalYuan;
      let isAdjusted = false;
      let adjustmentMsg = '';
      const minFeeYuan = isAppraisal ? 5000 : 3000;

      if (totalYuan < minFeeYuan) {
        totalYuan = minFeeYuan;
        isAdjusted = true;
        adjustmentMsg = isAppraisal
          ? `8. 最低收费限额调整：工程造价鉴定收费不足 5,000 元的，按 5,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥5,000 元）`
          : `8. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }

      const reportText = buildConsultingReportText({
        title: '造价咨询服务费测算结果',
        provinceLabel: '贵州省标准',
        serviceType: type,
        billingBaseLabel: GUIZHOU_BILLING_BASE_LABELS[type] || '计费基数',
        projects: validProjects,
        categoryFactor,
        categoryName: category.name,
        rateBasisLines,
        tierDescription: isCourtFee ? '出庭人次，单位：人·次' : '计费基数，单位：万元',
        tierLabels: isCourtFee ? [] : tierLabels,
        detailLines,
        detailHeading: isCourtFee ? '按出庭人次标准计算' : undefined,
        adjustedYuan: beforeAdjustYuan,
        minAdjustmentLine: isAdjusted ? adjustmentMsg : undefined,
        footerLabel: '项目总咨询费用',
        totalYuan,
        remark: '本测算已结合贵州省自律性指导标准约定的单次收费底线（普通项目 3,000 元，工程造价鉴定 5,000 元）完成限额校对。',
      });

      return res.json({ totalFee: Math.round(totalYuan), reportText });
    }

    // 3. 浙江省 Calculation (Percentage, Minimum 3000 limit, Category factor supported)
    if (province === '浙江省') {
      const type = specificType;
      const brackets = [100, 500, 1000, 2000, 5000, 10000, 50000];
      const tierLabels = buildTierLabels(brackets);
      // 浙江省无独立工程类别系数表，默认固定系数 1.0，支持前端传入自定义系数
      const category = resolveCategory({ name: '固定系数 1.0', factor: 1.0 }, categoryName, categoryFactorOverride);
      const categoryFactor = category.factor;
      let totalYuan = 0;
      const detailLines: string[] = [];
      let rateBasisLines: string[] = [];
      let isFlatRate = false;

      if (type === '方案优化' || type === '工程结算审核 (绩效收费)' || type === '全过程造价咨询 (绩效收费)') {
        const isOptimize = type === '方案优化';
        isFlatRate = true;
        const rateText = isOptimize ? '8.0%' : '5.0%';
        const rateDecimal = isOptimize ? 0.08 : 0.05;
        rateBasisLines = [
          '浙江省建设工程造价咨询行业建议收费标准（按固定比例计取）',
          `${type} 计费费率：${rateText}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = costVal * rateDecimal;
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildFlatRateDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              rateText,
              baseFeeWanyuan,
              categoryFactor
            )
          );
        });
      } else {
        const percentRates = ZHEJIANG_RATES[type] || [0.13, 0.11, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04];
        rateBasisLines = [
          '浙江省建设工程造价咨询行业建议收费标准（百分比 % 差额累进计算）',
          `${type} 阶梯费率：${percentRates.map(v => `${formatNum(v)}%`).join(' / ')}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = calculateProgressiveFeeWanyuan(costVal, brackets, percentRates.map(r => r / 100));
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              percentRates,
              tierLabels,
              categoryFactor,
              '%'
            )
          );
        });
      }

      const beforeAdjustYuan = totalYuan;
      let isAdjusted = false;
      let adjustmentMsg = '';

      if (totalYuan < 3000) {
        totalYuan = 3000;
        isAdjusted = true;
        adjustmentMsg = `8. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }

      const reportText = buildConsultingReportText({
        title: '造价咨询服务费测算结果',
        provinceLabel: '浙江省标准',
        serviceType: type,
        billingBaseLabel: ZHEJIANG_BILLING_BASE_LABELS[type] || '计费基数',
        projects: validProjects,
        categoryFactor,
        categoryName: category.name,
        rateBasisLines,
        tierDescription: '计费基数，单位：万元',
        tierLabels: isFlatRate ? [] : tierLabels,
        detailLines,
        detailHeading: isFlatRate ? '按固定费率计算' : undefined,
        adjustedYuan: beforeAdjustYuan,
        minAdjustmentLine: isAdjusted ? adjustmentMsg : undefined,
        footerLabel: '项目总咨询费用',
        totalYuan,
        remark: '根据浙江省行业收费规范，造价咨询业务单次计费总费用不足 3,000 元的，按 3,000 元底线标准起收。',
      });

      return res.json({ totalFee: Math.round(totalYuan), reportText });
    }

    // 4. Custom Province Calculation
    if (customProvince) {
      const custom: CustomProvince = customProvince;
      const type = specificType;
      const service = custom.services.find(s => s.name === type);
      if (!service) {
        return res.status(400).json({ error: `自定义省份不支持该收费服务项目：${type}` });
      }

      const catIdx = categoryIndex !== null ? Number(categoryIndex) : 0;
      const category = resolveCategory(
        custom.categories[catIdx] || { name: '通用工程', factor: 1.0 },
        categoryName,
        categoryFactorOverride
      );
      const categoryFactor = category.factor;

      let totalYuan = 0;
      const detailLines: string[] = [];
      let rateBasisLines: string[] = [];
      let brackets: number[] = [];

      if (service.rateType === 'percentage') {
        const rateText = `${(service.rateValue * 100).toFixed(3)}%`;
        rateBasisLines = [
          `${custom.name}自定义收费标准（按固定比例计取）`,
          `${type} 计费费率：${rateText}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = costVal * service.rateValue;
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildFlatRateDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              rateText,
              baseFeeWanyuan,
              categoryFactor
            )
          );
        });
      } else {
        const rateValues = service.progressiveRates || [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001];
        brackets = service.progressiveBrackets || [100, 500, 1000, 2000, 5000, 10000, 50000];
        rateBasisLines = [
          `${custom.name}自定义收费标准（差额累进计算）`,
          `${type} 阶梯费率：${rateValues.map(v => formatNum(v)).join(' / ')}`,
        ];
        validProjects.forEach((proj: any, idx: number) => {
          const costVal = parseFloat(proj.cost); // 万元
          const baseFeeWanyuan = calculateProgressiveFeeWanyuan(costVal, brackets, rateValues);
          totalYuan += baseFeeWanyuan * categoryFactor * 10000;
          detailLines.push(
            ...buildProgressiveDetailLines(
              proj.name || `单位工程 ${idx + 1}`,
              costVal,
              brackets,
              rateValues,
              buildTierLabels(brackets),
              categoryFactor,
              ''
            )
          );
        });
      }

      const reportText = buildConsultingReportText({
        title: '造价咨询服务费测算结果',
        provinceLabel: `${custom.name}标准`,
        serviceType: type,
        billingBaseLabel: service.billingBase || '计费基数',
        projects: validProjects,
        categoryFactor,
        categoryName: category.name,
        rateBasisLines,
        tierDescription: service.rateType === 'percentage' ? '计费基数，单位：万元（按固定比例计取）' : '计费基数，单位：万元',
        tierLabels: service.rateType === 'percentage' ? [] : buildTierLabels(brackets),
        detailLines,
        detailHeading: service.rateType === 'percentage' ? '按固定费率计算' : undefined,
        adjustedYuan: totalYuan,
        footerLabel: '项目总咨询费用',
        totalYuan,
        remark: `本测算依据${custom.name}自定义收费标准与系数计算，仅供内部参考。`,
      });

      return res.json({ totalFee: Math.round(totalYuan), reportText });
    }

    return res.status(400).json({ error: '无法识别的省份或计算配置' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: '后端计算服务发生异常: ' + err.message });
  }
});

// ==========================================
// 施工监理服务费（河南 / 湖南 / 沪苏浙）
// ==========================================

app.post('/api/calculate-supervision', (req: Request, res: Response) => {
  try {
    const {
      province,
      serviceType,
      amount,
      categoryName,
      categoryFactor,
      extraFactor,
      extraLabels,
      delegateRatio,
      withSafety,
    } = req.body;

    const standard = SUPERVISION_STANDARDS[province];
    if (!standard) {
      return res.status(400).json({ error: `不支持的监理费测算省份：${province}` });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: '请输入有效的计费额' });
    }
    const factor = Number(categoryFactor);
    if (!Number.isFinite(factor) || factor <= 0) {
      return res.status(400).json({ error: '请选择工程类别或自定义系数' });
    }

    const result = calculateSupervision({
      standard,
      amount: amt,
      serviceType: String(serviceType || ''),
      categoryName: String(categoryName || '固定系数 1.0'),
      categoryFactor: factor,
      extraFactor: Number(extraFactor) || 0,
      extraLabels: Array.isArray(extraLabels) ? extraLabels.map(String) : [],
      delegateRatio: Number(delegateRatio) || 1,
      withSafety: !!withSafety,
    });

    return res.json({ totalFee: Math.round(result.finalYuan), reportText: result.reportText });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: '监理费计算服务发生异常: ' + err.message });
  }
});

// ==========================================
// 建设项目前期工作咨询费（工程可研费：湖南 / 浙江 / 广西）
// ==========================================

app.post('/api/calculate-feasibility', (req: Request, res: Response) => {
  try {
    const {
      province,
      serviceKeys,
      amount,
      industryFactor,
      industryLabel,
      complexityFactor,
      otherFactor,
      otherLabels,
    } = req.body;

    const standard = FEASIBILITY_STANDARDS[province];
    if (!standard) {
      return res.status(400).json({ error: `不支持的可研费测算省份：${province}` });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: '请输入有效的估算投资额' });
    }

    const keys = Array.isArray(serviceKeys) ? serviceKeys.map(String) : [];
    if (keys.length === 0) {
      return res.status(400).json({ error: '请至少选择一项咨询服务类型' });
    }

    const result = calculateFeasibility({
      standard,
      amount: amt,
      serviceKeys: keys,
      industryFactor: Number(industryFactor) || 1,
      industryLabel: String(industryLabel || '未指定'),
      complexityFactor: Number(complexityFactor) || 1,
      otherFactor: Number(otherFactor) || 1,
      otherLabels: Array.isArray(otherLabels) ? otherLabels.map(String) : [],
    });

    return res.json({
      totalFee: result.totalYuan,
      totalWan: result.totalWan,
      reportText: result.reportText,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: '可研费计算服务发生异常: ' + err.message });
  }
});

// ==========================================
// 工程设计费（计价格〔2002〕10号 第 7 章 建筑市政工程设计）
// ==========================================

app.post('/api/calculate-design', (req: Request, res: Response) => {
  try {
    const {
      province,
      provinceLabel,
      amount,
      categoryName,
      billingNote,
      professionFactor,
      complexityTableName,
      complexityName,
      complexityFactor,
      additionalFactors,
      modeName,
      modeFactor,
      otherFees,
      phase,
      standard: standardSnapshot,
    } = req.body;

    // 自定义省份：优先使用前端传入的 standard 快照；否则回退到内置口径（仅「全国」）
    const standard =
      standardSnapshot && Array.isArray(standardSnapshot.axis) && Array.isArray(standardSnapshot.prices)
        ? (standardSnapshot as (typeof DESIGN_STANDARDS)[string])
        : DESIGN_STANDARDS[province];
    if (!standard) {
      return res.status(400).json({ error: `不支持的设计费测算口径：${province}` });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: '请输入有效的计费额' });
    }

    const pFactor = Number(professionFactor);
    if (!Number.isFinite(pFactor) || pFactor <= 0) {
      return res.status(400).json({ error: '请选择工程类别或自定义专业系数' });
    }

    const result = calculateDesign({
      standard,
      provinceLabel: provinceLabel ? String(provinceLabel) : undefined,
      amount: amt,
      categoryName: String(categoryName || '建筑、市政、电信工程'),
      billingNote: billingNote ? String(billingNote) : undefined,
      professionFactor: pFactor,
      complexityTableName: complexityTableName ? String(complexityTableName) : undefined,
      complexityName: String(complexityName || '未指定'),
      complexityFactor: Number(complexityFactor) || 1,
      additionalFactors: Array.isArray(additionalFactors)
        ? additionalFactors.map((f: any) => ({ name: String(f?.name ?? ''), factor: Number(f?.factor) || 1 }))
        : [],
      modeName: String(modeName || '新建项目'),
      modeFactor: Number(modeFactor) || 1,
      otherFees: Array.isArray(otherFees)
        ? otherFees.map((f: any) => ({ name: String(f?.name ?? ''), ratio: Number(f?.ratio) || 0 }))
        : [],
      phase: {
        name: String(phase?.name || '未指定'),
        p1: Number(phase?.p1) || 0,
        p2: Number(phase?.p2) || 0,
        p3: Number(phase?.p3) || 0,
      },
    });

    return res.json({
      totalFee: result.finalYuan,
      totalWan: result.finalWan,
      reportText: result.reportText,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: '设计费计算服务发生异常: ' + err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
