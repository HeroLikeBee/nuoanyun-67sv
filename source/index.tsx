/**
 * @name 诺安云 6.0
 */
// 诺安云 6.0 · 经营管理原型（19 页面 / 13 业务域）
// 依据：src/resources/prd/prd-08-nuoan-cloud-5.md（十要素规格）+ 用户截图（主框架与菜单）
//       + 20 个历史设计 HTML + 规范.md + 驾驶舱.html（驾驶舱版式参照）
//       设计基底 src/themes/nuoan-cloud/DESIGN.md
// 收敛说明：「我的工作台」与「经营驾驶舱」已合并为单一「驾驶舱」页面（角色视角在页内切换）
import React, { useMemo, useState } from 'react';
import { useHashPage, defineHashPageRoute } from '../../common/useHashPage';
import AppShell from './components/AppShell';
import { ToastProvider } from './components/ui';
import { APPROVALS, BIDS, PAGE_META, RECEIVABLES } from './components/data';
import './style.css';

import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import OppPage from './pages/OppPage';
import QuotePage from './pages/QuotePage';
import QuoteEditPage from './pages/QuoteEditPage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import BidPage from './pages/BidPage';
import CertPage from './pages/CertPage';
import DocPage from './pages/DocPage';
import ContractPage from './pages/ContractPage';
import ContractNewPage from './pages/ContractNewPage';
import ProjectPage from './pages/ProjectPage';
import ProjectCenterPage from './pages/ProjectCenterPage';
import ProjectNewPage from './pages/ProjectNewPage';
import ApprovalPage from './pages/ApprovalPage';
import SupplierPage from './pages/SupplierPage';
import MaterialPage from './pages/MaterialPage';
import DevicePage from './pages/DevicePage';
import InvoicePage from './pages/InvoicePage';
import SettingsPage from './pages/SettingsPage';

const ROUTE = defineHashPageRoute(
  Object.keys(PAGE_META).map((id) => ({ id, title: PAGE_META[id].title, group: PAGE_META[id].group })),
  { defaultPageId: 'dashboard' },
);

/**
 * 列表型页面：内容区视口锁定 —— 页头 / 瓦片 / 页签 / 筛选固定不动，
 * 表格卡吃满剩余高度并在卡内局部滚动，分页脚常驻卡底。
 * 驾驶舱、详情、工作台与向导页内容较长，保持整页滚动。
 *
 * 例外：合同管理 / 项目列表 改为整页滚动（不进此集合）。
 * 原因是这两页的表体在视口锁定下只剩 530~550px，10 行数据里有一半要滚才能看到；
 * 整页滚动后表体不再自带滚动条，一屏能看完当前页。
 * 配套样式见 style.css 末尾「整页滚动的列表页」覆盖块——那里把这两页的列表卡
 * 设为按内容撑开，否则卡片仍会被 flex 压缩、卡内又冒出滚动条。
 */
const FIXED_PAGES = new Set([
  'customer', 'opp', 'quote', 'bid', 'cert', 'doc',
  'approval', 'supplier', 'material', 'device', 'invoice',
]);

type GoFn = (pageId: string) => void;

export default function NuoanCloud6() {
  const { page, setPage } = useHashPage(ROUTE);
  const [role, setRole] = useState('sysadmin');
  /**
   * 路由脉冲：每次跳转自增。各页用它作为 effect 依赖重新读取 store 里的 focus，
   * 保证「同一页之间反复下钻」（如 A 项目 → 客户 → 该项目）也能重新打开详情。
   */
  const [nav, setNav] = useState(0);
  const go: GoFn = (p) => { setPage(p); setNav((n) => n + 1); };

  /**
   * 顶栏消息角标：由业务数据实时派生（此前写死 5）。
   * 口径 = 待我审批（待审批 + 审批中）+ 逾期应收期次 + 投标保证金未退。
   */
  const pending = useMemo(
    () => APPROVALS.filter((a) => a.status === '待审批' || a.status === '审批中').length
      + RECEIVABLES.filter((r) => r.status === '逾期').length
      + BIDS.filter((b) => b.depositSt === '未退').length,
    [],
  );

  const render = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage go={go} role={role} nav={nav} />;
      case 'customer': return <CustomerPage go={go} role={role} nav={nav} />;
      case 'opp': return <OppPage go={go} role={role} nav={nav} />;
      case 'quote': return <QuotePage go={go} role={role} nav={nav} />;
      case 'quote-edit': return <QuoteEditPage go={go} role={role} nav={nav} />;
      case 'quote-detail': return <QuoteDetailPage go={go} role={role} nav={nav} />;
      case 'bid': return <BidPage go={go} role={role} nav={nav} />;
      case 'cert': return <CertPage go={go} role={role} nav={nav} />;
      case 'doc': return <DocPage go={go} role={role} nav={nav} />;
      case 'contract': return <ContractPage go={go} role={role} nav={nav} />;
      case 'contract-new': return <ContractNewPage go={go} role={role} nav={nav} />;
      case 'project': return <ProjectPage go={go} role={role} nav={nav} />;
      case 'project-center': return <ProjectCenterPage go={go} role={role} nav={nav} />;
      case 'project-new': return <ProjectNewPage go={go} role={role} nav={nav} />;
      case 'approval': return <ApprovalPage go={go} role={role} nav={nav} />;
      case 'supplier': return <SupplierPage go={go} role={role} nav={nav} />;
      case 'material': return <MaterialPage go={go} role={role} nav={nav} />;
      case 'device': return <DevicePage go={go} role={role} />;
      case 'invoice': return <InvoicePage go={go} role={role} nav={nav} />;
      case 'settings': return <SettingsPage go={go} role={role} nav={nav} />;
      default: return <DashboardPage go={go} role={role} nav={nav} />;
    }
  };

  return (
    <ToastProvider>
      <AppShell page={page} onNavigate={go} role={role} onRoleChange={setRole} pending={pending} fixedLayout={FIXED_PAGES.has(page)}>
        {render()}
      </AppShell>
    </ToastProvider>
  );
}

export type { GoFn };
