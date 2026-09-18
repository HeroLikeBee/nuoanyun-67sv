/**
 * @name 客户合同 - 诺盾博达
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /rules/default-resource-recommendations.md
 */

import './style.css';
import React, { forwardRef, useImperativeHandle } from 'react';
import type { AxureProps, AxureHandle } from '../../common/axure-types';

// 侧边栏分组收起/展开箭头（向下箭头 path）
const SIDEBAR_CHEVRON_PATH = 'M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z';

// 侧边栏分组标题组件：点击收起/展开，箭头指示状态
function SidebarGroupTitle(props: {
  groupKey: string;
  open: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="style_43 block static font-normal leading-snug border-0 visible m-0 pt-0 pr-0 pb-1 pl-0 overflow-visible"
      style={{
        width: '155px',
        height: '27px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}
      onClick={function () { props.onToggle(props.groupKey); }}
    >
      <span>{props.children}</span>
      <span style={{ display: 'inline-flex', color: 'rgba(0, 0, 0, 0.45)' }}>
        <svg
          style={{
            width: '12px',
            height: '12px',
            transform: props.open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease'
          }}
          viewBox="64 64 896 896"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={SIDEBAR_CHEVRON_PATH}></path>
        </svg>
      </span>
    </div>
  );
}

// 侧边栏菜单项图标 path（file 文件 / people 人员 两种）
const MENU_FILE_ICON_PATH = 'M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4zM790.2 326L602 137.8V326zM320 482a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h384a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8zm0 136a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h184a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8z';
const MENU_PEOPLE_ICON_PATH = 'M928 224H768v-56c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v56H548v-56c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v56H328v-56c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v56H96c-17.7 0-32 14.3-32 32v576c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32M661 736h-43.9c-4.2 0-7.6-3.3-7.9-7.5c-3.8-50.6-46-90.5-97.2-90.5s-93.4 40-97.2 90.5c-.3 4.2-3.7 7.5-7.9 7.5H363a8 8 0 0 1-8-8.4c2.8-53.3 32-99.7 74.6-126.1a111.8 111.8 0 0 1-29.1-75.5c0-61.9 49.9-112 111.4-112s111.4 50.1 111.4 112c0 29.1-11 55.5-29.1 75.5c42.7 26.5 71.8 72.8 74.6 126.1c.4 4.6-3.2 8.4-7.8 8.4M512 474c-28.5 0-51.7 23.3-51.7 52s23.2 52 51.7 52s51.7-23.3 51.7-52s-23.2-52-51.7-52';

// 侧边栏菜单数据结构（多级：分组 → 子项）
type SidebarMenuItemData = { name: string; icon: 'file' | 'people'; textWidth: number };
type SidebarMenuGroupData = { key: string; title: string; openHeight: number; items: SidebarMenuItemData[] };

const MENU_GROUPS: SidebarMenuGroupData[] = [
  { key: 'xiaoshou', title: '销售管理', openHeight: 165, items: [
    { name: '客户管理', icon: 'file', textWidth: 56 },
    { name: '商机管理', icon: 'file', textWidth: 56 },
    { name: '投标管理', icon: 'file', textWidth: 56 }
  ] },
  { key: 'jiaofu', title: '交付管理', openHeight: 165, items: [
    { name: '合同管理', icon: 'file', textWidth: 56 },
    { name: '项目管理', icon: 'file', textWidth: 56 },
    { name: '采购管理', icon: 'file', textWidth: 56 }
  ] },
  { key: 'chanpin', title: '产品中心', openHeight: 73, items: [
    { name: '产品管理', icon: 'file', textWidth: 56 }
  ] },
  { key: 'xitongshezhi', title: '系统设置', openHeight: 257, items: [
    { name: '客户标签管理', icon: 'file', textWidth: 84 },
    { name: '功能标签管理', icon: 'file', textWidth: 84 },
    { name: '产品标签管理', icon: 'file', textWidth: 84 },
    { name: '报价标签管理', icon: 'file', textWidth: 84 },
    { name: '报价水印管理', icon: 'file', textWidth: 84 }
  ] }
];

// 侧边栏菜单项组件：可点击选中，选中后图标/文字高亮为蓝色
function SidebarMenuItem(props: {
  name: string;
  icon: 'file' | 'people';
  textWidth: number;
  active: boolean;
  onSelect: (name: string) => void;
}) {
  const iconPath = props.icon === 'people' ? MENU_PEOPLE_ICON_PATH : MENU_FILE_ICON_PATH;
  const liClass = (props.active ? 'style_50 ' : 'style_46 ') + 'flex relative items-center z-0 font-normal leading-snug whitespace-nowrap border-0 visible cursor-pointer m-0 pt-3 pr-3 pb-3 pl-4 overflow-hidden';
  const iconClass = (props.active ? 'style_48 ' : 'style_44 ') + 'flex static font-normal leading-3 text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible';
  const textClass = (props.active ? 'style_49 ' : 'style_45 ') + 'block static font-normal leading-snug whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2 p-0 overflow-hidden';
  return (
    <li className={liClass} style={{ width: '155px', height: '46px' }} onClick={function () { props.onSelect(props.name); }}>
      <span className={iconClass} style={{ width: '16px', height: '16px' }}>
        <svg style={{ width: '16px', height: '16px', display: 'block', fill: 'rgb(0, 0, 0)', strokeWidth: '1px', color: props.active ? 'rgb(24, 144, 255)' : 'rgb(138, 145, 156)', fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 1024 1024" className="iconify iconify--ant-design"><path fill="currentColor" d={iconPath}></path></svg>
      </span>
      <span className={textClass} style={{ width: props.textWidth + 'px', height: '22px' }}>{props.name}</span>
    </li>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[index] 组件渲染错误:', error);
    console.error('[index] 错误详情:', errorInfo);
    console.error('[index] 错误堆栈:', error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', border: '2px solid red', margin: '20px' }}>
          <h2>组件渲染失败: 客户合同 - 诺盾博达</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.error?.toString()}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const Component = forwardRef(function Index(
  innerProps: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  console.log('[index] 组件开始渲染');

  // 侧边栏分组展开状态（默认全部展开，支持收起/展开）
  const [openGroups, setOpenGroups] = React.useState<{ [key: string]: boolean }>({
    xiaoshou: true,
    jiaofu: true,
    chanpin: true,
    xitongshezhi: true
  });
  const toggleGroup = React.useCallback(function (key: string) {
    setOpenGroups(function (prev) { return { ...prev, [key]: !prev[key] }; });
  }, []);

  // 当前打开的菜单名：决定左侧选中高亮与标签页标题
  const [activeMenu, setActiveMenu] = React.useState<string>('合同管理');

  useImperativeHandle(ref, function () {
    return {
      getVar: function () { return undefined; },
      fireAction: function () {},
      eventList: [],
      actionList: [],
      varList: [],
      configList: [],
      dataList: []
    };
  }, []);

  // 动态注入外部资源
  React.useEffect(function () {
    const injected: (HTMLElement)[] = [];
    
    // 注入 links
    [{"href":"style.css","rel":"stylesheet","crossorigin":false}].forEach(function (linkInfo: any) {
      const existing = document.querySelector(`link[href="${linkInfo.href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = linkInfo.rel;
        link.href = linkInfo.href;
        if (linkInfo.crossorigin) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        injected.push(link);
      }
    });
    
    return function () {
      injected.forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  console.log('[index] 准备返回 JSX');

  try {
    return (
      <>
      <div data-chrome-export-root="true">
      <div data-chrome-export-body="true" className="style_208 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-x-hidden" style={{ width: '2552px', height: '1309px' }}>
              <div id="app" className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '1309px' }}>
                <section className="style_205 flex static flex-col grow font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '1309px' }}>
                  <header className="style_41 flex fixed flex-col shrink-0 z-50 font-normal border-0 visible mt-0 mr-0 mb-0 -ml-0 p-0 overflow-visible" style={{ width: '2552px', height: '60px' }}>
                    <div className="style_40 flex static items-center grow basis-1/12 font-normal border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '60px' }}>
                      <div className="style_4 flex static items-center font-normal border-0 visible m-0 p-0 overflow-visible" style={{ width: '192px', height: '60px' }}>
                        <div className="style_3 flex static items-center font-normal leading-3 text-center border-0 visible cursor-pointer m-0 pt-0.5 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '192px', height: '60px' }}>
                          <img className="style_1 block static font-normal leading-none text-center border-0 visible cursor-pointer mt-0 mr-2 mb-0 ml-2 p-0" src="assets/images/8PV4TGAAAAAElFTkSuQmCC.png" style={{ width: '32px', height: '32px' }} />
                          <div className="style_2 block static font-bold leading-tight text-center whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2 p-0 overflow-hidden" style={{ width: '84px', height: '26px' }}>诺盾博达</div>
                        </div>
                      </div>
                      <div className="style_20 block static grow basis-1/12 font-normal border-0 visible m-0 pt-0 pr-0 pb-0 pl-7 overflow-visible" style={{ width: '1879.2px', height: '60px' }}>
                        <ul className="style_19 flex static items-center font-normal text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '1849.2px', height: '60px' }}>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>项目概况</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>调度中心</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>联网监测</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '90px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '42px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '42px', height: '20px' }}>工作台</span>
                                <span className="style_9 block absolute z-10 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '8px', height: '8px' }}></span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>工程管理</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>物品管理</span>
                                <span className="style_10 block absolute z-10 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '8px', height: '8px' }}></span>
                              </div>
                            </span>
                          </li>
                          <li className="style_14 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_13 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_12 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_11 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue"' }}>经营管理</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>数据报表</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>知识中心</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>应急管理</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>平台配置</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>运营监测</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_8 block relative shrink-0 font-normal text-left whitespace-nowrap border-0 visible cursor-pointer -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '104px', height: '20px' }}>
                            <span className="style_7 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible">
                              <div className="style_6 inline-flex relative items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>
                                <span className="style_5 flex static items-center font-normal text-left whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '56px', height: '20px' }}>系统管理</span>
                              </div>
                            </span>
                          </li>
                          <li className="style_18 block absolute shrink-0 font-normal text-left border-0 opacity-0 visible cursor-not-allowed -mt-0 mr-0 mb-0 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-y-hidden" style={{ width: '54px', height: '0px' }}>
                            <div className="style_17 block relative font-normal text-left whitespace-nowrap border-0 visible cursor-not-allowed m-0 p-0 overflow-visible" style={{ width: '14px', height: '19px' }}>
                              <span className="style_16 inline static font-normal text-left whitespace-nowrap border-0 visible cursor-not-allowed m-0 p-0 overflow-visible">
                                <span className="style_15 inline-block static font-normal leading-3 text-center whitespace-nowrap border-0 visible cursor-not-allowed m-0 p-0 overflow-visible" style={{ width: '14px', height: '14px' }}>
                                  <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.25)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.25)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="ellipsis" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"></path></svg>
                                </span>
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <div className="style_39 flex static justify-between items-center font-normal border-0 visible m-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '480.797px', height: '60px' }}>
                        <div className="style_4 flex static items-center font-normal border-0 visible m-0 p-0 overflow-visible" style={{ width: '440.797px', height: '60px' }}>
                          <div className="style_25 flex static items-center font-normal border-0 visible cursor-pointer m-0 pt-0 pr-0.5 pb-0 pl-0.5 overflow-visible" style={{ width: '164px', height: '60px' }}>
                            <span className="style_24 flex relative font-normal leading-snug border visible cursor-pointer m-0 pt-1 pr-2.5 pb-1 pl-2.5 overflow-visible" style={{ width: '160px', height: '32px' }}>
                              <input className="style_21 block relative font-normal leading-snug border-0 visible cursor-text m-0 p-0" style={{ width: '76px', height: '22px' }} />
                              <span className="style_23 flex static items-center shrink-0 font-normal leading-snug border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible" style={{ width: '56px', height: '22px' }}>
                                <span className="style_22 block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 pt-0 pr-2 pb-0 pl-2 overflow-visible" style={{ width: '36px', height: '20px' }}>
                                  <svg style={{ width: '20px', height: '20px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.85)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg>
                                </span>
                              </span>
                            </span>
                          </div>
                          <div className="style_30 flex relative items-center font-normal border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2.5 pt-0 pr-0.5 pb-0 pl-0.5 overflow-visible" style={{ width: '40px', height: '40px' }}>
                            <div className="style_29 block relative font-normal border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '36px', height: '64px' }}>
                              <div className="style_28 inline-block relative font-normal border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '36px', height: '64px' }}>
                                <span className="style_26 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 pt-0 pr-2 pb-0 pl-2 overflow-visible" style={{ width: '36px', height: '20px' }}>
                                  <svg style={{ width: '20px', height: '20px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.85)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="bell" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M816 768h-24V428c0-141.1-104.3-257.7-240-277.1V112c0-22.1-17.9-40-40-40s-40 17.9-40 40v38.9c-135.7 19.4-240 136-240 277.1v340h-24c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h216c0 61.8 50.2 112 112 112s112-50.2 112-112h216c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM512 888c-26.5 0-48-21.5-48-48h96c0 26.5-21.5 48-48 48zM304 768V428c0-55.6 21.6-107.8 60.9-147.1S456.4 220 512 220c55.6 0 107.8 21.6 147.1 60.9S720 372.4 720 428v340H304z"></path></svg>
                                </span>
                                <span className="style_27 block absolute font-normal leading-none text-center border-0 visible cursor-pointer m-0 pt-0 pr-1 pb-0 pl-1 overflow-visible" style={{ width: '20.9375px', height: '16px' }}>25</span>
                              </div>
                            </div>
                          </div>
                          <div className="style_32 block static font-normal border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '30px', height: '64px' }}>
                            <span className="style_31 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 pt-0 pr-2 pb-0 pl-2 overflow-visible" style={{ width: '30px', height: '14px' }}>
                              <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.85)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="question-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M623.6 316.7C593.6 290.4 554 276 512 276s-81.6 14.5-111.6 40.7C369.2 344 352 380.7 352 420v7.6c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V420c0-44.1 43.1-80 96-80s96 35.9 96 80c0 31.1-22 59.6-56.1 72.7-21.2 8.1-39.2 22.3-52.1 40.9-13.1 19-19.9 41.8-19.9 64.9V620c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-22.7a48.3 48.3 0 0130.9-44.8c59-22.7 97.1-74.7 97.1-132.5.1-39.3-17.1-76-48.3-103.3zM472 732a40 40 0 1080 0 40 40 0 10-80 0z"></path></svg>
                            </span>
                          </div>
                          <span className="style_25 flex static items-center font-normal border-0 visible cursor-pointer m-0 pt-0 pr-0.5 pb-0 pl-0.5 overflow-visible" style={{ width: '36.7969px', height: '60px' }}>
                            <span className="style_33 block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 pt-0 pr-2 pb-0 pl-2 overflow-visible" style={{ width: '32.7969px', height: '16.7969px' }}>
                              <svg style={{ width: '16.7969px', height: '16.7969px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.85)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '16.8px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="fullscreen" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M290 236.4l43.9-43.9a8.01 8.01 0 00-4.7-13.6L169 160c-5.1-.6-9.5 3.7-8.9 8.9L179 329.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L370 423.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L290 236.4zm352.7 187.3c3.1 3.1 8.2 3.1 11.3 0l133.7-133.6 43.7 43.7a8.01 8.01 0 0013.6-4.7L863.9 169c.6-5.1-3.7-9.5-8.9-8.9L694.8 179c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L600.3 370a8.03 8.03 0 000 11.3l42.4 42.4zM845 694.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L654 600.3a8.03 8.03 0 00-11.3 0l-42.4 42.3a8.03 8.03 0 000 11.3L734 787.6l-43.9 43.9a8.01 8.01 0 004.7 13.6L855 864c5.1.6 9.5-3.7 8.9-8.9L845 694.9zm-463.7-94.6a8.03 8.03 0 00-11.3 0L236.3 733.9l-43.7-43.7a8.01 8.01 0 00-13.6 4.7L160.1 855c-.6 5.1 3.7 9.5 8.9 8.9L329.2 845c6.6-.8 9.4-8.9 4.7-13.6L290 787.6 423.7 654c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.4z"></path></svg>
                            </span>
                          </span>
                          <span className="style_38 flex static items-center font-normal border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2.5 pt-0 pr-2.5 pb-0 pl-2.5 overflow-hidden" style={{ width: '150px', height: '60px' }}>
                            <img className="style_34 block static font-normal border-0 visible cursor-pointer mt-0 mr-2.5 mb-0 ml-0 p-0" src="assets/images/D17GaJpLrMCVAAAAAElFTkSuQmCC.png" style={{ width: '36px', height: '36px' }} />
                            <div className="style_36 block static font-normal border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '60px', height: '15px' }}>
                              <div className="style_35 block static font-bold leading-none whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-hidden" style={{ width: '60px', height: '15px' }}>演示账号</div>
                            </div>
                            <span className="style_37 block static font-normal leading-3 text-center border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2.5 pt-1 pr-0 pb-0 pl-0 overflow-visible" style={{ width: '14px', height: '19px' }}>
                              <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgb(99, 115, 129)', strokeWidth: '1px', color: 'rgb(99, 115, 129)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </header>
                  <section className="style_204 flex static grow font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '1309px' }}>
                    <div className="style_42 block static shrink-0 basis-52 max-w-xs font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '210px', height: '1309px' }}></div>
                    <aside className="style_59 block fixed shrink-0 basis-52 max-w-xs z-50 font-normal leading-snug border-0 visible m-0 pt-0 pr-0 pb-2.5 pl-0 overflow-visible" style={{ width: '210px', height: '1249px' }}>
                      <div className="style_58 block static font-normal leading-snug border-0 visible -mt-0 mr-0 mb-0 ml-3.5 p-0 overflow-hidden" style={{ width: '195px', height: '1239px' }}>
                        <div className="style_57 block relative font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '195px', height: '1238.91px' }}>
                          <div className="style_53 block static font-normal leading-snug border-0 visible mt-0 mr-0 mb-4 ml-0 p-0 overflow-x-hidden" style={{ width: '195px', height: '1238.91px' }}>
                            <div className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '195px', height: '1219px' }}>
                              <ul className="style_51 block relative font-normal leading-snug border-0 visible m-0 pt-5 pr-0 pb-5 pl-0 overflow-visible" style={{ width: '195px' }}>
                              {MENU_GROUPS.map(function (group) {
                                const open = openGroups[group.key];
                                return (
                                  <div key={group.key} className="style_47 block static font-normal leading-snug border-0 visible mt-0 mr-0 mb-2.5 ml-0 pt-0 pr-5 pb-0 pl-5 overflow-visible" style={{ width: '195px', height: open ? group.openHeight + 'px' : 'auto' }}>
                                    <SidebarGroupTitle groupKey={group.key} open={open} onToggle={toggleGroup}>{group.title}</SidebarGroupTitle>
                                    {open && (
                                      <>
                                        {group.items.map(function (item) {
                                          return (
                                            <SidebarMenuItem
                                              key={item.name}
                                              name={item.name}
                                              icon={item.icon}
                                              textWidth={item.textWidth}
                                              active={activeMenu === item.name}
                                              onSelect={setActiveMenu}
                                            />
                                          );
                                        })}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              </ul>
                            </div>
                          </div>
                          <div className="style_55 block absolute z-0 font-normal leading-snug border-0 opacity-0 visible m-0 p-0 overflow-visible" style={{ width: '191px', height: '6px' }}>
                            <div className="style_54 block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '0px', height: '6px' }}></div>
                          </div>
                          <div className="style_56 block absolute z-0 font-normal leading-snug border-0 opacity-0 visible m-0 p-0 overflow-visible" style={{ width: '6px', height: '1234.91px' }}>
                            <div className="style_54 block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '6px', height: '0px' }}></div>
                          </div>
                        </div>
                      </div>
                    </aside>
                    <section className="style_203 flex static flex-col grow font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2341px', height: '1309px' }}>
                      <div className="style_60 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2341px', height: '94px' }}></div>
                      <div className="style_81 block fixed shrink-0 z-50 font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2342px', height: '34px' }}>
                        <div className="style_80 flex static flex-col font-normal leading-snug border-0 visible mt-0 mr-3.5 mb-0 ml-3.5 p-0 overflow-visible" style={{ width: '2312px', height: '34px' }}>
                          <div className="style_79 flex static flex-col font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '2312px', height: '34px' }}>
                            <div className="style_75 flex relative items-center shrink-0 font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2312px', height: '34px' }}>
                              <div className="style_74 flex relative self-stretch grow font-normal leading-snug whitespace-nowrap border-0 visible m-0 pt-0 pr-1.5 pb-0 pl-0 overflow-hidden" style={{ width: '2312px', height: '34px' }}>
                                <div className="style_73 flex relative items-end font-normal leading-snug whitespace-nowrap border-0 visible m-0 p-0 overflow-visible" style={{ width: 'auto', height: '34px' }}>
                                  <div className="style_65 flex relative items-center font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-1 mb-0 ml-0 pt-1.5 pr-3 pb-1.5 pl-4 overflow-visible" style={{ width: '70px', height: '30px' }}>
                                    <div id="rc-tabs-0-tab-/config-dashboard" className="style_64 block static font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '42px', height: '30px' }}>
                                      <span className="style_63 inline-flex static font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '42px', height: '30px' }}>
                                        <div className="style_62 block static font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 -ml-2.5 p-0 overflow-visible" style={{ width: '42px', height: '30px' }}>
                                          <span className="style_61 inline static font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible">项目概况</span>
                                        </div>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="style_72 flex relative items-center font-normal leading-7 whitespace-nowrap visible cursor-pointer mt-0 mr-1 mb-0 ml-0 pt-1.5 pr-3 pb-1.5 pl-4 overflow-hidden" style={{ width: 'auto', height: '34px', flexShrink: 0 }}>
                                    <div id="rc-tabs-0-tab-/quotationManagement/contract" className="style_69 block static font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: 'auto', height: '32px' }}>
                                      <span className="style_68 inline-flex static font-normal leading-relaxed whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: 'auto', height: '30px' }}>
                                        <div className="style_67 block static font-normal leading-relaxed whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 -ml-2.5 p-0 overflow-visible" style={{ width: 'auto', height: '30px' }}>
                                          <span className="style_66 inline static font-normal leading-relaxed whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible">{activeMenu}</span>
                                        </div>
                                      </span>
                                    </div>
                                    <button className="style_71 flex static justify-center items-center shrink-0 font-normal leading-7 text-center whitespace-nowrap border-0 visible cursor-pointer mt-0 -mr-1 mb-0 ml-2 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '14px', height: '14px' }}>
                                      <span className="style_70 block static font-normal leading-relaxed text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '9.59375px', height: '26px' }}>
                                        <svg style={{ width: '9.59375px', height: '12px', display: 'inline-block', fill: 'rgb(58, 65, 78)', strokeWidth: '1px', color: 'rgb(85, 85, 85)', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true" fillRule="evenodd" viewBox="64 64 896 896"><path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"></path></svg>
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="style_78 block static grow font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2312px', height: '0px' }}>
                              <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2312px', height: '0px' }}>
                                <div id="rc-tabs-0-panel-/quotationManagement/contract" className="style_76 block static shrink-0 font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2312px', height: '0px' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="style_202 block relative grow font-normal leading-snug border-0 visible mt-2 mr-0 mb-0 ml-0 pt-0 pr-3.5 pb-0 pl-3.5" style={{ width: '2341px', height: '1207px' }}>
                        <div className="style_57 block relative font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '2304px', height: '1214px' }}>
                          <div className="style_201 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '2304px', height: '1214px' }}>
                            <div className="style_200 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible mt-0 mr-0 mb-4 ml-0 p-0 overflow-visible" style={{ width: '2304px', height: '1198px' }}>
                              <div className="style_199 block relative font-normal leading-snug border-0 visible m-0 pt-3.5 pr-4 pb-1.5 pl-4 overflow-visible" style={{ width: '2304px', height: '1198px' }}>
                                <div className="style_83 block static font-normal leading-snug border-0 visible m-0 pt-0 pr-0 pb-3 pl-0 overflow-visible" style={{ width: '2272px', height: '36px' }}>
                                  <span className="style_82 flex relative justify-between items-center font-bold leading-normal border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '2272px', height: '24px' }}>客户跟进合同列表</span>
                                </div>
                                <div className="style_122 flex static justify-between font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2272px', height: '45px' }}>
                                  <form className="style_121 block static grow basis-1/12 font-normal leading-snug border-0 visible m-0 pt-0 pr-0 pb-1 pl-0 overflow-visible" style={{ width: '2272px', height: '45px' }}>
                                    <div className="style_120 flex static flex-wrap gap-y-2.5 font-normal leading-snug border-0 visible mt-0 -mr-2.5 mb-0 -ml-2.5 p-0 overflow-visible" style={{ width: '2292px', height: '40px' }}>
                                      <div className="style_93 block relative shrink-0 basis-1/6 font-normal leading-snug border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '382px' }}>
                                        <div className="style_92 flex static flex-wrap gap-y-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '362px', height: '32px' }}>
                                          <div className="style_85 block relative max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible m-0 p-0 overflow-hidden" style={{ width: '50px', height: '32px' }}>
                                            <label className="style_84 inline-flex relative items-center max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible cursor-default m-0 p-0 overflow-visible" style={{ width: '50px', height: '32px' }}>关键词</label>
                                          </div>
                                          <div className="style_91 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                            <div className="style_90 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                              <div className="style_89 block static grow max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                                <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                                  <div className="style_88 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                                    <span className="style_87 inline-flex relative font-normal leading-snug border visible m-0 pt-1 pr-2.5 pb-1 pl-2.5 overflow-visible" style={{ width: '312px', height: '32px' }}>
                                                      <input id="form_item_keyword" className="style_21 block relative font-normal leading-snug border-0 visible cursor-text m-0 p-0" style={{ width: '264px', height: '22px' }} />
                                                      <span className="style_86 flex static items-center shrink-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible" style={{ width: '20px', height: '22px' }}></span>
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="style_93 block relative shrink-0 basis-1/6 font-normal leading-snug border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '382px' }}>
                                        <div className="style_92 flex static flex-wrap gap-y-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '362px', height: '32px' }}>
                                          <div className="style_85 block relative max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible m-0 p-0 overflow-hidden" style={{ width: '36px', height: '32px' }}>
                                            <label className="style_84 inline-flex relative items-center max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible cursor-default m-0 p-0 overflow-visible" style={{ width: '36px', height: '32px' }}>客户</label>
                                          </div>
                                          <div className="style_91 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                            <div className="style_90 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                              <div className="style_89 block static grow max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                                <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                                  <div className="style_88 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                                    <div className="style_100 inline-block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                                      <div className="style_97 flex relative font-normal leading-snug border visible cursor-pointer m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '326px', height: '32px' }}>
                                                        <span className="style_95 block absolute font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '288px', height: '30px' }}>
                                                          <input id="form_item_customerId" className="style_94 inline-block static font-normal leading-snug border-0 opacity-0 visible cursor-pointer m-0 p-0" style={{ width: '288px', height: '30px' }} />
                                                        </span>
                                                        <span className="style_96 block static grow basis-1/12 font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 pt-0 pr-4 pb-0 pl-0 overflow-hidden" style={{ width: '302px', height: '30px' }}>请选择</span>
                                                      </div>
                                                      <span className="style_99 block absolute font-normal leading-3 text-center border-0 visible cursor-pointer -mt-1.5 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                        <span className="style_98 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                          <svg style={{ width: '12px', height: '12px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.25)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.25)', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'top', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg>
                                                        </span>
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="style_106 block relative max-w-full font-normal leading-snug border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '261px' }}>
                                        <div className="style_92 flex static flex-wrap gap-y-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '241px', height: '32px' }}>
                                          <div className="style_85 block relative max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible m-0 p-0 overflow-hidden" style={{ width: '92px', height: '32px' }}>
                                            <label className="style_84 inline-flex relative items-center max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible cursor-default m-0 p-0 overflow-visible" style={{ width: '92px', height: '32px' }}>合同所属年度</label>
                                          </div>
                                          <div className="style_91 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                            <div className="style_90 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                              <div className="style_89 block static grow max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                                <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                                  <div className="style_88 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                                    <div className="style_105 inline-flex relative items-center font-normal leading-snug border visible m-0 pt-1 pr-2.5 pb-1 pl-2.5 overflow-visible" style={{ width: '149px', height: '32px' }}>
                                                      <div className="style_104 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '125px', height: '22px' }}>
                                                        <input id="form_item_year" className="style_101 block relative grow font-normal leading-snug border-0 visible cursor-text m-0 p-0" style={{ width: '107px', height: '22px' }} />
                                                        <span className="style_103 block static self-center font-normal leading-none border-0 visible mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible" style={{ width: '14px', height: '14px' }}>
                                                          <span className="style_102 inline-block static font-normal leading-3 text-center border-0 visible m-0 p-0 overflow-visible" style={{ width: '14px', height: '14px' }}>
                                                            <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.25)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.25)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="calendar" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"></path></svg>
                                                          </span>
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="style_93 block relative shrink-0 basis-1/6 font-normal leading-snug border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '382px' }}>
                                        <div className="style_92 flex static flex-wrap gap-y-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '362px', height: '32px' }}>
                                          <div className="style_85 block relative max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible m-0 p-0 overflow-hidden" style={{ width: '64px', height: '32px' }}>
                                            <label className="style_84 inline-flex relative items-center max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible cursor-default m-0 p-0 overflow-visible" style={{ width: '64px', height: '32px' }}>合同状态</label>
                                          </div>
                                          <div className="style_91 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                            <div className="style_90 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                              <div className="style_89 block static grow max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                  <div className="style_88 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                    <div className="style_100 inline-block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                      <div className="style_97 flex relative font-normal leading-snug border visible cursor-pointer m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                        <span className="style_95 block absolute font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '260px', height: '30px' }}>
                                                          <input id="form_item_status" className="style_94 inline-block static font-normal leading-snug border-0 opacity-0 visible cursor-pointer m-0 p-0" style={{ width: '260px', height: '30px' }} />
                                                        </span>
                                                        <span className="style_96 block static grow basis-1/12 font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 pt-0 pr-4 pb-0 pl-0 overflow-hidden" style={{ width: '274px', height: '30px' }}>请选择</span>
                                                      </div>
                                                      <span className="style_107 block absolute font-normal leading-3 text-center border-0 visible cursor-pointer -mt-1.5 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                        <span className="style_98 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                          <svg style={{ width: '12px', height: '12px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.25)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.25)', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'top', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg>
                                                        </span>
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="style_93 block relative shrink-0 basis-1/6 font-normal leading-snug border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '382px' }}>
                                        <div className="style_92 flex static flex-wrap gap-y-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '362px', height: '32px' }}>
                                          <div className="style_85 block relative max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible m-0 p-0 overflow-hidden" style={{ width: '64px', height: '32px' }}>
                                            <label className="style_84 inline-flex relative items-center max-w-full font-normal leading-snug text-left whitespace-nowrap border-0 visible cursor-default m-0 p-0 overflow-visible" style={{ width: '64px', height: '32px' }}>合同类型</label>
                                          </div>
                                          <div className="style_91 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                            <div className="style_90 flex relative items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                              <div className="style_89 block static grow max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                <div className="style_77 flex static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                  <div className="style_88 block static grow basis-1/12 max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                    <div className="style_100 inline-block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                      <div className="style_97 flex relative font-normal leading-snug border visible cursor-pointer m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '298px', height: '32px' }}>
                                                        <span className="style_95 block absolute font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '260px', height: '30px' }}>
                                                          <input id="form_item_typeId" className="style_94 inline-block static font-normal leading-snug border-0 opacity-0 visible cursor-pointer m-0 p-0" style={{ width: '260px', height: '30px' }} />
                                                        </span>
                                                        <span className="style_96 block static grow basis-1/12 font-normal leading-7 whitespace-nowrap border-0 visible cursor-pointer m-0 pt-0 pr-4 pb-0 pl-0 overflow-hidden" style={{ width: '274px', height: '30px' }}>请选择</span>
                                                      </div>
                                                      <span className="style_107 block absolute font-normal leading-3 text-center border-0 visible cursor-pointer -mt-1.5 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                        <span className="style_98 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                          <svg style={{ width: '12px', height: '12px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.25)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.25)', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'top', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg>
                                                        </span>
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="style_119 block relative max-w-full font-normal leading-snug text-left border-0 visible m-0 pt-0 pr-2.5 pb-0 pl-2.5 overflow-visible" style={{ width: '198px', height: '40px' }}>
                                        <div className="style_118 block static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '178px' }}>
                                          <div className="style_117 flex static flex-wrap gap-y-0 font-normal leading-snug text-left border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '178px', height: '32px' }}>
                                            <div className="style_116 flex relative flex-col grow basis-0 max-w-full font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '178px', height: '32px' }}>
                                              <div className="style_115 flex relative items-center font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '178px', height: '32px' }}>
                                                <div className="style_114 block static grow max-w-full font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '178px', height: '32px' }}>
                                                  <button className="style_110 inline-block relative font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-2 mb-0 ml-0 pt-1 pr-3.5 pb-1 pl-3.5 overflow-visible" style={{ width: '80px', height: '32px' }}>
                                                    <span className="style_108 inline-block static font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '14px', height: '16px' }}>
                                                      <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgb(255, 255, 255)', strokeWidth: '1px', color: 'rgb(255, 255, 255)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg>
                                                    </span>
                                                    <span className="style_109 inline-block static font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>查询</span>
                                                  </button>
                                                  <button className="style_113 inline-block relative font-normal leading-snug text-center whitespace-nowrap border visible cursor-pointer mt-0 mr-2 mb-0 ml-0 pt-1 pr-3.5 pb-1 pl-3.5 overflow-visible" style={{ width: '82px', height: '32px' }}>
                                                    <span className="style_111 inline-block static font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '14px', height: '16px' }}>
                                                      <svg style={{ width: '14px', height: '14px', display: 'inline-block', fill: 'rgba(0, 0, 0, 0.85)', strokeWidth: '1px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="redo" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M758.2 839.1C851.8 765.9 912 651.9 912 523.9 912 303 733.5 124.3 512.6 124 291.4 123.7 112 302.8 112 523.9c0 125.2 57.5 236.9 147.6 310.2 3.5 2.8 8.6 2.2 11.4-1.3l39.4-50.5c2.7-3.4 2.1-8.3-1.2-11.1-8.1-6.6-15.9-13.7-23.4-21.2a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-9.3 9.3-19.1 18-29.3 26L668.2 724a8 8 0 00-14.1 3l-39.6 162.2c-1.2 5 2.6 9.9 7.7 9.9l167 .8c6.7 0 10.5-7.7 6.3-12.9l-37.3-47.9z"></path></svg>
                                                    </span>
                                                    <span className="style_112 inline-block static font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-2 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>重置</span>
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                                <div className="style_198 block static max-w-full font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2272px', height: '1095px' }}>
                                  <div className="style_197 block relative font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2272px', height: '1095px' }}>
                                    <div className="style_196 block relative font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2272px', height: '1095px' }}>
                                      <div className="style_185 block relative font-normal leading-snug border-0 visible m-0 p-0 overflow-x-hidden" style={{ width: '2279px', height: '1061px' }}>
                                        <div className="style_130 flex static justify-between items-center font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2279px', height: '40px' }}>
                                          <div className="style_60 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2279px' }}>
                                            <div className="style_129 flex static items-center font-normal leading-snug border-0 visible mt-0 mr-0 mb-2 ml-0 p-0 overflow-visible" style={{ width: '2279px', height: '32px' }}>
                                              <div className="style_128 flex static justify-between items-center grow basis-1/12 font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2279px', height: '32px' }}>
                                                <div className="style_127 flex static justify-between grow basis-1/12 font-normal leading-snug border-0 visible mt-0 mr-2 mb-0 ml-0 p-0 overflow-visible" style={{ width: '2271px', height: '32px' }}>
                                                  <div className="style_60 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '114px', height: '32px' }}>
                                                    <button className="style_124 inline-block relative font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer m-0 pt-1 pr-3.5 pb-1 pl-3.5 overflow-visible" style={{ width: '114px', height: '32px' }}>
                                                      <span className="style_123 inline-block static font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '84px', height: '22px' }}>上传盖章合同</span>
                                                    </button>
                                                  </div>
                                                  <div className="style_60 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '63.8438px', height: '32px' }}>
                                                    <button className="style_126 inline-block relative font-normal leading-snug text-center whitespace-nowrap border visible cursor-pointer m-0 pt-1 pr-3.5 pb-1 pl-3.5 overflow-visible" style={{ width: '63.8438px', height: '32px' }}>
                                                      <span className="style_125 inline-block static font-normal leading-snug text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '31.8438px', height: '22px' }}>导 出</span>
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="style_184 block static font-normal leading-snug visible m-0 p-0 overflow-visible" style={{ width: '2279px', height: '1021px' }}>
                                          <div className="style_156 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-hidden" style={{ width: '2278px', height: '48px' }}>
                                            <table className="style_155 static font-normal leading-snug text-left visible m-0 p-0 overflow-visible" style={{ width: '2278px', height: '48px' }}>
                                              <colgroup className="style_132 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2278px', height: '47px' }}>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.0625px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.0625px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.141px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.141px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '349.453px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '163.203px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '151.188px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.156px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.156px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.141px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '233.297px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '233.297px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.141px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '303.391px', height: '47px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '7.17188px', height: '47px' }}></col>
                                              </colgroup>
                                              <thead className="style_154 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2278px', height: '47px' }}>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2278px', height: '47px' }}>
                                                  <th className="style_138 relative font-medium leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.0625px', height: '47px' }}>
                                                    <div className="style_137 inline-flex relative flex-col font-medium leading-snug text-center border-0 visible m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <label className="style_136 flex static items-baseline font-medium leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                        <span className="style_135 block relative font-medium leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                          <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                          <span className="style_134 block relative font-medium leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                        </span>
                                                      </label>
                                                    </div>
                                                  </th>
                                                  <th className="style_138 relative font-medium leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.0625px', height: '47px' }}>
                                                    <span className="style_139 inline static font-medium leading-snug text-center border-0 visible m-0 p-0 overflow-visible">序号</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.141px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同类型</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.141px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同年度</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.453px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同名称</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.203px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同编号</span>
                                                  </th>
                                                  <th className="style_149 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible cursor-pointer m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.188px', height: '47px' }}>
                                                    <div className="style_148 flex static justify-between items-center grow font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '134.188px', height: '22px' }}>
                                                      <span className="style_143 block relative grow basis-1/12 z-0 font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-hidden" style={{ width: '119.188px', height: '22px' }}>
                                                        <span className="style_142 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">合同金额（元）</span>
                                                      </span>
                                                      <span className="style_147 block static font-medium leading-3 text-center whitespace-nowrap break-keep border-0 visible cursor-pointer mt-0 mr-0 mb-0 ml-1 p-0 overflow-visible" style={{ width: '11px', height: '18.7031px' }}>
                                                        <span className="style_146 inline-flex static flex-col items-center font-medium leading-3 text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '11px', height: '18.7031px' }}>
                                                          <span className="style_144 block static font-medium leading-3 text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '11px', height: '11px' }}>
                                                            <svg style={{ width: '11px', height: '11px', display: 'inline-block', fill: 'rgb(191, 191, 191)', strokeWidth: '1px', color: 'rgb(191, 191, 191)', fontSize: '11px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 500, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg>
                                                          </span>
                                                          <span className="style_145 block static font-medium leading-3 text-center whitespace-nowrap break-keep border-0 visible cursor-pointer -mt-1 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '11px', height: '11px' }}>
                                                            <svg style={{ width: '11px', height: '11px', display: 'inline-block', fill: 'rgb(191, 191, 191)', strokeWidth: '1px', color: 'rgb(191, 191, 191)', fontSize: '11px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 500, verticalAlign: 'baseline', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg>
                                                          </span>
                                                        </span>
                                                      </span>
                                                    </div>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.156px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同开始时间</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.156px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同截止时间</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.141px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">我方联系人</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '233.297px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">关联客户</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '233.297px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">关联业务</span>
                                                  </th>
                                                  <th className="style_141 relative font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.141px', height: '47px' }}>
                                                    <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">合同状态</span>
                                                  </th>
                                                  <th className="style_151 sticky z-0 font-medium leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '303.391px', height: '47px' }}>
                                                    <span className="style_150 block static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '286.391px', height: '22px' }}>
                                                      <span className="style_140 inline static font-medium leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible">操作</span>
                                                    </span>
                                                  </th>
                                                  <th className="style_152 sticky z-0 font-medium leading-snug text-left visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '7.17188px', height: '47px' }}></th>
                                                </tr>
                                              </thead>
                                            </table>
                                          </div>
                                          <div className="style_183 block static max-h-96 font-normal leading-snug border-0 visible m-0 p-0 overflow-y-scroll" style={{ width: '2278px', height: '972px' }}>
                                            <table className="style_182 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '392px' }}>
                                              <colgroup className="style_132 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '392px' }}>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.2188px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.2188px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '349.375px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '163.031px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '151.391px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.094px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.094px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '232.922px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '232.922px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '392px' }}></col>
                                                <col className="style_131 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '302.922px', height: '392px' }}></col>
                                              </colgroup>
                                              <tbody className="style_181 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '392px' }}>
                                                <tr className="style_159 static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '0px' }}>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.2188px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '58.2188px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '58.2188px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '58.2188px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '116.453px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '116.453px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '349.375px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '349.375px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '163.031px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '163.031px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '151.391px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '151.391px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.094px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '128.094px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '128.094px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '128.094px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '116.453px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '232.922px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '232.922px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '232.922px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '232.922px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '116.453px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '116.453px', height: '0px' }}></div>
                                                  </td>
                                                  <td className="style_158 relative font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '302.922px', height: '0px' }}>
                                                    <div className="style_157 block static font-normal leading-3 text-left border-0 visible m-0 p-0 overflow-hidden" style={{ width: '302.922px', height: '0px' }}></div>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>1</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2026</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">2026062402</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>ht2026062402</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>500000222</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-02-01</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2027-06-30</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>蓝艳</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">王九九</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_173 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>2</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2026</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">2026022401</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>ht2026022401</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>455555</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-03-01</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-09-30</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>蓝艳</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">王九九</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_176 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>3</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2026</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">2434</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>werwer123123</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>2312312</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-01</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2027-05-28</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>凡心波</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">测试521</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_173 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>4</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2020</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">1栋</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>3333</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>-555</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-29</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-31</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>凡心波</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">xhq</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_176 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>5</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2026</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">Test12</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>202408051616s</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>-5000</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-29</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2027-05-29</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>凡心波</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">ces 49</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_173 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_174 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>6</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2026</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">供水管理系统</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>202508051616s</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>-5000</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-29</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2027-05-28</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>凡心波</td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">ces 49</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">41001跟进</span>
                                                  </td>
                                                  <td className="style_175 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_176 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_160 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_163 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>7</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2020</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">11111111</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>11111</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>111111111111</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-16</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-23</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>蓝艳</td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">技术要求111</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">报价单123</span>
                                                  </td>
                                                  <td className="style_164 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_173 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                                <tr className="style_153 static font-normal leading-snug text-left border-0 visible m-0 p-0 overflow-visible" style={{ width: '2271px', height: '49px' }}>
                                                  <td className="style_178 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>
                                                    <label className="style_162 inline-flex static items-baseline font-normal leading-snug text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '22px' }}>
                                                      <span className="style_161 block relative font-normal leading-none text-center whitespace-nowrap border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}>
                                                        <input className="style_133 block absolute z-0 font-normal leading-none whitespace-nowrap border-0 opacity-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }} />
                                                        <span className="style_177 block relative font-normal leading-none text-center whitespace-nowrap border visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '16px', height: '16px' }}></span>
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="style_178 relative font-normal leading-snug text-center visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '58.2188px', height: '49px' }}>8</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>采购合同</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>2023</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '349.375px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">11111</span>
                                                  </td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '163.031px', height: '49px' }}>11111</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '151.391px', height: '49px' }}>1111</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-16</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '128.094px', height: '49px' }}>2026-05-17</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>蓝艳</td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}>
                                                    <span className="style_165 inline static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible">test个人123</span>
                                                  </td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '232.922px', height: '49px' }}></td>
                                                  <td className="style_179 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-hidden" style={{ width: '116.453px', height: '49px' }}>草稿</td>
                                                  <td className="style_180 sticky z-0 font-normal leading-snug text-center whitespace-nowrap break-keep visible m-0 pt-3 pr-2 pb-3 pl-2 overflow-visible" style={{ width: '302.922px', height: '49px' }}>
                                                    <span className="style_172 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-hidden" style={{ width: '285.922px', height: '24px' }}>
                                                      <div className="style_171 flex static justify-center items-center font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible m-0 p-0 overflow-visible" style={{ width: '285.922px', height: '24px' }}>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>编辑</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>下载</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_167 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '86px', height: '24px' }}>
                                                          <span className="style_166 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '70px', height: '22px' }}>收付款管理</span>
                                                        </button>
                                                        <div className="style_168 relative font-normal leading-snug text-center whitespace-nowrap break-keep visible mt-0 mr-0.5 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '1px', height: '12.5938px' }}></div>
                                                        <button className="style_170 flex relative items-center font-normal leading-snug text-center whitespace-nowrap break-keep border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '44px', height: '24px' }}>
                                                          <span className="style_169 block static font-normal leading-snug text-center whitespace-nowrap break-keep border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '28px', height: '22px' }}>删除</span>
                                                        </button>
                                                      </div>
                                                    </span>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                      <ul className="style_195 flex static flex-wrap justify-end gap-y-2 font-normal leading-snug border-0 visible mt-2.5 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '2272px', height: '24px' }}>
                                        <li className="style_186 block static shrink-0 font-normal leading-normal border-0 visible mt-0 mr-2 mb-0 ml-0 p-0 overflow-visible" style={{ width: '71.2188px', height: '24px' }}>共 9 条数据</li>
                                        <li className="style_188 block static shrink-0 font-medium leading-snug text-center border-0 visible cursor-pointer mt-0 mr-1 mb-0 ml-1 p-0 overflow-visible" style={{ width: '24px', height: '24px' }}>
                                          <a className="style_187 block static font-medium leading-snug text-center border-0 visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '24px', height: '22px' }}>1</a>
                                        </li>
                                        <li className="style_194 block static shrink-0 font-normal leading-snug border-0 visible mt-0 mr-0 mb-0 ml-0.5 p-0 overflow-visible" style={{ width: '89.3906px', height: '24px' }}>
                                          <div className="style_100 inline-block relative font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '89.3906px', height: '24px' }}>
                                            <div className="style_191 flex relative font-normal leading-snug border visible cursor-pointer m-0 pt-0 pr-1.5 pb-0 pl-1.5 overflow-visible" style={{ width: '89.3906px', height: '24px' }}>
                                              <span className="style_189 block absolute font-normal leading-snug border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '52.3906px', height: '22px' }}>
                                                <input id="rc_select_15" className="style_94 inline-block static font-normal leading-snug border-0 opacity-0 visible cursor-pointer m-0 p-0" style={{ width: '52.3906px', height: '22px' }} />
                                              </span>
                                              <span className="style_190 block relative grow basis-1/12 font-normal leading-snug whitespace-nowrap border-0 visible cursor-pointer m-0 pt-0 pr-5 pb-0 pl-0 overflow-hidden" style={{ width: '73.3906px', height: '22px' }}>10 条/页</span>
                                            </div>
                                            <span className="style_193 block absolute font-normal leading-3 text-center border-0 visible cursor-pointer -mt-1.5 mr-0 mb-0 ml-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                              <span className="style_192 inline-block static font-normal leading-3 text-center border-0 visible cursor-pointer m-0 p-0 overflow-visible" style={{ width: '12px', height: '12px' }}>
                                                <svg style={{ width: '12px', height: '12px', display: 'inline-block', fill: 'rgb(206, 206, 205)', strokeWidth: '1px', color: 'rgb(206, 206, 205)', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', fontWeight: 400, verticalAlign: 'top', overflow: 'hidden', visibility: 'visible' }} focusable="false" className="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg>
                                              </span>
                                            </span>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </section>
                </section>
              </div>
              <div className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}>
                <div className="style_206 block fixed z-50 font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}>
                  <div className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}></div>
                </div>
              </div>
              <div className="style_207 block absolute font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}>
                <div className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}></div>
              </div>
              <div className="style_207 block absolute font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}>
                <div className="style_52 block static font-normal leading-snug border-0 visible m-0 p-0 overflow-visible" style={{ width: '2552px', height: '0px' }}></div>
              </div>
            </div>
          </div>
          </>
    );
  } catch (error) {
    console.error('[index] JSX 渲染错误:', error);
    throw error;
  }
});

const WrappedComponent = forwardRef(function WrappedComponent(
  props: AxureProps,
  ref: React.ForwardedRef<AxureHandle>,
) {
  return (
    <ErrorBoundary>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  );
});

export default WrappedComponent;
