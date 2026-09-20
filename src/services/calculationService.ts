/**
 * 工程造价费用计算服务
 * 包含：工程设计费、工程可研费、工程监理费、造价咨询费的计算逻辑
 */

/**
 * 通用线性内插值计算函数
 * @param value 输入值（如：计费额/工程费）
 * @param axis 数据轴（如：[0, 500, 1000]）
 * @param values 对应数值（如：[10, 20, 50]）
 * @param isRate 是否为费率百分比
 * @returns 计算后的结果
 */
export function interpolate(value: number, axis: string[], values: string[], isRate: boolean = false): number {
  const numericAxis = axis.map(Number);
  const numericValues = values.map(v => parseFloat(v.replace('%', '')));

  // 处理边界情况
  if (value <= numericAxis[0]) return numericValues[0];
  if (value >= numericAxis[numericAxis.length - 1]) return numericValues[numericValues.length - 1];

  // 查表定位区间
  for (let i = 0; i < numericAxis.length - 1; i++) {
    if (value >= numericAxis[i] && value <= numericAxis[i + 1]) {
      const x0 = numericAxis[i];
      const x1 = numericAxis[i + 1];
      const y0 = numericValues[i];
      const y1 = numericValues[i + 1];

      // 线性内插公式: y = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
      const result = y0 + (y1 - y0) * (value - x0) / (x1 - x0);
      return isRate ? value * (result / 100) : result;
    }
  }

  return numericValues[numericValues.length - 1];
}

/**
 * 计算工程设计费
 */
export function calculateDesignFee(budget: number, axis: string[], basePrices: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000; 
  
  // 基价计算（内插法）
  const basePrice = interpolate(budgetInEyre, axis, basePrices, false);
  
  // 最终费用 = 基价 * 行业系数
  return basePrice * industryFactor;
}

/**
 * 计算编制项目建议书费用
 */
export function calculateProjectProposalFee(budget: number, axis: string[], rates: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  return interpolate(budgetInEyre, axis, rates, false) * industryFactor;
}

/**
 * 计算编制可行性研究报告费用
 */
export function calculateFeasibilityReportFee(budget: number, axis: string[], rates: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  return interpolate(budgetInEyre, axis, rates, false) * industryFactor;
}

/**
 * 计算评估项目建议书费用
 */
export function calculateProjectProposalEvaluationFee(budget: number, axis: string[], rates: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  return interpolate(budgetInEyre, axis, rates, false) * industryFactor;
}

/**
 * 计算评估可行性研究报告费用
 */
export function calculateFeasibilityReportEvaluationFee(budget: number, axis: string[], rates: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  return interpolate(budgetInEyre, axis, rates, false) * industryFactor;
}

/**
 * 计算汇总工程可研费用 (内部调用上述四个函数)
 */
export function calculateFeasibilityFee(budget: number, config: { name: string, axis: string[], rates: string[] }[], industryFactor: number) {
  const results: Record<string, number> = {};
  let total = 0;

  // 根据配置中的项目名称，分别调用具体函数
  config.forEach(item => {
    let fee = 0;
    if (item.name === '编制项目建议书') {
      fee = calculateProjectProposalFee(budget, item.axis, item.rates, industryFactor);
    } else if (item.name === '编制可行性研究报告') {
      fee = calculateFeasibilityReportFee(budget, item.axis, item.rates, industryFactor);
    } else if (item.name === '评估项目建议书') {
      fee = calculateProjectProposalEvaluationFee(budget, item.axis, item.rates, industryFactor);
    } else if (item.name === '评估可行性研究报告') {
      fee = calculateFeasibilityReportEvaluationFee(budget, item.axis, item.rates, industryFactor);
    } else {
      // 兜底逻辑
      fee = interpolate(budget / 10000, item.axis, item.rates, false) * industryFactor;
    }
    
    results[item.name] = fee;
    total += fee;
  });

  return { total, details: results };
}

/**
 * 计算工程监理费
 */
export function calculateSupervisionFee(budget: number, axis: string[], rates: string[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  const fee = interpolate(budgetInEyre, axis, rates, true);
  
  // 结果转回万元并应用行业系数
  return fee * 10000 * industryFactor;
}

/**
 * 累进计费计算函数 (类似阶梯电价/差额定额累进计费)
 * @param value 输入值
 * @param axis 分段轴
 * @param rates 对应费率
 * @returns 计算后的费率总额 (单位同输入轴或费率定义)
 */
export function calculateProgressiveFee(value: number, axis: string[], rates: string[]): number {
  const numericAxis = axis.map(Number);
  const numericRates = rates.map(r => parseFloat(r.replace('%', '')) / 100);
  
  let totalFee = 0;
  
  for (let i = 0; i < numericAxis.length; i++) {
    const start = numericAxis[i];
    // 下一个节点，如果没有下一个节点则为无穷大
    const end = i < numericAxis.length - 1 ? numericAxis[i + 1] : Infinity;
    const rate = numericRates[i];
    
    if (value > start) {
      // 计算落在这个区间的金额
      const amountInTier = Math.min(value, end) - start;
      totalFee += amountInTier * rate;
    } else {
      // 输入值未达到此区间起点，后续区间也不再需要计算
      break;
    }
  }
  
  return totalFee;
}

/**
 * 计算造价咨询费
 */
export function calculateConsultingFee(budget: number, config: { name: string, axis: string[], rates: string[] }[], industryFactor: number) {
  const budgetInEyre = budget / 10000;
  const results: Record<string, number> = {};
  let total = 0;

  config.forEach(item => {
    // 使用累进计费算法进行累加计算
    const baseFee = calculateProgressiveFee(budgetInEyre, item.axis, item.rates);
    // baseFee 单位是亿元，由于费率已经转换，这里结果也是亿元
    // 转换为万元并应用行业系数
    const feeInWan = baseFee * 10000 * industryFactor;
    results[item.name] = feeInWan;
    total += feeInWan;
  });

  return { total, details: results };
}
