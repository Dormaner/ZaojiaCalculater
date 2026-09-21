/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** 计算器各子模块 */
export type HistoryModule = 'design' | 'feasibility' | 'supervision' | 'consulting';

/** 历史计算记录（localStorage 持久化） */
export interface HistoryRecord {
  /** 唯一 id：`${时间戳}-${随机 4 位}` */
  id: string;
  /** 所属子模块 */
  module: HistoryModule;
  /** 模块中文名，如「工程设计费」 */
  moduleName: string;
  /** 主标题：工程类别 / 服务类型等关键参数 */
  title: string;
  /** 副标题：计费额、复杂程度等 */
  subtitle: string;
  /** 测算省份 */
  province: string;
  /** 计费额 / 计费基数（万元） */
  amount: number;
  /** 总费用（万元） */
  totalWan: number;
  /** 总费用（元） */
  totalYuan: number;
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 测算报告全文 */
  reportText: string;
  /** 入参快照，用于「重新测算」回填 */
  payload?: Record<string, unknown>;
}

/** 「我的」页面中 4 个模块的默认省份 */
export interface DefaultProvinces {
  consulting: string;
  feasibility: string;
  supervision: string;
  design: string;
}

export interface FeeBreakdown {
  design: {
    total: number;
    schematic: number;
    preliminary: number;
    working: number;
  };
  research: {
    total: number;
    proposal: number;
    feasibility: number;
    evaluation: number;
  };
  supervision: {
    total: number;
    construction: number;
    consulting: number;
  };
  consultation: {
    total: number;
    listing: number;
    process: number;
    audit: number;
  };
}

export type TabType = 'calculator' | 'history' | 'profile' | 'report';
