/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  History, 
  User, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight, 
  ArrowLeft,
  Search, 
  Trash2, 
  FileText, 
  RotateCcw, 
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Smartphone,
  Settings2,
  Percent,
  BookOpen,
  Info,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  BarChart3,
  HelpCircle,
  FileCheck,
  Eye,
  Landmark,
  Home,
  MessageSquare,
  Star,
  Plus,
  PlusCircle,
  MinusCircle,
  MapPin,
  Layers,
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, CalculationRecord } from './types';

import { 
  interpolate,
  calculateDesignFee,
  calculateFeasibilityFee,
  calculateSupervisionFee,
  calculateConsultingFee,
  calculateProgressiveFee
} from './services/calculationService';

// Data Constants for Calculations
const DESIGN_FEE_TABLE = {
  axis: ['0.02', '0.05', '0.1', '0.3', '0.5', '0.8', '1.0', '2.0', '4.0', '6.0', '8.0', '10', '20', '40', '60', '80', '100', '200'],
  basePrices: ['9.0', '20.9', '38.8', '103.8', '163.7', '249.6', '304.8', '566.8', '1054.0', '1515.5', '1960.1', '2393.4', '4450.8', '8276.7', '11897.5', '15391.4', '18793.8', '34948.9']
};

const FEASIBILITY_FEE_CONFIG = [
  { name: '编制项目建议书', rates: ['1', '2', '6', '14', '37', '55', '100'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['收费额 (万元)', '工程费 (亿元)'] },
  { name: '编制可行性研究报告', rates: ['2', '4', '12', '28', '75', '110', '200'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['收费额 (万元)', '工程费 (亿元)'] },
  { name: '评估项目建议书', rates: ['0.5', '1', '2', '4', '8', '12', '15'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['收费额 (万元)', '工程费 (亿元)'] },
  { name: '评估可行性研究报告', rates: ['1', '2', '3', '5', '10', '15', '20'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['收费额 (万元)', '工程费 (亿元)'] },
];

const SUPERVISION_FEE_CONFIG = {
  rates: ['3.3%', '3.0%', '2.6%', '2.2%', '1.8%', '1.5%', '1.2%'],
  axis: ['0', '0.05', '0.3', '1', '5', '10', '50']
};

const CONSULTING_FEE_CONFIG = [
  { name: '清单编制费', rates: ['0.80%', '0.65%', '0.60%', '0.45%', '0.35%', '0.25%', '0.20%'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['费率 (%)', '投资额 (亿元)'] },
  { name: '过程咨询费', rates: ['0.70%', '0.60%', '0.55%', '0.50%', '0.45%', '0.40%', '0.35%'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['费率 (%)', '工程费 (亿元)'] },
  { name: '结算审核费', rates: ['0.60%', '0.46%', '0.36%', '0.28%', '0.22%', '0.15%', '0.10%'], axis: ['0', '0.05', '0.3', '1', '5', '10', '50'], labels: ['费率 (%)', '审核额 (亿元)'] },
];

// Mock Data
const MOCK_RECORDS: CalculationRecord[] = [
  { id: '1', title: '市政道路扩建工程', date: '2023-10-25 14:30', totalAmount: 883.27, type: 'architecture' },
  { id: '2', title: '办公综合体设计', date: '2023-10-24 09:15', totalAmount: 2450.00, type: 'corporate_fare' },
  { id: '3', title: '工业厂房二期扩建', date: '2023-10-22 16:45', totalAmount: 1120.50, type: 'factory' },
  { id: '4', title: '中心公园景观改造', date: '2023-10-21 11:20', totalAmount: 425.80, type: 'park' },
  { id: '5', title: '污水处理站设备采购', date: '2023-10-20 15:05', totalAmount: 315.22, type: 'water_drop' },
];

function FeeItem({ item, index, isEditable }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [localRates, setLocalRates] = useState([...item.rates]);
  const [localAxis, setLocalAxis] = useState([...item.axis]);

  // Sync with standard values when not in custom mode
  useEffect(() => {
    if (!isEditable) {
      setLocalRates([...item.rates]);
      setLocalAxis([...item.axis]);
    }
  }, [item, isEditable]);

  const addInterval = () => {
    const lastRate = localRates[localRates.length - 1];
    const lastAxis = localAxis[localAxis.length - 1];
    setLocalRates([...localRates, lastRate]);
    setLocalAxis([...localAxis, lastAxis]);
  };

  const removeInterval = () => {
    if (localRates.length > 2) {
      setLocalRates(localRates.slice(0, -1));
      setLocalAxis(localAxis.slice(0, -1));
    }
  };

  const handleUpdate = (idx: number, val: string, type: 'rate' | 'axis') => {
    if (type === 'rate') {
      const newRates = [...localRates];
      newRates[idx] = val;
      setLocalRates(newRates);
    } else {
      const newAxis = [...localAxis];
      newAxis[idx] = val;
      setLocalAxis(newAxis);
    }
  };

  return (
    <div className="overflow-hidden border-b border-[#eceef0]/50 last:border-b-0">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 px-1 hover:bg-[#0F172A]/5 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2 max-w-[85%]">
          <span className="text-[13px] font-bold text-[#191c1e] shrink-0">
            <span className="mr-1.5">{index + 1}.</span>
            {item.name}
          </span>
          {!isOpen && (
            <span className="text-[10px] text-[#76777d] bg-[#f2f4f6] px-1.5 py-0.5 rounded truncate">
              {localRates[0]}...{localRates[localRates.length-1]}
            </span>
          )}
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-[#c6c6cd] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </div>
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="py-4 px-2 bg-[#f2f4f6]/30 rounded-lg mb-2 relative">
          <div className="overflow-x-auto hide-scrollbar pb-2 touch-pan-x">
            <div className="flex flex-col gap-4 min-w-max px-2">
              {/* Top Rates - In Boxes */}
              <div className="flex gap-2">
                {localRates.map((rate, idx) => (
                  <div key={idx} className="flex flex-col items-center w-9">
                    <span 
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdate(idx, e.currentTarget.textContent || '0', 'rate')}
                      className={`text-[9px] font-mono rounded-md px-1 py-1 w-full text-center outline-none border transition-all shadow-sm ${
                        isEditable 
                        ? 'bg-white border-[#eceef0] focus:border-[#008ebf] cursor-text' 
                        : 'bg-[#eceef0]/50 border-transparent text-[#76777d] cursor-default'
                      }`}
                    >
                      {rate}
                    </span>
                  </div>
                ))}
              </div>

              {/* Axis Line & Ticks */}
              <div className="relative h-2">
                {/* Fixed horizontal line aligned to center of boxes */}
                <div className="absolute top-1/2 left-[18px] right-[18px] h-px bg-[#c6c6cd] -translate-y-1/2"></div>
                
                {/* Ticks container matching top/bottom flex structure exactly */}
                <div className="absolute inset-x-0 top-0 bottom-0 flex gap-2">
                  {localRates.map((_, i) => (
                    <div key={i} className="flex justify-center items-center w-9">
                      <div className="w-0.5 h-2 bg-[#c6c6cd]"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Axis Labels */}
              <div className="flex gap-2">
                {localAxis.map((val, idx) => (
                  <span 
                    key={idx} 
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdate(idx, e.currentTarget.textContent || '0', 'axis')}
                    className={`text-[9px] w-9 text-center outline-none px-1 transition-colors ${
                      isEditable ? 'text-[#008ebf] font-bold cursor-text underline underline-offset-4 decoration-dotted' : 'text-[#45464d] cursor-default'
                    }`}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Add/Remove Controls - Custom Mode Only */}
          {isEditable && (
            <div className="flex justify-end gap-6 my-1 pr-2 mt-1">
              <button 
                onClick={(e) => { e.stopPropagation(); addInterval(); }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#191c1e] hover:opacity-70 transition-opacity"
              >
                <PlusCircle className="w-4 h-4" />
                增加分段
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); removeInterval(); }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#ba1a1a] hover:opacity-70 transition-opacity"
              >
                <MinusCircle className="w-4 h-4" />
                删除分段
              </button>
            </div>
          )}

          {/* Edge Unit Labels */}
          <div className="flex justify-between text-[9px] text-[#76777d] font-medium px-1 mt-1">
            <span>{item.labels[0]}</span>
            <span>{item.labels[1]}</span>
          </div>
          {isOpen && localRates.length > 5 && (
            <div className="text-[8px] text-[#c6c6cd] text-center mt-2 animate-pulse">左右滑动查看更多分段 →</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FeeSection({ icon: Icon, title, defaultVal, items, isOpen, onToggle, customContent, onSelect }: any) {
  const [selected, setSelected] = useState(defaultVal);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSelected(defaultVal);
  }, [defaultVal]);

  return (
    <div className="p-1 border-b border-[#eceef0] last:border-b-0 bg-white">
      <div 
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('.dropdown-container')) {
            onToggle();
          }
        }}
        className="flex items-center justify-between w-full px-3 py-3 cursor-pointer hover:bg-[#f2f4f6]/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#515f74]" />
          </div>
          <span className="text-sm font-bold text-[#191c1e]">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isOpen ? (
            <>
              <span className="text-[11px] text-[#76777d] font-medium">{selected}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#c6c6cd]" />
            </>
          ) : (
            <div className="relative dropdown-container">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center gap-1.5 border border-[#c6c6cd]/40 rounded px-2 py-1 bg-[#f2f4f6] cursor-pointer hover:border-[#008ebf] transition-all"
              >
                <span className="text-[10px] text-[#45464d] font-bold truncate max-w-[100px]">{selected}</span>
                <ChevronDown className="w-3 h-3 text-[#76777d]" />
              </div>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 top-full mt-1 w-32 bg-white border border-[#c6c6cd] rounded-lg shadow-xl z-30 overflow-hidden"
                  >
                    {['湖南省标准', '自定义标准'].map((opt) => (
                      <div 
                        key={opt}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(opt); 
                          setShowDropdown(false); 
                          if (onSelect) onSelect(opt);
                        }}
                        className="px-3 py-2 text-[11px] hover:bg-[#dae2fd] cursor-pointer transition-colors border-b last:border-b-0 border-[#eceef0] font-medium"
                      >
                        {opt}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white"
          >
            <div className="px-3 pb-3">
              {customContent ? (
                typeof customContent === 'function' ? customContent(selected) : customContent
              ) : (
                <div className="space-y-0.5">
                  {items.map((item: any, idx: number) => (
                    <FeeItem key={idx} item={item} index={idx} isEditable={selected === '自定义标准'} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 造价咨询费测算数据配置
const CONSULTING_PROJECT_CATEGORIES = [
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

const GUIZHOU_CONSULTING_PROJECT_CATEGORIES = [
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
  '全过程造价咨询 (绩效收费)',
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
  '工程造价鉴定': [3.0, 2.7, 2.4, 2.0, 1.5, 1.0],
  '材料询价（单独委托）': [3.0, 2.5, 2.0, 1.5, 1.0, 0.5]
};

const SINGLE_SERVICE_TYPES = [
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
  '工程造价司法鉴定',
  '工程主材及设备询价（单项）'
];

const SINGLE_SERVICE_RATES = [
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
  ['10.0%', '8.0%', '6.5%', '5.0%', '4.0%', '3.0%'], // 工程造价司法鉴定
  ['1.5%', '1.3%', '1.1%', '0.82%', '0.65%', '0.48%']  // 工程主材及设备询价（单项）
];

const BILLING_BASE_LABELS: Record<string, string> = {
  "投资估算编制": "估算价",
  "投资估算审核": "核定估算价",
  "工程概算编制": "概算价",
  "工程概算审核": "核定概算价",
  "编制工程量清单及清单计价": "招标控制价",
  "审核工程量清单及清单计价": "招标控制价",
  "工程结算编制": "竣工结算价",
  "工程结算审核（4.2方式）": "竣工结算价",
  "工程结算审核（4.3基本费用）": "竣工结算价",
  "工程结算审核（4.3效益费用）": "核增额或核减额",
  "竣工决算编制": "投资额",
  "竣工决算审核": "投资额",
  "工程造价司法鉴定": "申报鉴定金额",
  "工程主材及设备询价（单项）": "询价材料额",
  "全过程造价咨询服务（A型）": "项目投资估算/概算金额",
  "全过程造价咨询服务（B型）": "项目投资估算/概算金额",
  "全过程造价咨询服务（C型）": "项目投资估算/概算金额",
  "全过程造价咨询服务（D型）": "项目投资估算/概算金额",
  "全过程跟踪审计（A型）": "项目建安造价",
  "全过程跟踪审计（B型）": "项目建安造价",
  "全过程跟踪审计（C型）": "项目建安造价",
  "全过程跟踪审计（D型）": "项目建安造价",
};

const CONSULTING_SINGLE_AXIS = [500, 2000, 5000, 10000, 50000]; // 万元为单位

// 湖南省最低收费限额（出处：《湖南省建设工程造价咨询行业服务收费参考标准》）
const HUNAN_MIN_SERVICE_FEE_YUAN = 3000;    // 工程造价咨询服务收费低于 3000 元的，按 3000 元收取
const HUNAN_MIN_APPRAISAL_FEE_YUAN = 10000; // 工程造价鉴定收费不足 1 万元的，按 1 万元收取

const WHOLE_PROCESS_AXIS = [5000, 10000, 50000, 100000]; // 万元为单位（对应 0.5 / 1 / 5 / 10 亿元）
const WHOLE_PROCESS_RATES = {
  // 七、全过程造价咨询服务收费参考标准（不含驻场人员收费价格），单位：‰
  A: ['14.0', '12.0', '10.0', '9.0', '8.0'],   // A 型，决策阶段至竣工阶段
  B: ['13.0', '11.0', '9.0', '8.5', '7.5'],    // B 型，设计阶段至竣工阶段
  C: ['12.0', '9.5', '8.0', '7.5', '6.5'],     // C 型，交易阶段至竣工阶段
  D: ['10.0', '8.5', '7.5', '7.0', '6.0'],     // D 型，施工阶段至竣工阶段
};

const WHOLE_PROCESS_STAGE_LABELS: Record<string, string> = {
  A: '决策阶段至竣工阶段',
  B: '设计阶段至竣工阶段',
  C: '交易阶段至竣工阶段',
  D: '施工阶段至竣工阶段',
};

// 湖南省「造价咨询服务类型」下拉框中的大类分组选项
const HUNAN_WHOLE_PROCESS_OPTIONS = [
  { value: '全过程造价咨询服务（A型）', label: '全过程造价咨询服务（A型）- 决策阶段至竣工阶段' },
  { value: '全过程造价咨询服务（B型）', label: '全过程造价咨询服务（B型）- 设计阶段至竣工阶段' },
  { value: '全过程造价咨询服务（C型）', label: '全过程造价咨询服务（C型）- 交易阶段至竣工阶段' },
  { value: '全过程造价咨询服务（D型）', label: '全过程造价咨询服务（D型）- 施工阶段至竣工阶段' },
];

const HUNAN_TRACKING_AUDIT_OPTIONS = [
  { value: '全过程跟踪审计（A型）', label: '全过程跟踪审计（A型）- 投资立项起' },
  { value: '全过程跟踪审计（B型）', label: '全过程跟踪审计（B型）- 勘察设计起' },
  { value: '全过程跟踪审计（C型）', label: '全过程跟踪审计（C型）- 招标文件起' },
  { value: '全过程跟踪审计（D型）', label: '全过程跟踪审计（D型）- 施工准备起' },
];

// 由细分项反推湖南省的服务大类：1 单项造价服务、2 全过程造价咨询服务、3 全过程跟踪审计
const resolveHunanServiceType = (specificType: string): number | null => {
  if (!specificType) return null;
  if (specificType.startsWith('全过程造价咨询服务')) return 2;
  if (specificType.startsWith('全过程跟踪审计')) return 3;
  return 1;
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

const TRACKING_AUDIT_AXIS = [5000, 10000, 50000, 100000]; // 万元为单位
const TRACKING_AUDIT_RATES = {
  A: ['17.0', '15.0', '12.0', '10.0', '9.0'],
  B: ['15.0', '13.0', '11.0', '9.0', '8.0'],
  C: ['13.0', '12.0', '10.0', '8.0', '7.0'],
  D: ['12.0', '10.0', '9.0', '7.0', '6.0'],
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');

  const [lastCalculation, setLastCalculation] = useState<number | null>(null);
  const [industryFactor, setIndustryFactor] = useState(1.05);
  const [expandedPref, setExpandedPref] = useState<string | null>(null);

  const [customProvinces, setCustomProvinces] = useState<CustomProvince[]>(() => {
    try {
      const saved = localStorage.getItem('cost_calculator_custom_provinces');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddProvinceModal, setShowAddProvinceModal] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvServices, setNewProvServices] = useState<{
    name: string;
    billingBase: string;
    rateType: 'percentage' | 'progressive';
    rateValue: string;
    progressiveRates: string[];
  }[]>([
    {
      name: '投资估算编制或审核',
      billingBase: '估算价',
      rateType: 'progressive',
      rateValue: '0.35',
      progressiveRates: ['0.40', '0.35', '0.30', '0.22', '0.18', '0.12', '0.10', '0.10']
    }
  ]);
  const [newProvCategories, setNewProvCategories] = useState<{ name: string; factor: string }[]>([
    { name: '通用工程', factor: '1.0' }
  ]);

  // 所有省份统一为 5 个步骤：测算省份 → 造价咨询服务类型 → 计费基数 → 工程类别 → 测算报告
  const CONSULTING_STEPS = ['1. 测算省份', '2. 造价咨询服务类型', '3. 计费基数', '4. 工程类别', '5. 测算报告'];

  const getProvinceFlow = () => {
    return {
      steps: CONSULTING_STEPS,
      hasCategory: true,
    };
  };

  const getBillingBaseLabel = () => {
    if (consultingProvince === '贵州省') {
      return GUIZHOU_BILLING_BASE_LABELS[consultingSpecificType] || '计费基数';
    } else if (consultingProvince === '浙江省') {
      return ZHEJIANG_BILLING_BASE_LABELS[consultingSpecificType] || '收费基础';
    } else if (consultingProvince === '湖南省') {
      return BILLING_BASE_LABELS[consultingSpecificType] || '计费基数';
    } else {
      const custom = customProvinces.find(p => p.name === consultingProvince);
      const s = custom?.services.find(serv => serv.name === consultingSpecificType);
      return s ? s.billingBase : '计费基数';
    }
  };

  const getBillingBaseUnit = () => {
    const label = getBillingBaseLabel();
    if (label.includes('次') || label.includes('天') || consultingSpecificType.includes('出庭费')) {
      return '次';
    }
    return '万元';
  };

  const getProvinceCategories = () => {
    if (consultingProvince === '贵州省') {
      return GUIZHOU_CONSULTING_PROJECT_CATEGORIES;
    } else if (consultingProvince === '湖南省') {
      return CONSULTING_PROJECT_CATEGORIES;
    } else {
      const custom = customProvinces.find(p => p.name === consultingProvince);
      return custom ? custom.categories : [];
    }
  };

  // 工程类别下拉的固定选项值
  const CATEGORY_FIXED_VALUE = '__FIXED_1__';
  const CATEGORY_CUSTOM_VALUE = '__CUSTOM__';

  const getCategorySelectValue = () => {
    if (consultingCategoryIndex === -2) return CATEGORY_FIXED_VALUE;
    if (consultingCategoryIndex === -1) return CATEGORY_CUSTOM_VALUE;
    return consultingCategoryIndex === null ? '' : String(consultingCategoryIndex);
  };

  // 解析当前选中的工程类别（含「固定系数 1.0」与「自定义系数」两种特殊项）
  const getSelectedCategory = (): { name: string; factor: number } | null => {
    if (consultingCategoryIndex === -2) {
      return { name: '固定系数 1.0', factor: 1.0 };
    }
    if (consultingCategoryIndex === -1) {
      const parsed = parseFloat(consultingCustomFactor);
      const factor = Number.isFinite(parsed) && parsed > 0 ? parsed : 1.0;
      return { name: `自定义系数 ${formatNum(factor)}`, factor };
    }
    if (consultingCategoryIndex !== null) {
      const cats = getProvinceCategories();
      if (cats[consultingCategoryIndex]) {
        return { name: cats[consultingCategoryIndex].name, factor: cats[consultingCategoryIndex].factor };
      }
    }
    return null;
  };


  // New States for Design Section
  const [designStandard, setDesignStandard] = useState('湖南省标准');
  const [showDesignDropdown, setShowDesignDropdown] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const [phases, setPhases] = useState({ p1: 25, p2: 45, p3: 30 });

  // Sub-module standard labels states 
  const [factorStd, setFactorStd] = useState('湖南省标准');
  const [feasibilityStd, setFeasibilityStd] = useState('湖南省标准');
  const [supervisionStd, setSupervisionStd] = useState('湖南省标准');
  const [consultingStd, setConsultingStd] = useState('湖南省标准');

  // Preset Management and Data Storage
  const [presetsData, setPresetsData] = useState<Record<string, any>>({
    '默认偏好': { 
      factor: 1.05, 
      factorStd: '湖南省标准',
      designStd: '湖南省标准', 
      phases: { p1: 25, p2: 45, p3: 30 },
      feasibilityStd: '湖南省标准',
      supervisionStd: '湖南省标准',
      consultingStd: '湖南省标准'
    }
  });
  const [globalPresets, setGlobalPresets] = useState(['默认偏好']);
  const [selectedGlobalPreset, setSelectedGlobalPreset] = useState('默认偏好');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Calculation Inputs
  const [engineeringBudget, setEngineeringBudget] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('4、林业、商业、粮食、建筑');
  const [calcResults, setCalcResults] = useState<any>(null);

  // Sub-tabs for the main calculator
  const [calculatorSubTab, setCalculatorSubTab] = useState<'design' | 'feasibility' | 'supervision' | 'consulting'>('consulting');

  // States for Cost Consulting Questionnaire (Progressive step-by-step slider)
  const [consultingProvince, setConsultingProvince] = useState<string>('湖南省');
  const [consultingServiceType, setConsultingServiceType] = useState<number | null>(null);
  const [consultingSpecificType, setConsultingSpecificType] = useState<string>('');
  const [unitProjects, setUnitProjects] = useState<{ id: string; name: string; cost: string }[]>([
    { id: '1', name: '单位工程 1', cost: '' }
  ]);
  const [secondCategoryCost, setSecondCategoryCost] = useState<string>('');
  const [consultingCategoryIndex, setConsultingCategoryIndex] = useState<number | null>(null);
  const [consultingCustomFactor, setConsultingCustomFactor] = useState<string>('');
  const [consultingResultText, setConsultingResultText] = useState<string>('');
  const [showConsultingResult, setShowConsultingResult] = useState<boolean>(false);
  const [[consultingStep, slideDirection], setConsultingStep] = useState<[number, number]>([0, 0]);

  const navigateConsultingStep = (newStep: number) => {
    const dir = newStep > consultingStep ? 1 : -1;
    setConsultingStep([newStep, dir]);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [mouseDownX, setMouseDownX] = useState<number | null>(null);

  const handleSwipeMove = (direction: 'left' | 'right') => {
    const flow = getProvinceFlow();
    const lastStepIdx = flow.steps.length - 1;

    if (direction === 'left') {
      let canNext = false;

      if (consultingStep === 0) {
        canNext = !!consultingProvince;
      } else if (consultingStep === 1) {
        canNext = consultingSpecificType !== '';
      } else if (consultingStep === 2) {
        canNext = unitProjects.some(p => parseFloat(p.cost) > 0);
      } else if (consultingStep === 3) {
        canNext = false; // 工程类别需点击按钮完成测算
      }

      if (canNext && consultingStep < lastStepIdx) {
        navigateConsultingStep(consultingStep + 1);
      }
    } else {
      const canPrev = consultingStep > 0 && consultingStep < lastStepIdx;
      if (canPrev) {
        navigateConsultingStep(consultingStep - 1);
      }
    }
  };

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      setTouchStartX(e.targetTouches[0].clientX);
    },
    onTouchMove: (e: React.TouchEvent) => {
      setTouchEndX(e.targetTouches[0].clientX);
    },
    onTouchEnd: () => {
      if (touchStartX === null || touchEndX === null) return;
      const distance = touchStartX - touchEndX;
      if (Math.abs(distance) > 50) {
        handleSwipeMove(distance > 0 ? 'left' : 'right');
      }
      setTouchStartX(null);
      setTouchEndX(null);
    },
    onMouseDown: (e: React.MouseEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLButtonElement || e.target instanceof HTMLOptionElement) return;
      setMouseDownX(e.clientX);
    },
    onMouseUp: (e: React.MouseEvent) => {
      if (mouseDownX === null) return;
      const distance = mouseDownX - e.clientX;
      if (Math.abs(distance) > 50) {
        handleSwipeMove(distance > 0 ? 'left' : 'right');
      }
      setMouseDownX(null);
    }
  };

  const extractFeeOnly = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    for (const line of lines) {
      if (
        line.includes('项目总造价服务费用：') || 
        line.includes('项目总咨询费用：') || 
        line.includes('项目总跟踪审计费用：') ||
        line.includes('项目总咨询服务费用：')
      ) {
        const parts = line.split('：');
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    return '';
  };

  const renderResultText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const resultLineIdx = lines.findIndex(line => 
      line.includes('项目总造价服务费用：') || 
      line.includes('项目总咨询费用：') || 
      line.includes('项目总跟踪审计费用：') ||
      line.includes('项目总咨询服务费用：')
    );

    if (resultLineIdx === -1) {
      return (
        <pre className="text-xs font-mono bg-[#f7f9fb] p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed text-[#45464d] text-left">
          {text}
        </pre>
      );
    }

    const resultLine = lines[resultLineIdx];
    const beforeLines = lines.slice(0, resultLineIdx).join('\n');
    const afterLines = lines.slice(resultLineIdx + 1).join('\n');

    const matchLabel = resultLine.includes('项目总造价服务费用') ? '项目总造价服务费用' :
                       resultLine.includes('项目总跟踪审计费用') ? '项目总跟踪审计费用' : '项目总咨询服务费用';
    const matchVal = resultLine.split('：')[1] || resultLine;

    return (
      <div className="space-y-4 text-left">
        <pre className="text-xs font-mono bg-[#f7f9fb] p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed text-[#76777d]">
          {beforeLines}
        </pre>
        
        {/* Highlighted Key Result Box */}
        <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl p-5 text-center my-3">
          <span className="block text-xs font-bold text-[#76777d] mb-1">{matchLabel}</span>
          <div className="text-2xl font-black text-[#007AFF] font-mono">
            {matchVal}
          </div>
        </div>

        {afterLines && (
          <pre className="text-xs font-mono bg-[#f7f9fb] p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed text-[#76777d]">
            {afterLines}
          </pre>
        )}
      </div>
    );
  };

  // Project Categories Data
  const PROJECT_CATEGORIES = [
    { name: '建筑与室外工程 I 级', desc: '包括 50 层以上或建筑高度超过 150 米的超高层建筑，或跨度 36 米以上的大跨度建筑，以及功能极为复杂的大型公共建筑。' },
    { name: '建筑与室外工程 II 级', desc: '包括 12-50 层或建筑高度 50-150 米的高层建筑，或中型公共建筑，或跨度 24-36 米的建筑。' },
    { name: '建筑与室外工程 III 级', desc: '包括 12 层以下或建筑高度 50 米以下的普通低、多层建筑，或小型公共建筑。' },
    { name: '住宅小区（组团）工程', desc: '指城镇中按居住区规划布置，由多栋居住建筑及配套设施（如路网、绿地、配套公建）组成的群体工程。' },
    { name: '住宅工程', desc: '指单栋或多栋独立的居住类建筑，不含较大规模配套设施的情况。' },
    { name: '古建筑保护性建筑工程', desc: '对具有历史价值的古代建筑及其遗址进行的修缮、加固、复建或保护性设施建设工程。' },
    { name: '智能建筑弱电系统工程', desc: '包括楼宇自控、综合布线、安防监控、通信网络、紧急广播等各类弱电系统的集成与安装工程。' },
    { name: '室内装修工程', desc: '指对建筑物内部空间进行的二次装修、美化及相关配套设施的施工。' },
    { name: '园林绿化 I、II 级', desc: '复杂的城市公园、风景名胜区、主题公园或大规模景观轴线，包含较多雕塑、喷泉等建筑小品。' },
    { name: '园林绿化 III 级', desc: '常规的街道绿化、居住区绿地、单位内绿化或小型街头绿地。' },
    { name: '人防工程', desc: '为保障战时人员与物资掩蔽、人防指挥、医疗救护而建的地下防护建筑，包括平战结合的人防工程。' },
    { name: '市政公用工程 I、II 级', desc: '城市主干道、大型快速路、立交桥、长跨度桥梁或大规模供水排水厂站系统。' },
    { name: '市政公用工程 III 级', desc: '城市支路、普通排水管网、小型泵站或其他常规市政配套设施。' },
    { name: '广播电视、邮政工程工艺部分', desc: '专门针对广电发射中心、演播厅或邮政分拣、处理系统的工艺设备安装与系统调试。' },
    { name: '电信工程', desc: '现代通信系统工程，包括通信枢纽枢纽、基站、交换系统以及光缆骨干网络工程。' }
  ];

  const [selectedCategory, setSelectedCategory] = useState(PROJECT_CATEGORIES[0].name);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [explainingItem, setExplainingItem] = useState<{name: string, desc: string} | null>(null);

  // Consulting Types Data
  const CONSULTING_TYPES = [
    { name: '决策阶段至竣工阶段', desc: '全过程工程咨询服务，涵盖从前期策划、项目建议书、可行性研究、投资估算，到设计、招投标、施工管理、竣工验收及决算审计的完整生命周期。' },
    { name: '设计阶段至竣工阶段', desc: '从初步设计阶段切入，重点负责施工图预算编制、设计优化咨询、施工招标代理，以及从开工到竣工的全程造价控制与管理。' },
    { name: '交易阶段至竣工阶段', desc: '专注于工程招标咨询、工程量清单及招标控制价编制、投标文件商务标审核，以及合同签订至项目竣工后的费用申报与结算管理。' },
    { name: '施工阶段至竣工阶段', desc: '主要负责施工期间的进度款审核、设计变更与现场签证管理、结算把关，直至协助完成竣工财务决算审计工作。' }
  ];

  const [selectedConsultingType, setSelectedConsultingType] = useState(CONSULTING_TYPES[0].name);
  const [showConsultingDropdown, setShowConsultingDropdown] = useState(false);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (!target.closest('.consulting-dropdown-container')) {
        setShowConsultingDropdown(false);
      }
      if (!target.closest('.dropdown-container')) {
        setShowGlobalDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown, showConsultingDropdown, showGlobalDropdown]);

  // Helper to apply a preset's full configuration
  const applyPreset = (presetName: string) => {
    const config = presetsData[presetName];
    if (config) {
      setIndustryFactor(config.factor);
      setFactorStd(config.factorStd || '湖南省标准');
      setDesignStandard(config.designStd || '湖南省标准');
      setPhases(config.phases);
      setFeasibilityStd(config.feasibilityStd || '湖南省标准');
      setSupervisionStd(config.supervisionStd || '湖南省标准');
      setConsultingStd(config.consultingStd || '湖南省标准');
      setSelectedGlobalPreset(presetName);
    }
  };

  // Helper to delete a preset
  const deletePreset = (presetName: string) => {
    if (presetName === '默认偏好') return;
    
    setGlobalPresets(prev => prev.filter(p => p !== presetName));
    setPresetsData(prev => {
      const newData = { ...prev };
      delete newData[presetName];
      return newData;
    });

    if (selectedGlobalPreset === presetName) {
      applyPreset('默认偏好');
    }
  };

  const isCustom = !presetsData[selectedGlobalPreset] || 
                   industryFactor !== presetsData[selectedGlobalPreset].factor || 
                   designStandard !== presetsData[selectedGlobalPreset].designStd || 
                   factorStd !== presetsData[selectedGlobalPreset].factorStd ||
                   feasibilityStd !== presetsData[selectedGlobalPreset].feasibilityStd ||
                   supervisionStd !== presetsData[selectedGlobalPreset].supervisionStd ||
                   consultingStd !== presetsData[selectedGlobalPreset].consultingStd ||
                   phases.p1 !== presetsData[selectedGlobalPreset].phases.p1 ||
                   phases.p2 !== presetsData[selectedGlobalPreset].phases.p2 ||
                   phases.p3 !== presetsData[selectedGlobalPreset].phases.p3;

  const displayStandard = isCustom ? '自定义偏好' : selectedGlobalPreset;

  const calculateHunan = (validProjects: any[], category: any, categoryFactor: number) => {
    let totalYuan = 0;
    let detailLines: string[] = [];

    if (consultingServiceType === 1) {
      const typeIndex = SINGLE_SERVICE_TYPES.indexOf(consultingSpecificType);
      if (typeIndex === -1) return;

      // 工程结算审核（4.3效益费用）按效益额差额累进，其余按单项服务费率表
      const permilleRates = consultingSpecificType === '工程结算审核（4.3效益费用）'
        ? [60.0, 45.0, 30.0, 10.0, 9.0, 8.0]
        : SINGLE_SERVICE_RATES[typeIndex].map(r => parseFloat(r.replace('%', '')));
      const rates = permilleRates.map(r => r / 1000);
      const brackets = CONSULTING_SINGLE_AXIS;

      validProjects.forEach((proj, idx) => {
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
      const isAppraisal = consultingSpecificType.includes('鉴定');
      const minFeeYuan = isAppraisal ? HUNAN_MIN_APPRAISAL_FEE_YUAN : HUNAN_MIN_SERVICE_FEE_YUAN;
      let isAdjusted = false;
      let adjustmentMsg = '';
      if (totalYuan < minFeeYuan) {
        totalYuan = minFeeYuan;
        isAdjusted = true;
        adjustmentMsg = isAppraisal
          ? `8. 最低收费限额调整：工程造价鉴定收费不足 1 万元的，按 1 万元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥10,000 元）`
          : `8. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }

      const baseText = `【单项造价服务费测算结果 (湖南省标准)】
1. 服务类型：${consultingSpecificType}
2. 计费基数 (${BILLING_BASE_LABELS[consultingSpecificType] || '计费基数'})：${validProjects.map(p => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
3. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
4. 费率依据：湘价协收费价格表（千分比 ‰ 差额累进计算）
   ${consultingSpecificType} 阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
5. 阶梯区间划分（计费基数，单位：万元）：500以下｜500-2000｜2000-5000｜5000-10000｜10000-50000｜50000以上
6. 按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
7. 类别系数折算后金额：¥${Math.round(beforeAdjustYuan).toLocaleString()} 元
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总造价服务费用：¥${Math.round(totalYuan).toLocaleString()} 元
备注：本费用仅出具纸质/电子版造价报告，不含施工驻场、全过程现场管控服务。`;

      setConsultingResultText(baseText);
      setShowConsultingResult(true);

    } else if (consultingServiceType === 2) {
      const match = consultingSpecificType.match(/（([A-D])型）/);
      const packageType = match ? match[1] : 'A';
      const permilleRates = (WHOLE_PROCESS_RATES[packageType as 'A' | 'B' | 'C' | 'D'] || WHOLE_PROCESS_RATES.A).map(r => parseFloat(r));
      const rates = permilleRates.map(r => r / 1000);
      const brackets = WHOLE_PROCESS_AXIS;
      const stageLabel = WHOLE_PROCESS_STAGE_LABELS[packageType] || '';

      validProjects.forEach((proj, idx) => {
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
        adjustmentMsg = `8. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }

      const baseText = `【全过程造价咨询服务费测算结果 (湖南省标准)】
1. 服务类型：${consultingSpecificType}
2. 计费基数 (项目投资估算/概算金额)：${validProjects.map(p => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
3. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
4. 费率依据：《湖南省建设工程造价咨询行业服务收费参考标准》第七部分「全过程造价咨询服务收费参考标准（不含驻场人员收费价格）」
   ${packageType} 型（${stageLabel}）阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
5. 阶梯区间划分（估算或概算造价，单位：亿元）：0.5以下（不含0.5）｜0.5-1｜1-5｜5-10｜10以上
6. 按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
7. 类别系数折算后金额：¥${Math.round(beforeAdjustYuan).toLocaleString()} 元
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总咨询费用：¥${Math.round(totalYuan).toLocaleString()} 元
备注：本费用为全过程造价咨询服务包干费用，不含驻场人员收费价格。`;

      setConsultingResultText(baseText);
      setShowConsultingResult(true);

    } else if (consultingServiceType === 3) {
      const match = consultingSpecificType.match(/（([A-D])型）/);
      const packageType = match ? match[1] : 'A';
      const permilleRates = (TRACKING_AUDIT_RATES[packageType as 'A' | 'B' | 'C' | 'D'] || TRACKING_AUDIT_RATES.A).map(r => parseFloat(r));
      const rates = permilleRates.map(r => r / 1000);
      const brackets = TRACKING_AUDIT_AXIS;

      let buildBaseFeeYuan = 0;
      validProjects.forEach((proj, idx) => {
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

      const secondCostVal = parseFloat(secondCategoryCost) || 0; // 万元
      const secondCostDiscountedYuan = secondCostVal * 0.2 * 10000; // Note: PDF 湘价协附表10备注第4条: "二类费用（如设计费、监理费、咨询费等）可以按20%的折扣计取"!

      const totalAuditingBaseYuan = buildBaseFeeYuan + secondCostDiscountedYuan;
      const finalFeeYuan = totalAuditingBaseYuan * categoryFactor;

      const beforeAdjustYuan = finalFeeYuan;
      let adjustedFinalFeeYuan = finalFeeYuan;
      let isAdjusted = false;
      let adjustmentMsg = '';
      if (adjustedFinalFeeYuan < HUNAN_MIN_SERVICE_FEE_YUAN) {
        adjustedFinalFeeYuan = HUNAN_MIN_SERVICE_FEE_YUAN;
        isAdjusted = true;
        adjustmentMsg = `10. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }

      const baseText = `【全过程跟踪审计服务费测算结果 (湖南省标准)】
1. 服务类型：${consultingSpecificType}
2. 计费基数 (项目建安造价)：${validProjects.map((p: any) => `${p.name || '未命名'} (${p.cost}万元)`).join('、')}
3. 工程类别调整系数：${categoryFactor.toFixed(1)}（对应类型：${category.name}）
4. 费率依据：湘价协附表10「全过程跟踪审计收费表」（千分比 ‰ 差额累进计算）
   ${packageType} 型阶梯费率：${permilleRates.map(formatNum).join('‰ / ')}‰
——————————————————
计算过程说明：
5. 阶梯区间划分（建安造价，单位：万元）：5000以下｜5000-10000｜10000-50000｜50000-100000｜100000以上
6. 建安部分按差额累进方法计算（分段明细）：
${detailLines.join('\n')}
7. 二类费用折算（出处：附表10 备注第4条，二类费用可按 20% 折扣计取）：
   二类费用总额 ${formatNum(secondCostVal)}万元 × 20% = ${formatNum(secondCostVal * 0.2)}万元（¥${Math.round(secondCostDiscountedYuan).toLocaleString()} 元）
8. 计算式：（建安部分差额累进合计 ${formatNum(buildBaseFeeYuan / 10000)}万元 + 二类费用折算 ${formatNum(secondCostDiscountedYuan / 10000)}万元）*${categoryFactor.toFixed(1)}=${formatNum(finalFeeYuan / 10000)}万元（¥${Math.round(finalFeeYuan).toLocaleString()} 元）
9. 驻场人员薪酬单独额外累加，不计入本表包干费率
${isAdjusted ? `${adjustmentMsg}\n` : ''}——————————————————
项目总跟踪审计费用：¥${Math.round(adjustedFinalFeeYuan).toLocaleString()} 元
备注：本包干费用已包含全部审计工作。`;

      setConsultingResultText(baseText);
      setShowConsultingResult(true);
    }
  };

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

  const calculateZhejiang = (validProjects: any[], category: any, categoryFactor: number) => {
    const type = consultingSpecificType;
    const brackets = [100, 500, 1000, 2000, 5000, 10000, 50000];
    const tierLabels = buildTierLabels(brackets);
    const categoryName = category?.name || '固定系数 1.0';
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
      validProjects.forEach((proj, idx) => {
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
      validProjects.forEach((proj, idx) => {
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

    const baseText = buildConsultingReportText({
      title: '造价咨询服务费测算结果',
      provinceLabel: '浙江省标准',
      serviceType: type,
      billingBaseLabel: ZHEJIANG_BILLING_BASE_LABELS[type] || '计费基数',
      projects: validProjects,
      categoryFactor,
      categoryName,
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

    setConsultingResultText(baseText);
    setShowConsultingResult(true);
  };

  const calculateCustom = (validProjects: any[], category: any, categoryFactor: number, customProv: CustomProvince) => {
    const type = consultingSpecificType;
    const service = customProv.services.find(s => s.name === type);
    if (!service) return;

    const categoryName = category?.name || '固定系数 1.0';
    let totalYuan = 0;
    const detailLines: string[] = [];
    let rateBasisLines: string[] = [];
    let brackets: number[] = [];

    if (service.rateType === 'percentage') {
      const rateText = `${(service.rateValue * 100).toFixed(3)}%`;
      rateBasisLines = [
        `${customProv.name}自定义收费标准（按固定比例计取）`,
        `${type} 计费费率：${rateText}`,
      ];
      validProjects.forEach((proj, idx) => {
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
      const tierLabels = buildTierLabels(brackets);
      rateBasisLines = [
        `${customProv.name}自定义收费标准（差额累进计算）`,
        `${type} 阶梯费率：${rateValues.map(v => formatNum(v)).join(' / ')}`,
      ];
      validProjects.forEach((proj, idx) => {
        const costVal = parseFloat(proj.cost); // 万元
        const baseFeeWanyuan = calculateProgressiveFeeWanyuan(costVal, brackets, rateValues);
        totalYuan += baseFeeWanyuan * categoryFactor * 10000;
        detailLines.push(
          ...buildProgressiveDetailLines(
            proj.name || `单位工程 ${idx + 1}`,
            costVal,
            brackets,
            rateValues,
            tierLabels,
            categoryFactor,
            ''
          )
        );
      });
    }

    const baseText = buildConsultingReportText({
      title: '造价咨询服务费测算结果',
      provinceLabel: `${customProv.name}标准`,
      serviceType: type,
      billingBaseLabel: service.billingBase || '计费基数',
      projects: validProjects,
      categoryFactor,
      categoryName,
      rateBasisLines,
      tierDescription: service.rateType === 'percentage' ? '计费基数，单位：万元（按固定比例计取）' : '计费基数，单位：万元',
      tierLabels: service.rateType === 'percentage' ? [] : buildTierLabels(brackets),
      detailLines,
      detailHeading: service.rateType === 'percentage' ? '按固定费率计算' : undefined,
      adjustedYuan: totalYuan,
      footerLabel: '项目总咨询费用',
      totalYuan,
      remark: `本测算依据${customProv.name}自定义收费标准与系数计算，仅供内部参考。`,
    });

    setConsultingResultText(baseText);
    setShowConsultingResult(true);
  };

  const calculateGuizhou = (validProjects: any[], category: any, categoryFactor: number) => {
    let totalYuan = 0;
    const detailLines: string[] = [];
    const type = consultingSpecificType;
    const categoryName = category?.name || '固定系数 1.0';
    const brackets = [500, 1000, 5000, 10000, 50000];
    const tierLabels = buildTierLabels(brackets);
    const isAppraisal = type.includes('工程造价鉴定');
    let rateBasisLines: string[] = [];

    const isAdditional = type === '工程结算复审 (追加费用)' || type.includes('追加费用');
    const isCourtFee = type === '工程造价鉴定 (出庭费)';

    if (isAdditional) {
      const isReview = type === '工程结算复审 (追加费用)';
      const rateText = isReview ? '8.0%' : '6.0%';
      const rateDecimal = isReview ? 0.08 : 0.06;
      rateBasisLines = [
        '贵州省发展改革委/住房城乡建设厅收费指导意见（按固定比例计取）',
        `${type} 计费费率：${rateText}`,
      ];
      validProjects.forEach((proj, idx) => {
        const costVal = parseFloat(proj.cost);
        const baseFeeWanyuan = costVal * rateDecimal;
        totalYuan += baseFeeWanyuan * categoryFactor * 10000;
        detailLines.push(
          ...buildFlatRateDetailLines(proj.name || `单位工程 ${idx + 1}`, costVal, rateText, baseFeeWanyuan, categoryFactor)
        );
      });
    } else if (isCourtFee) {
      rateBasisLines = [
        '贵州省发展改革委/住房城乡建设厅收费指导意见（按出庭人次计取）',
        `${type} 计费标准：3,000 元/人·次`,
      ];
      validProjects.forEach((proj, idx) => {
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
      // 工程造价鉴定按百分比计取，其余按千分比 ‰ 计取
      const rateUnit: RateUnit = isAppraisal ? '%' : '‰';
      const rawRates = GUIZHOU_RATES[type] || [1.3, 1.0, 0.7, 0.5, 0.4, 0.2];
      const divisor = RATE_UNITS[rateUnit].divisor;
      rateBasisLines = [
        `贵州省发展改革委/住房城乡建设厅收费指导意见（${isAppraisal ? '百分比 %' : '千分比 ‰'}差额累进计算）`,
        `${type} 阶梯费率：${rawRates.map(v => `${formatNum(v)}${RATE_UNITS[rateUnit].suffix}`).join(' / ')}`,
      ];
      validProjects.forEach((proj, idx) => {
        const costVal = parseFloat(proj.cost);
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

    if (isAppraisal) {
      if (totalYuan < 5000) {
        totalYuan = 5000;
        isAdjusted = true;
        adjustmentMsg = `8. 最低收费限额调整：工程造价鉴定收费不足 5,000 元的，按 5,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥5,000 元）`;
      }
    } else {
      if (totalYuan < 3000) {
        totalYuan = 3000;
        isAdjusted = true;
        adjustmentMsg = `8. 最低收费限额调整：工程造价咨询服务收费低于 3,000 元的，按 3,000 元收取（本次累计计费原结果为 ¥${Math.round(beforeAdjustYuan).toLocaleString()} 元，已调整为 ¥3,000 元）`;
      }
    }

    const baseText = buildConsultingReportText({
      title: '造价咨询服务费测算结果',
      provinceLabel: '贵州省标准',
      serviceType: type,
      billingBaseLabel: GUIZHOU_BILLING_BASE_LABELS[type] || '计费基数',
      projects: validProjects,
      categoryFactor,
      categoryName,
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

    setConsultingResultText(baseText);
    setShowConsultingResult(true);
  };

  const handleCalculateConsulting = async () => {
    const validProjects = unitProjects.filter(p => parseFloat(p.cost) > 0);
    if (validProjects.length === 0) {
      alert('请输入至少一个有效的单位工程造价（计费基数）');
      return;
    }

    const flow = getProvinceFlow();
    let category = null;
    let categoryFactor = 1.0;

    if (flow.hasCategory) {
      category = getSelectedCategory();
      if (!category) {
        alert('请选择工程类别或自定义系数');
        return;
      }
      categoryFactor = category.factor;
    }

    // Try fetching from the backend server API
    try {
      const response = await fetch('http://localhost:3001/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province: consultingProvince,
          serviceType: consultingServiceType,
          specificType: consultingSpecificType,
          categoryIndex: consultingCategoryIndex,
          categoryName: category ? category.name : null,
          categoryFactor,
          unitProjects,
          secondCategoryCost,
          customProvince: customProvinces.find(p => p.name === consultingProvince) || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConsultingResultText(data.reportText);
        setShowConsultingResult(true);
        console.log('Calculation computed successfully by the backend API.');
        return;
      }
    } catch (err) {
      console.warn('Backend server calculation failed or unavailable, falling back to local computation:', err);
    }

    // Client-side fallback computation
    if (consultingProvince === '湖南省') {
      calculateHunan(validProjects, category, categoryFactor);
    } else if (consultingProvince === '浙江省') {
      calculateZhejiang(validProjects, category, categoryFactor);
    } else if (consultingProvince === '贵州省') {
      calculateGuizhou(validProjects, category, categoryFactor);
    } else {
      const custom = customProvinces.find(p => p.name === consultingProvince);
      if (custom) {
        calculateCustom(validProjects, category, categoryFactor, custom);
      }
    }
  };

  const handleCalculate = () => {
    const budget = parseFloat(engineeringBudget) || 0;
    if (budget <= 0) {
      alert('请输入有效的工程总预算');
      return;
    }

    // 1. Calculate Design Fee
    const designTotal = calculateDesignFee(budget, DESIGN_FEE_TABLE.axis, DESIGN_FEE_TABLE.basePrices, industryFactor);
    
    // 2. Calculate Feasibility Fee
    const feasibility = calculateFeasibilityFee(budget, FEASIBILITY_FEE_CONFIG, industryFactor);
    
    // 3. Calculate Supervision Fee
    const supervisionTotal = calculateSupervisionFee(budget, SUPERVISION_FEE_CONFIG.axis, SUPERVISION_FEE_CONFIG.rates, industryFactor);

    // 4. Calculate Consulting Fee
    const consulting = calculateConsultingFee(budget, CONSULTING_FEE_CONFIG, industryFactor);

    setCalcResults({
      budget,
      activeSubTab: calculatorSubTab,
      design: {
        total: designTotal,
        p1: designTotal * (phases.p1 / 100),
        p2: designTotal * (phases.p2 / 100),
        p3: designTotal * (phases.p3 / 100)
      },
      feasibility: {
        total: feasibility.total,
        details: feasibility.details
      },
      supervision: {
        total: supervisionTotal
      },
      consulting: {
        total: consulting.total,
        details: consulting.details
      }
    });

    setActiveTab('report');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const wizardVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -150 : 150,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    })
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans pb-32">
      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 pt-4"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                {/* 顶部二级导航：四个子页面 */}
                <div className="flex bg-[#f2f4f6] p-1 rounded-2xl shadow-inner max-w-3xl mx-auto border border-[#eceef0]">
                  {[
                    { id: 'design', label: '工程设计费' },
                    { id: 'feasibility', label: '工程可研费' },
                    { id: 'supervision', label: '工程监理费' },
                    { id: 'consulting', label: '造价咨询费' },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setCalculatorSubTab(subTab.id as any)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all relative ${
                        calculatorSubTab === subTab.id
                          ? 'bg-white text-[#0F172A] shadow-md border border-[#eceef0]'
                          : 'text-[#515f74] hover:text-[#0F172A]'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* 子页面 1：工程设计费 */}
                {calculatorSubTab === 'design' && (
                  <div className="space-y-6 px-1 animate-fadeIn">
                    <div className="p-5 bg-white border border-[#c6c6cd]/60 shadow-sm rounded-2xl">
                      <label className="block text-sm font-bold mb-2 ml-1 text-[#0F172A]">工程总预算 (万元)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-[#0F172A]">¥</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={engineeringBudget}
                          onChange={(e) => setEngineeringBudget(e.target.value)}
                          className="w-full border-b border-[#c6c6cd] bg-transparent pl-10 pr-4 py-3 text-2xl font-black focus:outline-none focus:border-[#008ebf] placeholder:text-[#c6c6cd]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 px-1">
                        <label className="text-[12px] font-semibold text-[#45464d] ml-1">项目所在区域/城市</label>
                        <select 
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="w-full border border-[#c6c6cd] bg-white px-3 py-3 text-sm rounded-xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none"
                        >
                          <option value="">选择省份 / 城市</option>
                          <option>湖南省</option>
                          <option>北京市</option>
                          <option>上海市</option>
                          <option>广东省</option>
                        </select>
                      </div>

                      <div className="space-y-1 px-1">
                        <label className="text-[12px] font-semibold text-[#45464d] ml-1">工程所属行业</label>
                        <select 
                          value={selectedIndustry}
                          onChange={(e) => setSelectedIndustry(e.target.value)}
                          className="w-full border border-[#c6c6cd] bg-white px-3 py-3 text-sm rounded-xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none"
                        >
                          <option>1、石化、化工、钢铁</option>
                          <option>2、石油、天然气、水利、水电、交通（水运）、化纤</option>
                          <option>3、有色、黄金、纺织、轻工、邮电、广播、电视、医药、煤炭、火电（含核电）、机械（含船舶、航空、航天、兵器）</option>
                          <option>4、林业、商业、粮食、建筑</option>
                          <option>5、建材、交通（公路）、铁道、市政公用工程</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={handleCalculate}
                      className="w-full bg-[#0F172A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.1)] text-base"
                    >
                      开始测算设计费
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* 子页面 2：工程可研费 */}
                {calculatorSubTab === 'feasibility' && (
                  <div className="space-y-6 px-1 animate-fadeIn">
                    <div className="p-5 bg-white border border-[#c6c6cd]/60 shadow-sm rounded-2xl">
                      <label className="block text-sm font-bold mb-2 ml-1 text-[#0F172A]">估算投资额 (万元)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-[#0F172A]">¥</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={engineeringBudget}
                          onChange={(e) => setEngineeringBudget(e.target.value)}
                          className="w-full border-b border-[#c6c6cd] bg-transparent pl-10 pr-4 py-3 text-2xl font-black focus:outline-none focus:border-[#008ebf] placeholder:text-[#c6c6cd]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 px-1">
                      <label className="text-[12px] font-semibold text-[#45464d] ml-1">工程所属行业</label>
                      <select 
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="w-full border border-[#c6c6cd] bg-white px-3 py-3 text-sm rounded-xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none"
                      >
                        <option>1、石化、化工、钢铁</option>
                        <option>2、石油、天然气、水利、水电、交通（水运）、化纤</option>
                        <option>3、有色、黄金、纺织、轻工、邮电、广播、电视、医药、煤炭、火电（含核电）、机械（含船舶、航空、航天、兵器）</option>
                        <option>4、林业、商业、粮食、建筑</option>
                        <option>5、建材、交通（公路）、铁道、市政公用工程</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleCalculate}
                      className="w-full bg-[#0F172A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.1)] text-base"
                    >
                      开始测算可研费
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* 子页面 3：工程监理费 */}
                {calculatorSubTab === 'supervision' && (
                  <div className="space-y-6 px-1 animate-fadeIn">
                    <div className="p-5 bg-white border border-[#c6c6cd]/60 shadow-sm rounded-2xl">
                      <label className="block text-sm font-bold mb-2 ml-1 text-[#0F172A]">计费额 (万元)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-[#0F172A]">¥</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={engineeringBudget}
                          onChange={(e) => setEngineeringBudget(e.target.value)}
                          className="w-full border-b border-[#c6c6cd] bg-transparent pl-10 pr-4 py-3 text-2xl font-black focus:outline-none focus:border-[#008ebf] placeholder:text-[#c6c6cd]"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleCalculate}
                      className="w-full bg-[#0F172A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e293b] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.1)] text-base"
                    >
                      开始测算监理费
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* 子页面 4：造价咨询费测算问卷 */}
                {calculatorSubTab === 'consulting' && (
                  <div className="space-y-10 px-4 py-8 animate-fadeIn max-w-4xl mx-auto w-full">
                    
                    {/* 顶部滑动指示器 */}
                    <div className="max-w-xl mx-auto mb-8 px-1">
                      <div className="flex justify-between text-[9px] font-bold text-[#76777d] mb-3 uppercase tracking-wider">
                        {getProvinceFlow().steps.map((stepText, idx) => (
                          <span key={idx} className={consultingStep === idx ? 'text-[#007AFF]' : ''}>
                            {stepText}
                          </span>
                        ))}
                      </div>
                      <div className="h-1.5 bg-[#eceef0] rounded-full overflow-hidden flex gap-1">
                        {getProvinceFlow().steps.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-full flex-1 transition-all duration-300 rounded-full ${
                              consultingStep >= idx ? 'bg-[#007AFF]' : 'bg-[#c6c6cd]/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 问卷滑动容器 */}
                    <div 
                      className="max-w-2xl w-full mx-auto select-none"
                      {...swipeHandlers}
                    >
                        <div className="relative overflow-hidden min-h-[460px] flex flex-col justify-center">
                          <AnimatePresence mode="wait" custom={slideDirection}>
                            {consultingStep === 0 && (
                              <motion.div
                                key="step-0"
                                custom={slideDirection}
                                variants={wizardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="space-y-8 p-10 md:p-12 bg-white shadow-lg rounded-[32px] text-center max-w-lg mx-auto w-full"
                              >
                                <div className="flex flex-col items-center gap-3.5 mb-2">
                                  <div className="bg-[#007AFF]/10 p-3.5 rounded-2xl text-[#007AFF]">
                                    <MapPin className="w-6 h-6" />
                                  </div>
                                  <h3 className="text-xl font-bold text-[#0F172A]">测算省份</h3>
                                </div>
                                <p className="text-xs text-[#76777d]">各省造价咨询计费规章与基准不同，请选择对应省份以匹配相应算法。</p>
                                <div className="relative mt-2 max-w-xs mx-auto">
                                  <select
                                    value={consultingProvince}
                                    onChange={(e) => {
                                      if (e.target.value === 'ADD_CUSTOM') {
                                        setShowAddProvinceModal(true);
                                        return;
                                      }
                                      setConsultingProvince(e.target.value);
                                      setConsultingServiceType(null);
                                      setConsultingSpecificType('');
                                      setConsultingCategoryIndex(null);
                                      setShowConsultingResult(false);
                                      // Auto-advance
                                      setTimeout(() => navigateConsultingStep(1), 150);
                                    }}
                                    className="w-full border border-[#c6c6cd] bg-white px-4 py-4 text-sm rounded-2xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%20%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none font-semibold text-[#0F172A] text-center"
                                  >
                                    <option value="">-- 请选择省份 --</option>
                                    <option value="湖南省">湖南省</option>
                                    <option value="浙江省">浙江省</option>
                                    <option value="贵州省">贵州省</option>
                                    {customProvinces.map((prov) => (
                                      <option key={prov.name} value={prov.name}>{prov.name}</option>
                                    ))}
                                    <option value="ADD_CUSTOM" className="text-[#007AFF] font-bold">+ 新增自定义省份...</option>
                                  </select>
                                </div>
                              </motion.div>
                            )}

                            {consultingStep === 1 && (
                              <div className="space-y-6 w-full">
                                {/* 湖南省：大类已合并至下方「造价咨询服务类型」下拉框 */}

                                <motion.div
                                  key="step-1"
                                    custom={slideDirection}
                                    variants={wizardVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="space-y-8 p-10 md:p-12 bg-white shadow-lg rounded-[32px] text-center max-w-lg mx-auto w-full animate-fadeIn"
                                  >
                                    <div className="flex flex-col items-center gap-3.5 mb-2">
                                      <div className="bg-[#007AFF]/10 p-3.5 rounded-2xl text-[#007AFF]">
                                        <Layers className="w-6 h-6" />
                                      </div>
                                      <h3 className="text-xl font-bold text-[#0F172A]">造价咨询服务类型</h3>
                                    </div>
                                    <p className="text-xs text-[#76777d]">请在下方列表中选定最匹配您项目需求的具体细分咨询服务。</p>
                                    <div className="relative mt-2">
                                      <select
                                        value={consultingSpecificType}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setConsultingSpecificType(value);
                                          // 湖南省：由细分项反推服务大类（1 单项 / 2 全过程造价咨询 / 3 跟踪审计）
                                          setConsultingServiceType(
                                            consultingProvince === '湖南省' ? resolveHunanServiceType(value) : null
                                          );
                                          setConsultingCategoryIndex(null);
                                          setShowConsultingResult(false);
                                          if (value) {
                                            setTimeout(() => navigateConsultingStep(2), 150);
                                          }
                                        }}
                                        className="w-full border border-[#c6c6cd] bg-white px-4 py-4 text-sm rounded-2xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%20%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none text-[#0F172A] font-semibold text-center"
                                      >
                                        <option value="">-- 请选择造价咨询服务类型 --</option>
                                        {consultingProvince === '湖南省' ? (
                                          <>
                                            <optgroup label="单项造价编制 / 审核">
                                              {SINGLE_SERVICE_TYPES.map((type) => (
                                                <option key={type} value={type}>
                                                  {type}
                                                </option>
                                              ))}
                                            </optgroup>
                                            <optgroup label="全过程造价咨询服务">
                                              {HUNAN_WHOLE_PROCESS_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                  {opt.label}
                                                </option>
                                              ))}
                                            </optgroup>
                                            <optgroup label="全过程跟踪审计">
                                              {HUNAN_TRACKING_AUDIT_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                  {opt.label}
                                                </option>
                                              ))}
                                            </optgroup>
                                          </>
                                        ) : (
                                          <>
                                            {consultingProvince === '贵州省' && GUIZHOU_SINGLE_SERVICE_TYPES.map((type) => (
                                              <option key={type} value={type}>
                                                {type}
                                              </option>
                                            ))}
                                            {consultingProvince === '浙江省' && ZHEJIANG_SINGLE_SERVICE_TYPES.map((type) => (
                                              <option key={type} value={type}>
                                                {type}
                                              </option>
                                            ))}
                                            {(() => {
                                              const custom = customProvinces.find(p => p.name === consultingProvince);
                                              return custom ? custom.services.map((s) => (
                                                <option key={s.name} value={s.name}>
                                                  {s.name}
                                                </option>
                                              )) : null;
                                            })()}
                                          </>
                                        )}
                                      </select>
                                    </div>
                                </motion.div>
                              </div>
                            )}

                            {consultingStep === 2 && (
                              <motion.div
                                key="step-2"
                                custom={slideDirection}
                                variants={wizardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="space-y-8 p-10 md:p-12 bg-white shadow-lg rounded-[32px] text-center max-w-lg mx-auto w-full animate-fadeIn"
                              >
                                <div className="flex flex-col items-center gap-3.5 mb-2">
                                  <div className="bg-[#007AFF]/10 p-3.5 rounded-2xl text-[#007AFF]">
                                    <Layers className="w-6 h-6" />
                                  </div>
                                  <h3 className="text-xl font-bold text-[#0F172A]">录入计费基数</h3>
                                  <p className="text-xs text-[#76777d]">（{getBillingBaseLabel()}）</p>
                                </div>

                                <div className="relative mt-2 max-w-xs mx-auto">
                                  <input
                                    type="number"
                                    value={unitProjects[0]?.cost || ''}
                                    onChange={(e) => {
                                      const newList = [{ id: '1', name: '单位工程 1', cost: e.target.value }];
                                      setUnitProjects(newList);
                                      setConsultingCategoryIndex(null);
                                      setShowConsultingResult(false);
                                    }}
                                    placeholder={`请输入${getBillingBaseLabel()}（${getBillingBaseUnit()}）`}
                                    className="w-full border border-[#c6c6cd] bg-white px-5 py-5 pr-12 text-base rounded-2xl focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none text-[#0F172A] font-bold text-center font-mono shadow-sm"
                                  />
                                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-[#76777d]">
                                    {getBillingBaseUnit()}
                                  </span>
                                </div>

                                {/* 跟踪审计：额外录入二类费用 */}
                                {consultingServiceType === 3 && (
                                  <div className="pt-6 border-t border-[#eceef0]/60 space-y-3">
                                    <label className="block text-sm font-bold text-[#0F172A] text-center">跟踪审计追加：二类费用（设计、监理等）合计</label>
                                    <div className="relative max-w-xs mx-auto">
                                      <input
                                        type="number"
                                        placeholder="如无请填 0"
                                        value={secondCategoryCost}
                                        onChange={(e) => {
                                          setSecondCategoryCost(e.target.value);
                                          setConsultingCategoryIndex(null);
                                          setShowConsultingResult(false);
                                        }}
                                        className="w-full border border-[#c6c6cd] bg-white px-4 py-3.5 pl-4 pr-12 text-sm rounded-2xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none font-mono font-semibold text-center"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#76777d]">万元</span>
                                    </div>
                                  </div>
                                )}

                                {unitProjects[0]?.cost && parseFloat(unitProjects[0].cost) > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="pt-2 flex justify-center"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => navigateConsultingStep(3)}
                                      className="px-8 py-3.5 bg-[#007AFF] text-white rounded-2xl text-xs font-bold hover:bg-[#0052b3] transition-all shadow-md active:scale-95 flex items-center gap-1.5 animate-fadeIn"
                                    >
                                      继续
                                      <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                  </motion.div>
                                )}
                              </motion.div>
                            )}

                            {consultingStep === 3 && (
                              <div className="space-y-6 w-full animate-fadeIn">
                                <motion.div
                                  key="step-3"
                                  custom={slideDirection}
                                  variants={wizardVariants}
                                  initial="enter"
                                  animate="center"
                                  exit="exit"
                                  className="space-y-8 p-10 md:p-12 bg-white shadow-lg rounded-[32px] text-center max-w-lg mx-auto w-full"
                                >
                                  <div className="flex flex-col items-center gap-3.5 mb-2">
                                    <div className="bg-[#007AFF]/10 p-3.5 rounded-2xl text-[#007AFF]">
                                      <Award className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F172A]">选择工程类别</h3>
                                  </div>
                                  <p className="text-xs text-[#76777d]">请选择工程对应的行业类别以匹配调整系数，也可直接使用固定系数或输入自定义系数。</p>
                                  <div className="relative mt-2 max-w-xs mx-auto">
                                    <select
                                      value={getCategorySelectValue()}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw === '') setConsultingCategoryIndex(null);
                                        else if (raw === CATEGORY_FIXED_VALUE) setConsultingCategoryIndex(-2);
                                        else if (raw === CATEGORY_CUSTOM_VALUE) setConsultingCategoryIndex(-1);
                                        else setConsultingCategoryIndex(Number(raw));
                                        setShowConsultingResult(false);
                                      }}
                                      className="w-full border border-[#c6c6cd] bg-white px-4 py-4 text-sm rounded-2xl appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%20%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1rem_center] bg-no-repeat focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none text-[#0F172A] font-semibold text-center"
                                    >
                                      <option value="">-- 请选择工程类别 --</option>
                                      {getProvinceCategories().map((cat, idx) => (
                                        <option key={idx} value={idx}>
                                          {idx + 1}. {cat.name} (调整系数: {cat.factor})
                                        </option>
                                      ))}
                                      {getProvinceCategories().length === 0 && (
                                        <option value={CATEGORY_FIXED_VALUE}>固定系数 1.0</option>
                                      )}
                                      <option value={CATEGORY_CUSTOM_VALUE}>自定义系数（手动输入）</option>
                                    </select>
                                  </div>

                                  {consultingCategoryIndex === -1 && (
                                    <div className="relative mt-2 max-w-xs mx-auto">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={consultingCustomFactor}
                                        onChange={(e) => {
                                          setConsultingCustomFactor(e.target.value);
                                          setShowConsultingResult(false);
                                        }}
                                        placeholder="请输入自定义系数，如 1.25"
                                        className="w-full border border-[#c6c6cd] bg-white px-5 py-4 pl-4 pr-14 text-sm rounded-2xl focus:ring-2 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none text-[#0F172A] font-bold text-center font-mono shadow-sm"
                                      />
                                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-[#76777d]">系数</span>
                                    </div>
                                  )}
                                </motion.div>

                                {getSelectedCategory() !== null && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-6 flex justify-center w-full"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleCalculateConsulting();
                                        navigateConsultingStep(4);
                                      }}
                                      className="px-10 py-4 bg-[#007AFF] text-white rounded-2xl text-xs font-bold hover:bg-[#0052b3] transition-all shadow-md active:scale-95 flex items-center gap-2 animate-fadeIn"
                                    >
                                      造价咨询费生成
                                      <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {consultingStep === 4 && (
                              <motion.div
                                key="step-4"
                                custom={slideDirection}
                                variants={wizardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="space-y-4 w-full animate-fadeIn"
                              >
                                {showConsultingResult && (
                                  <div className="p-6 bg-white border border-[#c6c6cd]/60 shadow-lg rounded-3xl space-y-4 border-t-4 border-t-[#007AFF] text-center">
                                    <div className="flex justify-between items-center pb-2 border-b border-[#eceef0]">
                                      <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                                        <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                                        咨询服务费测算报告
                                      </h3>
                                      <div className="text-xs font-black text-white bg-[#007AFF] px-4 py-2 rounded-xl font-mono shadow-sm">
                                        {extractFeeOnly(consultingResultText)}
                                      </div>
                                    </div>
                                    <pre className="text-xs font-mono bg-[#f7f9fb] p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed text-[#45464d] border border-[#eceef0] text-left">
                                      {consultingResultText}
                                    </pre>
                                  </div>
                                )}
                                <div className="flex justify-center pt-2">
                                  <button
                                    onClick={() => {
                                      setConsultingServiceType(null);
                                      setConsultingSpecificType('');
                                      setConsultingCategoryIndex(null);
                                      setConsultingCustomFactor('');
                                      setShowConsultingResult(false);
                                      setSecondCategoryCost('');
                                      setUnitProjects([{ id: '1', name: '单位工程 1', cost: '' }]);
                                      navigateConsultingStep(0);
                                    }}
                                    className="flex items-center gap-1.5 px-8 py-4 bg-[#0F172A] text-white rounded-2xl text-xs font-bold hover:bg-[#1e293b] transition-all shadow-md active:scale-[0.98]"
                                  >
                                    重新测算
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>


                    </div>
                  )}

                {/* Padding for fixed button */}
                <div className="h-20 md:hidden"></div>
              </div>
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              key="report"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 pt-2"
            >
              <div className="bg-white border border-[#c6c6cd]/60 rounded-lg p-3 shadow-sm border-t-4 border-t-[#008ebf]">
                <h2 className="text-xl font-bold mb-1">工程造价结算汇总</h2>
                <p className="text-[#45464d] text-[11px]">基于最新行业取费标准及用户输入参数自动计算</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
               <div className="md:col-span-4 bg-white border border-[#c6c6cd]/60 rounded-lg p-3 shadow-sm border-t-2 border-t-[#0F172A]">
                  <p className="text-[10px] uppercase tracking-wider text-[#45464d] mb-2 font-bold">项目概算总计 (预估总额)</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#008ebf]">
                      {(calcResults?.budget || 883.27).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-semibold text-[#45464d]">万元</span>
                  </div>
                </div>

                {(calcResults?.activeSubTab === 'design' || !calcResults?.activeSubTab) && (
                  <div className="md:col-span-8 bg-white border border-[#c6c6cd]/60 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-[#f2f4f6] px-4 py-2 border-b border-[#c6c6cd]/60 flex justify-between items-center">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                         <LayoutDashboard className="w-4 h-4 text-[#008ebf]" />
                         工程设计费 (总价)
                      </h3>
                      <span className="text-sm font-mono font-bold text-[#008ebf]">
                        {(calcResults?.design.total || 804.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} 万元
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col border-r border-[#eceef0] last:border-0 pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">方案设计({phases.p1}%)</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.design.p1 || 120.62).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col border-r border-[#eceef0] last:border-0 pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">初步设计({phases.p2}%)</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.design.p2 || 241.23).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">施工图({phases.p3}%)</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.design.p3 || 442.26).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Fee Sections */}
                {(calcResults?.activeSubTab === 'feasibility' || !calcResults?.activeSubTab) && (
                  <div key="ke-yan" className="md:col-span-12 bg-white border border-[#c6c6cd]/60 rounded-lg overflow-hidden shadow-sm animate-fadeIn">
                    <div className="bg-[#f2f4f6] px-4 py-2 border-b border-[#c6c6cd]/60 flex justify-between items-center">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                         <BarChart3 className="w-4 h-4 text-[#008ebf]" />
                         工程可研费用
                      </h3>
                      <span className="text-sm font-mono font-bold text-[#008ebf]">
                        {(calcResults?.feasibility.total || 28.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} 万元
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">编制项目建议书</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.feasibility.details['编制项目建议书'] || 9.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">编制可行性研究报告</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.feasibility.details['编制可行性研究报告'] || 12.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">评估项目建议书</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.feasibility.details['评估项目建议书'] || 7.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">评估可行性研究报告</span>
                          <span className="text-sm font-bold text-nowrap">
                            {calcResults?.feasibility.details['评估可行性研究报告'] ? calcResults.feasibility.details['评估可行性研究报告'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(calcResults?.activeSubTab === 'supervision' || !calcResults?.activeSubTab) && (
                  <div key="jian-li" className="md:col-span-12 bg-white border border-[#c6c6cd]/60 rounded-lg overflow-hidden shadow-sm animate-fadeIn">
                    <div className="bg-[#f2f4f6] px-4 py-2 border-b border-[#c6c6cd]/60 flex justify-between items-center">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                         <User className="w-4 h-4 text-[#008ebf]" />
                         工程监理费
                      </h3>
                      <span className="text-sm font-mono font-bold text-[#008ebf]">
                        {(calcResults?.supervision.total || 32.40).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} 万元
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">施工期监理</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.supervision.total || 25.92).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">额外咨询服务</span>
                          <span className="text-sm font-bold text-nowrap">--</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(calcResults?.activeSubTab === 'consulting' || !calcResults?.activeSubTab) && (
                  <div key="zhao-jia" className="md:col-span-12 bg-white border border-[#c6c6cd]/60 rounded-lg overflow-hidden shadow-sm animate-fadeIn">
                    <div className="bg-[#f2f4f6] px-4 py-2 border-b border-[#c6c6cd]/60 flex justify-between items-center">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                         <Settings2 className="w-4 h-4 text-[#008ebf]" />
                         造价咨询费 (旧版对照)
                      </h3>
                      <span className="text-sm font-mono font-bold text-[#008ebf]">
                        {(calcResults?.consulting.total || 18.27).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} 万元
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">清单编制费</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.consulting.details['清单编制费'] || 6.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col border-r border-[#eceef0] pr-1">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">过程咨询费</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.consulting.details['全过程造价咨询费'] || calcResults?.consulting.details['过程咨询费'] || 8.17).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#45464d] mb-1 font-medium truncate">结算审核费</span>
                          <span className="text-sm font-bold text-nowrap">
                            {(calcResults?.consulting.details['结算审核费 (含一审/终审)'] || calcResults?.consulting.details['结算审核费'] || 4.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} <span className="text-[9px] font-normal text-[#76777d]">万</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-12 bg-[#d5e3fd] rounded-lg p-4 text-[#57657b]">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" />
                    <h4 className="text-xs font-bold">备注说明</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    1. 以上费用均为预估金额，最终结算以实际审计结果为准。<br/>
                    2. 设计费已包含方案优化及三次重大修改的技术服务费。
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2 mb-20 lg:mb-0">
                <button 
                  onClick={() => setActiveTab('calculator')}
                  className="flex-1 bg-white border border-[#0F172A] text-[#0F172A] py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#eceef0] transition-all shadow-sm text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新计算
                </button>
                <button className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg text-sm">
                  <FileCheck className="w-4 h-4" />
                  导出 PDF
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 pt-2"
            >
              <div className="mb-2">
                <h2 className="text-xl font-bold tracking-tight mb-2 px-1">最近计算</h2>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                  <input
                    type="text"
                    placeholder="搜索项目名称"
                    className="w-full bg-white border border-[#c6c6cd]/60 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-sm text-[#191c1e]">历史计算记录</h3>
                <span className="text-[10px] bg-[#d5e3fd] text-[#57657b] px-2 py-0.5 rounded-full font-bold">共 {MOCK_RECORDS.length} 条</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {MOCK_RECORDS.map((record) => (
                  <motion.div
                    key={record.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setActiveTab('report')}
                    className="bg-white border border-[#c6c6cd]/60 rounded-lg p-3 shadow-sm hover:border-[#008ebf] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-[#f2f4f6] rounded-md group-hover:bg-[#dae2fd] transition-colors">
                        <ImageIcon className="w-4 h-4 text-[#515f74]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); /* Delete logic */ }}
                          className="p-1.5 text-[#76777d] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#c6c6cd]" />
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-0.5 truncate">{record.title}</h4>
                    <p className="text-[11px] text-[#76777d] mb-3">{record.date}</p>
                    <div className="flex items-end justify-between pt-2 border-t border-[#f2f4f6]">
                      <span className="text-[11px] text-[#57657b] font-medium">预计总额</span>
                      <span className="text-base font-black text-[#008ebf]">{record.totalAmount.toLocaleString()} 万元</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {!showAccountSettings ? (
                  <motion.div
                    key="profile-home"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <section 
                      onClick={() => setShowAccountSettings(true)}
                      className="bg-white border border-[#c6c6cd] rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-[#008ebf] transition-all cursor-pointer group"
                    >
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#0F172A] group-hover:scale-105 transition-transform">
                        <img 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQHSgF-Wilr4FO21cxp9ZlFRIiaw1BXJ327IssFEx6aECRJsJytK-fL-RjbjFjz0mjYVYNqF4DmnN8EN10ROcT15C231hvsvibyyy-w9qv3OK4RSx5HfJQfOO5i0v6wSKb5E7UVU-NXpSdRn4cqLHBFmiphrCbPIaO-B2F87hF1ICluJjSyal77ZEpxw_vBM5_CgcIdwPfYUApi8pgMHoxU4M5kkqDUovm436iD-cxKYKy_eBDZZcu62yM2xnNAd1pWuuUFJm29Lg" 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">工程造价师</h2>
                          <span className="bg-[#d5e3fd] text-[#57657b] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Pro</span>
                        </div>
                        <p className="text-sm text-[#45464d] flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-4 h-4" />
                          执业证书编号: CE-2023089412
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight className="w-5 h-5 text-[#c6c6cd] group-hover:text-[#008ebf] transition-colors" />
                        <span className="text-[10px] text-[#c6c6cd] mt-0.5">账号设置</span>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Calculation Preferences */}
                      <div className="md:col-span-12 bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-[#f2f4f6] border-b border-[#c6c6cd] flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      计算偏好
                    </h3>
                    
                    <div className="relative dropdown-container">
                      <div 
                        onClick={() => setShowGlobalDropdown(!showGlobalDropdown)}
                        className="flex items-center gap-1.5 border border-[#c6c6cd]/60 rounded-md px-2 py-1 bg-white cursor-pointer hover:border-[#008ebf] transition-all shadow-sm"
                      >
                        <span className="text-[10px] text-[#45464d] font-bold">
                          {displayStandard}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#76777d]" />
                      </div>
                      
                      <AnimatePresence>
                        {showGlobalDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#c6c6cd] rounded-xl shadow-2xl z-[60] overflow-hidden"
                          >
                            {globalPresets.map((preset) => (
                              <div 
                                key={preset}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyPreset(preset);
                                  setShowGlobalDropdown(false);
                                }}
                                className={`px-4 py-2.5 text-[11px] hover:bg-[#f2f4f6] cursor-pointer transition-colors border-b border-[#eceef0] font-bold flex items-center justify-between gap-2 group ${selectedGlobalPreset === preset && !isCustom ? 'text-[#008ebf]' : 'text-[#45464d]'}`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {selectedGlobalPreset === preset && !isCustom && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                  <span className="truncate">{preset}</span>
                                </div>
                                {preset !== '默认偏好' && (
                                  <Trash2 
                                    className="w-3 h-3 text-[#76777d]/0 group-hover:text-[#ba1a1a] transition-all hover:scale-110 shrink-0" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePreset(preset);
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowGlobalDropdown(false);
                                setShowSavePresetModal(true);
                              }}
                              className="px-4 py-3 text-[11px] hover:bg-[#f2f4f6] cursor-pointer transition-colors font-bold flex items-center gap-2 text-[#007AFF]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              保存为新偏好
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* 新增自定义省份 Modal */}
                  <AnimatePresence>
                    {showAddProvinceModal && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 30, scale: 0.95 }}
                          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                          {/* 头部 */}
                          <div className="p-6 border-b border-[#eceef0] flex justify-between items-center bg-gradient-to-r from-[#007AFF]/5 to-transparent">
                            <div className="text-left">
                              <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-[#007AFF]" />
                                新建自定义省份计费标准
                              </h3>
                              <p className="text-xs text-[#76777d] mt-1">设置本省专属的细分咨询项目、收费基础及费率算法</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowAddProvinceModal(false);
                                setConsultingProvince('');
                              }}
                              className="p-2 hover:bg-[#eceef0] rounded-full text-[#76777d] transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* 滚动表单区 */}
                          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                            {/* 1. 省份名称 */}
                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-[#0F172A]">省份名称</label>
                              <input
                                type="text"
                                placeholder="例如：广东省、四川省"
                                value={newProvName}
                                onChange={(e) => setNewProvName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f2f4f6] rounded-xl outline-none text-sm font-semibold border border-transparent focus:border-[#007AFF] transition-all font-sans"
                              />
                            </div>

                            {/* 2. 类别系数配置（所有省份统一包含「工程类别」步骤） */}
                            <div className="space-y-3 bg-[#f7f9fb] p-4 rounded-2xl border border-[#eceef0] transition-all">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-[#0F172A]">类别系数配置列表</h4>
                                  <button
                                    type="button"
                                    onClick={() => setNewProvCategories([...newProvCategories, { name: '', factor: '1.0' }])}
                                    className="text-xs font-bold text-[#007AFF] hover:underline flex items-center gap-1"
                                  >
                                    + 添加类别
                                  </button>
                                </div>
                                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                                  {newProvCategories.map((cat, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                      <input
                                        type="text"
                                        placeholder="如：装饰工程、古建工程"
                                        value={cat.name}
                                        onChange={(e) => {
                                          const newList = [...newProvCategories];
                                          newList[idx].name = e.target.value;
                                          setNewProvCategories(newList);
                                        }}
                                        className="flex-1 px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#007AFF]"
                                      />
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="系数"
                                        value={cat.factor}
                                        onChange={(e) => {
                                          const newList = [...newProvCategories];
                                          newList[idx].factor = e.target.value;
                                          setNewProvCategories(newList);
                                        }}
                                        className="w-20 px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-xs text-center outline-none focus:border-[#007AFF]"
                                      />
                                      {newProvCategories.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setNewProvCategories(newProvCategories.filter((_, i) => i !== idx))}
                                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                          删除
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                            </div>

                            {/* 3. 收费咨询项目列表 */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-[#0F172A]">细分咨询项目收费费率配置</label>
                                <button
                                  type="button"
                                  onClick={() => setNewProvServices([...newProvServices, {
                                    name: '',
                                    billingBase: '',
                                    rateType: 'progressive',
                                    rateValue: '0.3',
                                    progressiveRates: ['0.40', '0.35', '0.30', '0.22', '0.18', '0.12', '0.10', '0.10']
                                  }])}
                                  className="text-xs font-bold text-[#007AFF] hover:underline flex items-center gap-1"
                                >
                                  + 新增项目
                                </button>
                              </div>

                              <div className="space-y-4">
                                {newProvServices.map((service, idx) => (
                                  <div key={idx} className="p-4 bg-[#f8fafc] border border-[#eceef0] rounded-2xl space-y-4 relative">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-[#45464d]">咨询项目名称</span>
                                            <input
                                              type="text"
                                              placeholder="如：控制价编制或审核"
                                              value={service.name}
                                              onChange={(e) => {
                                                const newList = [...newProvServices];
                                                newList[idx].name = e.target.value;
                                                setNewProvServices(newList);
                                              }}
                                              className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#007AFF]"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-[#45464d]">收费基数名称</span>
                                            <input
                                              type="text"
                                              placeholder="如：控制价金额"
                                              value={service.billingBase}
                                              onChange={(e) => {
                                                const newList = [...newProvServices];
                                                newList[idx].billingBase = e.target.value;
                                                setNewProvServices(newList);
                                              }}
                                              className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#007AFF]"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-4 items-center">
                                          <span className="text-[11px] font-bold text-[#45464d]">计费类型:</span>
                                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                                            <input
                                              type="radio"
                                              name={`rateType-${idx}`}
                                              checked={service.rateType === 'progressive'}
                                              onChange={() => {
                                                const newList = [...newProvServices];
                                                newList[idx].rateType = 'progressive';
                                                setNewProvServices(newList);
                                              }}
                                              className="accent-[#007AFF]"
                                            />
                                            差额累进收费
                                          </label>
                                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                                            <input
                                              type="radio"
                                              name={`rateType-${idx}`}
                                              checked={service.rateType === 'percentage'}
                                              onChange={() => {
                                                const newList = [...newProvServices];
                                                newList[idx].rateType = 'percentage';
                                                setNewProvServices(newList);
                                              }}
                                              className="accent-[#007AFF]"
                                            />
                                            固定费率比例收费
                                          </label>
                                        </div>

                                        {service.rateType === 'percentage' ? (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-[#45464d]">固定比例收费费率 (%)</span>
                                            <div className="relative max-w-[150px]">
                                              <input
                                                type="number"
                                                step="0.001"
                                                placeholder="0.3"
                                                value={service.rateValue}
                                                onChange={(e) => {
                                                  const newList = [...newProvServices];
                                                  newList[idx].rateValue = e.target.value;
                                                  setNewProvServices(newList);
                                                }}
                                                className="w-full px-3 py-2 pr-6 bg-white border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#007AFF] font-semibold font-mono"
                                              />
                                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#76777d] font-bold">%</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-1.5">
                                            <span className="text-[11px] font-bold text-[#45464d]">差额累进各区间收费费率 (%)</span>
                                            <div className="grid grid-cols-4 gap-2">
                                              {[
                                                { label: '<100万', key: 0 },
                                                { label: '100-500万', key: 1 },
                                                { label: '500-1000万', key: 2 },
                                                { label: '1000-2000万', key: 3 },
                                                { label: '2000-5000万', key: 4 },
                                                { label: '50-1亿', key: 5 },
                                                { label: '1-5亿', key: 6 },
                                                { label: '>5亿', key: 7 },
                                              ].map((b) => (
                                                <div key={b.key} className="space-y-1 text-center bg-white p-1.5 border border-[#eceef0] rounded-xl">
                                                  <span className="text-[9px] font-bold text-[#76777d]">{b.label}</span>
                                                  <div className="relative">
                                                    <input
                                                      type="number"
                                                      step="0.001"
                                                      value={service.progressiveRates[b.key] || ''}
                                                      onChange={(e) => {
                                                        const newList = [...newProvServices];
                                                        newList[idx].progressiveRates[b.key] = e.target.value;
                                                        setNewProvServices(newList);
                                                      }}
                                                      className="w-full px-1 py-1 text-center bg-[#f7f9fb] border border-transparent rounded-lg text-xs font-mono font-black"
                                                    />
                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-[#76777d] font-bold">%</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {newProvServices.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setNewProvServices(newProvServices.filter((_, i) => i !== idx))}
                                          className="text-red-500 hover:text-red-700 text-xs font-bold self-start mt-2"
                                        >
                                          删除
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 底部按钮 */}
                          <div className="p-6 border-t border-[#eceef0] bg-[#f8fafc] flex gap-4">
                            <button
                              onClick={() => {
                                setShowAddProvinceModal(false);
                                setConsultingProvince('');
                              }}
                              className="flex-1 py-3.5 rounded-xl bg-white border border-[#c6c6cd] text-[#45464d] text-xs font-black active:scale-[0.98] transition-all shadow-sm"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => {
                                const name = newProvName.trim();
                                if (!name) {
                                  alert('请输入省份名称！');
                                  return;
                                }
                                if (newProvServices.some(s => !s.name.trim())) {
                                  alert('所有细分项目必须填写名称！');
                                  return;
                                }

                                const parsedProvince: CustomProvince = {
                                  name,
                                  hasCategoryStep: true,
                                  categories: newProvCategories.map(c => ({
                                    name: c.name.trim() || '通用工程',
                                    factor: parseFloat(c.factor) || 1.0
                                  })),
                                  services: newProvServices.map(s => ({
                                    name: s.name.trim(),
                                    billingBase: s.billingBase.trim() || '计费基数',
                                    rateType: s.rateType,
                                    rateValue: (parseFloat(s.rateValue) || 0) / 100, // stored as decimal
                                    progressiveRates: s.progressiveRates.map(val => (parseFloat(val) || 0) / 100)
                                  }))
                                };

                                const updated = [...customProvinces.filter(p => p.name !== name), parsedProvince];
                                setCustomProvinces(updated);
                                localStorage.setItem('cost_calculator_custom_provinces', JSON.stringify(updated));

                                setConsultingProvince(name);
                                setConsultingServiceType(null);
                                setConsultingSpecificType('');
                                setConsultingCategoryIndex(null);
                                setShowConsultingResult(false);

                                setShowAddProvinceModal(false);

                                // reset forms
                                setNewProvName('');
                                setNewProvCategories([{ name: '通用工程', factor: '1.0' }]);
                                setNewProvServices([{
                                  name: '投资估算编制或审核',
                                  billingBase: '估算价',
                                  rateType: 'progressive',
                                  rateValue: '0.35',
                                  progressiveRates: ['0.40', '0.35', '0.30', '0.22', '0.18', '0.12', '0.10', '0.10']
                                }]);

                                // Advance to step 1
                                setTimeout(() => navigateConsultingStep(1), 200);
                              }}
                              className="flex-1 py-3.5 rounded-xl bg-[#007AFF] text-white text-xs font-black active:scale-[0.98] transition-all shadow-md"
                            >
                              保存并选定该省份
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Save Preset Dialog */}
                  <AnimatePresence>
                    {showSavePresetModal && (
                      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                          <div className="p-5 border-b border-[#eceef0]">
                            <h3 className="text-lg font-bold text-[#191c1e]">保存自定义标准偏好</h3>
                            <p className="text-xs text-[#76777d] mt-1">为当前调整好的计算偏好命名，以便日后直接调用</p>
                          </div>
                          <div className="p-5 space-y-4">
                            <div className="space-y-1.5 focus-within:ring-1 focus-within:ring-[#007AFF]">
                              <input 
                                autoFocus
                                type="text"
                                placeholder="如：XX项目偏好"
                                value={newPresetName}
                                onChange={(e) => {
                                  setNewPresetName(e.target.value);
                                  setShowOverwriteWarning(false);
                                }}
                                className="w-full px-4 py-3 bg-[#f2f4f6] rounded-xl outline-none text-sm font-medium border border-transparent focus:border-[#008ebf] transition-all"
                              />
                            </div>

                            {showOverwriteWarning && (
                              <div className="mx-5 p-3 rounded-lg bg-[#ba1a1a]/5 border border-[#ba1a1a]/20">
                                <p className="text-[11px] text-[#ba1a1a] font-bold leading-relaxed">
                                  偏好“{newPresetName.trim()}”已存在，是否确认覆盖该偏好的所有配置数值？
                                </p>
                              </div>
                            )}

                            <div className="flex gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  setShowSavePresetModal(false);
                                  setShowOverwriteWarning(false);
                                }}
                                className="flex-1 py-3 rounded-xl bg-[#f2f4f6] text-[#45464d] text-sm font-bold active:scale-[0.98] transition-all"
                              >
                                取消
                              </button>
                              <button 
                                onClick={() => {
                                  const nameToSave = newPresetName.trim();
                                  if (!nameToSave) return;
                                  
                                  const isDuplicate = globalPresets.includes(nameToSave);
                                  
                                  // If it's a duplicate and user hasn't seen/confirmed the warning yet
                                  if (isDuplicate && !showOverwriteWarning) {
                                    setShowOverwriteWarning(true);
                                    return;
                                  }

                                  const config = {
                                    factor: industryFactor,
                                    factorStd: factorStd,
                                    designStd: designStandard,
                                    phases: { ...phases },
                                    feasibilityStd: feasibilityStd,
                                    supervisionStd: supervisionStd,
                                    consultingStd: consultingStd
                                  };
                                  
                                  // Update data
                                  setPresetsData(prev => ({ ...prev, [nameToSave]: config }));
                                  
                                  // Add to list if new
                                  if (!isDuplicate) {
                                    setGlobalPresets(prev => [...prev, nameToSave]);
                                  }
                                  
                                  // Set as active
                                  setSelectedGlobalPreset(nameToSave);
                                  
                                  // Close modal and reset warning
                                  setShowSavePresetModal(false);
                                  setShowOverwriteWarning(false);
                                  setNewPresetName('');
                                  
                                  // Show success message with a small delay
                                  setTimeout(() => {
                                    alert(`已成功保存并启用偏好：“${nameToSave}”`);
                                  }, 100);
                                }}
                                disabled={!newPresetName.trim()}
                                className={`flex-1 py-3 rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-50 ${
                                  showOverwriteWarning ? 'bg-[#ba1a1a]' : 'bg-[#0F172A]'
                                }`}
                              >
                                {showOverwriteWarning ? '确认覆盖' : '确认保存'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                  
                  <div className="divide-y divide-[#eceef0]">
                    <FeeSection 
                      icon={Percent} 
                      title="默认调整系数" 
                      isOpen={expandedPref === 'factor'}
                      onToggle={() => setExpandedPref(expandedPref === 'factor' ? null : 'factor')}
                      onSelect={(opt: string) => {
                        setFactorStd(opt);
                        if (opt === '湖南省标准') {
                          setIndustryFactor(1.05);
                        }
                      }}
                      defaultVal={factorStd}
                      customContent={(currentSelected: string) => (
                        <div className="pt-2 px-1">
                          <div className={`p-4 rounded-xl border flex justify-between items-center shadow-sm transition-all ${
                            currentSelected === '自定义标准' ? 'bg-white border-[#eceef0]' : 'bg-[#f2f4f6]/50 border-transparent opacity-80'
                          }`}>
                            <span className="text-sm font-medium text-[#45464d]">当前系数数值</span>
                            <div className="flex items-center">
                              <input 
                                type="number"
                                step="0.01"
                                readOnly={currentSelected !== '自定义标准'}
                                value={industryFactor}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setIndustryFactor(val);
                                  setFactorStd('自定义标准');
                                }}
                                className={`text-base font-black bg-transparent text-right outline-none w-20 transition-all ${
                                  currentSelected === '自定义标准' ? 'text-[#007AFF] cursor-text' : 'text-[#76777d] cursor-default'
                                }`}
                              />
                            </div>
                          </div>
                          {currentSelected !== '自定义标准' && (
                            <p className="text-[9px] text-[#76777d] mt-3 ml-1">切换至“自定义标准”以修改数值</p>
                          )}
                        </div>
                      )}
                      items={[]}
                    />

                    <FeeSection 
                      icon={BookOpen} 
                      title="工程设计费规范" 
                      isOpen={expandedPref === 'design'}
                      onToggle={() => setExpandedPref(expandedPref === 'design' ? null : 'design')}
                      onSelect={(opt: string) => setDesignStandard(opt)}
                      defaultVal={designStandard} 
                      customContent={(currentSelected: string) => {
                        const designItems = [
                          { 
                            name: '工程设计收费基价', 
                            rates: ['9.0', '20.9', '38.8', '103.8', '163.7', '249.6', '304.8', '566.8', '1054.0', '1515.5', '1960.1', '2393.4', '4450.8', '8276.7', '11897.5', '15391.4', '18793.8', '34948.9'], 
                            axis: ['0.02', '0.05', '0.1', '0.3', '0.5', '0.8', '1.0', '2.0', '4.0', '6.0', '8.0', '10', '20', '40', '60', '80', '100', '200'], 
                            labels: ['收费基价 (万元)', '计费额 (亿元)'] 
                          }
                        ];
                        return (
                          <div className="pt-2 px-1">
                            <div className="space-y-6">
                              {designItems.map((item, idx) => (
                                <FeeItem 
                                  key={idx} 
                                  item={item} 
                                  index={idx} 
                                  isEditable={currentSelected === '自定义标准'} 
                                />
                              ))}
                            </div>

                            <div className="mt-8 border-t border-[#eceef0]/60 pt-4">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-[#191c1e]">2. 阶段分配比例</span>
                              </div>
                              
                              <div className="flex h-5 w-full rounded-full overflow-hidden mb-4 border border-[#eceef0]/30 shadow-sm">
                                <div className="h-full bg-[#008ebf] flex items-center justify-center text-[9px] text-white font-bold transition-all duration-300" style={{ width: `${phases.p1}%` }}>
                                  <span 
                                    contentEditable={currentSelected === '自定义标准'}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = parseInt(e.currentTarget.textContent || '0');
                                      setPhases(prev => ({ ...prev, p1: val }));
                                      setDesignStandard('自定义标准');
                                    }}
                                    className={currentSelected === '自定义标准' ? "px-1 bg-white/20 rounded cursor-text" : ""}
                                  >
                                    {phases.p1}
                                  </span>%
                                </div>
                                <div className="h-full bg-[#0F172A] flex items-center justify-center text-[9px] text-white font-bold transition-all duration-300" style={{ width: `${phases.p2}%` }}>
                                  <span 
                                    contentEditable={currentSelected === '自定义标准'}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = parseInt(e.currentTarget.textContent || '0');
                                      setPhases(prev => ({ ...prev, p2: val }));
                                      setDesignStandard('自定义标准');
                                    }}
                                    className={currentSelected === '自定义标准' ? "px-1 bg-white/20 rounded cursor-text" : ""}
                                  >
                                    {phases.p2}
                                  </span>%
                                </div>
                                <div className="h-full bg-[#515f74] flex items-center justify-center text-[9px] text-white font-bold transition-all duration-300" style={{ width: `${phases.p3}%` }}>
                                  <span 
                                    contentEditable={currentSelected === '自定义标准'}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = parseInt(e.currentTarget.textContent || '0');
                                      setPhases(prev => ({ ...prev, p3: val }));
                                      setDesignStandard('自定义标准');
                                    }}
                                    className={currentSelected === '自定义标准' ? "px-1 bg-white/20 rounded cursor-text" : ""}
                                  >
                                    {phases.p3}
                                  </span>%
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#008ebf]"></div>
                                  <span className="text-xs text-[#45464d] font-medium">方案设计</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-[#eceef0] pl-4">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#0F172A]"></div>
                                  <span className="text-xs text-[#45464d] font-medium">初步设计</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-[#eceef0] pl-4">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#515f74]"></div>
                                  <span className="text-xs text-[#45464d] font-medium">施工图</span>
                                </div>
                              </div>
                            </div>

                            {currentSelected === '自定义标准' && (
                              <p className="text-[9px] text-[#007AFF] mt-6 italic">* 点击阶段百分比或横轴数值可直接修改</p>
                            )}
                          </div>
                        );
                      }}
                      items={[]}
                    />

                    <FeeSection 
                      icon={BarChart3} 
                      title="工程可研费规范" 
                      isOpen={expandedPref === 'ke-yan'}
                      onToggle={() => setExpandedPref(expandedPref === 'ke-yan' ? null : 'ke-yan')}
                      onSelect={(opt: string) => setFeasibilityStd(opt)}
                      defaultVal={feasibilityStd} 
                      items={FEASIBILITY_FEE_CONFIG}
                    />

                    <FeeSection 
                      icon={Eye} 
                      title="工程监理费规范" 
                      isOpen={expandedPref === 'jian-li'}
                      onToggle={() => setExpandedPref(expandedPref === 'jian-li' ? null : 'jian-li')}
                      onSelect={(opt: string) => setSupervisionStd(opt)}
                      defaultVal={supervisionStd} 
                      items={[
                        { name: '施工监理服务费收费标准', rates: SUPERVISION_FEE_CONFIG.rates, axis: SUPERVISION_FEE_CONFIG.axis, labels: ['费率 (%)', '工程费 (亿元)'] },
                      ]}
                    />

                    <FeeSection 
                      icon={Landmark} 
                      title="造价咨询费规范" 
                      isOpen={expandedPref === 'zhao-jia'}
                      onToggle={() => setExpandedPref(expandedPref === 'zhao-jia' ? null : 'zhao-jia')}
                      onSelect={(opt: string) => setConsultingStd(opt)}
                      defaultVal={consultingStd} 
                      items={CONSULTING_FEE_CONFIG}
                    />
                  </div>
                </div>

                {/* About Application */}
                <div className="md:col-span-12 overflow-hidden flex flex-col">
                  <div className="p-4 flex items-center justify-between text-center gap-2">
                    <button className="flex flex-col items-center gap-1 flex-1 hover:opacity-70 transition-opacity">
                      <RotateCcw className="w-4 h-4 text-[#76777d]" />
                      <span className="text-[10px] font-bold text-[#45464d]">版本 v2.4.0</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 flex-1 hover:opacity-70 transition-opacity">
                      <Lock className="w-4 h-4 text-[#76777d]" />
                      <span className="text-[10px] font-bold text-[#45464d]">隐私政策</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 flex-1 hover:opacity-70 transition-opacity">
                      <FileText className="w-4 h-4 text-[#76777d]" />
                      <span className="text-[10px] font-bold text-[#45464d]">用户协议</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 flex-1 hover:opacity-70 transition-opacity">
                      <HelpCircle className="w-4 h-4 text-[#76777d]" />
                      <span className="text-[10px] font-bold text-[#45464d]">帮助中心</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-12">
                  <button className="w-full bg-white border border-[#ba1a1a] rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors group">
                    <LogOut className="w-4 h-4 text-[#ba1a1a]" />
                    <span className="text-sm font-bold text-[#ba1a1a]">退出登录</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
                  <motion.div
                    key="account-settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Header with Back button */}
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setShowAccountSettings(false)}
                        className="p-2 bg-white rounded-lg border border-[#c6c6cd]/60 hover:bg-[#f2f4f6] transition-colors shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#45464d]" />
                      </button>
                      <h2 className="text-xl font-bold">账号设置</h2>
                    </div>

                    {/* Avatar Card */}
                    <div className="bg-white border border-[#c6c6cd] rounded-xl p-8 flex flex-col items-center gap-5 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008ebf] to-[#0F172A]"></div>
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f2f4f6] shadow-xl relative">
                          <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQHSgF-Wilr4FO21cxp9ZlFRIiaw1BXJ327IssFEx6aECRJsJytK-fL-RjbjFjz0mjYVYNqF4DmnN8EN10ROcT15C231hvsvibyyy-w9qv3OK4RSx5HfJQfOO5i0v6wSKb5E7UVU-NXpSdRn4cqLHBFmiphrCbPIaO-B2F87hF1ICluJjSyal77ZEpxw_vBM5_CgcIdwPfYUApi8pgMHoxU4M5kkqDUovm436iD-cxKYKy_eBDZZcu62yM2xnNAd1pWuuUFJm29Lg" 
                            alt="Profile" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-2 bg-[#007AFF] rounded-full border-2 border-white shadow-lg text-white">
                          <Settings2 className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-[#191c1e]">工程造价师</h4>
                        <p className="text-xs text-[#76777d]">执业证书编号: CE-2023089412</p>
                      </div>
                      <button className="px-8 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-[#1e293b] active:scale-[0.98] transition-all">
                        更换头像
                      </button>
                    </div>

                    {/* Security List */}
                    <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-[#f2f4f6] border-b border-[#c6c6cd]">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          账户与安全
                        </h3>
                      </div>
                      <div className="divide-y divide-[#eceef0]">
                        <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left group">
                          <div>
                            <p className="text-sm font-bold text-[#191c1e]">登录密码</p>
                            <p className="text-[11px] text-[#76777d] mt-0.5">建议定期更换密码以保障安全</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#76777d]">已设置</span>
                            <ChevronRight className="w-4 h-4 text-[#c6c6cd] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                        <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left group">
                          <div>
                            <p className="text-sm font-bold text-[#191c1e]">手机绑定</p>
                            <p className="text-[11px] text-[#76777d] mt-0.5">138****8888</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#76777d]">已验证</span>
                            <ChevronRight className="w-4 h-4 text-[#c6c6cd] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                        <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left group border-t border-[#eceef0]">
                          <div>
                            <p className="text-sm font-bold text-[#191c1e]">实名认证</p>
                            <p className="text-[11px] text-[#76777d] mt-0.5">用于执业证书合法性验证</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#ba1a1a] font-bold">待完善</span>
                            <ChevronRight className="w-4 h-4 text-[#c6c6cd] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center pt-4 pb-8">
                <p className="text-xs text-[#45464d]">© 2024 工程造价助手 - 专业工程管理系统</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>



      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2f4f6] pb-5 pt-2 flex items-center justify-around z-50">
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'calculator' || activeTab === 'report' ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
        >
          <Home className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-medium font-sans">计算器</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'history' ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
        >
          <MessageSquare className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-medium">历史</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'profile' ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
        >
          <User className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </nav>

      {/* Help Modal */}
      <AnimatePresence>
        {explainingItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-3xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-[#eceef0] flex items-center justify-between bg-[#f8f9fa]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#d5e3fd] rounded-lg">
                    <HelpCircle className="w-5 h-5 text-[#008ebf]" />
                  </div>
                  <h3 className="text-lg font-black text-[#191c1e]">详细说明</h3>
                </div>
                <button 
                  onClick={() => setExplainingItem(null)}
                  className="p-1.5 hover:bg-[#eceef0] rounded-full transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#76777d]" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#76777d] uppercase tracking-wider mb-1">名称</h4>
                  <p className="text-base font-bold text-[#191c1e]">{explainingItem.name}</p>
                </div>
                <div className="p-4 bg-[#f2f4f6]/50 rounded-xl border border-[#eceef0]">
                  <h4 className="text-xs font-bold text-[#76777d] uppercase tracking-wider mb-2">业务释义</h4>
                  <p className="text-sm text-[#45464d] leading-relaxed">
                    {explainingItem.desc}
                  </p>
                </div>
                <button 
                  onClick={() => setExplainingItem(null)}
                  className="w-full py-3.5 rounded-xl bg-[#0F172A] text-white text-sm font-bold active:scale-[0.98] transition-all"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
