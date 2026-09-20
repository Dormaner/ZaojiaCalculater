/**
 * 施工阶段监理服务费计费标准（河南 / 湖南 / 沪苏浙）
 *
 * 数据出处：
 * - 河南省建设监理协会《河南省建设工程施工监理费计费规则》（豫建监协〔2015〕19号）
 * - 《湖南省建设工程施工阶段监理服务费计费规则》
 * - 上海市建设工程咨询行业协会 / 江苏省建设监理协会 / 浙江省建设工程监理管理协会
 *   《建设工程施工监理服务费计费规则》（沪建咨协〔2015〕11号 等）
 *
 * 三地统一计费方式：监理服务费 = 计费额 × 费率（直线内插） × 工程难度调整系数
 */

export interface SupervisionCategory {
  name: string;
  factor: number;
}

/** 附加选项（加价 / 下限校验） */
export interface SupervisionOption {
  key: string;
  label: string;
  /** 0.20 表示加收 20% */
  factor: number;
  /** 同组内互斥（如优质服务系数的市级 / 省级 / 国级） */
  group?: string;
}

export interface SupervisionStandard {
  key: string;
  /** 省份显示名 */
  name: string;
  /** 报告标题中的标准名，如「河南省标准」 */
  label: string;
  /** 费率依据文案（报告第 4 行） */
  source: string;
  /** 计费额档位（万元） */
  axis: number[];
  /** 对应费率（%） */
  rates: number[];
  /** 首档 / 末档的开区间描述 → 改为完整档位标签列表 */
  tierLabels: string[];
  /** 工程难度调整系数表 */
  categories: Record<string, SupervisionCategory[]>;
  /** 监理服务类型（即难度系数表的分类维度） */
  serviceTypes: string[];
  /** 附加选项 */
  options: SupervisionOption[];
  /** 备注 */
  remark: string;
}

/** 监理服务费报告中的「计费额」口径 */
export const SUPERVISION_BILLING_BASE_LABEL = '建安工程费+设备购置费+联合试运转费';

/** 共同的服务类型（即两套难度系数表） */
const SERVICE_TYPES = ['房屋建筑工程', '市政公用工程'];

export const SUPERVISION_STANDARDS: Record<string, SupervisionStandard> = {
  河南省: {
    key: '河南省',
    name: '河南省',
    label: '河南省标准',
    source:
      '河南省建设监理协会《河南省建设工程施工监理费计费规则》（豫建监协〔2015〕19号）第十三条 表2 建设工程施工监理综合费率表',
    axis: [500, 1000, 3000, 5000, 8000, 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000],
    rates: [3.3, 3.0, 2.6, 2.4, 2.3, 2.2, 2.0, 1.8, 1.7, 1.6, 1.5, 1.4, 1.2, 1.1, 1.1, 1.0],
    tierLabels: ['≤500万元', '1000万元', '3000万元', '5000万元', '8000万元', '10000万元', '20000万元', '40000万元', '60000万元', '80000万元', '100000万元', '200000万元', '400000万元', '600000万元', '800000万元', '≥1000000万元'],
    serviceTypes: SERVICE_TYPES,
    categories: {
      房屋建筑工程: [
        { name: '普通厂房工程', factor: 0.9 },
        { name: '住宅工程', factor: 1.0 },
        { name: '综合商业用房', factor: 1.1 },
        { name: '按四星级及以上标准建设的酒店(含精装修)', factor: 1.15 },
        { name: '综合性医院', factor: 1.15 },
        { name: '大跨度钢结构的建筑(体育场馆、文化场馆、会展中心等)', factor: 1.25 },
        { name: '100m≤建筑高度<200m', factor: 1.2 },
        { name: '200m≤建筑高度<300m', factor: 1.3 },
        { name: '建筑高度≥300m', factor: 1.35 },
        { name: '地下四层及以上或基坑深度≥18m', factor: 1.4 },
        { name: '古建筑维修；古遗迹修复；文物古迹维护', factor: 1.4 },
      ],
      市政公用工程: [
        { name: '直径<1m的管道工程', factor: 0.9 },
        { name: '园林工程；城市广场', factor: 0.9 },
        { name: '中低压燃气；小区供热工程', factor: 1.0 },
        { name: '直径≥1m的管道工程；<3m³/s的泵站；<5万吨/日水厂(污水厂)工程', factor: 1.0 },
        { name: '普通道路工程；人行天桥', factor: 1.0 },
        { name: '垃圾中转站；垃圾填埋工程', factor: 1.0 },
        { name: '长度<1000m隧道工程', factor: 1.1 },
        { name: '高压燃气管网；液化储气站', factor: 1.15 },
        { name: '城市快速路；分离式立交桥；人行地下通道', factor: 1.15 },
        { name: '互通式立交桥；地下通道；城市地铁、轻轨', factor: 1.2 },
        { name: '单孔跨径≥100m的桥梁', factor: 1.2 },
        { name: '1000m≤长度<3000m隧道工程；跨度≥12m的隧道工程', factor: 1.2 },
        { name: '埋深≥5m的管道工程；顶管工程；≥3m³/s的泵站；≥5万吨/日水厂(污水厂)工程', factor: 1.2 },
        { name: '垃圾焚烧工程', factor: 1.2 },
        { name: '单孔跨径≥200m的桥梁', factor: 1.3 },
        { name: '长度≥3000m的隧道工程；连拱隧道；水底隧道；浅埋暗挖隧道', factor: 1.3 },
      ],
    },
    options: [
      { key: 'safety_city', label: '优质服务·安全文明奖（市级）', factor: 0.05, group: 'safety' },
      { key: 'safety_province', label: '优质服务·安全文明奖（省级）', factor: 0.1, group: 'safety' },
      { key: 'safety_nation', label: '优质服务·安全文明奖（国级）', factor: 0.2, group: 'safety' },
      { key: 'quality_city', label: '优质服务·工程质量奖（市级）', factor: 0.1, group: 'quality' },
      { key: 'quality_province', label: '优质服务·工程质量奖（省级）', factor: 0.2, group: 'quality' },
      { key: 'quality_nation', label: '优质服务·工程质量奖（国级）', factor: 0.3, group: 'quality' },
    ],
    remark:
      '计费额处于两个数值区间的，可采用直线内插法计算。本费用为施工阶段监理服务费，不含可报销费用与超期服务费用。',
  },

  湖南省: {
    key: '湖南省',
    name: '湖南省',
    label: '湖南省标准',
    source:
      '《湖南省建设工程施工阶段监理服务费计费规则》第十一条 附表1 工程监理综合费率表',
    axis: [500, 1000, 3000, 5000, 8000, 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000],
    rates: [3.8, 3.6, 3.4, 3.2, 3.0, 2.75, 2.5, 2.25, 2.0, 1.8, 1.6, 1.5, 1.3, 1.2, 1.1, 1.0],
    tierLabels: ['≤500万元', '1000万元', '3000万元', '5000万元', '8000万元', '10000万元', '20000万元', '40000万元', '60000万元', '80000万元', '100000万元', '200000万元', '400000万元', '600000万元', '800000万元', '≥1000000万元'],
    serviceTypes: SERVICE_TYPES,
    categories: {
      房屋建筑工程: [
        { name: '普通厂房工程', factor: 0.85 },
        { name: '住宅工程', factor: 1.0 },
        { name: '综合商业用房', factor: 1.1 },
        { name: '按四星级及以上标准建设的酒店（含精装修）', factor: 1.15 },
        { name: '大跨度钢结构建筑（体育场馆、文化场馆、会展中心等）', factor: 1.25 },
        { name: '综合性医院', factor: 1.15 },
        { name: '地下四层及以上或基坑深度≥18m', factor: 1.2 },
        { name: '100m≤建筑高度<200m', factor: 1.15 },
        { name: '200m≤建筑高度<300m', factor: 1.15 },
        { name: '建筑高度≥300m', factor: 1.15 },
        { name: '古建筑维修；古遗址修复；文物古迹维护', factor: 1.15 },
      ],
      市政公用工程: [
        { name: '普通道路工程；人行天桥', factor: 0.85 },
        { name: '城市快速路；分离式立交桥；人行地下通道', factor: 1.0 },
        { name: '互通式立交桥；地下通道；城市地铁、轻轨', factor: 1.15 },
        { name: '单孔跨径≥100m的桥梁', factor: 1.0 },
        { name: '单孔跨径≥200m的桥梁', factor: 1.15 },
        { name: '长度<1000m隧道工程', factor: 0.85 },
        { name: '1000m≤长度<3000m隧道工程；跨度≥12m的隧道工程', factor: 1.0 },
        { name: '长度≥3000m隧道工程；连拱隧道；水底隧道；浅埋暗挖隧道', factor: 1.15 },
        { name: '直径<1m的管道工程', factor: 0.85 },
        { name: '直径≥1m的管道工程；<3m³/s的泵站；<5万吨/日水厂（污水厂）工程', factor: 1.0 },
        { name: '埋深≥5m的管道工程；顶管工程；≥3m³/s的泵站；≥5万吨/日给水厂或污水厂工程', factor: 1.15 },
        { name: '海（江）底排污管道；海水取排水、淡化及处理工程', factor: 1.15 },
        { name: '园林工程；城市广场', factor: 0.9 },
        { name: '中低压燃气工程', factor: 1.0 },
        { name: '高压燃气管网；液化储气站', factor: 1.0 },
        { name: '垃圾中转站；垃圾填埋工程', factor: 1.0 },
        { name: '垃圾焚烧工程', factor: 1.15 },
      ],
    },
    options: [
      { key: 'project_mgmt', label: '含项目管理服务（加收 20%，第八条）', factor: 0.2 },
      { key: 'warranty', label: '含保修阶段监理服务（加收 5%，第十四条）', factor: 0.05 },
    ],
    remark:
      '计费额处于两个数值区间的，采用直线内插法计算。本费用为施工阶段全部监理服务工作内容的费用，不含附加工作与额外工作费用。',
  },

  沪苏浙: {
    key: '沪苏浙',
    name: '上海市/江苏省/浙江省',
    label: '沪苏浙标准',
    source:
      '上海市建设工程咨询行业协会、江苏省建设监理协会、浙江省建设工程监理管理协会《建设工程施工监理服务费计费规则》（沪建咨协〔2015〕11号、苏建监协〔2015〕4号、浙建监协〔2015〕19号）3.3 监理服务费费率表',
    axis: [1000, 5000, 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000],
    rates: [4.5, 4.0, 3.5, 3.0, 2.6, 2.4, 2.2, 2.0, 1.6, 1.4, 1.2],
    tierLabels: ['≤1000万元', '5000万元', '10000万元', '20000万元', '40000万元', '60000万元', '80000万元', '100000万元', '200000万元', '400000万元', '600000万元', '>600000万元'],
    serviceTypes: SERVICE_TYPES,
    categories: {
      房屋建筑工程: [
        { name: '普通厂房工程', factor: 0.9 },
        { name: '住宅工程', factor: 1.0 },
        { name: '综合商业用房', factor: 1.1 },
        { name: '按四星级及以上标准建设的酒店（含精装修）', factor: 1.15 },
        { name: '大跨度钢结构的建筑（体育场馆、文化场馆、会展中心等）', factor: 1.25 },
        { name: '综合性医院', factor: 1.15 },
        { name: '地下四层及以上或基坑深度≥18m', factor: 1.2 },
        { name: '100m≤建筑高度<200m', factor: 1.2 },
        { name: '200m≤建筑高度<300m', factor: 1.3 },
        { name: '建筑高度≥300m', factor: 1.35 },
      ],
      市政公用工程: [
        { name: '普通道路工程；人行天桥', factor: 1.0 },
        { name: '城市快速路；分离式立交桥；人行地下通道', factor: 1.15 },
        { name: '互通式立交桥；地下通道；城市地铁、轻轨', factor: 1.2 },
        { name: '单孔跨径≥100m的桥梁', factor: 1.2 },
        { name: '单孔跨径≥200m的桥梁', factor: 1.3 },
        { name: '长度<1000m隧道工程', factor: 1.1 },
        { name: '1000m≤长度<3000m隧道工程；跨度≥12m的隧道工程', factor: 1.2 },
        { name: '长度≥3000m隧道工程；连拱隧道；水底隧道；浅埋暗挖隧道', factor: 1.3 },
        { name: '直径<1m的管道工程', factor: 0.9 },
        { name: '直径≥1m的管道工程；<3m³/s的泵站；<5万吨/日水厂（污水厂）工程', factor: 1.0 },
        { name: '埋深≥5m的管道工程；顶管工程；≥3m³/s的泵站；≥5万吨/日水厂（污水厂）工程', factor: 1.2 },
        { name: '海（江）底排污管道；海水取排水、淡化及处理工程', factor: 1.3 },
        { name: '园林工程；城市广场', factor: 0.9 },
        { name: '古建筑', factor: 1.1 },
        { name: '中低压燃气；小区供热工程', factor: 1.0 },
        { name: '高压燃气管网；液化储气站', factor: 1.15 },
        { name: '垃圾中转站；垃圾填埋工程', factor: 1.0 },
        { name: '垃圾焚烧工程', factor: 1.2 },
      ],
    },
    options: [],
    remark:
      '计费额处于两个数值区间的，可采用直线内插法计算。以上费用不包括可报销费用。单独委托工程质量控制和安全生产管理服务的，监理服务费不宜低于施工阶段监理服务费的 80%。',
  },
};

export const SUPERVISION_PROVINCES = Object.keys(SUPERVISION_STANDARDS);

/** 数值展示：最多保留 2 位小数 */
const formatNum = (value: number) => String(Math.round(value * 100) / 100);

/**
 * 直线内插法求费率（%）
 * 计费额低于首档取首档费率，高于末档取末档费率，其余按相邻两档线性内插
 */
export const interpolateSupervisionRate = (amountWanyuan: number, axis: number[], rates: number[]) => {
  const lastIdx = axis.length - 1;
  if (amountWanyuan <= axis[0]) {
    return { rate: rates[0], lower: null, upper: null, isBelowFirst: true, isAboveLast: false };
  }
  if (amountWanyuan >= axis[lastIdx]) {
    return { rate: rates[lastIdx], lower: null, upper: null, isBelowFirst: false, isAboveLast: true };
  }
  for (let i = 0; i < lastIdx; i++) {
    if (amountWanyuan >= axis[i] && amountWanyuan < axis[i + 1]) {
      const lower = { amount: axis[i], rate: rates[i] };
      const upper = { amount: axis[i + 1], rate: rates[i + 1] };
      const rate = lower.rate + ((upper.rate - lower.rate) * (amountWanyuan - lower.amount)) / (upper.amount - lower.amount);
      return { rate, lower, upper, isBelowFirst: false, isAboveLast: false };
    }
  }
  return { rate: rates[lastIdx], lower: null, upper: null, isBelowFirst: false, isAboveLast: true };
};

export interface SupervisionCalcInput {
  standard: SupervisionStandard;
  amount: number;              // 计费额（万元）
  serviceType: string;
  categoryName: string;
  categoryFactor: number;
  /** 附加系数之和，0.2 表示加收 20% */
  extraFactor: number;
  /** 委托工作量占比（0~1），默认 1 */
  delegateRatio: number;
  /** 是否含工程质量控制与安全生产管理（触发 80% 下限） */
  withSafety: boolean;
  extraLabels: string[];
}

export interface SupervisionCalcResult {
  rate: number;
  lower: { amount: number; rate: number } | null;
  upper: { amount: number; rate: number } | null;
  isBelowFirst: boolean;
  isAboveLast: boolean;
  /** 计费额 × 费率 × 难度系数（元） */
  baseYuan: number;
  /** 附加调整后（元） */
  withExtraYuan: number;
  /** 委托占比折算后（元） */
  ratioYuan: number;
  /** 80% 下限（元），未触发为 null */
  minYuan: number | null;
  finalYuan: number;
  reportText: string;
}

export const calculateSupervision = (input: SupervisionCalcInput): SupervisionCalcResult => {
  const { standard, amount, serviceType, categoryName, categoryFactor, extraFactor, delegateRatio, withSafety, extraLabels } = input;
  const interp = interpolateSupervisionRate(amount, standard.axis, standard.rates);
  const rate = interp.rate;

  const baseYuan = amount * 10000 * (rate / 100) * categoryFactor;
  const withExtraYuan = baseYuan * (1 + extraFactor);
  const ratio = Number.isFinite(delegateRatio) && delegateRatio > 0 ? delegateRatio : 1;
  const ratioYuan = withExtraYuan * ratio;

  const minYuan = withSafety ? withExtraYuan * 0.8 : null;
  const finalYuan = minYuan !== null ? Math.max(ratioYuan, minYuan) : ratioYuan;

  const tierLine = standard.tierLabels.join('｜');
  /** 费率显示：最多 4 位小数，去掉末尾多余的 0 */
  const fmtRate = (v: number) => String(Math.round(v * 10000) / 10000);

  let interpLine: string;
  if (interp.lower && interp.upper) {
    interpLine = [
      `   计费额 ${formatNum(amount)} 万元位于「${formatNum(interp.lower.amount)}万元(${fmtRate(interp.lower.rate)}%)」与「${formatNum(interp.upper.amount)}万元(${fmtRate(interp.upper.rate)}%)」之间`,
      `   内插费率 = ${fmtRate(interp.lower.rate)}% + (${fmtRate(interp.upper.rate)}% − ${fmtRate(interp.lower.rate)}%) × (${formatNum(amount)} − ${formatNum(interp.lower.amount)}) / (${formatNum(interp.upper.amount)} − ${formatNum(interp.lower.amount)}) = ${fmtRate(rate)}%`,
    ].join('\n');
  } else if (interp.isBelowFirst) {
    interpLine = `   计费额 ${formatNum(amount)} 万元未达到首档 ${formatNum(standard.axis[0])} 万元，直接取首档费率 ${fmtRate(rate)}%`;
  } else {
    interpLine = `   计费额 ${formatNum(amount)} 万元已达到末档 ${formatNum(standard.axis[standard.axis.length - 1])} 万元，直接取末档费率 ${fmtRate(rate)}%`;
  }

  const lines: string[] = [];
  lines.push(`【施工监理服务费测算结果 (${standard.label})】`);
  lines.push(`1. 服务类型：${serviceType}`);
  lines.push(`2. 计费额 (${SUPERVISION_BILLING_BASE_LABEL})：${formatNum(amount)} 万元`);
  lines.push(`3. 工程难度调整系数：${categoryFactor.toFixed(2)}（对应类型：${categoryName}）`);
  lines.push(`4. 费率依据：${standard.source}`);
  lines.push('——————————————————');
  lines.push('计算过程说明：');
  lines.push(`5. 费率档位（计费额）：${tierLine}`);
  lines.push('6. 按直线内插法计算费率：');
  lines.push(interpLine);
  lines.push(`   计算式：${formatNum(amount)}万 × ${fmtRate(rate)}% × ${categoryFactor.toFixed(2)} = ${formatNum(baseYuan / 10000)}万元（¥${Math.round(baseYuan).toLocaleString()} 元）`);

  let stepIdx = 7;
  if (extraLabels.length > 0) {
    lines.push(`${stepIdx}. 附加调整（加收 ${Math.round(extraFactor * 100)}%）：`);
    extraLabels.forEach(l => lines.push(`   · ${l}`));
    lines.push(`   附加后金额：${formatNum(withExtraYuan / 10000)}万元（¥${Math.round(withExtraYuan).toLocaleString()} 元）`);
    stepIdx += 1;
  }

  if (ratio !== 1) {
    lines.push(`${stepIdx}. 委托工作量占比折算：${formatNum(ratio * 100)}%`);
    lines.push(`   折算后金额：${formatNum(ratioYuan / 10000)}万元（¥${Math.round(ratioYuan).toLocaleString()} 元）`);
    stepIdx += 1;
  }

  if (minYuan !== null) {
    const applied = ratioYuan < minYuan;
    lines.push(`${stepIdx}. 单独委托下限校验：单独委托工程质量控制和履行安全生产管理法定职责的，监理服务费不宜低于施工阶段监理服务总费用的 80%`);
    lines.push(`   下限金额：${formatNum(minYuan / 10000)}万元（¥${Math.round(minYuan).toLocaleString()} 元）${applied ? '，本次折算金额低于下限，已按下限计取' : '，本次折算金额高于下限，无需调整'}`);
    stepIdx += 1;
  }

  lines.push('——————————————————');
  lines.push(`项目总监理服务费用：¥${Math.round(finalYuan).toLocaleString()} 元`);
  lines.push(`备注：${standard.remark}`);

  return {
    rate,
    lower: interp.lower,
    upper: interp.upper,
    isBelowFirst: interp.isBelowFirst,
    isAboveLast: interp.isAboveLast,
    baseYuan,
    withExtraYuan,
    ratioYuan,
    minYuan,
    finalYuan,
    reportText: lines.join('\n'),
  };
};
