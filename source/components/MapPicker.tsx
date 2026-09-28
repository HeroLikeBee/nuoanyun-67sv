// 诺安云 6.0 · 地图选择器（mock 底图）
// 不接真实地图 API：CSS 模拟浅色地图底图（浅灰/浅绿块 + 网格线 + 城市道路示意）。
// 点击地图任意位置生成红色定位 marker，反显「地址 + 经纬度」（mock 经纬度，以昆明为中心）。
// 内置「清除重选」与手填兜底，可作为 Field 的自定义控件或独立组件使用。
import React, { useMemo, useRef, useState } from 'react';
import { Btn } from './ui';
import { Ico } from './icons';

export type MapPickerProps = {
  /** 当前地址（手填或点选回填） */
  value?: string;
  /** 选中后回传：地址 + 经度 + 纬度（手填时 lng/lat 为空） */
  onChange: (addr: string, lng?: string, lat?: string) => void;
  placeholder?: string;
};

/* 昆明城区 mock 区块：按相对坐标(x:0~1, y:0~1)命中就近区块名。
   底图只是示意，不要求地理精确 —— 点哪都能反显一个合理的「区/路」文案。 */
const DISTRICTS: { x: number; y: number; name: string }[] = [
  { x: 0.22, y: 0.28, name: '五华区 · 翠湖片区' },
  { x: 0.55, y: 0.22, name: '盘龙区 · 白塔路' },
  { x: 0.78, y: 0.40, name: '官渡区 · 关上' },
  { x: 0.30, y: 0.62, name: '西山区 · 滇池路' },
  { x: 0.62, y: 0.68, name: '呈贡区 · 乌龙片区' },
  { x: 0.15, y: 0.78, name: '西山区 · 马街' },
  { x: 0.85, y: 0.18, name: '官渡区 · 巫家坝' },
  { x: 0.45, y: 0.45, name: '盘龙区 · 东风广场' },
];

/** 由点击相对坐标 → mock 经纬度（昆明 102.71°E, 25.04°N 为中心，±0.05° 偏移） */
function coordOf(x: number, y: number): { lng: string; lat: string } {
  const lng = 102.66 + x * 0.12;
  const lat = 25.09 - y * 0.10;
  return { lng: lng.toFixed(2), lat: lat.toFixed(2) };
}

/** 由点击相对坐标 → 就近区块名 */
function districtOf(x: number, y: number): string {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best.name;
}

export default function MapPicker({ value, onChange, placeholder }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  /* marker 相对坐标（0~1）；null 表示未点选 */
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);
  /* 点选反显的地址串（含区块 + 经纬度） */
  const [pickedAddr, setPickedAddr] = useState('');
  /* 手填兜底输入 */
  const [manual, setManual] = useState(value || '');

  /* 外部 value 变化时同步到手填框（只在未点选时不覆盖点选结果） */
  React.useEffect(() => {
    if (!mark && value !== manual) setManual(value || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onMapClick = (e: React.MouseEvent) => {
    const el = mapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setMark({ x, y });
    const { lng, lat } = coordOf(x, y);
    const addr = `${districtOf(x, y)} · ${lng}°E, ${lat}°N`;
    setPickedAddr(addr);
    setManual(addr);
    onChange(addr, lng, lat);
  };

  const clear = () => {
    setMark(null);
    setPickedAddr('');
    setManual('');
    onChange('');
  };

  const onManual = (v: string) => {
    setManual(v);
    /* 手填时清掉经纬度（点选才带坐标） */
    onChange(v);
  };

  /* 道路示意：几条横向/纵向虚线，纯装饰 */
  const roads = useMemo(
    () => [
      { top: '30%', h: 6 }, { top: '58%', h: 5 }, { top: '82%', h: 6 },
      { left: '28%', w: 5 }, { left: '62%', w: 6 },
    ],
    [],
  );

  return (
    <div className="nc-mappicker">
      <div
        ref={mapRef}
        className="nc-map-canvas"
        onClick={onMapClick}
        role="application"
        aria-label="点击地图选择位置"
      >
        {/* 底图色块：浅绿（绿地/水域）+ 浅灰（建筑） */}
        <div className="nc-map-block nc-map-green" style={{ left: '4%', top: '8%', width: '30%', height: '22%' }} />
        <div className="nc-map-block nc-map-green" style={{ left: '60%', top: '66%', width: '34%', height: '26%' }} />
        <div className="nc-map-block nc-map-gray" style={{ left: '40%', top: '10%', width: '24%', height: '18%' }} />
        <div className="nc-map-block nc-map-gray" style={{ left: '8%', top: '40%', width: '20%', height: '24%' }} />
        <div className="nc-map-block nc-map-gray" style={{ left: '70%', top: '18%', width: '24%', height: '30%' }} />
        {/* 网格线 */}
        <div className="nc-map-grid" />
        {/* 道路示意 */}
        {roads.map((r, i) => (
          <div key={i} className="nc-map-road" style={r} />
        ))}
        {/* 区块标签（mock） */}
        {DISTRICTS.map((d) => (
          <span key={d.name} className="nc-map-label" style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}>
            {d.name.split(' · ')[0]}
          </span>
        ))}
        {/* marker */}
        {mark && (
          <div className="nc-map-marker" style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%` }}>
            <Ico n="pin" size={20} />
          </div>
        )}
        {!mark && (
          <div className="nc-map-hint"><Ico n="target" size={14} /> 点击地图任意位置定位</div>
        )}
      </div>

      <div className="nc-map-bar">
        <span className="nc-map-result">
          {pickedAddr
            ? <><Ico n="pin" size={14} /> 已选：{pickedAddr}</>
            : <span className="nc-muted">{value || '尚未点选位置'}</span>}
        </span>
        {mark && (
          <Btn size="sm" onClick={clear} title="清除已选 marker，重新点选">清除重选</Btn>
        )}
      </div>

      <input
        className="nc-input nc-map-input"
        value={manual}
        onChange={(e) => onManual(e.target.value)}
        placeholder={placeholder || '或手动输入地址，如：××中心大厦 B2 消防泵房'}
      />
    </div>
  );
}
