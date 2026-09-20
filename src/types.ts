/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CalculationRecord {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  type: 'architecture' | 'corporate_fare' | 'factory' | 'park' | 'water_drop';
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
