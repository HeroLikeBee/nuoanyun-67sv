var UserComponent=function(s){"use strict";var Xa=Object.defineProperty;var v=(s,e)=>Xa(s,"name",{value:e,configurable:!0});var e=`// 消安云平台 · 页面分片 acceptDocHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function acceptDocHTML(){
 var rows=[
  ['YS-2609-006','XX大厦 · 消防水系统','验收资料 12 项','已归档',tg('g','验收通过'),OKNO],
  ['YS-2609-004','XX医院 · 火灾报警系统','验收资料 8 项','缺失 1 项（整改单）',tg('r','整改中'),OKNO],
  ['YS-2609-002','XX产业园 · 防排烟系统','验收资料 9 项','已归档',tg('g','验收通过'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">验收资料（归入验收目录 · 工程 / 财务审核后归档）</div>'+
  '<div class="table-wrap">'+tblHTML(['验收单','项目 · 系统','资料项','归档情况','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>已归档 2 · 整改中 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：补充缺失资料">补资料</button></span></div>'+
  '<div class="demo-note">验收资料缺失影响收款：必须补齐验收单 / 消防报告 / 整改闭环后才算归档完成</div></div>';
}`,u=`// 消安云平台 · 页面分片 acceptStdHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function acceptStdHTML(){
 var rows=[
  ['YS-2609-006','XX大厦 · 消防水系统','喷淋系统水压测试','12 项 / 12 项',tg('g','合格'),OKNO],
  ['YS-2609-004','XX医院 · 火灾报警','探测器功能测试','9 项 / 10 项',tg('r','1 项不合格'),OKNO],
  ['YS-2609-002','XX产业园 · 防排烟','风机风量测试','6 项 / 6 项',tg('g','合格'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">标准验收单（按检查项逐项验收 · 不能只写「一切正常」）</div>'+
  '<div class="table-wrap">'+tblHTML(['验收单','项目 · 系统','验收内容','检查项','结果','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>合格 2 · 不合格 1（已发起整改闭环）</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新建验收单">+ 新建验收单</button></span></div>'+
  '<div class="demo-note">验收单按标准检查项逐项勾选并拍照留证，不合格项自动进入整改闭环（发现 → 整改 → 复查）</div></div>';
}`,b=`// 消安云平台 · 页面分片 autoInvHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function autoInvHTML(){
 var rows=[
  ['KP-2609-041','XX大厦 · 消防泵维修（保外）','¥8,500','销售合同 / 维修订单 RP-2609-016',tg('b','待确认开票'),OKNO],
  ['KP-2609-039','XX产业园 · 维保年费（续签）','¥92,000','维保合同 XW-2609-01',tg('b','待确认开票'),OKNO],
  ['KP-2609-036','XX医院 · 喷淋改造进度款','¥186,000','销售合同 XS-2609-03',tg('g','已开票'),OKNO],
  ['KP-2609-032','XX商业广场 · 应急照明','¥36,500','销售合同 XS-2609-02',tg('g','已开票'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">自动开票任务（财务确认后对接税务开票）</div>'+
  '<div class="table-wrap">'+tblHTML(['开票任务','开票内容','金额','关联单据','状态','操作'],rows,1060)+'</div>'+
  '<div class="wb-total"><span>待确认 2 单 ¥100,500 · 已开票 2 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量确认开票">批量确认开票</button></span></div>'+
  '<div class="demo-note">维修确收订单 / 续签合同 / 进度款自动生成开票任务，财务点「确认开票」对接税务</div></div>';
}`,g=`// 消安云平台 · 页面分片 autoRecvHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function autoRecvHTML(){
 var rows=[
  ['SR-2609-008','华信管业','¥168,000','已自动匹配：采购合同 ZC-2609-08',tg('b','待人工确认'),OKNO],
  ['SR-2609-006','天广消防','¥86,400','已自动匹配：采购合同 ZC-2609-05',tg('b','待人工确认'),OKNO],
  ['SR-2609-003','安泰电子','¥42,800',tg('y','模糊匹配 2 个候选'),tg('y','待人工选择'),OKNO],
  ['SR-2609-001','金桥物资','¥31,200','已确认挂接',tg('g','已挂接'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">自动收票挂接（从税务系统抓取 → 按销售方 / 名称 / 金额 / 项目匹配 → 人工确认保存）</div>'+
  '<div class="table-wrap">'+tblHTML(['收票任务','销售方','金额','匹配结果','状态','操作'],rows,1020)+'</div>'+
  '<div class="wb-total"><span>本月抓取收票 12 张 · 自动匹配 9 · 待确认 3</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：全部确认挂接">全部确认</button></span></div>'+
  '<div class="demo-note">红圈是内账系统：开票 / 收票仅经授权后与税务系统对接，收票按要素自动匹配，人工确认避免错挂</div></div>';
}`,m=`// 消安云平台 · 页面分片 batchQrHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function batchQrHTML(){
 var rows=[
  ['PC-2609-031','镀锌钢管 DN100','项目现场仓 A','3,000 m','¥168.0','09-16',tg('b','可打印'),OKNO],
  ['PC-2609-029','喷淋头 ZSTX15','项目现场仓 A','600 只','¥30.0','09-15',tg('b','可打印'),OKNO],
  ['PC-2609-026','烟感探测器 JTY-GD','维保备件库 A1','400 只','¥16.0','09-14',tg('g','已打印'),OKNO],
  ['PC-2609-022','沟槽管件','公司库 B2','180 件','¥120.0','09-12',tg('g','已打印'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">批次 / 二维码（入库自动生成 · 扫码溯源）</div>'+
  '<div class="table-wrap">'+tblHTML(['批次号','物料','仓库 / 库位','数量','入库单价','日期','状态','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>待打印 2 批 · 已打印 2 批</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：打印批次二维码标签">批量打印二维码</button></span></div>'+
  '<div class="demo-note">移动端扫码可看：材料信息 / 供应商 / 合同 / 入库时间 / 合格证 3C / 后续领用结算记录</div></div>';
}`,f=`// 消安云平台 · 证书台账（参考"证书管理.html"重构：三视角列表 + 汇总四卡 + 待处理黄条 + 详情 + 表单 + 借用流程）
// 数据：CERTS（app-data.js）兼容旧字段；扩展字段（level/major/no/org/issueDate/validFrom/validTo/longTerm/remind/subsidy/borrow/borrowHistory/attachments/renewals/status）按需写入
var __certState=null;
function certInit(){
 if(__certState)return;
 __certState={view:'list',seg:'cert',type:'all',status:'all',kw:'',pKw:'',expanded:null,editId:null,draft:null,flow:null};
}
function certX(c){
 var x=c._x;if(x)return x;
 x={id:c.id,name:c.name,holder:c.holder,type:c.type,valid:c.valid,days:c.days,occ:c.occ,occNote:c.occNote,
  ownerType:(c.type==='企业')?'company':'personal',
  level:c.level||'—',major:c.major||'',no:c.no||c.id,org:c.org||'—',
  issueDate:c.issueDate||c.valid||'',validFrom:c.validFrom||c.valid||'',validTo:c.validTo||c.valid||'',
  longTerm:!!c.longTerm,remind:c.remind||60,
  subsidy:c.subsidy||{mode:'none'},borrow:c.borrow||null,
  borrowHistory:c.borrowHistory||[],attachments:c.attachments||[],renewals:c.renewals||[],status:c.status||'active'};
 c._x=x;return x;
}
function certSt(x){
 if(x.status==='archived')return {k:'archived',l:'已注销',t:'gray'};
 if(x.longTerm)return {k:'long',l:'长期有效',t:'blue'};
 if(!x.validTo)return {k:'ok',l:'—',t:'gray'};
 var d=Math.ceil((new Date(x.validTo)-new Date())/864e5);
 if(d<0)return {k:'expired',l:'已过期 '+(-d)+' 天',t:'red'};
 if(d<=90)return {k:'soon',l:'临期 '+d+' 天',t:'yellow'};
 return {k:'ok',l:'有效',t:'green'};
}
function certDays(x){
 if(x.longTerm||!x.validTo)return Infinity;
 return Math.ceil((new Date(x.validTo)-new Date())/864e5);
}
function certResp(x){return x.ownerType==='personal'?x.holder:(x.custodian?x.custodian+'（保管）':(x.holder||'—'))}
function certSubTxt(x){
 var s=x.subsidy;
 if(x.ownerType!=='personal'||!s||s.mode==='none'||!s.amount)return '';
 return '¥'+s.amount+'/'+({monthly:'月',yearly:'年',once:'次'}[s.mode]);
}
function certYearCost(x){
 var s=x.subsidy;
 if(x.ownerType!=='personal'||!s||!s.amount)return 0;
 if(s.mode==='monthly')return Number(s.amount)*12;
 if(s.mode==='yearly')return Number(s.amount);
 return 0;
}
function certOccTag2(x){
 if(x.occ==='占用中')return tagHtml('占用中 · '+(x.occNote||''),'red');
 if(x.occ==='预占用')return tagHtml('预占用 · '+(x.occNote||''),'yellow');
 if(x.borrow){var d=Math.ceil((new Date(x.borrow.toDate)-new Date())/864e5);
  return d<0?tagHtml('借出超期 '+(-d)+' 天','red'):(d<=7?tagHtml('借出中 · 剩 '+d+' 天','yellow'):tagHtml('借出中','blue'));}
 return tagHtml('空闲','gray');
}
function certBorrowBadge(x){
 if(!x.borrow)return '';
 var d=Math.ceil((new Date(x.borrow.toDate)-new Date())/864e5);
 if(d<0)return tagHtml('超期 '+(-d)+' 天未还','red');
 if(d<=7)return tagHtml('剩 '+d+' 天归还','yellow');
 return tagHtml('借出中','blue');
}
function certFlowMask(){return '<div class="cert-mask" id="certFlowMask"><div class="cert-flow" id="certFlowBox"></div></div>'}
function certOpenFlow(html){certInit();var r=document.getElementById('certRoot');var m=r?r.querySelector('#certFlowMask'):null;
 if(!m){var d=document.createElement('div');d.className='cert-mask';d.id='certFlowMask';d.innerHTML='<div class="cert-flow" id="certFlowBox"></div>';
  (r||document.body).appendChild(d);m=d;}
 m.style.display='flex';m.querySelector('#certFlowBox').innerHTML=html;
 m.onclick=function(e){if(e.target===m)certCloseFlow()};
 bindCertFlow(m);
}
function certCloseFlow(){var m=document.getElementById('certFlowMask');if(m)m.style.display='none'}
function bindCertFlow(m){
// 流按钮由 certGlobalBind 捕获处理（flowok/flowcancel），避免平台全局委托拦截
}
function certFlowOk(cb){window.__certFlowOk=cb}

/* ============ 主页面 ============ */
function bidCertHTML(){
 certInit();certGlobalBind();var st=__certState;
 var body=st.view==='detail'?certDetailHTML(st.detailId):(st.view==='form'?certFormHTML():certListHTML());
 return '<div id="certPageBox">'+body+'</div>';
}
/* ---------- 列表 ---------- */
function certSummary(){
 var act=CERTS.filter(function(c){return c.status!=='archived'}).map(certX);
 var soon=act.filter(function(x){var d=certDays(x);return d>=0&&d<=90}).sort(function(a,b){return certDays(a)-certDays(b)});
 var exp=act.filter(function(x){return certDays(x)<0});
 var co=act.filter(function(x){return x.ownerType==='company'}).length;
 var yc=act.reduce(function(s,x){return s+certYearCost(x)},0);
 var card=function(lb,v,note,cls){return '<div class="cert-sum '+cls+'"><div class="cs-lb">'+lb+'</div><div class="cs-v num">'+v+'</div><div class="cs-n">'+note+'</div></div>'};
 return '<div class="cert-sums">'+
  card('在册证书',act.length,'个人 '+(act.length-co)+' · 公司 '+co+'','')+
  card('90 天内到期',soon.length,soon.length?('最早 '+soon[0].validTo+' 到期'):'—','warn')+
  card('已过期',exp.length,exp.length?'请尽快安排复审 / 续期':'—','bad')+
  card('年度补贴成本','¥'+Math.round(yc).toLocaleString(),'个人持证补贴年化合计','gold')+'</div>';
}
function certStrip(){
 var items=[];
 CERTS.filter(function(c){return c.status!=='archived'}).forEach(function(c){
  var x=certX(c);
  if(x.borrow){var rd=Math.ceil((new Date(x.borrow.toDate)-new Date())/864e5);
   if(rd<0)items.push({txt:'《'+x.name+'》借出「'+x.borrow.projectName+'」已超期 '+(-rd)+' 天',id:x.id,bad:1,d:rd});
   else if(rd<=7)items.push({txt:'《'+x.name+'》'+rd+' 天后需归还（'+x.borrow.projectName+'）',id:x.id,d:rd});}
  if(!x.borrow&&x.occ==='占用中'&&x.occNote)items.push({txt:'《'+x.name+'》'+x.occNote+' 使用中',id:x.id,d:30});
  if(!x.longTerm&&x.validTo){var ed=certDays(x);
   if(ed<0)items.push({txt:'《'+x.name+'》· '+certResp(x)+' 已过期 '+(-ed)+' 天',id:x.id,bad:1,d:ed});
   else if(ed<=90)items.push({txt:'《'+x.name+'》· '+certResp(x)+' '+ed+' 天后到期',id:x.id,d:ed});}
 });
 items.sort(function(a,b){return a.d-b.d});
 if(!items.length)return '';
 var LIM=4,h='<div class="cert-strip">';
 h+='<span class="cs-t">⏰ '+items.length+' 条证书待处理</span>';
 items.forEach(function(it,i){
  h+='<button class="cs-chip'+(it.bad?' bad':'')+'" data-cact="strip" data-id="'+it.id+'" style="'+(i>=LIM?'display:none':'')+'">'+it.txt+'</button>';
 });
 if(items.length>LIM)h+='<button class="cs-more" data-cact="strip-all">展开全部 '+items.length+' 项</button>';
 h+='</div>';
 return h;
}
function certSeg(){
 var s=st_=__certState;
 return '<div class="cert-seg">'+
  '<button data-cact="seg" data-v="cert" class="'+(s.seg==='cert'?'on':'')+'">按证书</button>'+
  '<button data-cact="seg" data-v="person" class="'+(s.seg==='person'?'on':'')+'">按人员</button>'+
  '<button data-cact="seg" data-v="proj" class="'+(s.seg==='proj'?'on':'')+'">按项目</button></div>';
}
function certToolbar(){
 var s=__certState,h='<div class="cert-tb">';
 h+='<input class="cert-ipt" id="certKw" placeholder="搜索证书 / 持有人 / 编号…" value="'+(s.seg==='proj'?s.pKw:s.kw)+'" data-cact="kw">';
 if(s.seg==='cert')h+='<select class="cert-sel" data-cact="status"><option value="all">全部状态</option><option value="ok">有效</option><option value="soon">临期</option><option value="expired">已过期</option><option value="long">长期有效</option><option value="borrow">借出中</option><option value="archived">已注销</option></select>';
 h+='<span style="margin-left:auto" class="cert-act"><button class="cert-btn ok" data-cact="new">+ 新增证书</button><button class="mini-btn mini-no" data-toast="演示：导出台账（Excel）">导出台账</button></span></div>';
 return h;
}
function certTypeChips(){
 var s=__certState;
 if(s.seg!=='cert')return '';
 var types=['人员','企业'],cnt={};CERTS.forEach(function(c){cnt[c.type]=(cnt[c.type]||0)+1});
 return '<div class="cert-chips"><button class="chip2'+(s.type==='all'?' on':'')+'" data-cact="type" data-t="all">全部 <b>'+CERTS.length+'</b></button>'+
  types.map(function(t){return '<button class="chip2'+(s.type===t?' on':'')+'" data-cact="type" data-t="'+t+'">'+t+' <b>'+(cnt[t]||0)+'</b></button>'}).join('')+'</div>';
}
function certRows(){
 var s=__certState,arr=CERTS.slice();
 if(s.type!=='all')arr=arr.filter(function(c){return c.type===s.type});
 if(s.status!=='all'){
  arr=arr.filter(function(c){var x=certX(c),k=certSt(x).k;
   if(s.status==='borrow')return !!x.borrow&&k!=='archived';
   return k===s.status;});
 }
 if(s.kw.trim()){var k=s.kw.trim().toLowerCase();
  arr=arr.filter(function(c){var x=certX(c);return [x.name,x.holder,x.custodian,x.no,x.major].join(' ').toLowerCase().indexOf(k)>-1});}
 arr.sort(function(a,b){var xa=certX(a),xb=certX(b);return certDays(xa)-certDays(xb)});
 return arr;
}
function certTable(){
 var s=__certState,arr=certRows();
 var h='<table class="tbl" style="min-width:1040px"><thead><tr><th>证书名称</th><th>持有人 / 保管人</th><th>类型</th><th>证书编号</th><th>有效期至</th><th>状态</th><th>占用 / 借用</th><th style="width:190px">操作</th></tr></thead><tbody>';
 if(!arr.length)return '<div class="mn-tip">没有符合条件的证书</div></table>';
 arr.forEach(function(c){var x=certX(c),stx=certSt(x),d=certDays(x);
  var due=!x.longTerm&&x.validTo?('<span class="num">'+x.validTo+'</span><div class="cell-sub num '+(d<0?'c-red':d<=30?'c-yellow':d<=90?'c-yellow':'c-gray')+'">'+(d<0?'已过期 '+(-d)+' 天':'剩余 '+d+' 天')+'</div>')
   :'<span class="cell-sub">'+(x.longTerm?'长期有效':(x.validTo||'—'))+'</span>';
  var sub='<button class="cert-btn ok" data-cact="view" data-id="'+c.id+'">详情</button>';
  if(stx.k!=='archived'){
   if(!x.longTerm)sub+='<button class="cert-btn no" data-cact="edit" data-id="'+c.id+'" data-focus="validTo" title="续期 / 编辑">续期</button>';
   if(x.borrow)sub+='<button class="cert-btn ok" data-cact="return" data-id="'+c.id+'">归还</button>';
   else if(stx.k!=='expired')sub+='<button class="cert-btn no" data-cact="borrow" data-id="'+c.id+'">借出</button>';
   sub+='<button class="cert-btn no" data-cact="edit" data-id="'+c.id+'">编辑</button>';
   var canUse=c.days>=0&&c.occ!=='占用中';
   sub+=(canUse?'<button class="mini-btn mini-ok" data-cpk-add="'+c.id+'">投标包</button>':'');
   sub+='<button class="row-del" data-cact="archive" data-id="'+c.id+'" title="注销">注销</button>';
  }
  h+='<tr><td><b>'+x.name+'</b>'+(x.ownerType==='company'?tagHtml('公司','gray'):'')+'<div class="cell-sub">'+(x.major||'—')+(x.level&&x.level!=='—'?' · '+x.level:'')+(certSubTxt(x)?' · <span class="c-gold">'+certSubTxt(x)+'</span>':'')+'</div></td>'+
   '<td><b>'+certResp(x)+'</b><div class="cell-sub">'+(x.ownerType==='personal'?'个人':'企业')+'</div></td>'+
   '<td>'+x.type+'</td><td class="num">'+x.no+'</td><td>'+due+'</td>'+
   '<td>'+tagHtml(stx.l,stx.t)+'</td><td>'+certOccTag2(x)+'</td>'+
   '<td><span style="display:flex;gap:4px;flex-wrap:wrap">'+sub+'</span></td></tr>';
 });
 return h+'</tbody></table>';
}
function personRows(){
 var map={};
 CERTS.forEach(function(c){var x=certX(c);if(x.status==='archived')return;
  var n=certResp(x);if(!n)return;
  (map[n]=map[n]||{name:n,certs:[]}).certs.push(x);});
 var arr=Object.values(map).map(function(r){
  r.n=r.certs.length;
  r.st90=r.certs.filter(function(x){var d=certDays(x);return d>=0&&d<=90}).length;
  r.borr=r.certs.filter(function(x){return x.borrow}).length;
  r.sub=r.certs.reduce(function(s,x){return s+certYearCost(x)},0);
  return r;});
 var s=__certState;
 if(s.kw.trim()){var k=s.kw.trim().toLowerCase();arr=arr.filter(function(r){return (r.name+'').toLowerCase().indexOf(k)>-1});}
 arr.sort(function(a,b){return b.n-a.n});
 return arr;
}
function personExpand(name){
 var r=personRows().find(function(x){return x.name===name});if(!r)return '';
 return '<div class="xp-wrap">'+r.certs.map(function(x){var stx=certSt(x);
  return '<div class="xp-item"><b>'+x.name+'</b>'+(x.ownerType==='company'?tagHtml('公司','gray'):'')+'<span class="num">'+x.no+'</span>'+
   '<span class="num">'+(x.longTerm?'长期':x.validTo)+'</span>'+tagHtml(stx.l,stx.t)+
   (certSubTxt(x)?'<span class="c-gold">'+certSubTxt(x)+'</span>':'')+
   (x.borrow?'<span class="c-blue">借出 · '+x.borrow.projectName+'</span>':'')+
   '<span class="spacer"></span><button class="cert-btn ok" data-cact="view" data-id="'+x.id+'">详情</button></div>'}).join('')+'</div>';
}
function projRows(){
 var map={};
 CERTS.forEach(function(c){var x=certX(c);if(!x.borrow||x.status==='archived')return;
  (map[x.borrow.projectName]=map[x.borrow.projectName]||{name:x.borrow.projectName,certs:[]}).certs.push(x);});
 var arr=Object.values(map).map(function(r){
  r.n=r.certs.length;
  r.risk=r.certs.filter(function(x){var d=Math.ceil((new Date(x.borrow.toDate)-new Date())/864e5);return d<0||d<=7}).length;
  return r;});
 var s=__certState;
 if(s.kw.trim()){var k=s.kw.trim().toLowerCase();arr=arr.filter(function(r){return r.name.toLowerCase().indexOf(k)>-1});}
 arr.sort(function(a,b){return b.n-a.n});
 return arr;
}
function projExpand(name){
 var r=projRows().find(function(x){return x.name===name});if(!r)return '';
 return '<div class="xp-wrap">'+r.certs.map(function(x){var b=x.borrow;
  return '<div class="xp-item"><b>'+x.name+'</b>'+tagHtml(x.type,'gray')+
   '<span class="num">'+b.fromDate+' ~ '+b.toDate+'</span>'+certBorrowBadge(x)+
   '<span class="spacer"></span><button class="cert-btn ok" data-cact="return" data-id="'+x.id+'">归还</button><button class="cert-btn no" data-cact="view" data-id="'+x.id+'">详情</button></div>'}).join('')+'</div>';
}
function certListHTML(){
 var s=__certState;
 var body;
 if(s.seg==='cert')body=certTable();
 else if(s.seg==='person'){
  var pr=personRows();
  body='<table class="tbl" style="min-width:760px"><thead><tr><th>人员</th><th style="text-align:center">证书数</th><th style="text-align:center">90天内到期</th><th style="text-align:center">借出中</th><th style="text-align:right">年补贴</th><th style="text-align:center">明细</th></tr></thead><tbody>'+
   (pr.length?pr.map(function(r){var open=s.expanded===r.name;
    return '<tr><td><b>'+r.name+'</b></td><td style="text-align:center" class="num">'+r.n+'</td><td style="text-align:center" class="num '+(r.st90?'c-yellow':'')+'">'+r.st90+'</td><td style="text-align:center" class="num '+(r.borr?'c-blue':'')+'">'+r.borr+'</td><td style="text-align:right" class="num c-gold">'+(r.sub?'¥'+r.sub:'—')+'</td><td style="text-align:center"><button class="cert-btn ok" data-cact="toggle" data-n="'+r.name+'">'+(open?'收起':'展开')+'</button></td></tr>'+
    (open?'<tr class="xp-tr"><td colspan="6">'+personExpand(r.name)+'</td></tr>':'');}).join(''):'<tr><td colspan="6" class="mn-tip">无人员证书</td></tr>')+'</tbody></table>';
 } else {
  var pr2=projRows();
  body='<table class="tbl" style="min-width:720px"><thead><tr><th>借用项目</th><th style="text-align:center">借用证书</th><th style="text-align:center">风险</th><th style="text-align:center">明细</th></tr></thead><tbody>'+
   (pr2.length?pr2.map(function(r){var open=s.expanded===r.name;
    return '<tr><td><b>'+r.name+'</b></td><td style="text-align:center" class="num">'+r.n+'</td><td style="text-align:center" class="num '+(r.risk?'c-red':'')+'">'+(r.risk||'—')+'</td><td style="text-align:center"><button class="cert-btn ok" data-cact="toggle" data-n="'+r.name+'">'+(open?'收起':'展开')+'</button></td></tr>'+
    (open?'<tr class="xp-tr"><td colspan="4">'+projExpand(r.name)+'</td></tr>':'');}).join(''):'<tr><td colspan="4" class="mn-tip">暂无借出证书</td></tr>')+'</tbody></table>';
 }
 return '<div class="card-bd" id="certRoot"><div class="dv-sec">证书台账 · 全生命周期管理（有效期 / 占用 / 借还 / 补贴 / 投标包联动）</div>'+
  certSummary()+certStrip()+
  '<div class="cert-bar">'+certSeg()+certToolbar()+'</div>'+certTypeChips()+
  '<div class="table-wrap">'+body+'</div>'+
  '<div class="demo-note">证书状态自动计算（有效 / 临期 / 过期 / 长期 / 已注销）；借出用于投标 / 履约并做归还闭环；过期或已占用证书禁止加入投标包（防废标）</div>'+certFlowMask()+'</div>';
}
/* ---------- 详情 ---------- */
function certDetailHTML(id){
 var c=CERTS.find(function(x){return x.id===id});if(!c)return certListHTML();
 var x=certX(c),stx=certSt(x),isCo=x.ownerType==='company';
 var rv=function(k,v){return '<div class="rv-row"><span>'+k+'</span><b>'+v+'</b></div>'};
 var info=
  rv('证书归属',isCo?'<span class="c-gold">公司证书</span>':'个人证书')+
  rv(isCo?'保管人':'持有人',certResp(x))+
  rv('证书编号','<span class="num">'+x.no+'</span>')+
  rv('类型 / 等级',x.type+(x.level&&x.level!=='—'?' · '+x.level:''))+
  rv('专业类别',x.major||'—')+
  rv('发证机关',x.org||'—')+
  rv('发证日期','<span class="num">'+(x.issueDate||'—')+'</span>')+
  rv('有效期起','<span class="num">'+(x.validFrom||'—')+'</span>')+
  rv('有效期至',x.longTerm?'长期有效':'<span class="num">'+(x.validTo||'—')+'</span>')+
  rv('剩余天数',x.longTerm?'长期有效':(function(){var d=certDays(x);return d<0?'<span class="c-red num">已过期 '+(-d)+' 天</span>':'<span class="num">'+d+' 天</span>'})())+
  rv('到期提醒',x.longTerm?'—':'提前 '+x.remind+' 天')+
  (x.ownerType==='personal'?rv('持证补贴',(function(){var s=x.subsidy;if(!s||s.mode==='none'||!s.amount)return '无';
    return ({monthly:'按月',yearly:'按年',once:'一次性'}[s.mode])+' ¥'+s.amount+(s.startDate?' · 起 '+s.startDate:'')+(certYearCost(x)?'（年化 ¥'+certYearCost(x)+'）':'');})()):'');
 var borrow;
 if(stx.k==='archived')borrow='<div class="mn-tip">证书已注销，记录可追溯</div>';
 else if(x.borrow){var b=x.borrow,rd=Math.ceil((new Date(b.toDate)-new Date())/864e5);
  borrow='<div class="borrow-box">'+certBorrowBadge(x)+'<b>'+b.projectName+'</b>'+
   '<span class="cell-sub">用途 '+b.purpose+' · <span class="num">'+b.fromDate+' ~ '+b.toDate+'</span>'+(b.handler?' · 经手 '+b.handler:'')+'</span>'+
   '<span class="spacer"></span><button class="cert-btn ok" data-cact="renewBorrow" data-id="'+c.id+'">续借</button><button class="cert-btn ok" data-cact="return" data-id="'+c.id+'">确认归还</button></div>'+
   (!x.longTerm&&x.validTo&&certDays(x)<90?'<div class="borrow-warn">⚠ 证书 '+certDays(x)+' 天后到期（<span class="num">'+x.validTo+'</span>），建议归还前安排续期</div>':'')+
   (rd<0?'<div class="borrow-warn red">已超过预计归还日 '+(-rd)+' 天，请尽快确认归还</div>':'');
 } else borrow='<div class="mn-tip" style="display:flex;align-items:center;justify-content:space-between"><span>'+(x.occ==='占用中'?('使用中 · '+(x.occNote||'')):'未借出，证书在库')+'</span>'+
  (stx.k!=='expired'?'<button class="cert-btn ok" data-cact="borrow" data-id="'+c.id+'">'+(isCo?'外借资质':'借出到项目')+'</button>':'')+'</div>';
 var tlR='<div class="tl-item first"><b>取得证书</b><span class="num">'+(x.issueDate||x.validFrom||'—')+' 发证 · '+(x.org||'—')+'</span></div>';
 x.renewals.forEach(function(r){tlR+='<div class="tl-item"><b>续期</b> <span class="num">'+r.from+' → '+r.to+'</span><span class="num">'+r.date+' · '+r.by+'</span></div>'});
 if(!x.longTerm&&stx.k!=='archived'&&!x.renewals.length)tlR+='<div class="tl-item">暂无续期记录，到期前请安排复审 / 延期</div>';
 var hist=x.borrowHistory||[];
 var tlB=hist.length?hist.map(function(e){return '<div class="tl-item"><b>'+e.projectName+'</b> · '+e.purpose+'<div class="cell-sub num">'+e.fromDate+' ~ '+e.toDate+' · 归还 '+(e.returnDate||'—')+(e.handler?' · 经手 '+e.handler:'')+'</div></div>'}).join('')
  :'<div class="tl-item">暂无历史借用记录</div>';
 var ops='<button class="btn btn-ghost" data-cact="back">返回列表</button>';
 if(stx.k!=='archived'){
  if(!x.longTerm)ops+='<button class="btn btn-primary" data-cact="edit" data-id="'+c.id+'" data-focus="validTo">续期</button>';
  ops+='<button class="btn btn-ghost" data-cact="edit" data-id="'+c.id+'">编辑</button>';
  if(x.borrow)ops+='<button class="btn btn-ghost" data-cact="renewBorrow" data-id="'+c.id+'">续借</button>';
  var canUse=c.days>=0&&c.occ!=='占用中';
  ops+=(canUse?'<button class="btn btn-ghost" data-cpk-add="'+c.id+'">加入投标包</button>':'');
  ops+='<button class="btn btn-ghost c-red" data-cact="archive" data-id="'+c.id+'">注销</button>';
 }
 var files=(x.attachments||[]).length?x.attachments.map(function(f){return '<div class="file-it"><span class="f-ic '+(f.type||'pdf')+'">'+(f.type==='img'?'IMG':'PDF')+'</span><div><div class="f-n">'+f.name+'</div><div class="f-m">'+f.size+'</div></div></div>'}).join(''):'<div class="mn-tip">暂无附件</div>';
 return '<div class="card-bd" id="certRoot">'+
  '<div class="dv-sec">证书详情 · '+x.name+'</div>'+
  '<div style="display:flex;align-items:center;gap:10px;margin:0 0 14px"><h2 style="font-size:20px">'+x.name+'</h2>'+tagHtml(stx.l,stx.t)+(isCo?tagHtml('公司证书','gray'):'')+certBorrowBadge(x)+'<span style="margin-left:auto;display:flex;gap:8px">'+ops+'</span></div>'+
  '<div class="cert-card"><div class="cc-h">基本信息 <span class="cc-tip">编号 <span class="num">'+x.no+'</span></span></div><div class="cc-b rv-grid">'+info+'</div></div>'+
  '<div class="cert-card"><div class="cc-h">'+(isCo?'资质外借':'证书借用')+' <span class="cc-tip">借出用于投标 / 履约 / 资质申报</span></div><div class="cc-b">'+borrow+'</div></div>'+
  '<div class="cert-duo"><div class="cert-card"><div class="cc-h">续期历史 <span class="cc-tip">'+(x.longTerm?'长期有效证书':'含初始取得')+'</span></div><div class="cc-b tl">'+tlR+'</div></div>'+
  '<div class="cert-card"><div class="cc-h">借用记录 <span class="cc-tip">历史 '+hist.length+' 次</span></div><div class="cc-b tl">'+tlB+'</div></div></div>'+
  '<div class="cert-card"><div class="cc-h">附件 <span class="cc-tip">共 '+(x.attachments||[]).length+' 个</span></div><div class="cc-b">'+files+'</div></div>'+
  certFlowMask()+'</div>';
}
function certToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
/* ---------- 表单 ---------- */
function certFormHTML(){
 var st=__certState;
 var c=st.editId?CERTS.find(function(x){return x.id===st.editId}):null;
 if(c&&!st.draft){st.draft={ownerType:c.type==='企业'?'company':'personal',name:c.name,type:c.type,level:c.level||'—',major:c.major||'',no:c.no||c.id,holder:c.holder,custodian:c.custodian||'',org:c.org||'',issueDate:c.issueDate||c.valid||'',validFrom:c.validFrom||c.valid||'',validTo:c.validTo||(c.longTerm?'':c.valid),longTerm:!!c.longTerm,remind:String(c.remind||60),subsidy:c.subsidy||{mode:'none',amount:'',startDate:''},remark:c.remark||''};}
 if(!st.draft)st.draft={ownerType:'personal',name:'',type:'人员',level:'—',major:'',no:'',org:'',issueDate:'',validFrom:'',validTo:'',longTerm:false,remind:'60',subsidy:{mode:'none',amount:'',startDate:''},remark:''};
 var d=st.draft;
 var isCo=d.ownerType==='company';
 var fld=function(k,label,req,inner){return '<div class="f-item" data-fk="'+k+'"><div class="f-l">'+(req?'<b>*</b>':'')+label+'</div>'+inner+'<div class="f-e"></div></div>'};
 var inp=function(k,ph,val){return '<input class="f-inp" data-fk="'+k+'" placeholder="'+ph+'" value="'+((val===undefined?'':val)||'')+'">'};
 var sel=function(k,opts,val){return '<select class="f-inp" data-fk="'+k+'">'+opts.map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>'}).join('')+'</select>'};
 var errs=certFormErrs(d),pill=errs.length;
 var h='<div class="card-bd" id="certRoot">'+
  '<div class="dv-sec">'+(st.editId?'编辑证书 · 到期可续期':'新增证书')+'</div>'+
  '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><button class="cert-btn no" data-cact="back">返回列表</button>'+
  (st.editId?'<span class="c-gray">创建后归属不可修改</span>':'')+
  '<span style="margin-left:auto" class="fpill '+(pill?'':'ok')+'">'+(pill?pill+' 项待完善':'✓ 校验通过')+'</span></div>'+
  (pill?'<div class="cert-strip">'+errs.map(function(e,i){return '<button class="cs-chip" data-cact="focus" data-k="'+e.k+'" style="'+(i>=4?'display:none':'')+'">'+e.txt+'</button>'}).join('')+'</div>':'')+
  '<div class="cert-card"><div class="cc-h">证书信息</div><div class="cc-b"><div class="cert-fg">'+
  fld('ownerType','证书归属',1,'<div class="cert-seg"><button data-cact="owner" data-v="personal" class="'+(d.ownerType==='personal'?'on':'')+'">个人证书</button><button data-cact="owner" data-v="company" class="'+(d.ownerType==='company'?'on':'')+'">公司证书</button></div>')+
  fld('name','证书名称',1,inp('name','如：一级注册消防工程师',d.name))+
  fld('type','证书类型',1,sel('type',['人员','企业'],d.type))+
  fld('level','等级',0,inp('level','如：一级',d.level))+
  fld('major','专业类别',0,inp('major','如：建筑工程 / 机电工程',d.major))+
  fld('no','证书编号',1,inp('no','与原件一致',d.no))+
  fld('holder','持有人',d.ownerType==='personal'?1:0,inp('holder','持有人姓名',d.holder))+
  fld('custodian','保管人',d.ownerType==='company'?1:0,inp('custodian','保管人',d.custodian))+
  fld('org','发证机关',0,inp('org','如：住房和城乡建设部',d.org))+
  fld('issueDate','发证日期',1,inp('issueDate','',d.issueDate))+
  fld('validFrom','有效期起',1,inp('validFrom','',d.validFrom))+
  fld('validTo','有效期至',d.longTerm?0:1,inp('validTo','',d.longTerm?'':d.validTo))+
  fld('longTerm','有效期类型',0,'<label class="chk"><input type="checkbox" data-fk="longTerm"'+(d.longTerm?' checked':'')+'> 长期有效（不设到期日）</label>')+
  fld('remind','到期提前提醒',0,sel('remind',['30','60','90'],String(d.remind))) +
  (d.ownerType==='personal'?fld('subsidy','持证补贴',0,sel('subsidy',['none','monthly','yearly','once'],d.subsidy.mode))+'<div class="f-item" data-fk="subamt"><div class="f-l">补贴金额（元）</div><input class="f-inp" data-fk="subamt" value="'+(d.subsidy.amount||'')+'" placeholder="如：3000"><div class="f-e"></div></div>':'')+
  fld('remark','备注',0,'<textarea class="f-inp" rows="2" data-fk="remark" placeholder="选填">'+(d.remark||'')+'</textarea>')+
  '</div></div></div>'+
  '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn btn-ghost" data-cact="back">取消</button><button class="btn btn-primary" data-cact="save">保存</button></div>'+
  certFlowMask()+'</div>';
 return h;
}
function certFormErrs(d){
 var E=[];
 var req=function(k,label){if(!String(d[k]||'').trim())E.push({k:k,txt:'请填写'+label});};
 req('name','证书名称');req('type','证书类型');req('no','证书编号');req('issueDate','发证日期');req('validFrom','有效期起');
 if(d.ownerType==='personal')req('holder','持有人');else req('custodian','保管人');
 if(!d.longTerm)req('validTo','有效期至');
 if(d.ownerType==='personal'&&d.subsidy&&d.subsidy.mode!=='none'&&!String(d.subsidy.amount||'').trim())E.push({k:'subamt',txt:'已选补贴模式，请填写补贴金额'});
 if(d.validFrom&&d.validTo&&!d.longTerm&&d.validTo<=d.validFrom)E.push({k:'validTo',txt:'有效期至必须晚于有效期起'});
 if(d.validFrom&&d.issueDate&&d.validFrom<d.issueDate)E.push({k:'validFrom',txt:'有效期起不能早于发证日期'});
 var dup=CERTS.some(function(c){return c.id!==__certState.editId&&(c.no||c.id)===String(d.no||'').trim()});
 if(dup)E.push({k:'no',txt:'证书编号已存在，请核对原件'});
 return E;
}
/* ---------- 页面事件：捕获阶段全局委托（避免与平台冒泡委托冲突） ---------- */
function certHandle(b){
 var act=b.dataset.cact,id=b.dataset.id;
 var st=__certState,root=document.getElementById('certRoot');
 if(act==='seg'){st.seg=b.dataset.v;st.expanded=null;st.view='list';renderCert();}
 else if(act==='type'){st.type=b.dataset.t;renderCert();}
 else if(act==='toggle'){st.expanded=st.expanded===b.dataset.n?null:b.dataset.n;renderCert();}
 else if(act==='strip-all'){var chips=root.querySelectorAll('.cert-strip .cs-chip');chips.forEach(function(c){c.style.display=''});b.style.display='none';}
 else if(act==='strip'){st.view='detail';st.detailId=b.dataset.id;renderCert();}
 else if(act==='view'){st.view='detail';st.detailId=id;renderCert();}
 else if(act==='back'){st.view='list';renderCert();}
 else if(act==='new'){st.view='form';st.editId=null;st.draft={ownerType:'personal',name:'',type:'人员',level:'—',major:'',no:'',org:'',issueDate:'',validFrom:'',validTo:'',longTerm:false,remind:'60',subsidy:{mode:'none',amount:'',startDate:''},remark:''};renderCert();}
 else if(act==='edit'){st.view='form';st.editId=id;st.draft=null;renderCert();}
 else if(act==='archive'){var c=CERTS.find(function(x){return x.id===id});if(!c)return;
  certAsk('确认注销','注销后《'+c.name+'》不再参与到期提醒与借用，记录仍可追溯。确认注销？',function(){c.status='archived';c._x=null;st.view='list';renderCert();toast('证书已注销');});}
 else if(act==='borrow'){certBorrowFlow(id);}
 else if(act==='return'){certReturnFlow(id);}
 else if(act==='renewBorrow'){certRenewFlow(id);}
 else if(act==='owner'){st.draft=st.draft||{};st.draft.ownerType=b.dataset.v;renderCert();}
 else if(act==='focus'){var el=root.querySelector('[data-fk="'+b.dataset.k+'"]');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});if(el.focus)el.focus();}}
 else if(act==='flowok'){var cb=window.__certFlowOk;if(cb){var e=cb();if(e!==false)certCloseFlow();}}
 else if(act==='flowcancel'){certCloseFlow();}
 else if(act==='askx'){var ask=window.__certAsk;window.__certAsk=null;if(b.dataset.v==='o'&&ask){ask();}}
 else if(act==='save'){certSave();}
}
function certGlobalBind(){
 // HMR/重复渲染安全：覆盖式重绑，避免旧监听器（无 flowok 等新动作）残留
 if(window.__certH1){document.removeEventListener('click',window.__certH1,true)}
 if(window.__certH2){document.removeEventListener('input',window.__certH2,true)}
 if(window.__certH3){document.removeEventListener('change',window.__certH3,true)}
 window.__certH1=function(e){
  var r=document.getElementById('certRoot');if(!r)return;
  var b=e.target.closest('[data-cact]');if(!b||!r.contains(b))return;
  e.stopPropagation();e.preventDefault();certHandle(b);
 };
 window.__certH2=function(e){
  var r=document.getElementById('certRoot');if(!r)return;
  var t=e.target;if(!r.contains(t))return;
  var fk=t.dataset&&t.dataset.fk;
  if(t.dataset&&t.dataset.cact==='kw'){__certState.kw=t.value;renderCertSoft();return}
  if(fk&&__certState.view==='form'){
   var d=__certState.draft;if(!d)return;
   var k=fk,v=t.value;
   if(k==='longTerm'){d.longTerm=t.checked;if(t.checked)d.validTo='';}
   else if(k==='subsidy'){d.subsidy=d.subsidy||{};d.subsidy.mode=v;}
   else if(k==='subamt'){d.subsidy=d.subsidy||{};d.subsidy.amount=v;}
   else d[k]=v;
   renderCertSoft();
  }
 };
 window.__certH3=function(e){
  var r=document.getElementById('certRoot');if(!r)return;
  var t=e.target;if(!r.contains(t))return;
  if(t.dataset&&t.dataset.cact==='status'){__certState.status=t.value;renderCert();}
 };
 document.addEventListener('click',window.__certH1,true);
 document.addEventListener('input',window.__certH2,true);
 document.addEventListener('change',window.__certH3,true);
}
/* 输入软渲染（保留焦点） */
function renderCertSoft(){
 var box=document.getElementById('certPageBox');if(!box)return;
 var oldF=document.activeElement,fk=oldF&&oldF.dataset?oldF.dataset.fk:null,kw=oldF===document.getElementById('certKw');
 var sel=oldF&&oldF.dataset&&oldF.dataset.cact==='status'?oldF.value:null;
 box.innerHTML=bidCertHTML();
 var root=document.getElementById('certRoot');
 if(fk){var el=root.querySelector('[data-fk="'+fk+'"]');
  if(el){el.focus();var s=el.value;el.value='';el.value=s;}}
 else if(kw){var el2=root.querySelector('#certKw');if(el2){el2.focus();var s2=el2.value;el2.value='';el2.value=s2;}}
 else if(sel){var el3=root.querySelector('[data-cact="status"]');if(el3)el3.value=sel;}
}
function renderCert(){var box=document.getElementById('certPageBox');if(!box)return;box.innerHTML=bidCertHTML();}
/* 弹窗确认 */
function certAsk(title,msg,cb){certInit();var r=document.getElementById('certRoot');
 var d=document.createElement('div');d.className='cert-mask';d.style.display='flex';
 d.innerHTML='<div class="cert-flow"><div class="cf-h">'+title+'</div><div class="cf-b">'+msg+'</div><div class="cf-f"><button class="btn btn-ghost" data-cact="askx" data-v="c">取消</button><button class="btn btn-primary" data-cact="askx" data-v="o">确认</button></div></div>';
 r.appendChild(d);
 window.__certAsk=cb;
 d.onclick=function(e){if(e.target===d)d.remove()};
}
/* ---------- 借出 / 归还 / 续借 流程 ---------- */
var __PROJS=['XX产业园一期消防工程','XX医院二期消防改造','XX国际大厦消防改造','XX学校迁建消防配套','XX商业广场综合体'];
function certBorrowFlow(id){
 var c=CERTS.find(function(x){return x.id===id});if(!c)return;
 var x=certX(c);
 if(x.borrow){toast('该证书已在借出中');return;}
 if(x.status==='archived'){toast('已注销证书不可借出');return;}
 if(c.days<0){toast('证书已过期，不可借出');return;}
 certInit();var st=__certState;st.flow={id:id};
 certOpenFlow('<div class="cf-h">'+(x.ownerType==='company'?'外借资质':'借出到项目')+'</div>'+
  '<div class="cf-line"><b>《'+x.name+'》</b>'+(x.ownerType==='company'?tagHtml('公司','gray'):'')+'<span class="cell-sub">'+certResp(x)+' · '+(x.longTerm?'长期有效':'有效期至 <span class="num">'+x.validTo+'</span>')+'</span></div>'+
  '<div class="bm"><div class="b-l">借出项目 <b>*</b></div><select class="f-inp" id="bmProj"><option value="">请选择</option>'+__PROJS.map(function(p){return '<option>'+p+'</option>'}).join('')+'</select><div class="f-e" id="bmE1"></div></div>'+
  '<div class="bm"><div class="b-l">借用用途 <b>*</b></div><select class="f-inp" id="bmUse"><option value="">请选择</option><option>投标</option><option>履约</option><option>资质申报</option><option>其他</option></select><div class="f-e" id="bmE2"></div></div>'+
  '<div class="bm"><div class="b-l">预计归还日期 <b>*</b></div><input type="date" class="f-inp" id="bmTo"><div class="f-e" id="bmE3"></div></div>'+
  '<div class="bm"><div class="b-l">经手人（选填）</div><input class="f-inp" id="bmH" placeholder="如：王芳"></div>'+
  '<div class="bm-warns" id="bmW"></div>'+
  '<div class="cf-f"><button class="btn btn-ghost" data-cact="flowcancel">取消</button><button class="btn btn-primary" data-cact="flowok">确认借出</button></div>');
 certFlowOk(function(){
  var p=document.getElementById('bmProj').value,u=document.getElementById('bmUse').value,t=document.getElementById('bmTo').value,h=document.getElementById('bmH').value;
  var E=[];
  document.getElementById('bmE1').textContent=document.getElementById('bmE2').textContent=document.getElementById('bmE3').textContent='';
  if(!p){E.push('请选择借出项目');document.getElementById('bmE1').textContent='请选择';}
  if(!u){E.push('请选择借用用途');document.getElementById('bmE2').textContent='请选择';}
  if(!t){E.push('请填写预计归还日期');document.getElementById('bmE3').textContent='请填写';}
  else if(!x.longTerm&&x.validTo&&t>x.validTo){E.push('归还日期不能晚于证书到期日（'+x.validTo+'）');document.getElementById('bmE3').textContent='晚于到期日';}
  if(E.length){toast(E[0]);return false;}
  c.borrow={projectName:p,purpose:u,fromDate:certToday(),toDate:t,handler:h};c._x=null;
  certCloseFlow();st.view='detail';st.detailId=id;renderCert();toast('已借出至「'+p+'」');
 });
}
function certReturnFlow(id){
 var c=CERTS.find(function(x){return x.id===id});if(!c)return;
 var x=certX(c);if(!x.borrow){toast('该证书未在借出中');return;}
 var b=x.borrow,rd=Math.ceil((new Date(b.toDate)-new Date())/864e5);
 certInit();var st=__certState;
 certOpenFlow('<div class="cf-h">确认归还</div>'+
  '<div class="cf-line"><b>《'+x.name+'》</b><span class="cell-sub">'+certResp(x)+'</span></div>'+
  '<div class="rv-grid"><div class="rv-row"><span>借用项目</span><b>'+b.projectName+'</b></div>'+
  '<div class="rv-row"><span>用途</span><b>'+b.purpose+'</b></div>'+
  '<div class="rv-row"><span>借用期间</span><b class="num">'+b.fromDate+' ~ '+b.toDate+'</b></div>'+
  '<div class="rv-row"><span>归还状态</span><b class="'+(rd<0?'c-red':'c-green')+'">'+(rd<0?'已超期 '+(-rd)+' 天':'按期归还')+'</b></div></div>'+
  '<div class="cf-f"><button class="btn btn-ghost" data-cact="flowcancel">取消</button><button class="btn btn-primary" data-cact="flowok">确认归还入库</button></div>');
 certFlowOk(function(){
  c.borrowHistory=c.borrowHistory||[];c.borrowHistory.unshift({...b,returnDate:certToday()});
  c.borrow=null;c._x=null;
  certCloseFlow();st.view='detail';st.detailId=id;renderCert();toast('已归还入库，借用记录已归档');
 });
}
function certRenewFlow(id){
 var c=CERTS.find(function(x){return x.id===id});if(!c)return;
 var x=certX(c);if(!x.borrow){toast('该证书未在借出中');return;}
 var b=x.borrow;
 certInit();var st=__certState;
 certOpenFlow('<div class="cf-h">续借 · '+b.projectName+'</div>'+
  '<div class="cf-line"><b>《'+x.name+'》</b><span class="cell-sub">当前归还日 <span class="num">'+b.toDate+'</span></span></div>'+
  '<div class="bm"><div class="b-l">新归还日期 <b>*</b></div><input type="date" class="f-inp" id="bmNewTo" value="'+b.toDate+'"><div class="f-e" id="bmE"></div></div>'+
  '<div class="cf-f"><button class="btn btn-ghost" data-cact="flowcancel">取消</button><button class="btn btn-primary" data-cact="flowok">确认续借</button></div>');
 certFlowOk(function(){
  var v=document.getElementById('bmNewTo').value,err='';
  if(!v)err='请填写新归还日期';
  else if(v<=b.fromDate)err='新归还日期须晚于借出日期';
  else if(!x.longTerm&&x.validTo&&v>x.validTo)err='不能晚于证书到期日（'+x.validTo+'），如需长期借用请先续期';
  if(err){document.getElementById('bmE').textContent=err;toast(err);return false;}
  var old=b.toDate;b.toDate=v;c._x=null;
  certCloseFlow();st.view='detail';st.detailId=id;renderCert();toast('归还日期已从 '+old+' 延至 '+v);
 });
}
function certSave(){
 var st=__certState;var d=st.draft||{};var E=certFormErrs(d);
 if(E.length){toast('还有 '+E.length+' 项待完善');var el=document.querySelector('#certRoot [data-fk="'+E[0].k+'"]');if(el)el.scrollIntoView({behavior:'smooth',block:'center'});return;}
 var sub=d.ownerType==='personal'&&d.subsidy&&d.subsidy.mode!=='none'
  ?{mode:d.subsidy.mode,amount:Number(d.subsidy.amount)||0,startDate:d.subsidy.startDate||''}:{mode:'none'};
 var data={name:String(d.name||'').trim(),type:d.type||'人员',holder:d.holder||'',custodian:d.custodian||'',no:String(d.no).trim(),ownerType:d.ownerType,level:d.level,major:d.major,org:d.org,issueDate:d.issueDate,validFrom:d.validFrom,validTo:d.longTerm?'':d.validTo,longTerm:!!d.longTerm,remind:Number(d.remind)||60,subsidy:sub,remark:d.remark||''};
 if(st.editId){
  var c=CERTS.find(function(x){return x.id===st.editId});if(!c)return;
  var oldValid=c._x?c._x.validTo:c.valid;
  Object.assign(c,data);
  if(oldValid&&data.validTo&&data.validTo>oldValid){c.renewals=c.renewals||[];c.renewals.unshift({from:oldValid,to:data.validTo,date:certToday(),by:'管理员'});toast('已保存并记录一次续期');}
  else toast('修改已保存');
  c._x=null;st.view='detail';st.detailId=c.id;
 } else {
  var id2='CERT-'+String(100+Math.floor(Math.random()*900));
  var nc={id:id2,name:d.name,holder:d.ownerType==='personal'?d.holder:(d.custodian||'企业'),type:d.type||'人员',valid:data.validTo||'',days:data.longTerm?1000:Math.ceil((new Date(data.validTo)-new Date())/864e5),occ:'空闲',...data};
  CERTS.unshift(nc);toast('证书已创建');st.view='detail';st.detailId=id2;
 }
 renderCert();
}
`,w=`// 消安云平台 · 页面分片 bidcollabHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bidcollabHTML(){
 var cols=[['技术标',[['施工组织设计','李敏 · 09-18','70% 编写中'],['质量保证措施','刘洋 · 09-19','40% 编写中']]],['商务标',[['报价单 BJ-2609-05','孙倩 · 09-18',tg('g','已完成')],['付款计划 / 保函','周凯 · 09-20','30% 编写中']]],['资信标',[['企业资质包','赵磊 · 09-17',tg('g','已完成')],['业绩证明材料','何军 · 09-18','60% 编写中']]],['审核',[['技术标初审','王强 · 09-20','待审核'],['商务标终审','王志明 · 09-21','待审核']]]];
 var kb=cols.map(function(c){return '<div class="kb-col"><div class="kb-col-hd">'+c[0]+'<span class="kb-count">'+c[1].length+'</span></div>'+c[1].map(function(t){return '<div class="kb-card"><div class="kb-title">'+t[0]+'</div><div class="kb-chips">'+t[1]+'</div><div class="kl"><span>进度</span><b>'+t[2]+'</b></div></div>'}).join('')+'</div>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">协作中投标</div><div class="m-num">BD-005</div><div class="m-sub">XX医院二期消防工程</div></div><div class="metric"><div class="m-label">整体进度</div><div class="m-num">72%</div><div class="m-sub">标书提交截止 09-25</div></div><div class="metric"><div class="m-label">协作成员</div><div class="m-num">6 人</div><div class="m-sub">商务 2 · 技术 2 · 资信 2</div></div><div class="metric"><div class="m-label">待审核</div><div class="m-num">2 项</div><div class="m-sub">技术 / 商务标初审</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>标书协作看板</h3><div class="right"><button class="btn btn-primary" data-toast="演示：上传标书附件（技术 / 商务 / 资信）">'+ICON.plus+'<span>上传附件</span></button><span class="link-btn" data-toast="演示：标书定稿 / 打印装订 / 递交登记">定稿递交</span></div></div><div class="card-bd"><div class="kb" style="grid-template-columns:repeat(4,1fr)">'+kb+'</div></div></section>'+
 '<div class="demo-note">技术标 / 商务标 / 资信标跨部门协作留痕，附件与审核过程自动归档；报价单 BJ-2609-05 已作为商务标依据关联</div>';
}`,h=`// 消安云平台 · 页面分片 bidlossHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bidlossHTML(){
 var ls=window.BIDLOSS=window.BIDLOSS||BIDLOSS;var tot=ls.reduce(function(a,x){return a+x[1]},0)||1;var rows=ls.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+Math.round(r[1]/tot*100)+'%</td><td>'+r[3]+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">近 3 个月丢标</div><div class="m-num">5 个</div><div class="m-sub">金额 ¥1,180 万</div></div><div class="metric"><div class="m-label">丢标率</div><div class="m-num">50%</div><div class="m-sub">投标 10 / 中标 5</div></div><div class="metric"><div class="m-label">首因：报价偏高</div><div class="m-num">40%</div><div class="m-sub">建议引用内部定额复价</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>丢标原因分布</h3><div class="right"><span class="link-btn" data-toast="演示：按季度 / 区域筛选">按季度 / 区域</span></div></div><div class="card-bd"><div class="chart"><div class="cb">'+[['报价偏高',40],['客户关系',20],['资质不符',20],['响应慢',20]].map(function(d){var mx=40;return '<div class="col"><div class="bar '+(d[1]===mx?'hot':'')+'" style="height:'+Math.round(d[1]/mx*70)+'%"><i>'+d[1]+'%</i></div><span class="xl">'+d[0]+'</span></div>'}).join('')+'</div></div></div></section>'+
 '<section class="card"><div class="card-hd"><h3>丢标明细</h3></div><div style="padding:16px">'+tblHTML(['丢标原因','数量','占比','关联投标'],rows,760)+'</div></section>';
}`,y=`// 消安云平台 · 页面分片 bidnodeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bidnodeHTML(){
 var nodes=['报名','招标中','做标书','交保证金','已投标','开标','中标'];
 var col=function(n){var items=BIDS.filter(function(b){return b.node===n});return '<div class="kb-col"><div class="kb-col-hd">'+n+'<span class="kb-count">'+items.length+'</span></div>'+items.map(function(b){var o=oppOf(b.oid);var canNext=['报名','招标中','做标书','交保证金','已投标','开标'].indexOf(b.node)>-1;return '<div class="kb-card" data-bid="'+b.id+'"><div class="kb-title">'+b.name+'</div><div class="kb-chips">'+(o?clName(o.cid):'—')+(b.bond?' · 保证金 ¥'+b.bond+' 万':'')+'</div><div class="kl"><span>截止</span><b>'+b.deadline+'</b></div>'+(canNext?'<button class="mini-btn mini-ok" data-bid-next="'+b.id+'" style="margin-top:8px">推进 ▸</button>':'')+'</div>'}).join('')+'</div>'};
 return '<div class="metrics"><div class="metric"><div class="m-label">进行中投标</div><div class="m-num">3 个</div><div class="m-sub">报名 1 · 做标书 1 · 已投标 1</div></div><div class="metric"><div class="m-label">待交保证金</div><div class="m-num">¥5 万</div><div class="m-sub">BD-002 需 10-01 前缴纳</div></div><div class="metric"><div class="m-label">近 30 天开标</div><div class="m-num">3 场</div><div class="m-sub">09-28 / 10-08</div></div><div class="metric"><div class="m-label">保证金待退还</div><div class="m-num">¥5 万</div><div class="m-sub">BD-004 未中标待退</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>投标节点看板</h3><div class="right"><button class="btn btn-primary" data-bidreg-new="1">'+ICON.plus+'<span>登记投标</span></button><span class="link-btn" data-toast="演示：报名截止 / 标书提交 / 开标自动提醒">提醒设置</span></div></div><div class="card-bd"><div class="kb" style="grid-template-columns:repeat(7,1fr)">'+nodes.map(col).join('')+'</div></div></section>';
}`,T=`// 消安云平台 · 页面分片 bidregHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bidregHTML(){
 var f=window.BIDREG_F=window.BIDREG_F||{node:'',kw:''};
 var list=BIDS.filter(function(b){if(f.node&&b.node!==f.node)return false;if(f.kw&&(b.id+b.name).toLowerCase().indexOf(f.kw.toLowerCase())<0)return false;return true});
 var rows=list.map(function(b){var o=oppOf(b.oid);return '<tr><td>'+b.id+'</td><td><b>'+b.name+'</b></td><td>'+(o?clName(o.cid):'—')+'</td><td>'+tagHtml(b.node,b.node==='已中标'?'green':b.node==='未中标'?'red':'blue')+'</td><td>¥'+(b.bond||0)+' 万</td><td>'+b.deadline+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-link="投标" data-lid="'+b.id+'">节点</button><button class="mini-btn mini-no" data-toast="演示：关联报价单 / 资质包 / 标书附件">关联</button></span></td></tr>'}).join('');
 var cnt=function(n){return BIDS.filter(function(b){return b.node===n}).length};
 return '<div class="pills"><div class="pill active">全部 <b>'+BIDS.length+'</b></div><div class="pill">报名 <b>'+cnt('报名')+'</b></div><div class="pill">做标书 <b>'+cnt('做标书')+'</b></div><div class="pill">已投标 <b>'+cnt('已投标')+'</b></div><div class="pill">已出结果 <b>'+(cnt('已中标')+cnt('未中标'))+'</b></div></div>'+
 '<div class="fbar"><select data-bidreg-f="node"><option value="">投标节点：全部</option><option value="报名"'+(f.node==='报名'?' selected':'')+'>投标节点：报名</option><option value="做标书"'+(f.node==='做标书'?' selected':'')+'>投标节点：做标书</option><option value="已投标"'+(f.node==='已投标'?' selected':'')+'>投标节点：已投标</option></select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09</span><input class="fkw" data-bidreg-kw placeholder="关键字搜索…" value="'+(f.kw||'')+'"/><span class="reset" data-bidreg-reset="1">重置</span><span style="margin-left:auto"><button class="btn btn-primary" data-bidreg-new="1">'+ICON.plus+'<span>登记投标</span></button></span></div>'+
 '<div class="table-wrap">'+tblHTML(['投标编号','投标项目','客户','节点','保证金(万)','截止 / 开标','操作'],rows,1020)+'</div>'+
 '<div class="demo-note">线下投标可补录结果；「登记投标」新增后自动进入节点看板流转（报名 → 招标中 → 做标书 → 交保证金 → 已投标 → 开标 → 中标）</div>';
}
`,k=`// 消安云平台 · 页面分片 bidresultHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bidresultHTML(){
 var f=window.BIDR_F=window.BIDR_F||{res:'',kw:''};
 var rows=BIDS.filter(function(b){return b.result==='已中标'||b.result==='未中标'||b.result==='待开标'}).map(function(b){var o=oppOf(b.oid);var win=b.result==='已中标';var no=b.result==='未中标';
  if(f.res&&b.result!==f.res)return null;
  if(f.kw&&(b.id+b.name).toLowerCase().indexOf(f.kw.toLowerCase())<0)return null;
  return '<tr><td>'+b.id+'</td><td><b>'+b.name+'</b></td><td>'+(o?clName(o.cid):'—')+'</td><td>'+tagHtml(b.result,win?'green':no?'red':'yellow')+'</td><td>'+(b.score!=null?b.score+' 分':'—')+'</td><td>'+b.deadline+'</td><td><span class="ti-acts">'+(win?'<button class="mini-btn mini-ok" data-bid-proj="'+b.id+'">立项</button>':no?'<button class="mini-btn mini-no" data-bid-loss="'+b.id+'">记录原因</button>':'<span style="font-size:12px;color:var(--t3)">待开标</span>')+'</span></td></tr>'}).filter(function(x){return x}).join('');
 var cnt=function(r){return BIDS.filter(function(b){return b.result===r}).length};
 return '<div class="pills"><div class="pill active">全部 <b>'+BIDS.filter(function(b){return b.result==='已中标'||b.result==='未中标'||b.result==='待开标'}).length+'</b></div><div class="pill">已中标 <b>'+cnt('已中标')+'</b></div><div class="pill">未中标 <b>'+cnt('未中标')+'</b></div><div class="pill">待开标 <b>'+cnt('待开标')+'</b></div></div>'+
 '<div class="fbar"><select data-bidr-f="res"><option value="">结果：全部</option><option value="已中标"'+(f.res==='已中标'?' selected':'')+'>结果：已中标</option><option value="未中标"'+(f.res==='未中标'?' selected':'')+'>结果：未中标</option><option value="待开标"'+(f.res==='待开标'?' selected':'')+'>结果：待开标</option></select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09</span><input class="fkw" data-bidr-kw placeholder="关键字搜索…" value="'+(f.kw||'')+'"/><span class="reset" data-bidr-reset="1">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['投标编号','投标项目','客户','结果','评分','开标时间','操作'],rows,960)+'</div>'+
 '<div class="demo-note">中标后「立项」带数据进入项目列表并反向生成目标成本；未中标「记录原因」自动进入丢标原因分析（按季度 / 半年）</div>';
}
`,M=`// 消安云平台 · 页面分片 bizApprHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizApprHTML(){
 var rows=[
  ['付款申请','FK-2609-032 · 华信管业 ¥8,500',tg('r','红灯 · 超合同比例'),'09-16 10:30',OKNO],
  ['合同审批','BG-2609-006 · 签证 ¥26,400','普通',tg('y','待审批'),'09-16 09:00',OKNO],
  ['报销','BX-2609-033 · ¥380','普通',tg('y','待审批'),'09-16 08:40',OKNO],
  ['用印','YJ-2609-008 · 维保合同用印','普通',tg('y','待审批'),'09-15 17:20',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">待我审批（付款 / 合同 / 报销 / 用印 聚合 · 红灯优先）</div>'+
  '<div class="table-wrap">'+tblHTML(['流程类型','事项','风险','提交时间','操作'],rows,920)+'</div>'+
  '<div class="wb-total"><span>待审批 4 项 · 红灯 1 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量审批">批量审批</button></span></div>'+
  '<div class="demo-note">待办中心聚合审批、工单、巡检、回款任务；付款红灯项必须「知情后特批」或驳回</div></div>';
}`,X=`// 消安云平台 · 页面分片 bizBoardHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizBoardHTML(){
 var rows=[
  ['P-2609-08','XX产业园喷淋工程','新建 · 自营','¥512 万','¥486 万',tg('g','正常'),'86%',OKNO],
  ['P-2609-05','XX医院消防改造','改造 · 自营','¥368 万','¥302 万',tg('y','回款滞后'),'72%',OKNO],
  ['P-2609-03','XX商业广场维保','维保 · 自营','¥96 万','¥82 万',tg('g','正常'),'90%',OKNO],
  ['P-2609-01','XX物流园（联营）','新建 · 联营','¥240 万','¥168 万',tg('r','资金风险'),'65%',OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">在建项目</div><div class="m-num">8 个</div><div class="m-sub">自营 6 · 联营 2</div></div><div class="metric"><div class="m-label">总产值</div><div class="m-num">¥2,186 万</div><div class="m-sub">本年累计</div></div><div class="metric"><div class="m-label">综合回款率</div><div class="m-num">78%</div><div class="m-sub">同比 +6%</div></div><div class="metric"><div class="m-label">风险项目</div><div class="m-num">2 个</div><div class="m-sub">资金 / 回款风险</div></div></div>'+
  '<div class="table-wrap">'+tblHTML(['项目','类型','合同金额','累计收款','经营状态','进度','操作'],rows,1040)+'</div>'+
  '<div class="demo-note">项目 360 组合看板：各项目经营状态红黄绿一目了然，点击穿透项目 360 查看明细</div>';
}`,x=`// 消安云平台 · 页面分片 bizBossHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizBossHTML(){
 return '<div class="metrics"><div class="metric"><div class="m-label">年产值</div><div class="m-num">¥8,642 万</div><div class="m-sub">目标完成 82%</div></div><div class="metric"><div class="m-label">毛利润</div><div class="m-num">¥1,286 万</div><div class="m-sub">毛利率 14.9%</div></div><div class="metric"><div class="m-label">回款率</div><div class="m-num">78%</div><div class="m-sub">应收 ¥1,902 万</div></div><div class="metric"><div class="m-label">税负比</div><div class="m-num">2.8%</div><div class="m-sub">行业参考 3.1%</div></div></div>'+
  '<div class="dv-sec">本月关键指标（各岗位录入数据自动汇总 · 不需专人做表）</div>'+
  '<div class="table-wrap">'+tblHTML(['指标','本月','本年累计','同比','状态'],[
   ['新签合同额','¥486 万','¥3,520 万','+18%',tg('g','增长')],
   ['收款','¥512 万','¥4,860 万','+9%',tg('g','正常')],
   ['付款','¥386 万','¥3,260 万','+12%',tg('y','关注')],
   ['开票','¥428 万','¥4,120 万','+10%',tg('g','正常')],
   ['质保金到期','1 笔 ¥18 万','6 笔 ¥96 万','—',tg('r','需跟进')]],900)+'</div>'+
  '<div class="demo-note">老板驾驶舱：经营信息 / 现金流 / 税负比 / 风险自动出表，指标可配置，是「数据价值」的落地</div>';
}`,O=`// 消安云平台 · 页面分片 bizInsightHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizInsightHTML(){
 var rows=[
  ['09-16','FK-2609-032 · 华信管业','超合同付款比例',tg('r','红灯'),'老板知情后特批','09-16 11:00'],
  ['09-15','FK-2609-030 · 天广消防','四检通过',tg('g','绿灯'),'正常放行','09-15 15:20'],
  ['09-14','FK-2609-025 · 正泰消防','缺票',tg('o','黄灯'),'驳回补票','09-14 16:30']];
 return '<div class="card-bd"><div class="dv-sec">智能业务洞察记录（每笔付款四检结果 + 处置留痕）</div>'+
  '<div class="table-wrap">'+tblHTML(['日期','付款单','洞察结果','灯色','处置','处置时间'],rows,980)+'</div>'+
  '<div class="wb-total"><span>本月洞察 26 笔 · 红灯 5 · 特批 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出洞察记录">导出记录</button></span></div>'+
  '<div class="demo-note">所有特批 / 驳回 / 补票留痕，满足审计与风控；供后续供应商付款决策参考</div></div>';
}
/* ===== 波次B3 系统管理 ===== */`,L=`// 消安云平台 · 页面分片 bizMoneyHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizMoneyHTML(){
 var key=curMenuKey;
 if(key.indexOf('质保金')>-1){
  var rows=[
   ['P-2609-05','XX医院消防改造','质保金 ¥18 万','2026-09-28',tg('r','12 天后到期'),OKNO],
   ['P-2609-01','XX物流园（联营）','质保金 ¥24 万','2026-11-05',tg('y','50 天后到期'),OKNO],
   ['P-2609-03','XX商业广场维保','质保金 ¥9.6 万','2027-01-12',tg('gray','远期'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">质保金到期提醒（提前一个月自动提醒）</div>'+
   '<div class="table-wrap">'+tblHTML(['项目','类型','金额','到期日','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>30 天内到期 1 笔 ¥18 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成催收提醒">催收提醒</button></span></div>'+
   '<div class="demo-note">质保金到期自动提醒责任人，逾期未收回影响现金流（联动回款与资金）</div></div>';
 }
 if(key.indexOf('现金流')>-1){
  var rows=[
   ['09 上旬','收款 ¥186 万 · 付款 ¥128 万',tg('g','+¥58 万'),'09-15'],
   ['08 下旬','收款 ¥142 万 · 付款 ¥96 万',tg('g','+¥46 万'),'08-31'],
   ['08 中旬','收款 ¥108 万 · 付款 ¥124 万',tg('r','-¥16 万'),'08-20'],
   ['08 上旬','收款 ¥98 万 · 付款 ¥72 万',tg('g','+¥26 万'),'08-12']];
  return '<div class="card-bd"><div class="dv-sec">现金流报表（周期现金流 · 自动汇总收款 / 付款）</div>'+
   '<div class="table-wrap">'+tblHTML(['周期','收款 / 付款','净现金流','截止'],rows,880)+'</div>'+
   '<div class="wb-total"><span>本月累计净现金流 +¥86 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出现金流报表">导出</button></span></div>'+
   '<div class="demo-note">现金流 = 累计收款 − 累计付款；预警超付 / 缺票 / 超可用资金（联动智能业务洞察）</div></div>';
 }
 if(key.indexOf('应收')>-1){
  var rows=[
   ['P-2609-05','XX医院消防改造','已开票未回款','¥86 万','60 天',tg('r','超期'),OKNO],
   ['P-2609-08','XX产业园喷淋工程','已开票未回款','¥58 万','25 天',tg('y','关注'),OKNO],
   ['P-2609-01','XX物流园（联营）','已开票未回款','¥46 万','12 天',tg('b','正常'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">应收 / 已开票未回款（开票与收款差额自动统计）</div>'+
   '<div class="table-wrap">'+tblHTML(['项目','类型','未回款','账龄','天数','状态','操作'],rows,960)+'</div>'+
   '<div class="wb-total"><span>已开票未回款合计 ¥190 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成催收计划">催收计划</button></span></div>'+
   '<div class="demo-note">账龄超 30 天黄灯、60 天红灯，自动进入回款节点提醒与催收计划</div></div>';
 }
 var rows=[
  ['P-2609-08','XX产业园喷淋工程','进度款节点','2026-09-25',tg('b','提前 8 天'),OKNO],
  ['P-2609-05','XX医院消防改造','竣工款节点','2026-09-30',tg('b','提前 13 天'),OKNO],
  ['P-2609-01','XX物流园（联营）','回款逾期','2026-09-08',tg('r','已逾期 9 天'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">回款节点提醒（节点提前一个月自动提醒 · 逾期红灯）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目','节点类型','节点日','剩余 / 逾期','状态','操作'],rows,920)+'</div>'+
  '<div class="wb-total"><span>近 30 天回款节点 3 个 · 逾期 1 个</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量提醒责任人">提醒责任人</button></span></div>'+
  '<div class="demo-note">回款节点提前一个月自动提示应收 / 已开票未回款 / 质保金到期，联动经营驾驶舱</div></div>';
}`,P=`// 消安云平台 · 页面分片 bizReportHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizReportHTML(){
 var rows=[
  ['P-2609-08','XX产业园喷淋工程','¥512 万','¥428 万','¥36 万','¥342 万','¥62 万','14.6%',tg('g','健康'),OKNO],
  ['P-2609-05','XX医院消防改造','¥368 万','¥312 万','¥28 万','¥226 万','¥84 万','12.8%',tg('y','关注'),OKNO],
  ['P-2609-03','XX商业广场维保','¥96 万','¥82 万','¥15 万','¥71 万','¥10 万','18.2%',tg('g','健康'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">项目经营报表（合同 / 收款 / 成本 / 毛利 / 税负 自动汇总）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目','合同金额','累计开票','累计收款','实际成本','已付','毛利','毛利率','状态','操作'],rows,1180)+'</div>'+
  '<div class="wb-total"><span>报表口径：合同金额 / 已开票金额 / 收款金额 分列，可筛选时间范围</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出经营报表">导出报表</button></span></div>'+
  '<div class="demo-note">经营报表明确统计对象 / 数据来源 / 计算口径 / 筛选条件 / 时间范围 / 更新频率，可下钻至项目 360</div></div>';
}`,j=`// 消安云平台 · 页面分片 bizRiskHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function bizRiskHTML(){
 var map={资金风险:'资金',合同风险:'合同',税务风险:'税务',采购风险:'采购',安全风险:'安全',成本风险:'成本','供应商 / 客户风险项':'供应商 / 客户',风险总览:'全部'};
 var k=String(curMenuKey||'').split('.').pop();var t=map[k]||'全部';
 var pool={
  '资金':[['P-2609-01','XX物流园（联营）','走款异常 · 超合同比例',tg('r','高'),'09-16']],
  '合同':[['ZC-2609-08','华信管业 合同','付款比例 95% 接近上限',tg('o','中'),'09-15'],['XS-2609-02','XX商业广场 销售合同','回款节点临近',tg('o','中'),'09-14']],
  '税务':[['FP-2609-085','金桥物资 进项','缺票 1 张',tg('o','中'),'09-12']],
  '采购':[['WL-0232','喷淋头','超价 +4%',tg('o','中'),'09-15']],
  '安全':[['XX医院 3F','喷淋渗漏','现场安全隐患待复查',tg('r','高'),'09-16']],
  '成本':[['P-2609-05','XX医院改造','实际成本超预算 6%',tg('r','高'),'09-14']],
  '供应商 / 客户':[['XX 电器','黑名单','伪造 3C 证书',tg('r','高'),'04-22']],
  '全部':[['P-2609-01','资金风险 · 联营走款异常',tg('r','高'),'09-16'],['XX医院 3F','安全风险 · 渗漏待复查',tg('r','高'),'09-16'],['P-2609-05','成本风险 · 超预算 6%',tg('r','高'),'09-14'],['WL-0232','采购风险 · 超价 4%',tg('o','中'),'09-15'],['ZC-2609-08','合同风险 · 付款 95%',tg('o','中'),'09-15']]};
 var rows=(pool[t]||[]).map(function(r){return r.concat([OKNO])});
 return '<div class="metrics"><div class="metric"><div class="m-label">'+t+'风险</div><div class="m-num">'+(rows.length)+' 项</div><div class="m-sub">红灯优先处理</div></div><div class="metric"><div class="m-label">高风险</div><div class="m-num">'+(rows.filter(function(r){return r[3]===tg('r','高')}).length)+' 项</div><div class="m-sub">需本周闭环</div></div></div>'+
  '<div class="table-wrap">'+tblHTML(['对象','风险描述','级别','发现时间','操作'],rows,920)+'</div>'+
  '<div class="demo-note">风险中心按 资金 / 合同 / 税务 / 采购 / 安全 / 成本 / 供应商 分类亮灯，责任人认领 → 整改 → 关闭留痕</div>';
}`,S=`/* ============ 菜单合并 V2.1 · 被合并工作站看板（设备 / 资料 / 学习） ============ */
function devBoardHTML(){
 var cols=['设备','位置','类型','状态','最近上报'];
 var rows=[
  ['感烟探测器 JD-0231','F2-3 走廊','火灾探测器',tg('r','告警 · 误报'),'09-17 18:02'],
  ['水压/喷淋 WL-0012','B1 水泵房','水压/喷淋',tg('r','告警 · 压力低'),'09-17 17:40'],
  ['消防主机 XF-001','F1 消防控制室','消防主机',tg('r','告警 · 通讯中断'),'09-17 16:55'],
  ['电气火灾监测 DQ-008','F3 配电间','电气火灾',tg('y','预警 · 温度偏高'),'09-17 15:20'],
  ['应急照明 YJ-045','B2 通道','应急照明',tg('y','离线 4 台'),'09-17 12:10'],
  ['视频监控 SP-121','F1 大厅','视频',tg('g','正常'),'09-17 18:01']];
 return '<div class="metrics"><div class="metric"><div class="m-label">设备总数</div><div class="m-num">1,316 台</div><div class="m-sub">在线 1,286 · 离线 23</div></div><div class="metric"><div class="m-label">当前告警</div><div class="m-num"><span style="color:var(--danger,#f53f3f)">7 条</span></div><div class="m-sub">实时 · 自动转维保调度</div></div><div class="metric"><div class="m-label">孪生场景</div><div class="m-num">6 个</div><div class="m-sub">3D / 楼层模型</div></div><div class="metric"><div class="m-label">今日处置</div><div class="m-num">5 条</div><div class="m-sub">转工单 3 · 已闭环 2</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>实时告警（自动转维保调度工单）</h3><div class="right"><span class="link-btn" data-act="设备告警全部">查看全部告警</span></div></div><div class="card-bd" style="padding:0">'+tblHTML(cols,rows,900)+'</div></section>'+
 '<section class="card"><div class="card-hd"><h3>设备状态分布</h3></div><div class="card-bd"><div class="metrics" style="margin:0">'+
  [['在线',1286,'green'],['告警',7,'red'],['预警',19,'yellow'],['离线',23,'gray']].map(function(s){return '<div class="metric"><div class="m-label">'+s[0]+'</div><div class="m-num" style="color:var(--'+(s[2]==='green'?'ok':s[2])+')">'+s[1]+' 台</div><div class="m-sub">占比 '+Math.round(s[1]/1316*100)+'%</div></div>'}).join('')+
 '</div></div></section>'+
 '<div class="demo-note">设备资产 / 孪生场景 / IoT 监测与告警 / 设备报告 见左侧菜单；告警可一键转维保调度工单</div>';
}
function dashBoardHTML(){
 var rows=[
  ['立项与合同','8 项','8 项','0',tg('g','齐备')],
  ['施工过程（质量 / 安全 / 材料）','24 项','21 项','3',tg('r','缺失 3 项')],
  ['竣工验收','12 项','4 项','8',tg('r','缺失 8 项')],
  ['消防报告','4 份','2 份','2',tg('y','生成中')]];
 var miss=[['隐蔽工程验收记录（F2 喷淋）','施工过程','孙倩',tg('r','已逾期 3 天')],['消防产品 3C 认证（主机）','施工过程','孙倩',tg('y','今日到期')],['竣工图纸（电气）','竣工验收','李敏',tg('r','已逾期 5 天')]];
 return '<div class="metrics"><div class="metric"><div class="m-label">应归档资料</div><div class="m-num">342 份</div><div class="m-sub">按里程碑目录</div></div><div class="metric"><div class="m-label">已归档</div><div class="m-num">268 份</div><div class="m-sub">归档率 78%</div></div><div class="metric"><div class="m-label">缺失提醒</div><div class="m-num" style="color:var(--danger,#f53f3f)">74 份</div><div class="m-sub">红点待补</div></div><div class="metric"><div class="m-label">待审核</div><div class="m-num">12 份</div><div class="m-sub">工程 / 财务</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>里程碑归档进度</h3><div class="right"><span class="link-btn" data-act="里程碑资料目录">进入目录</span></div></div><div class="card-bd" style="padding:0">'+tblHTML(['里程碑','应归档','已归档','缺失','状态'],rows,900)+'</div></section>'+
 '<section class="card"><div class="card-hd"><h3>缺失红点 · 优先补录</h3></div><div class="card-bd" style="padding:0">'+tblHTML(['缺失资料','里程碑','责任人','状态'],miss,900)+'</div></section>'+
 '<div class="demo-note">智能归档把审批流中的合同 / 发票 / 订单附件自动归类；财务未审核视为未归档，影响收款</div>';
}
function eduBoardHTML(){
 var rows=[['气体灭火维护要点（第 6 期）','内部讲师','68%',tg('y','进行中')],['主机编程实操（第 4 期）','外聘专家','45%',tg('y','进行中')],['规范解读 2026（第 3 期）','内部讲师','100%',tg('g','已完成')],['误报案例复盘（第 2 期）','内部讲师','—',tg('gray','未开始')]];
 var ex=[['09-22 14:00','规范解读 2026 · 阶段考','维保部','12 人报名'],['09-28 09:30','主机编程实操 · 结业考','技术部','8 人报名'],['10-10 10:00','故障库 · 月度考核','全员','—']];
 return '<div class="metrics"><div class="metric"><div class="m-label">课程总数</div><div class="m-num">32 门</div><div class="m-sub">企业 / 行业知识库</div></div><div class="metric"><div class="m-label">考试通过率</div><div class="m-num">86%</div><div class="m-sub">近 3 个月</div></div><div class="metric"><div class="m-label">持证人员</div><div class="m-num">45 人</div><div class="m-sub">证书与上岗联动</div></div><div class="metric"><div class="m-label">待复训</div><div class="m-num" style="color:var(--danger,#f53f3f)">3 人</div><div class="m-sub">证书 90 天内到期</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>进行中课程</h3><div class="right"><span class="link-btn" data-act="考试与培训">进入培训</span></div></div><div class="card-bd" style="padding:0">'+tblHTML(['课程','讲师','进度','状态'],rows,900)+'</div></section>'+
 '<section class="card"><div class="card-hd"><h3>考试安排</h3></div><div class="card-bd" style="padding:0">'+tblHTML(['时间','考试','部门','报名'],ex,900)+'</div></section>'+
 '<div class="demo-note">考试合格 → 证书生效 → 允许排班 / 值班上岗；证书到期触发复训，与证书管理联动</div>';
}
`,_=`// 消安云平台 · 页面分片 calcParent —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function calcParent(p){
 var kids=CITEMS.filter(function(x){return x.id.indexOf(p.id+'-')===0});
 return kids.reduce(function(s,k){return s+k.qty*k.price},0)/10000;
}`,H=`// 消安云平台 · 页面分片 catTableHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function catTableHTML(){
 var TREE=[
  {n:'消防水系统',ch:[{n:'管材 / 管件'},{n:'喷淋'},{n:'消火栓 / 阀门'},{n:'灭火器材'}]},
  {n:'消防电系统',ch:[{n:'火灾报警'},{n:'消防主机'},{n:'布线'},{n:'线缆 / 桥架'}]},
  {n:'防排烟系统',ch:[{n:'风管'},{n:'防火分隔'},{n:'风阀'}]},
  {n:'报警系统',ch:[{n:'气体灭火'},{n:'应急照明'}]},
  {n:'智慧消防 / 硬件',ch:[{n:'数据采集'},{n:'监测设备'}]},
  {n:'未分类',ch:[]}];
 var countBy=function(path){var n=0;for(var i=0;i<MATERIALS.length;i++){if(MATERIALS[i].cat.indexOf(path)===0)n++}return n};
 var nodeHtml=function(n,p,deep,isLeaf){
  var P=p.replace(/\\s+/g,'');
  return '<div class="ct-node'+(MAT_FS.cat===P?' on':'')+'" data-tree-cat="'+P+'" style="padding-left:'+(8+deep*18)+'px">'+
   (isLeaf?'<span class="ct-arr empty">·</span>':'<span class="ct-arr open" data-arr="'+P+'">▾</span>')+
   '<span class="ct-name">'+n+'</span><span class="ct-cnt">'+countBy(P)+'</span></div>';
 };
 var treeHtml='';
 TREE.forEach(function(t){
  var P1=t.n.replace(/\\s+/g,'');
  treeHtml+=nodeHtml(t.n,t.n,0,false);
  var kids=(t.ch||[]).map(function(c){return nodeHtml(c.n,P1+'/'+c.n,1,true)}).join('');
  treeHtml+='<div class="ct-children" data-parent="'+P1+'">'+kids+'</div>';
 });
 var kwl=(MAT_FS.kw||'').toLowerCase();
 var filtered=MATERIALS.filter(function(M){
  if(MAT_FS.cat&&M.cat.indexOf(MAT_FS.cat)!==0)return false;   if(MAT_FS.type&&M.type!==MAT_FS.type)return false;
  if(MAT_FS.ctrl&&M.ctrl!==MAT_FS.ctrl)return false;
  if(MAT_FS.aux&&M.aux!==MAT_FS.aux)return false;
  if(MAT_FS.st==='停用'&&M.st.indexOf('停用')<0)return false;
  if(MAT_FS.st==='启用'&&M.st.indexOf('停用')>-1)return false;
  if(kwl&&(M.code+M.name+M.brand+M.spec).toLowerCase().indexOf(kwl)<0)return false;
  return true});
 var total=filtered.length;
 var pages=Math.max(1,Math.ceil(total/MAT_FS.per));
 if(MAT_FS.page>pages)MAT_FS.page=pages;
 var pageRows=filtered.slice((MAT_FS.page-1)*MAT_FS.per,MAT_FS.page*MAT_FS.per);
 function kitTg(M){return M.kit?'<span class="tag b">套件</span>':''}
  function bomInfo(M){if(!M.kit)return '';var s=M.bom?M.bom.map(function(b){return b.n+'×'+b.q}).join('，'):'';return '<span class="link-btn" data-toast="演示：套件组成 — '+s+'；领用按 BOM 展开扣减底层库存，可组装 '+(M.kitQty||0)+' 套">组成明细</span>'}
  function matOps(id){return '<span class="row-ops"><button class="mini-btn mini-ok" data-mat-op="详情" data-mid="'+id+'">详情</button><button class="mini-btn mini-no" data-mat-op="编辑" data-mid="'+id+'">编辑</button><button class="mini-btn mini-no" data-mat-op="停用 / 启用" data-mid="'+id+'">停用</button><button class="mini-btn mini-no" data-mat-op="二维码" data-mid="'+id+'">二维码</button><span class="link-btn" data-mat-op="更多" data-mid="'+id+'">更多 ▾</span></span>'}
 var trs=pageRows.map(function(M){
  var stock=(M.stock||0)+(M.transit||0);
  var low=M.safe>0&&stock<=M.safe;
  return '<tr data-mid="'+M.id+'"'+(M.st.indexOf('待复核')>-1?' class="dim"':'')+'><td>'+M.code+'</td><td>'+M.name+' · '+M.brand+' · '+M.spec+'</td><td>'+M.cat+'</td><td>'+(M.type||'材料供货')+kitTg(M)+'</td><td>'+M.unit+'</td><td>'+tg(M.aux==='主材'?'b':'gray',M.aux)+'</td><td>'+ctrlTg(M.ctrl)+'</td><td>'+stTg(M.st)+'</td><td><span class="link-btn" data-inv-down="'+M.id+'">'+nfmt(stock)+(low?'<i style="font-style:normal;color:var(--red)"> · 低于安全</i>':'')+'</span></td><td>'+M.upd+'</td><td>'+bomInfo(M)+matOps(M.id)+'</td></tr>'}).join('');
 var selV=function(v,o){return v===o?' selected':''};
 function mkSel(f,opts,def){return '<select data-mat-f="'+f+'"><option value=""'+selV(MAT_FS[f],'')+'>'+def+'：全部</option>'+opts.map(function(o){return '<option value="'+o+'"'+selV(MAT_FS[f],o)+'>'+def+'：'+o+'</option>'}).join('')+'</select>'}
 var fbar='<select data-mat-f="type"><option value="">类型：全部</option>'+['材料供货','设备成套包','复合项'].map(function(o){return '<option value="'+o+'"'+selV(MAT_FS.type,o)+'>类型：'+o+'</option>'}).join('')+'</select>'+'<select data-mat-f="ctrl"><option value="">控制方式：全部</option>'+['量价双控','仅控量','仅控价','不控'].map(function(o){return '<option value="'+o+'"'+selV(MAT_FS.ctrl,o)+'>控制方式：'+o+'</option>'}).join('')+'</select>'+
  mkSel('aux',['主材','辅材'],'主材 / 辅材')+
  '<select data-mat-f="st"><option value="">状态：全部</option><option value="启用"'+selV(MAT_FS.st,'启用')+'>状态：启用</option><option value="停用"'+selV(MAT_FS.st,'停用')+'>状态：停用</option></select>'+
  '<input class="fkw" data-mat-kw placeholder="编码 / 名称 / 型号 模糊查询，支持扫码查询" value="'+(MAT_FS.kw||'')+'"/>'+
  '<span class="reset" data-mat-reset="1">重置</span>';
 var pager='<button class="pg-btn"'+(MAT_FS.page<=1?' disabled':' data-mat-pg="'+ (MAT_FS.page-1)+'"')+'>‹</button>'+
  (function(){var s='';for(var i=1;i<=pages;i++){s+='<button class="pg-btn'+(i===MAT_FS.page?' cur':'')+'" data-mat-pg="'+i+'">'+i+'</button>'}return s})()+
  '<button class="pg-btn"'+(MAT_FS.page>=pages?' disabled':' data-mat-pg="'+(MAT_FS.page+1)+'"')+'>›</button>';
 return '<div class="card-bd"><div class="mcat-wrap">'+
  '<div class="cat-tree"><div class="cat-tree-hd">消防专业分类树<span class="link-btn" data-tree-mgr="1">管理</span></div>'+treeHtml+'</div>'+
  '<div class="mat-rt"><div class="fbar">'+fbar+'</div>'+
  '<div class="mat-opbar">'+
   '<button class="btn btn-primary" data-mat-new="1">'+ICON.plus+'<span>新建</span></button>'+
   '<button class="mini-btn mini-no" data-toast="演示：下载 Excel 导入模板（校验：编码唯一 / 分类存在 / 单位合法 / 控制方式合法，错误行高亮并可下载错误报告）">导入</button>'+
   '<button class="mini-btn mini-no" data-toast="演示：导出材料主数据（可批量）">导出</button>'+
  '</div>'+
  '<div class="mat-filter-bar"><span class="link-btn" data-toast="演示：列设置（拖拽列 / 固定列 / 选择显示列 / 保存个人视图）">自定义列 ▾</span></div>'+
  '<div class="table-wrap"><table class="tbl" style="min-width:1300px"><thead><tr><th>材料编码</th><th>名称 / 品牌 / 型号</th><th>分类路径</th><th>类型</th><th>单位</th><th>主材 / 辅材</th><th>控制方式</th><th>状态</th><th>当前库存（下钻）</th><th>更新时间</th><th>操作</th></tr></thead><tbody>'+trs+'</tbody></table></div>'+
  '<div class="mcat-foot">共 <b>'+total+'</b> 条 · '+MAT_FS.per+' 条/页 · 第 '+MAT_FS.page+'/'+pages+' 页 <span style="margin-left:auto;display:flex;gap:4px;align-items:center">'+pager+'</span></div></div></div></div>';
}`,C=`// 消安云平台 · 页面分片 catTreeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function catTreeHTML(){
 var tree=[['消防水系统',[['管材',2],['喷淋',1],['阀门',3]]],['消防电系统',[['探测器',2],['主机',1],['线缆',3]]],['防排烟系统',[['卷帘',1],['风机',2]]],['智慧消防',[['硬件',2],['平台软件',1],['数字孪生',1]]]].map(function(b){return '<div class="tree-node"><div class="tree-branch"><span class="tree-ic">'+ICON.file+'</span><b>'+b[0]+'</b><i>'+b[1].reduce(function(a,x){return a+x[1]},0)+' 种材料</i></div><div class="tree-kids">'+b[1].map(function(k){return '<div class="tree-leaf" data-toast="演示：打开「'+k[0]+'」材料列表">'+k[0]+'<i>'+k[1]+'</i></div>'}).join('')+'</div></div>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">材料分类</div><div class="m-num">4 大类</div><div class="m-sub">12 子类 · 1,268 种</div></div><div class="metric"><div class="m-label">主材 / 辅材</div><div class="m-num">860 / 408</div><div class="m-sub">主材量价双控优先</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>材料分类树（消防专业体系）</h3><div class="right"><button class="btn btn-primary" data-new="材料分类">'+ICON.plus+'<span>新建分类</span></button></div></div><div class="card-bd"><div class="tree">'+tree+'</div></div></section>'+
 '<div class="demo-note">分类树：消防水 / 消防电 / 防排烟 / 智慧消防 → 大类 → 品种 → 规格型号，材料主数据公共入口</div>';
}`,A=`// 消安云平台 · 页面分片 certDashHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function certDashHTML(){
 var tiles=[['证书总数','1,286',''],['有效','1,112','g'],['30 天内到期','9','r'],['60 / 90 天内到期','23','y'],['已过期','4','r'],['本月需继续教育','17','y']];
 var rows=[
 ['安全生产许可证','（鲁）JZ 安许 2023-018','2026-10-05',dt('r')+' 19 天','延续申请已提交','工程交付部','去续期'],
 ['张伟 · 机电建造师（二级）','建造师 2609 8877','2026-09-30',dt('r')+' 14 天','待安排继续教育','工程交付部','提醒责任人'],
 ['XX 消防检测计量证书','JL-2026-0331','2026-11-12',dt('y')+' 57 天','未开始','维保服务中心','去续期'],
 ['李敏 · 消防设施操作员（中级）','XFCZ 2024 0512','2026-12-01',dt('y')+' 76 天','已报名复训','工程交付部','去续期'],
 ['吴斌 · 注册消防工程师','XFGC 2019 1108','2027-03-18',dt('g')+' 183 天','—','技术部','—'],
 ['周凯 · 低压电工特种作业证','T6201 2608 3312','2026-08-30',dt('r')+' 已过期 17 天','已脱审 · 立即处理','维保服务中心','立即续期']];
 return '<div class="card-bd">'+
  '<div class="cert-tiles">'+tiles.map(function(t){return '<div class="cert-tile"><div class="ct-k">'+t[0]+'</div><div class="ct-v '+(t[2]==='r'?'hot':(t[2]==='y'?'mid':''))+'"'+(t[2]==='g'?' style="color:var(--green)"':'')+'>'+t[1]+'</div></div>'}).join('')+'</div>'+
  '<div class="dv-sec">到期预警列表（红 → 黄 → 绿）</div>'+
  tblHTML(['证书 / 持证人','证书编号','有效期至','倒计时','续期状态','责任部门','操作'],rows,760)+
  '<div class="dv-sec">关联投标 · 废标风险预警（证书到期将导致投标资格无效 · 防废标）</div>'+
  '<div class="table-wrap">'+tblHTML(['证书 / 持证人','有效期','剩余','关联投标','投标节点','风险等级','建议'],[
   ['注册消防工程师（吴斌） CERT-008','2026-08-30',tg('r','已过期 18 天'),'BD-002 XX医院二期消防改造','做标书中',tg('r','高 · 废标风险'),'立即更换持证人员并更新投标包'],
   ['特种作业操作证（电工）杨帆 CERT-003','2026-09-30',tg('y','12 天'),'BD-005 XX商业广场智慧消防','报名',tg('y','中 · 临期风险'),'30 天内续期 / 换人'],
   ['建造师 B 证 张伟 CERT-004','2026-09-20',tg('y','2 天'),'—','—',tg('y','中 · 临期风险'),'立即续期，否则人员证书包无效']],800,0)+'</div>'+
  '<div class="demo-note">证书 30 / 60 / 90 天到期预警；过期证书禁止加入投标包，关联在投项目自动标红为「废标风险」，防止无效投标</div>'+
  '<div class="dv-sec">快捷操作</div><div class="gs-chips-wrap"><span class="gs-chip" data-act="一键提醒全部责任人">一键提醒全部责任人</span><span class="gs-chip" data-act="导出到期证书包">导出到期证书包</span><span class="gs-chip" data-act="加入投标材料包">加入投标材料包</span><span class="gs-chip" data-act="设置提前 90 / 60 / 30 天提醒">设置提前 90 / 60 / 30 天提醒</span></div></div>';
}`,E=`// 消安云平台 · 页面分片 certPackHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
var PERFS=[
 ['医院','改造',156,'XX医院二期消防改造','2025-11',tg('g','已竣工')],
 ['产业园','新建',386,'XX产业园一期喷淋系统','2026-03',tg('g','已竣工')],
 ['商业','新建',982,'XX体育馆消防专项','2026-01',tg('g','已竣工')],
 ['教育','改造',86,'XX学校宿舍喷淋改造','2025-09',tg('g','已竣工')],
 ['政务','新建',1560,'XX政务中心消防工程','2025-12',tg('g','已竣工')],
 ['工业','维保',36,'XX商城年度维保','2026-02',tg('b','履约中')]];
function certPackHTML(){
 window.CPK=window.CPK||{sel:['CERT-001','CERT-006','CERT-007','CERT-002','CERT-003']};
 var cks=CERTS.map(function(c){
  var disabled=c.days<0||c.occ==='占用中';
  var checked=CPK.sel.indexOf(c.id)>-1;
  if(disabled)checked=false;
  var note;
  if(c.days<0)note=tg('r','已过期 '+(0-c.days)+' 天 · 禁止使用（防废标）');
  else if(c.occ==='占用中')note=tg('r','占用中 · '+(c.occNote||'')+' · 不可同时用于其他投标');
  else if(c.occ==='预占用')note=tg('y','预占用 · '+(c.occNote||''));
  else if(c.days<=30)note=tg('r','临期 '+c.days+' 天 · 建议 30 天内续期，可勾选');
  else if(c.days<=90)note=tg('y','90 天内到期（'+c.days+' 天）');
  else note=tg('g','有效期 ✓ · 未被占用');
  return '<label class="kv-row kv-chk" style="cursor:'+(disabled?'not-allowed':'pointer')+'"><span><input type="checkbox" data-cpk-chk="'+c.id+'" '+(checked?'checked':'')+(disabled?' disabled':'')+' style="margin-right:8px;vertical-align:-2px"/>'+c.name+'（'+(c.type==='人员'?c.holder:'企业')+'）<br/><span style="font-size:12px;color:var(--t3);margin-left:24px">'+note+'</span></span><b></b></label>'});
 var selOk=CPK.sel.filter(function(id){var c=CERTS.find(function(x){return x.id===id});return c&&c.days>=0&&c.occ!=='占用中'});
 var packs=[
  ['XX体育馆 · 投标资质包','XX体育馆消防专项','6 本（企业 3 + 人员 3）','类似业绩 5 项','王悦','09-15',tg('b','下载 / 打印')],
  ['XX医院门诊楼 · 投标资质包','XX医院门诊楼改造','5 本（企业 2 + 人员 3）','类似业绩 4 项','王悦','09-13',tg('b','下载 / 打印')],
  ['常规维保投标基础包','通用','4 本（企业 4）','类似业绩 3 项','刘畅','08-30',tg('b','下载 / 打印')]];
  window.CPKPACKS=window.CPKPACKS||packs;
  var pf=window.PERF_F=window.PERF_F||{ind:'',type:'',amt:''};
  var plist=PERFS.filter(function(p2){if(pf.ind&&p2[0]!==pf.ind)return false;if(pf.type&&p2[1]!==pf.type)return false;if(pf.amt==='1'&&!(p2[2]<100))return false;if(pf.amt==='2'&&!(p2[2]>=100&&p2[2]<=500))return false;if(pf.amt==='3'&&!(p2[2]>500))return false;return true});
  var perfRows=plist.map(function(p2){return '<tr><td>'+p2[0]+'</td><td>'+p2[1]+'</td><td>¥'+p2[2]+' 万</td><td><span class="link-btn" data-toast="演示：打开业绩详情 / 引用到投标包">'+p2[3]+'</span></td><td>'+p2[4]+'</td><td>'+p2[5]+'</td></tr>'}).join('');
 return '<div class="card-bd">'+
  '<div class="dv-sec">① 勾选资质组成「业绩资质包」（自动校验有效期与占用状态 · 避免人员离职丢资产 · 避免证书过期废标）</div>'+
  '<div class="wb-total" style="margin-bottom:10px"><span>已选 <b id="cpkCount">'+selOk.length+'</b> 项 · 系统实时校验有效期与占用状态</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-cpk-ok="1">自动打包生成资质包</button> <button class="mini-btn mini-no" data-cpk-pdf="1">导出证书包 PDF</button></span></div>'+
  '<div class="kvg" style="grid-template-columns:1fr 1fr">'+cks.join('')+'</div>'+
  '<div class="dv-sec">② 已生成的投标资质包</div>'+
  '<div class="table-wrap" style="margin:8px 0">'+tblHTML(['材料包名称','关联投标','包含证书','包含业绩','更新人','更新时间','操作'],CPKPACKS,820)+'</div>'+
  '<div class="dv-sec">③ 业绩组合筛选（行业 + 业务类型 + 金额）</div>'+
  '<div class="fbar"><select data-perf-f="ind"><option value="">行业：全部</option><option value="医院">医院</option><option value="产业园">产业园</option><option value="商业">商业</option><option value="教育">教育</option><option value="政务">政务</option><option value="工业">工业</option></select><select data-perf-f="type"><option value="">业务类型：全部</option><option value="新建">新建</option><option value="改造">改造</option><option value="维保">维保</option><option value="检测">检测</option></select><select data-perf-f="amt"><option value="">金额：全部</option><option value="1">&lt;100 万</option><option value="2">100~500 万</option><option value="3">&gt;500 万</option></select><span class="reset" data-perf-reset="1">重置</span><span style="margin-left:auto;font-size:12px;color:var(--t3)">命中 '+plist.length+' / '+PERFS.length+' 条</span></div>'+
  '<div class="table-wrap" style="margin-top:8px">'+tblHTML(['行业','业务类型','合同金额','项目名称','竣工时间','状态'],perfRows,820)+'</div>'+
  '<div class="demo-note">业绩库按行业 / 业务类型 / 金额组合筛选，可引用为投标业绩材料；打包时证书状态自动预占用，开标后中标 → 实际占用，未中标 → 释放</div></div>';
}
`,N=`// 消安云平台 · 页面分片 clName —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function clName(cid){var c=CLIENTS.find(function(x){return x.id===cid});return c?c.name:cid}`,F=`// 消安云平台 · 页面分片 clOf —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function clOf(cid){return CLIENTS.find(function(x){return x.id===cid})}`,I=`// 消安云平台 · 页面分片 clientHTML —— 客户档案（O4 入口：档案按钮 → 客户 360）
function clientHTML(){
 var F=window.CLI_F||{region:'',industry:'',kw:''};
 var rows=CLIENTS.filter(function(c){
  if(F.region&&c.region!==F.region)return false;
  if(F.industry&&c.industry!==F.industry)return false;
  if(F.kw&&(c.name+c.contact+c.id).toLowerCase().indexOf(F.kw.toLowerCase())<0)return false;
  return true}).map(function(c){return '<tr><td>'+c.id+'</td><td><b>'+c.name+'</b></td><td>'+c.industry+'</td><td>'+c.region+'</td><td>'+c.contact+'</td><td>'+c.phone+'</td><td class="rt num">'+c.opp+'</td><td>'+tagHtml(c.tier==='A'?'重点':c.tier==='B'?'重要':'普通',c.tier==='A'?'red':c.tier==='B'?'yellow':'blue')+'</td><td>'+c.last+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-clid="'+c.id+'">360 档案</button><button class="mini-btn mini-no" data-toast="演示：编辑客户信息">编辑</button></span></td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>'+CLIENTS.length+'</b></div><div class="pill">重点客户 <b>'+CLIENTS.filter(function(c){return c.tier==='A'}).length+'</b></div><div class="pill">区域：昆明 <b>'+CLIENTS.filter(function(c){return c.region==='昆明'}).length+'</b></div><div class="pill">近 7 天活跃 <b>'+CLIENTS.filter(function(c){return c.last>='09-10'}).length+'</b></div></div>'+
 '<div class="fbar"><select data-cli-f="region"><option value="">区域：全部</option>'+['昆明','曲靖','文山','楚雄'].map(function(r){return '<option value="'+r+'">区域：'+r+'</option>'}).join('')+'</select><select data-cli-f="industry"><option value="">行业：全部</option>'+['园区开发','医疗','商业','地产','教育','物流'].map(function(r){return '<option value="'+r+'">行业：'+r+'</option>'}).join('')+'</select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 更新：2026-09-16</span><input class="fkw" data-cli-kw placeholder="关键字搜索…"/><span class="reset" data-cli-reset>重置</span></div>'+
 '<div class="table-wrap"><div class="gm-tblw"><table class="gm-tb" style="min-width:1080px"><thead><tr><th>客户编号</th><th>客户名称</th><th>行业</th><th>区域</th><th>联系人</th><th>电话</th><th class="rt">商机数</th><th>等级</th><th>最近跟进</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
 '<div class="demo-note">点击「360 档案」打开客户全景：商机 / 报价 / 合同 / 跟进四源动态聚合</div>';
}
`,B=`// 消安云平台 · 页面分片 cnStepsHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function cnStepsHTML(){
 return '<div class="cn-steps">'+CN_STEPS.map(function(s,i){
  var cls=i===cnStep?' on':(i<cnStep?' done':'');
  if(cnEdit&&i===0)cls=(i===cnStep)?' on':' done';
  return '<div class="cn-step '+cls+'" data-cns="'+i+'"><b>'+(i<cnStep?'✓':(i+1))+'</b>'+s+'</div>';
 }).join('')+'</div>';
}`,D=`// 消安云平台 · 页面分片 contactHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function contactHTML(){
 var rows=[
  ['CL-001','张伟','总经理','138****2210','昆明','园区开发','主联系人','09-16'],
  ['CL-001','钱进','工程部经理','150****4432','昆明','园区开发','技术对接','09-10'],
  ['CL-002','李雪','后勤主任','139****8102','昆明','医疗','主联系人','09-15'],
  ['CL-002','孙强','安全科','147****9921','昆明','医疗','报修对接','08-28'],
  ['CL-003','陈晨','物业经理','137****4521','昆明','商业','主联系人','09-12'],
  ['CL-005','刘涛','基建科长','135****3310','文山','教育','主联系人','09-08'],
  ['CL-006','赵敏','运营总监','152****7745','楚雄','物流','主联系人','09-05']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],'blue')+'</td><td>'+r[7]+'</td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>7</b></div><div class="pill">主联系人 <b>6</b></div><div class="pill">技术对接 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>区域：全部</option><option>区域：昆明</option><option>区域：文山</option><option>区域：楚雄</option></select><select><option>角色：全部</option><option>角色：主联系人</option><option>角色：技术对接</option></select><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['客户编号','姓名','职位','电话','区域','所属客户','角色','最近联系'],rows,960)+'</div>'+
 '<div class="demo-note">按区域分类维护联系人（昆明 / 文山 / 楚雄 / 广西等），销售离职后客户资产不流失</div>';
}`,q=`// 消安云平台 · 页面分片 contractApproveHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
// C7 试点改造：通过/驳回真实改变审批状态（CAPPR 数据驱动，操作后重渲染）
window.CAPPR=[
 {id:'HT-2610-01',obj:'XX新区消防改造合同（新建）',party:'XX新区建设投资有限公司',from:'商务 / 王悦',amt:'¥186.00 万',rule:'需总经理审批',time:'09-17 10:00',flow:tg('y','会签 3 / 5'),st:'审批中'},
 {id:'HT-2609-12',obj:'XX国际大厦消防改造合同',party:'XX置业有限公司',from:'商务 / 孙倩',amt:'¥521.00 万',rule:'金额超 500 万 · 总经理特批',time:'09-16 16:20',flow:tg('b','法务待审'),st:'审批中'},
 {id:'BG-02',obj:'管网变更 · 补充协议（HT-2609-18）',from:'成控 / 李敏',amt:'-1.20 万',rule:'变更超 1% 需分管审批',time:'09-16 09:05',flow:tg('g','已会签'),st:'待分管审批'},
 {id:'ZC-2609-11',obj:'风管安装分包合同',from:'商务 / 王强',amt:'¥45.00 万',rule:'常规审批',time:'09-15 14:30',flow:tg('g','已通过'),st:'已生效'}];
function contractApproveHTML(){
 var list=CAPPR;
 var pend=list.filter(function(r){return r.st.indexOf('审批')>-1||r.st==='待分管审批'}).length;
 var mine=list.length;
 var done=list.filter(function(r){return r.st==='已生效'||r.st==='已驳回'}).length;
 var rows=list.map(function(r,i){
  var op;
  if(r.st==='已生效')op=tg('g','已生效');
  else if(r.st==='已驳回')op=tg('r','已驳回');
  else op='<span class="ti-acts" style="margin:0"><button class="mini-btn mini-ok" data-ap-ok="'+i+'">通过</button><button class="mini-btn mini-no" data-ap-no="'+i+'">驳回</button><button class="mini-btn mini-no" data-toast="演示：加签 / 转签 / 委托">加签</button></span>';
  return [r.id,r.obj,r.from,r.amt,r.rule,r.time,r.flow,op]});
 return '<div class="pills"><div class="pill active">待我审批 <b>'+pend+'</b></div><div class="pill">我发起 <b>'+mine+'</b></div><div class="pill">已办结 <b>'+done+'</b></div></div>'+
 '<div class="fbar"><select><option>审批类型：全部</option><option>审批类型：新建合同</option><option>审批类型：合同变更</option><option>审批类型：结算 / 付款</option></select><select><option>风险等级：全部</option><option>风险等级：高</option><option>风险等级：中</option></select><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['对象','类型 / 发起人','金额','审批规则','提交时间','会签 / 加签','状态','操作'],rows,1140)+'</div>'+
 '<div class="demo-note">通过 / 驳回真实改变审批状态并留痕（刷新后仍在）；支持会签 / 加签 / 转签 / 委托 / 条件分支（按金额、风险等级自动路由）：消防类合同先保卫 / 安全部门初审，再交法务办合法合规审查；联营合同需总经理特批</div>';
}
`,R=`// 消安云平台 · 页面分片 contractDashHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function contractDashHTML(){
 var risks=[
  ['ZC-2608-19','报警设备供货合同 · XX医院',tg('r','超结算付款 104.6%'),'追回差额或补充结算','安泰电子','立即处理'],
  ['HT-2608-31','XX医院门诊楼合同',tg('r','超付预警 89.4%'),'暂缓付款，先收票','卫健委机关事务中心','暂缓付款'],
  ['HT-2608-22','XX商业广场合同',tg('r','缺票 ¥18.2 万'),'催收发票后支付尾款','XX商业运营','催发票'],
  ['HT-2609-18','XX产业园主合同',tg('y','付款 71.5% 接近上限'),'先完成第3期产值上报','XX产业园开发','上报产值'],
  ['质保金','XX大厦 · ¥32 万 10-08 到期',tg('y','质保金到期'),'到期前完成复检','XX置业','安排复检']];
 var cAll=0,cSettled=0,trM={};
 for(var di=0;di<CONTRACTS.length;di++){var dc=CONTRACTS[di],da=dc.amt||0;cAll+=da;
  if(dc.st==='已结算'||dc.st==='已归档')cSettled++;
  var dm=String(dc.id).match(/-\\d{2}(\\d{2})-/);if(dm)trM[dm[1]]=(trM[dm[1]]||0)+da}
 var trend=['04','05','06','07','08','09'].map(function(k){return [k+'月',Math.round((trM[k]||0)*10)/10]});
 var trendMax=1;trend.forEach(function(t){if(t[1]>trendMax)trendMax=t[1]});
 var dMain=0,dMat=0,dFw=0,dSub=0;
 for(var dj=0;dj<CONTRACTS.length;dj++){var d2=CONTRACTS[dj],a2=d2.amt||0;
  if(d2.dir==='销售')dMain+=a2;else if(d2.dir==='采购'){if(d2.type==='材料'||d2.type==='机械'||d2.type==='软硬件')dMat+=a2;else dSub+=a2}else dFw+=a2}
 var pMain=Math.round(dMain/cAll*100),pMat=Math.round(dMat/cAll*100),pFw=Math.round(dFw/cAll*100);
 var dist=[['销售合同（收入）',pMain],['材料 / 设备',pMat],['框架 / 维保 / 联营',pFw],['分包 / 劳务',100-pMain-pMat-pFw]];
 var arSum=0;SETTLE_XS.forEach(function(r){arSum+=(parseFloat(String(r[6]).replace(/,/g,''))||0)});
 var pendN=(window.CAPPR||[]).filter(function(r){return (r.st||'').indexOf('审批')>-1}).length;
 var tiles=[['合同总额','¥'+nfmt(Math.round(cAll))+' 万',''],['待审批',String(pendN),'y'],['结算完成率',Math.round(cSettled/CONTRACTS.length*100)+'%','g'],['应收余额','¥'+nfmt(Math.round(arSum*10)/10)+' 万','r'],['风险合同',String(risks.length),'r'],['本月新签','¥'+nfmt(Math.round(trM['09']||0))+' 万','g']];
 return '<div class="card-bd">'+
  '<div class="cert-tiles">'+tiles.map(function(t){return '<div class="cert-tile"><div class="ct-k">'+t[0]+'</div><div class="ct-v '+(t[2]==='r'?'hot':(t[2]==='y'?'mid':''))+'"'+(t[2]==='g'?' style="color:var(--green)"':'')+'>'+t[1]+'</div></div>'}).join('')+'</div>'+
  '<div class="grid-main" style="margin-bottom:0">'+
  '<section class="card"><div class="card-hd"><h3>合同签订趋势（近 6 月 · 万元）</h3></div><div class="chart" style="border:none">'+
  '<div class="cb">'+trend.map(function(d){return '<div class="col"><div class="bar'+(d[1]===trendMax?' hot':'')+'" style="height:'+Math.round(d[1]/trendMax*70)+'%"><i>'+d[1]+'</i></div><span class="xl">'+d[0]+'</span></div>'}).join('')+'</div></div></section>'+
  '<section class="card"><div class="card-hd"><h3>合同类型分布</h3></div><div class="card-bd">'+
  dist.map(function(d){return '<div class="fun-row"><span class="fl2">'+d[0]+'</span><span class="fb"><i style="width:'+d[1]+'%"></i></span><b>'+d[1]+'%</b></div>'}).join('')+
  '<div class="dv-sec">健康指标</div><div class="kvg"><div class="kv-row"><span>平均审批时长</span><b>1.8 天</b></div><div class="kv-row"><span>按期回款率</span><b>81.4%</b></div></div>'+
  '</div></section></div>'+
  '<div class="dv-sec">风险合同列表（点击穿透合同详情）</div>'+
  tblHTML(['编号','合同','风险标签','处置建议','对方单位','操作'],risks,860,'contract')+
  '<div class="wb-total" style="margin-top:12px"><span>风险口径：超付 / 超结算 / 缺票 / 超资金余额 / 质保到期</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-act="导出经营月报附表">导出经营月报附表</button></span></div>'+
  '</div>';
}`,K=`// 消安云平台 · 页面分片 contractLedgerHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
// C1/C5 试点改造：数据驱动（CONTRACTS）+ Tab/筛选/分页真实生效 + 业务用途标签检索
function contractLedgerHTML(){
 var f=window.CLED||{tab:'all',st:'',ptype:'',mode:'',bus:'',kw:'',page:1,per:10};
 var list=CONTRACTS.filter(function(c){
  if(f.tab!=='all'&&c.dir!==f.tab)return false;
  if(f.st&&c.st.indexOf(f.st)<0)return false;
  if(f.ptype&&c.ptype!==f.ptype)return false;
  if(f.mode&&c.mode!==f.mode)return false;
  if(f.bus&&c.bus.indexOf(f.bus)<0)return false;
  if(f.kw){var kw=f.kw.toLowerCase();if((c.id+c.name+c.party+c.proj).toLowerCase().indexOf(kw)<0)return false}
  return true});
 var cnt=function(dir){return dir?CONTRACTS.filter(function(c){return c.dir===dir}).length:CONTRACTS.length};
 var tabs=[['all','全部',cnt()],['销售','销售合同 / 收入合同',cnt('销售')],['采购','采购合同 / 支出合同',cnt('采购')],['框架','框架合同与子订单',cnt('框架')],['维保','维保合同',cnt('维保')],['联营','联营合同',cnt('联营')]];
 var tabHTML=tabs.map(function(t){return '<span class="ctab'+(f.tab===t[0]?' on':'')+'" data-cl-tab="'+t[0]+'">'+t[1]+' <b>'+t[2]+'</b></span>'}).join('');
 var total=list.length,pages=Math.max(1,Math.ceil(total/f.per));
 if(f.page>pages)f.page=pages;
 var pageRows=list.slice((f.page-1)*f.per,f.page*f.per);
 var typeTg=function(x){return x==='主合同'?tg('b',x):x==='框架'?tg('purple',x):tg('gray',x)};
var rows=pageRows.map(function(c){
  return [c.id,'<b>'+c.name+'</b>',c.proj,c.party,typeTg(c.type),{rt:true,v:c.amt.toFixed(2)},c.pct,stTg(c.st),c.mode]});
 var sel=function(k,opts,label){return '<select data-cl-f="'+k+'"><option value="">'+label+'：全部</option>'+opts.map(function(o){return '<option value="'+o+'"'+(f[k]===o?' selected':'')+'>'+label+'：'+o+'</option>'}).join('')+'</select>'};
 var pager='<button class="pg-btn"'+(f.page<=1?' disabled':' data-cl-pg="'+(f.page-1)+'"')+'>‹</button>'+(function(){var s='';for(var i=1;i<=pages;i++){s+='<button class="pg-btn'+(i===f.page?' cur':'')+'"'+(i===f.page?' aria-current="page"':'')+' data-cl-pg="'+i+'">'+i+'</button>'}return s})()+'<button class="pg-btn"'+(f.page>=pages?' disabled':' data-cl-pg="'+(f.page+1)+'"')+'>›</button>';
 return '<div class="pills"><div class="pill active">合同台账 <b>'+CONTRACTS.length+'</b></div><div class="pill" data-toast="演示：按项目维度穿透">按项目维度查看</div><div class="pill" data-toast="演示：合同模板库">合同模板</div></div>'+
  '<div class="ctabbar">'+tabHTML+'</div>'+
  '<div class="fbar">'+sel('st',['履约中','审批中','已结算','已归档','超结算付款'],'状态')+sel('ptype',['新建','改造 / 维修','维保','框架'],'项目类型')+sel('mode',['自营','联营'],'经营方式')+sel('bus',['工程类','维保类','内控管理类','软件平台类','平台配置类','维保 / 检测'],'业务用途')+'<input class="fkw" data-cl-kw placeholder="搜索合同编号 / 名称 / 对方单位…" value="'+(f.kw||'')+'"/><span class="reset" data-cl-reset>重置</span></div>'+
  '<div class="table-wrap">'+ (function(){var cj='<div class="gm-tblw"><table class="gm-tb cj-tbl" style="min-width:1120px"><thead><tr>'+ ['合同编号','合同名称','所属项目','对方单位','类型','>金额(万)','付款 / 回款比例','状态','经营方式'].map(function(h){ return '<th'+(h.charAt(0)==='>'?' class="rt"':'')+'>'+(h.charAt(0)==='>'?h.slice(1):h)+'</th>'}).join('')+'</tr></thead><tbody>'+ pageRows.map(function(c){return '<tr data-detail="contract" data-cid="'+c.id+'">'+ [c.id,'<b>'+c.name+'</b>',c.proj,c.party,typeTg(c.type),'<span class="num money">'+c.amt.toFixed(2)+'</span>',c.pct,stTg(c.st),c.mode] .map(function(cell,i){return '<td'+(i===5?' class="rt num money"':'')+'>'+cell+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>' +'<div class="tbl-foot">共 '+total+' 条 · '+f.per+' 条/页 · 第 '+f.page+'/'+pages+' 页<span style="margin-left:auto;display:flex;gap:4px;align-items:center">'+pager+'</span></div>';return cj})()+'</div>'+
  '<div class="demo-note">台账按数据实时过滤与分页：合同方向 Tab + 状态 / 项目类型 / 经营方式 / 业务用途（内控管理类 / 平台配置类 / 混合标签）组合检索；点行打开合同详情，行数与筛选结果自动一致</div>';
}
`,G=`// 消安云平台 · 页面分片 contractRiskHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function contractRiskHTML(){
 var six=[['回款条件过低 / 无预付款','⚠ 3 份合同预付比例 <10%'],['工期低于定额或赶工风险','⚠ 2 份合同工期偏紧 >15%'],['质量安全条款不齐全','✓ 抽查合规'],['税率与项目类型不匹配','⚠ 1 份税率 6% 待核'],['违约责任 / 争议解决不明确','✓ 合规'],['缺少消防资质 / 人员证书要求','⚠ 1 份维保合同缺操作员证书']];
 var risks=[['资金风险','付款超合同 3.2%（XX物流园）',tg('r','高')],['合同风险','工期偏紧 + 缺票（XX医院）',tg('y','中')],['税务风险','税率 6% 与项目类型待核',tg('y','中')],['供应商风险','华信管业 2 单延期交货',tg('y','中')],['客户风险','XX酒店历史回款周期 92 天',tg('y','中')]];
 return '<div class="metrics"><div class="metric"><div class="m-label">合同风险</div><div class="m-num">7 项</div><div class="m-sub">红 1 · 黄 6</div></div><div class="metric"><div class="m-label">六不准拦截</div><div class="m-num">3 项</div><div class="m-sub">预付款 / 工期 / 税率</div></div><div class="metric"><div class="m-label">供应商 / 客户风险</div><div class="m-num">5 家</div><div class="m-sub">每家可维护触发条件与提醒人</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>风险管理六不准（AI 业务助手）</h3><div class="right"><span class="link-btn" data-toast="演示：配置六不准规则">配置</span></div></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['检查项','当前命中'],six.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>'}).join(''),820)+'</div></div></section>'+
 '<section class="card"><div class="card-hd"><h3>AI 合同对比（原合同 vs 供应商修改模板）</h3><div class="right"><button class="btn btn-primary" data-ai-cmp="1">'+ICON.plus+'<span>对比合同</span></button></div></div><div style="padding:16px">'+tblHTML(['条款','原合同','供应商修改稿','AI 风险提示'],[
  ['付款比例','进度款 70%','进度款 60%','⚠ 降低回款节奏，建议维持原条款'],
  ['违约上限','日 0.5‰','日 0.3‰','⚠ 违约成本下降 40%'],
  ['质保期','24 个月','18 个月','⚠ 缩短质保，消防合规风险']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td style="color:var(--red)">'+r[2]+'</td><td>'+r[3]+'</td></tr>'}).join(''),1120)+'</div></section>'+
 '<section class="card"><div class="card-hd"><h3>供应商 / 客户风险项</h3></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['对象','风险项','触发条件','提醒人','等级'],risks.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>李敏</td><td>'+r[2]+'</td></tr>'}).join(''),920)+'</div></div></section>'+
 '<div class="demo-note">AI 按回款条件 / 工期 / 质量安全 / 税率 / 违约 / 资质证书六项输出高 / 中 / 低风险；消防技术标准更新（如 GB55037-2022）引发的合规调整也纳入风险排查</div>';
}`,W=`// 消安云平台 · 页面分片 contractWizHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function contractWizHTML(){
 return '<div class="card-bd">'+
 '<div class="dv-sec">合同来源入口（规格声明的四种来源均可发起）</div><div class="pick-tiles">'+
 '<div class="qtile" data-act="商机转合同：BD 商机池 → 选「已中标」商机 → 承接中标信息与客户档案转入合同"><div class="qi">'+ICON.target+'</div><span>商机转合同<br/><span style="color:var(--t3);font-size:11px">BD 商机池 · 中标后发起</span></span></div>'+
 '<div class="qtile" data-act="报价转合同：报价与勘察 → 打开报价单 → 点「转合同 / 销售订单」，报价清单反向生成目标成本"><div class="qi">'+ICON.file+'</div><span>报价转合同<br/><span style="color:var(--t3);font-size:11px">报价单清单反向生成目标成本</span></span></div>'+
 '<div class="qtile" data-cnew="1"><div class="qi">'+ICON.plus+'</div><span>直接签约<br/><span style="color:var(--t3);font-size:11px">无项目直签 · 新客户直接建档</span></span></div>'+
 '<div class="qtile" data-act="框架子合同：合同管理 → 框架合同与子订单 → 点「衍生子订单 / 子合同」按框架价挂接"><div class="qi">'+ICON.layers+'</div><span>框架子合同<br/><span style="color:var(--t3);font-size:11px">框架协议下衍生子订单</span></span></div>'+
 '</div>'+
 '<div class="dv-sec">第一步 · 上传合同任意附件（Word / PDF / 图片 / 照片）</div>'+
 '<div class="ocr-drop" data-toast="演示：上传附件，AI/OCR 自动识别回填"><svg class="ic" style="width:30px;height:30px;margin:0 auto 8px" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>点击上传或拖入合同文件<br/><span style="font-size:12px">AI 自动识别：合同编号 · 名称 · 金额 · 税率 · 工期 · 付款节点 · 相对方 · 银行信息，减少一线手工录入</span></div>'+
 '<div class="dv-sec">AI 回填预览（演示）</div><div class="table-wrap">'+tblHTML(['字段','识别结果','校验'],[
  ['合同编号','HT-2610-01','✓'],
  ['合同名称','XX新区消防改造工程合同','✓'],
  ['对方单位','XX新区建设投资有限公司','✓'],
  ['合同金额 / 税率','¥186.00 万 / 9%','✓'],
  ['工期 / 付款节点','90 天 / 预付 30% + 进度 40% + 竣工 25% + 质保金 5%','✓'],
  ['银行账户','6222 **** **** 3312 · XX银行','待确认']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+tg(r[2]==='✓'?'green':'yellow',r[2])+'</td></tr>'}).join(''),760)+'</div>'+
 '<div class="wb-total"><span>识别结果置信度 98.2% · 可手工修正 · 编号查重：台账无重复 ✓（审批通过后自动挂牌写入合同台账）</span><span style="margin-left:auto"><button class="mini-btn mini-no" data-act="重新识别">重新识别</button> <button class="mini-btn mini-ok" data-cnew="1">进入新建合同向导（V1.0 建立）</button></span></div></div>';
}`,J=`// 消安云平台 · 页面分片 costChangeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function costChangeHTML(){
 var rows=[
  ['BG-2609-014','镀锌钢管 DN100 单价','22 → 20',tg('y','-2 元'),'张成控','09-16 10:24',tg('b','已生效 · 留痕'),OKNO],
  ['BG-2609-012','喷淋头 ZSTX15 数量增加','+120 只','+¥3,600',tg('o','超量'),'赵经理','09-14 16:10',tg('b','已生效 · 留痕'),OKNO],
  ['BG-2609-009','删除项：应急照明 X 项','-8 只','-¥4,800',tg('r','自动扣减大项'),'李工','09-12 09:30',tg('b','已生效 · 留痕'),OKNO],
  ['BG-2609-006','签证：业主新增喷淋支管','+¥26,400','+¥26,400',tg('g','签证回传'),'王经理','09-10 14:00',tg('y','待审批'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">变更 / 签证（22 改 20 留痕 · 删除项自动扣减大项 · 业主原因完善签证资料）</div>'+
  '<div class="table-wrap">'+tblHTML(['变更单号','变更内容','数量 / 单价变化','金额影响','类型','发起人','时间','状态','操作'],rows,1180)+'</div>'+
  '<div class="wb-total"><span>本月变更 6 单 · 已生效 3 · 待审批 1 · 签证待回传 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发起变更">+ 发起变更</button></span></div>'+
  '<div class="demo-note">班组原因损耗 → 扣款；业主原因 → 必须完善签证资料，否则后续收款无依据；所有变更版本留痕不可覆盖</div></div>';
}`,Q=`// 消安云平台 · 页面分片 costImpHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function costImpHTML(){
 return '<div class="metrics"><div class="metric"><div class="m-label">可导入清单</div><div class="m-num">6 份</div><div class="m-sub">投标清单 4 · 内控预算 2</div></div><div class="metric"><div class="m-label">待审核导入</div><div class="m-num">2 份</div><div class="m-sub">校验通过后生效</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>清单导入（投标清单 → 内控预算）</h3><div class="right"><button class="btn btn-primary" data-toast="演示：上传 Excel / 从报价单引用">'+ICON.plus+'<span>导入清单</span></button></div></div><div style="padding:16px"><div class="pills"><div class="pill active">待导入 <b>2</b></div><div class="pill">已导入 <b>4</b></div></div>'+
 '<div class="table-wrap">'+tblHTML(['来源','项目','类型','条目数','导入人','状态','操作'],[
  ['报价单 BJ-2609-05','XX医院二期消防改造','投标清单','28','王强','待审核','<span class="ti-acts"><button class="mini-btn mini-ok" data-toast="演示：导入校验通过，生成目标成本">导入</button></span>'],
  ['报价单 BJ-2609-06','XX产业园一期喷淋系统','投标清单','22','李敏','已导入','<span class="ti-acts"><button class="mini-btn mini-no" data-toast="演示：查看目标成本">目标成本</button></span>'],
  ['内控预算 V2026.09','XX商业广场综合体','内控预算','35','成控部','已导入','<span class="ti-acts"><button class="mini-btn mini-no" data-toast="演示：查看预算红线">查看</button></span>']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+tagHtml(r[2],r[2]==='投标清单'?'blue':'yellow')+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+tagHtml(r[5],r[5]==='已导入'?'green':'yellow')+'</td><td>'+r[6]+'</td></tr>'}).join(''),1000)+'</div></div></section>'+
 '<div class="demo-note">暂无成控部门时先以投标清单作为内部管理红线，后续深化为内控预算 / 目标成本</div>';
}`,V=`// 消安云平台 · 页面分片 costTreeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function costTreeHTML(){
 var rows=[
  ['1','消防水系统','¥186.4 万',tg('b','量价双控'),'12',tg('gray','预算')],
  ['1.1','管材 / 管件','¥88.2 万',tg('b','量价双控'),'5',tg('gray','预算')],
  ['1.1.1','镀锌钢管 DN100','¥52.6 万',tg('b','量价双控'),'1',tg('gray','预算')],
  ['1.2','喷淋系统','¥98.2 万',tg('o','仅控量'),'7',tg('b','已发生')],
  ['2','消防电系统','¥121.7 万',tg('b','量价双控'),'9',tg('b','已发生')],
  ['2.1','火灾报警','¥74.3 万',tg('b','量价双控'),'6',tg('b','已发生')],
  ['3','防排烟系统','¥64.8 万',tg('o','仅控量'),'4',tg('gray','预算')]];
 return '<div class="card-bd"><div class="dv-sec">树状成本科目（投标清单 / 内控预算导入生成，支持 1 / 1.1 / 1.1.1 层级）</div>'+
  '<div class="table-wrap">'+tblHTML(['科目编码','科目名称（树状）','预算金额','控制方式','子项','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>预算合计 ¥372.9 万 · 已发生 ¥219.9 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：从投标清单导入生成树状科目">导入生成</button></span></div>'+
  '<div class="demo-note">成本科目树联动量价双控：不平衡报价项设为「仅控量不控价」；变更留痕自动增减大项金额</div></div>';
}`,z=`// 消安云平台 · 页面分片 costWriteoffHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function costWriteoffHTML(){
 var rows=[
  ['未关联-18','XX 物流园 应急照明采购','¥4,800','09-10 无合同先采购',tg('r','超期未关联'),OKNO],
  ['未关联-16','XX 大厦 水泵维修（保外）','¥8,500','09-08 先付款',tg('y','待关联'),OKNO],
  ['未关联-12','XX 医院 喷淋头补货','¥3,600','09-05 无预算先入库',tg('b','已关联 · 待销项'),OKNO],
  ['未关联-08','XX 学校 烟感更换','¥2,640','08-28 已关联成本项',tg('g','已销项'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">先发生后关联 / 销项（无预算先采购、先付款 → 手动关联成本项 → 最终销项）</div>'+
  '<div class="table-wrap">'+tblHTML(['关联单号','业务内容','金额','原因','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>未关联 2 笔 ¥1.33 万 · 已关联待销项 1 · 已销项 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量关联成本项">批量关联</button></span></div>'+
  '<div class="demo-note">确保每笔付款都有成本归口：关联后进入六行量价对比，超期未关联红色预警，防止糊涂账</div></div>';
}`,$=`// 消安云平台 · 页面分片 deliverPackHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function deliverPackHTML(){
 var rows=[
  ['交付包-12','XX大厦 消防维保交付','验收报告 / 维保记录 / 满意度','9 项',tg('g','已交付'),OKNO],
  ['交付包-09','XX医院 年度检测交付','检测报告 / 整改闭环 / 收费确认','12 项',tg('b','打包中'),OKNO],
  ['交付包-06','XX产业园 竣工交付','竣工资料 / 验收单 / 设备清单','18 项',tg('b','待打包'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">交付物料包（验收资料 + 报告 + 清单 一键打包交付）</div>'+
  '<div class="table-wrap">'+tblHTML(['交付包','项目','内容组成','资料数','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>已交付 1 · 打包中 1 · 待打包 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成交付物料包">生成交付包</button></span></div>'+
  '<div class="demo-note">交付物料包带企业 Logo 与签章，PDF 导出 / 打印，供业主签收与存档</div></div>';
}
/* ===== 波次B1 协同办公 ===== */`,Z=`// 消安云平台 · 页面分片 docArchHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function docArchHTML(){
 var rows=[
  ['智能归档-12','采购合同 ZC-2609-08 附件','自动归类 → 合同档案 / 采购合同',tg('g','已归档'),'09-16 自动'],
  ['智能归档-11','AI 入库单附件（合格证）','自动归类 → 材料资料 / 批次 2609-031',tg('g','已归档'),'09-15 自动'],
  ['智能归档-09','付款审批附件（发票）','自动归类 → 资金档案 / 发票台账',tg('g','已归档'),'09-14 自动'],
  ['智能归档-06','维修订单 RP-2609-016 附件','建议归类 → 维保档案 / 维修订单',tg('b','待确认'),'09-13 待人工']];
 return '<div class="card-bd"><div class="dv-sec">智能归档（审批流中的合同 / 发票 / 订单附件自动归类 · 相当于「图书管理员」）</div>'+
  '<div class="table-wrap">'+tblHTML(['归档任务','来源单据附件','自动归类位置','状态','时间','操作'],rows,1080)+'</div>'+
  '<div class="wb-total"><span>本月自动归档 26 项 · 待人工确认 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：确认全部智能归档">全部确认</button></span></div>'+
  '<div class="demo-note">附件随审批流自动进入资料目录，无需人工整理；工程部 / 财务审核未通过视为未归档</div></div>';
}`,U=`// 消安云平台 · 页面分片 docAuditHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function docAuditHTML(){
 var rows=[
  ['XX大厦 · 竣工资料包','工程部 · 王工',tg('b','待审核'),'资料齐全 · 缺验收单 1 张',OKNO],
  ['XX医院 · 月度资料','工程部 · 李工',tg('g','已通过'),'全部归档',OKNO],
  ['XX产业园 · 结算资料','财务部 · 张会计',tg('r','未通过'),'发票缺失 · 视为未归档',OKNO],
  ['XX商业广场 · 材料资料','财务部 · 张会计',tg('g','已通过'),'合格证 / 3C 齐全',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">工程 / 财务审核（未通过视为未归档 · 影响验收与收款）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目 · 资料包','审核部门','状态','审核意见','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>待审核 1 · 已通过 2 · 未通过 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量审核">批量审核</button></span></div>'+
  '<div class="demo-note">财务未审核的资料对收款有影响，应视为未归档；审核通过才可进入验收 / 结算环节</div></div>';
}`,Y=`// 消安云平台 · 页面分片 docMissHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function docMissHTML(){
 var rows=[
  ['XX大厦 · 隐蔽工程验收','过程 · 隐蔽验收单',tg('r','缺失'),'责任人：赵工','09-20 前补传',OKNO],
  ['XX医院 · 材料合格证（批次 2609-031）','过程 · 合格证',tg('y','临期 3 天'),'责任人：李材管','09-18 前补传',OKNO],
  ['XX产业园 · 3C 认证（喷淋头）','过程 · 3C',tg('r','缺失'),'责任人：李材管','已超期 2 天',OKNO],
  ['XX商业广场 · 竣工报告','竣工 · 验收资料',tg('b','待生成'),'责任人：王经理','10-01 前归档',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">资料缺失提醒（红色缺失 · 黄色临期 · 到期未补影响验收与收款）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目 · 资料项','资料类别','状态','责任人','处理时限','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>缺失 2 · 临期 1 · 待生成 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：一键催办责任人">催办责任人</button></span></div>'+
  '<div class="demo-note">消防产品进场需提供合格证 / 3C / 检验报告：资料缺失或过期影响验收通过与收款</div></div>';
}`,tt=`// 消安云平台 · 页面分片 docTreeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function docTreeHTML(){
 var rows=[
  ['开工','施工合同','合同扫描件','3 项',tg('g','已归档'),OKNO],
  ['过程','材料合格证 / 3C / 检验报告','按批次归档','18 项',tg('g','已归档'),OKNO],
  ['过程','隐蔽工程验收资料','现场照片 / 验收单','6 项',tg('y','缺失 1 项'),OKNO],
  ['竣工','竣工验收资料','验收报告 / 整改闭环','4 项',tg('b','待归档'),OKNO],
  ['结算','结算资料','结算单 / 发票','2 项',tg('b','待归档'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">里程碑资料目录（按里程碑设置应归档资料目录 · 缺失提醒）</div>'+
  '<div class="table-wrap">'+tblHTML(['里程碑','资料类别','内容说明','数量','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>已归档 27 项 · 缺失 1 · 待归档 6</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：配置里程碑目录">+ 配置目录</button></span></div>'+
  '<div class="demo-note">资料按文件夹 / 目录管理；缺失红点提醒，避免人员离职后资料交接不全</div></div>';
}`,nt=`// 消安云平台 · 页面分片 eduFaultHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function eduFaultHTML(){
 var rows=[
  ['GZ-001','烟感探测器频繁误报','灰尘 / 安装位置不当','清理 + 重测',tg('g','已收录'),OKNO],
  ['GZ-002','消防泵启动异常','控制柜主板故障','更换主板',tg('g','已收录'),OKNO],
  ['GZ-003','喷淋末端试水压力不足','主管阀门未全开','检查阀门',tg('b','整理中'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">故障库（常见故障 · 原因 · 处理方案）</div>'+
  '<div class="table-wrap">'+tblHTML(['编号','故障现象','原因分析','处理方案','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>故障库 32 条 · 命中率 78%</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：录入新故障">+ 录入故障</button></span></div>'+
  '<div class="demo-note">故障库支撑维保工单处理与知识考试，沉淀一线经验</div></div>';
}
/* ===== 波次C4 数字孪生与 IoT ===== */`,at=`// 消安云平台 · 页面分片 eduKnowHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function eduKnowHTML(){
 var key=curMenuKey;
 if(key.indexOf('价格')>-1){
  var rows=[
   ['JG-001','消防主材市场价格行情（镀锌钢管 / 喷淋头 / 阀门 月度走势）','市场行情','09-16 更新',tg('g','已发布'),OKNO],
   ['JG-002','询价经验：二维码询价 / 比价要点','实战经验','内部沉淀',tg('g','已发布'),OKNO],
   ['JG-003','内部定额：综合单价构成与上浮规则','内部定额','成控维护',tg('b','草稿'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">价格知识库（市场价格 / 询价经验 / 内部定额 培训资料）</div>'+
   '<div class="table-wrap">'+tblHTML(['编号','知识主题','分类','更新','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>价格知识 26 篇 · 与价格库联动</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：检索价格知识">检索</button></span></div>'+
   '<div class="demo-note">价格知识库面向采购 / 成控培训：市场价格行情、询价经验与内部定额规则沉淀（联动价格库与内部定额）</div></div>';
 }
 if(key.indexOf('规范')>-1){
  var rows=[
   ['GB 50016-2014','建筑设计防火规范','国家标准','2018 修订',tg('g','现行'),OKNO],
   ['GB 50116-2013','火灾自动报警系统设计规范','国家标准','2013',tg('g','现行'),OKNO],
   ['GB 25506-2010','消防控制室通用技术要求','国家标准','2010',tg('g','现行'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">规范案例（消防标准 / 典型案例库）</div>'+
   '<div class="table-wrap">'+tblHTML(['编号','名称','类型','版本','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>规范 36 条 · 案例 28 例</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：检索规范">检索</button></span></div>'+
   '<div class="demo-note">规范案例库支撑巡检标准检查项与知识考试题库</div></div>';
 }
 var rows=[
  ['KB-001','消防水系统组成与原理','管道 / 阀门 / 泵组',tg('g','已发布'),OKNO],
  ['KB-002','火灾报警系统调试要点','探测器 / 主机',tg('g','已发布'),OKNO],
  ['KB-003','维保巡检标准动作','按项检查 · 拍照留证',tg('b','草稿'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">企业 / 行业知识（内部沉淀 + 行业资料）</div>'+
  '<div class="table-wrap">'+tblHTML(['编号','知识主题','内容分类','状态','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>知识条目 48 篇 · 本月新增 6</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新增知识">+ 新增知识</button></span></div>'+
  '<div class="demo-note">知识库 AI 可选配：问答 / 检索 / 自动归档（模块市场计费）</div></div>';
}`,st=`// 消安云平台 · 页面分片 esigHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function esigHTML(){
 var rows=[
  ['企业电子签章（合同用印）','SN-9A2F-2024-1108','诺盾博达消防工程有限公司','CFCA 国信 CA','2024-11-08 ~ 2026-11-08',tg('g','RSA-2048'),tg('g','已安装 · 在用'),'王悦 / 合同章 · USBKey-001','<span class="ti-acts"><button class="mini-btn mini-ok" data-esg-op="详情">详情</button><button class="mini-btn mini-no" data-esg-op="续期">续期</button><button class="mini-btn mini-no" data-esg-op="吊销">吊销</button></span>'],
  ['个人签名证书（王悦）','SN-77C1-2025-0302','王悦（法人代表）','CFCA 国信 CA','2025-03-02 ~ 2027-03-02',tg('b','SM2 国密'),tg('g','已安装'),'个人签章 · USBKey-002','<span class="ti-acts"><button class="mini-btn mini-ok" data-esg-op="详情">详情</button><button class="mini-btn mini-no" data-esg-op="续期">续期</button><button class="mini-btn mini-no" data-esg-op="吊销">吊销</button></span>'],
  ['消防报告签章证书（申请中）','—','诺盾博达消防工程有限公司','待签发','待签发',tg('gray','—'),tg('o','待签发'),'申请中 · 用途：消防报告电子签','<span class="ti-acts"><button class="mini-btn mini-ok" data-esg-op="签发下载">签发下载</button><button class="mini-btn mini-no" data-esg-op="取消申请">取消申请</button></span>'],
  ['服务器证书（数字孪生平台）','SN-E3B7-2026-0801','iot.nuodunbidu.com','TrustAsia','2026-08-01 ~ 2027-07-31',tg('g','RSA-2048'),tg('y','已安装 · 即将到期'),'IOT 平台 · 无 USBKey','<span class="ti-acts"><button class="mini-btn mini-ok" data-esg-op="详情">详情</button><button class="mini-btn mini-no" data-esg-op="续期">续期</button></span>'],
  ['旧合同章证书（已吊销）','SN-1180-2023-0101','诺盾博达消防工程有限公司','CFCA 国信 CA','2023-01-01 ~ 2026-01-01',tg('gray','RSA-2048'),tg('gray','已吊销'),'吊销原因：印章停用 / 人员离职','<span class="ti-acts"><button class="mini-btn mini-no" data-esg-op="查看吊销记录">查看吊销记录</button></span>']];
 return '<div class="card-bd">'+
  '<div class="wb-top"><b>电子签 / CA 数字证书：</b>覆盖 申请（enrollment）→ 签发（issuance）→ 安装（installation）→ 续期（renewal）→ 吊销（revocation）全生命周期；红圈为内账 / 业务系统，<b>不直接签发 CA</b>，仅管理企业从第三方 CA 获得的数字证书及其生命周期状态</div>'+
  '<div class="pills"><div class="pill active">全部 <b>5</b></div><div class="pill">待签发 <b>1</b></div><div class="pill">已安装 <b>2</b></div><div class="pill">即将到期 <b>1</b></div><div class="pill">已吊销 <b>1</b></div></div>'+
  '<div class="fbar"><select><option>证书类型：全部</option><option>企业电子签章</option><option>个人签名证书</option><option>服务器证书</option><option>国密证书</option></select><select><option>密钥算法：全部</option><option>RSA-2048</option><option>SM2 国密</option></select><select><option>生命周期状态：全部</option><option>待签发</option><option>已安装</option><option>即将到期</option><option>已吊销</option></select><select><option>绑定用户：全部</option><option>王悦</option><option>合同章</option></select><input class="fkw" placeholder="证书名称 / 序列号 / 主体…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
  '<div class="mat-opbar"><span class="opb-title">共 <b>5</b> 份数字证书 · 在用 <b>3</b> · 待处理 <b>1</b></span><span style="flex:1"></span>'+
  '<button class="btn btn-ghost" data-esg-op="申请注册">'+ICON.plus+'<span>申请注册</span></button>'+
  '<button class="btn btn-ghost" data-esg-op="签发下载">签发下载</button>'+
  '<button class="btn btn-ghost" data-esg-op="安装绑定">安装 / 绑定</button>'+
  '<button class="btn btn-ghost" data-esg-op="续期">续期</button>'+
  '<button class="btn btn-ghost" data-esg-op="吊销">吊销 / 注销</button>'+
  '<button class="btn btn-ghost" data-toast="演示：导入 / 导出证书台账">'+ICON.dl+'<span>导入 / 导出</span></button>'+
  '<button class="btn btn-primary" data-toast="演示：校验全部证书私钥保护状态">校验私钥保护</button></div>'+
  '<div class="table-wrap">'+tblHTML(['证书名称','序列号','主体','颁发者（CA）','有效期','密钥算法','生命周期状态','绑定 / USBKey','操作'],rows,1120)+'</div>'+
  '<div class="demo-note">吊销后进入吊销列表并同步 CRL / OCSP 状态，签章 / 报告即时失效；人员离职或密钥泄露必须立即吊销，避免冒用签章造成合规风险</div>';
}`,it=`// 消安云平台 · 页面分片 extInqHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function extInqHTML(){
 var key=curMenuKey;
 if(key.indexOf('历史')>-1){
  var rows=[
   ['XJ-2609-032','华信管业 · 镀锌钢管 DN100','¥168.0','09-15','已中标',tg('g','已报价')],
   ['XJ-2609-030','天广消防 · 喷淋头','¥30.0','09-14','参与',tg('g','已报价')],
   ['XJ-2609-028','金桥物资 · 沟槽管件','¥120.0','09-12','未中标',tg('gray','历史')]];
  return '<div class="card-bd"><div class="dv-sec">已报价 / 历史报价（供应商仅看己方数据）</div>'+
   '<div class="table-wrap">'+tblHTML(['询价号','内容','报价','时间','结果','状态'],rows,900)+'</div>'+
   '<div class="wb-total"><span>本月报价 12 次 · 中标 4 次</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出报价记录">导出</button></span></div>'+
   '<div class="demo-note">供应商隐藏其他供应商价格、企业成本与利润；仅见己方询价与报价</div></div>';
 }
 var rows=[
  ['XJ-2609-035','镀锌钢管 DN100 · 3,000 m','扫码报价 · 截止 09-18',tg('b','待报价'),OKNO],
  ['XJ-2609-034','喷淋头 ZSTX15 · 600 只','扫码报价 · 截止 09-18',tg('b','待报价'),OKNO],
  ['XJ-2609-033','烟感探测器 · 400 只','扫码报价 · 截止 09-17',tg('o','今日截止'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">待报价询价（供应商微信扫码报价 · 数据自动进系统）</div>'+
  '<div class="table-wrap">'+tblHTML(['询价号','询价内容','说明','状态','操作'],rows,920)+'</div>'+
  '<div class="wb-total"><span>待报价 3 · 已截止 0</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：扫码进入报价">扫码报价</button></span></div>'+
  '<div class="demo-note">二维码只发给企业自有供应商（红圈非公共招采平台）；报价自动沉淀价格库</div></div>';
}`,et=`// 消安云平台 · 页面分片 extOrderHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function extOrderHTML(){
 var key=curMenuKey;
 if(key.indexOf('收货')>-1){
  var rows=[
   ['PO-2609-021','镀锌钢管 DN100','3,000 m','09-18 到货',tg('b','待确认收货'),OKNO],
   ['PO-2609-019','喷淋头 ZSTX15','600 只','09-17 到货',tg('g','已确认'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">送货 / 收货确认（供应商送货 → 我方确认 → 联动 AI 入库）</div>'+
   '<div class="table-wrap">'+tblHTML(['订单号','物料','数量','到货','状态','操作'],rows,880)+'</div>'+
   '<div class="wb-total"><span>待确认 1 · 已确认 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：确认收货">确认收货</button></span></div>'+
   '<div class="demo-note">收货确认后进入 AI 拍照入库 / 验收环节，实收与应收差异自动记录</div></div>';
 }
 var rows=[
  ['PO-2609-021','镀锌钢管 DN100','3,000 m','¥50.4 万','09-18 送货',tg('b','待发货'),OKNO],
  ['PO-2609-019','喷淋头 ZSTX15','600 只','¥1.8 万','09-17 送货',tg('g','已发货'),OKNO],
  ['PO-2609-016','烟感探测器','400 只','¥6.4 万','09-12 送货',tg('g','已完成'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">采购订单（供应商视角 · 按订单送货）</div>'+
  '<div class="table-wrap">'+tblHTML(['订单号','物料','数量','金额','送货日期','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>待发货 1 · 已发货 1 · 已完成 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：确认发货">确认发货</button></span></div>'+
  '<div class="demo-note">供应商按订单送货，携带手写 / 电子送货单，配合我方 AI 拍照入库</div></div>';
}`,dt=`// 消安云平台 · 页面分片 extSettleHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function extSettleHTML(){
 var key=curMenuKey;
 if(key.indexOf('结算单')>-1){
  var rows=[
   ['JS-2609-008','华信管业','3 月材料款','¥168,000',tg('b','待我方确认'),OKNO],
   ['JS-2609-006','天广消防','2 月材料款','¥86,400',tg('g','已确认'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">结算单（供应商提交 · 我方对账确认）</div>'+
   '<div class="table-wrap">'+tblHTML(['结算单','供应商','期间','金额','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>待确认 1 · 已确认 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看结算明细">查看明细</button></span></div>'+
   '<div class="demo-note">结算单与订单 / 入库 / 发票三单匹配，确认后进入付款流程</div></div>';
 }
 if(key.indexOf('发票')>-1){
  var rows=[
   ['SR-2609-008','华信管业','¥168,000','已匹配采购合同',tg('b','待确认'),OKNO],
   ['SR-2609-006','天广消防','¥86,400','已匹配',tg('g','已挂接'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">收票 / 发票确认（供应商开票 → 系统匹配挂接）</div>'+
   '<div class="table-wrap">'+tblHTML(['收票单','供应商','金额','匹配','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>待确认 1 · 已挂接 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：确认挂接">确认挂接</button></span></div>'+
   '<div class="demo-note">收票按销售方 / 名称 / 金额 / 项目匹配，缺票项影响付款审批</div></div>';
 }
 var rows=[
  ['DZ-2609-005','华信管业','3 月材料对账','¥168,000',tg('b','待确认'),OKNO],
  ['DZ-2609-003','天广消防','2 月材料对账','¥86,400',tg('g','已确认'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">对账单（供应商对账 · 差异处理）</div>'+
  '<div class="table-wrap">'+tblHTML(['对账单','供应商','期间','金额','状态','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>待确认 1 · 已确认 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出对账单">导出</button></span></div>'+
  '<div class="demo-note">对账差异（数量 / 单价 / 金额）自动标注，确认后生成结算单</div></div>';
}
/* ===== 波次C3 知识考试 ===== */`,rt=`// 消安云平台 · 页面分片 fhSignHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function fhSignHTML(){
 var fh=[['FH-2609-08','供应商送货单','ZX-2609-01（管网）','镀锌钢管 DN100 · 2,000m','金桥物资','09-15 14:20','已签收',tg('g','已入库')],['FH-2609-07','供应商送货单','ZX-2609-02（喷淋）','喷淋头 ZSTX15 · 1,200 只','天广消防','09-15 10:05','已签收',tg('g','已入库')],['FH-2609-06','我方交付清单','销售合同 XS-2609-18','XX医院二期消防设备交付','我方工程部','09-14 16:30','已签收',tg('b','业主签收')],['FH-2609-05','供应商送货单','ZX-2609-03（报警）','点型烟感 · 300 只','安泰电子','09-16 09:10','运输中',tg('o','待签收')]].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+tagHtml(r[1],'blue')+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td></tr>'}).join('');
 var qs=[['QS-2609-12','FH-2609-08','王强','09-15 15:10','2,000m ✓','外观 / 3C 合格','合格',tg('b','关联 AI 入库 RK-2609-31')],['QS-2609-11','FH-2609-07','王强','09-15 11:20','1,200 只 ✓','喷头爆破试验报告齐全','合格',tg('b','关联 AI 入库 RK-2609-30')],['QS-2609-10','FH-2609-06','XX医院物业（赵工）','09-14 17:40','消防设备 1 批 ✓','到货清单核对一致','业主验收通过',tg('b','交付节点已确认')],['QS-2609-09','FH-2609-04','李敏','09-13 09:30','800 只（应收 1,000）','2 箱破损','让步接收（已审批）',tg('o','待补货 200 只')]].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],r[6]==='合格'||r[6]==='业主验收通过'?'green':(r[6].indexOf('让步')>-1?'orange':'red'))+'</td><td>'+r[7]+'</td></tr>'}).join('');
 return '<div class="wb-top"><b>履约与发货签收：</b>发货单 / 送货单与签收 / 验收单<b>不是新合同类型</b>，而是合同履约、验收、入库、结算的依据单据；供应商送货单（采购侧）或我方交付清单（销售侧）→ 现场签收 / 验收 → 关联 AI 拍照入库、批次二维码、结算</div>'+
 '<div class="metrics"><div class="metric"><div class="m-label">待签收</div><div class="m-num">1 单</div><div class="m-sub">FH-2609-05 运输中</div></div><div class="metric"><div class="m-label">今日签收</div><div class="m-num">3 单</div><div class="m-sub">验收合格 2 · 让步接收 1</div></div><div class="metric"><div class="m-label">关联 AI 入库</div><div class="m-num">2 单</div><div class="m-sub">OCR 识别量价已入价格库</div></div></div>'+
 '<div class="dv-sec">发货单 / 送货单（供应商送货 · 我方交付）</div>'+
 '<div class="table-wrap">'+tblHTML(['单据编号','类型','关联合同','货物明细','供应商 / 交付方','时间','签收状态','入库状态'],fh,1240)+'</div>'+
 '<div class="dv-sec">签收单 / 验收单（数量 · 质量验收 · 现场照片）</div>'+
 '<div class="table-wrap">'+tblHTML(['签收单','关联发货单','签收人','签收时间','数量验收','质量验收','验收结果','关联单据'],qs,1240)+'</div>'+
 '<div class="mat-opbar"><span class="opb-title">签收 / 验收是 AI 拍照入库的前置证明：不合格触发退货 / 待退 / 索赔，合格后进入库存与结算</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：新建发货 / 送货单">新建发货单</button><button class="btn btn-ghost" data-toast="演示：登记签收并拍照上传">登记签收</button><button class="btn btn-primary" data-toast="演示：跳转 AI 拍照入库关联本单">AI 拍照入库</button></div>'+
 '<div class="demo-note">销售侧：我方交付清单 + 业主 / 物业验收确认；采购侧：供应商送货单 + 驻场人员签收；两者都是结算与对账的重要凭证</div>';
}`,ot=`// 消安云平台 · 页面分片 followHTML —— 跟进记录 / 拜访总结（动态数据源 __FOLLOW，客户 360 同源）
function followHTML(){
 var fws=clientFollows('');
 var rows=fws.map(function(f){return '<tr><td>'+f.d+'</td><td>'+f.who+'</td><td>'+tagHtml(f.mode,f.mode==='电话'?'blue':'green')+'</td><td>'+clName(f.cid)+' · '+f.cid+'</td><td>'+f.note+'</td><td>'+tagHtml('正常','green')+'</td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>'+fws.length+'</b></div><div class="pill">电话跟进 <b>'+fws.filter(function(f){return f.mode==='电话'}).length+'</b></div><div class="pill">上门拜访 <b>'+fws.filter(function(f){return f.mode==='拜访'}).length+'</b></div><div class="pill">待跟进提醒 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>跟进人：全部</option>'+['李敏','王强','郑洁','孙倩','周凯'].map(function(w){return '<option>跟进人：'+w+'</option>'}).join('')+'</select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09-01 ~ 09-16</span><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap"><div class="gm-tblw"><table class="gm-tb" style="min-width:1080px"><thead><tr><th>日期</th><th>跟进人</th><th>方式</th><th>客户 / 联系人</th><th>沟通总结（支持拍照附件）</th><th>状态</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
 '<div class="demo-note">电话 / 拜访总结可拍照留痕，形成客户 360° 跟进记录，便于接手人还原历史沟通；推进商机时自动追加记录</div>';
}
`,lt=`// 消安云平台 · 页面分片 frameHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function frameHTML(){
 var subs=[
  ['ZD-2609-12','XX产业园喷淋系统工程','¥96.40 万','框架价 -2%',tg('b','履约中'),'已收 2 批','8月已对账','查看明细'],
  ['ZD-2609-09','XX学校宿舍喷淋改造','¥38.90 万','框架价 -2%',tg('o','待收货'),'—','—','查看明细'],
  ['ZD-2608-21','XX医院门诊楼报警系统','¥29.60 万','框架价 -2%',tg('g','已完结'),'3 批已收','已对账结清','查看明细'],
  ['ZD-2608-11','XX商业广场防排烟','¥52.10 万','框架价 -2%',tg('g','已完结'),'2 批已收','已对账结清','查看明细']];
 return '<div class="card-bd">'+
  '<div class="dt-card" style="margin-bottom:12px">'+
  '<div class="dt-sec"><h4>框架合同</h4><div class="kvg"><div class="kv-row"><span>编号</span><b>GK-2606-01</b></div><div class="kv-row"><span>对方单位</span><b>XX集团采购中心</b></div></div></div>'+
  '<div class="dt-sec"><h4>框架条款</h4><div class="kvg"><div class="kv-row"><span>框架总额</span><b>¥2,000 万</b></div><div class="kv-row"><span>有效期</span><b>2026-01-01 ~ 12-31</b></div></div></div>'+
  '<div class="dt-sec"><h4>继承规则</h4><div class="kvg"><div class="kv-row"><span>税率 / 账期</span><b>13% · 月结 60 天</b></div><div class="kv-row"><span>价格</span><b>签订期信息价下浮 2%</b></div></div></div>'+
  '<div class="dt-sec"><h4>执行进度</h4><div style="margin-top:6px"><div class="pbar"><i style="width:62%"></i></div><div class="kb-pct">已执行 ¥1,240 万 · 62%（4 个子订单）</div></div></div>'+
  '</div>'+
  '<div class="dv-sec">子订单（自动继承主合同价格、税率、付款条款）</div>'+
  tblHTML(['子订单号','对应项目','订单金额','价格','状态','收货','对账','操作'],subs,820)+
  '<div class="dv-sec" style="margin-top:12px">年度指标 vs 累计结算（框架 GK-2606-01 · 2026）</div>'+
  '<div class="table-wrap" style="margin-top:8px">'+tblHTML(['品类 / 子项','年度框架指标','累计下单','累计结算','完成率','对账状态'],[
   ['管网材料','¥800 万','¥512 万','¥498 万','64%',tg('g','已对账 8 月')],
   ['喷淋材料','¥500 万','¥298 万','¥281 万','60%',tg('g','已对账 8 月')],
   ['报警设备','¥400 万','¥246 万','¥238 万','62%',tg('y','8 月对账中')],
   ['辅材 / 备件','¥300 万','¥184 万','¥172 万','61%',tg('b','待对账')]],760)+'</div>'+
  '<div class="demo-note" style="margin-top:8px">框架子合同按工作量 / 进度结算：每笔子订单金额可低于框架价（-2%），累计结算对年度指标实时对比，支撑区域框架采购计划</div>'+
'<div class="wb-total" style="margin-top:12px"><span>子订单可关联订单 / 收货 / 对账；点「查看主合同累计」回看框架总执行</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-act="衍生子订单 / 子合同">+ 衍生子订单</button> <button class="mini-btn mini-no" data-act="查看主合同累计">查看主合同累计</button></span></div>'+
  '</div>';
}`,ct=`// 消安云平台 · 页面分片 funnelHTML —— 商机与漏斗（O1 阶段推进 / O2 报价贯通 / O3 动态漏斗）
function funnelHTML(){
 var sum=OPP.reduce(function(a,o){return a+o.amt},0);
 var idx=function(s){return OPP_STAGES.indexOf(s)};
 var at=function(stage,fromIdx){return OPP.filter(function(o){return idx(o.stage)>=fromIdx}).length};
 var quoteN=at('报价',idx('报价')), quoteAfter=at('投标',idx('投标')), winN=OPP.filter(function(o){return o.stage==='中标/签约'||o.result==='赢单'}).length;
 var conv=quoteN>0?Math.round(quoteAfter/quoteN*100):0;
 var bidBase=OPP.filter(function(o){return idx(o.stage)>=idx('投标')}).length;
 var winRate=bidBase>0?Math.round(winN/bidBase*100):0;
 var funnelBar=OPP_STAGES.map(function(s){var n=OPP.filter(function(o){return o.stage===s}).length;return '<div class="fl-col'+(n?'' :'')+'"><b>'+s+'</b><span>'+n+' 个</span></div>'}).join('');
 var rows=OPP.map(function(o){var qs=LINK_QUOTES.filter(function(q){return q.oid===o.id});
  return '<tr><td>'+o.id+'</td><td><span class="link-btn" data-opid="'+o.id+'" style="cursor:pointer">'+o.name+'</span></td><td>'+clName(o.cid)+'</td><td>'+tagHtml(o.stage,o.stage==='投标'||o.stage==='报价'?'yellow':o.stage==='勘察/方案'?'blue':'green')+'</td><td class="rt num">¥'+o.amt+' 万</td><td>'+o.owner+'</td><td>'+o.next+'</td><td>'+(o.days>=3?tagHtml(o.days+' 天未跟进','red'):tagHtml(o.days+' 天','green'))+'</td><td>'+(o.result?tagHtml(o.result,o.result==='赢单'?'green':o.result==='输单'?'red':'gray'):'—')+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-opp="'+o.id+'" data-act="阶段推进">推进</button><button class="mini-btn mini-no" data-opp="'+o.id+'" data-act="分支结果">分支结果</button>'+(qs.length?'<button class="mini-btn mini-no" data-quote="'+qs[0].id+'">报价 '+qs.length+'</button>':'<button class="mini-btn mini-no" data-toast="该商机暂无报价单，可在报价台账新建">报价 0</button>')+'</span></td></tr>'}).join('');
 var tl=['#2f6bff','#4f7bff','#6c8dff','#8fa6ff','#b3c2ff','#16a34a'];
 return '<div class="metrics"><div class="metric"><div class="m-label">商机总数</div><div class="m-num">'+OPP.length+' 个</div><div class="m-sub">在途金额 ¥'+sum+' 万</div></div><div class="metric"><div class="m-label">商机金额</div><div class="m-num">¥'+sum+' 万</div><div class="m-sub">平均 ¥'+(OPP.length?Math.round(sum/OPP.length):0)+' 万</div></div><div class="metric"><div class="m-label">报价→投标转化</div><div class="m-num">'+conv+'%</div><div class="m-sub">'+quoteAfter+'/'+quoteN+' 个报价进入投标</div></div><div class="metric"><div class="m-label">赢单率</div><div class="m-num">'+winRate+'%</div><div class="m-sub">'+winN+'/'+bidBase+' 个投标阶段赢单</div></div></div>'+
 '<section class="card"><div class="card-h"><span class="ic blue"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></span><h3>销售漏斗 · 按阶段</h3><span class="more">按团队 / 时间</span></div><div class="card-b"><div class="funnel">'+OPP_STAGES.map(function(s,i){var n=OPP.filter(function(o){return o.stage===s}).length;return '<div class="fl-col"><b>'+s+'</b><span>'+n+' 个</span><span class="fb" style="height:4px;border-radius:99px;background:#eef1f6;width:100%;overflow:hidden;margin-top:4px"><i style="display:block;height:100%;width:'+(OPP.length?Math.round(n/OPP.length*100):0)+'%;background:'+tl[i]+'"></i></span></div>'}).join('')+'</div></div></section>'+
 '<section class="card"><div class="card-h"><span class="ic amber"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><h3>最近推进记录</h3><span class="more" data-toast="演示：查看全部推进日志">全部日志</span></div><div class="card-b"><div class="gm-tblw"><table class="gm-tb" style="min-width:760px"><thead><tr><th>时间</th><th>商机</th><th>阶段</th><th>操作人</th><th>说明</th></tr></thead><tbody>'+oppLog().slice(0,3).map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+tagHtml(r[2],r[2]==='报价'?'yellow':r[2]==='投标'?'red':'blue')+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td></tr>'}).join('')+'</tbody></table></div></div></section>'+
 '<section class="card"><div class="card-h"><span class="ic green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg></span><h3>商机列表</h3><span class="more"><button class="btn btn-primary" style="padding:5px 12px;font-size:12.5px" data-new="商机">'+ICON.plus.replace('class="ic"','class="ic" style="width:12px;height:12px"')+'<span>新建商机</span></button></span></div><div class="card-b"><div class="gm-tblw"><table class="gm-tb" style="min-width:1180px"><thead><tr><th>商机编号</th><th>商机名称</th><th>客户</th><th>阶段</th><th class="rt">金额</th><th>负责人</th><th>下一步</th><th>未跟进</th><th>结果</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></section>'+
 '<div class="demo-note">漏斗与转化率按商机当前阶段实时计算 · 推进走自定义里程碑（可配置）· 报价按钮直达报价单详情，报价台账与商机同源</div>';
}
`,pt=`// 消安云平台 · 页面分片 inbAcceptDrawer —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function inbAcceptDrawer(id){
 closeMatDrawer();
 var root=document.createElement('div');root.id='matDrawerRoot';
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:760px">'+
  '<div class="drawer-hd"><h2>入库验收 · '+id+'</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="dt-head"><div class="dt-head-t">收货信息</div><div class="dt-head-g">'+
    '<div class="k-pair"><span class="hi">供应商</span><span class="hv">华信管业</span></div>'+
    '<div class="k-pair"><span class="hi">采购合同 / 订单</span><span class="hv">ZC-2609-08</span></div>'+
    '<div class="k-pair"><span class="hi">关联项目</span><span class="hv">XX产业园喷淋系统</span></div>'+
    '<div class="k-pair"><span class="hi">入库仓库</span><span class="hv">项目现场库 · 主仓 A</span></div>'+
    '<div class="k-pair"><span class="hi">到货日期</span><span class="hv">2026-09-17</span></div>'+
    '<div class="k-pair"><span class="hi">送货单号</span><span class="hv">送货单 SH-2609-21（AI 已识别）</span></div>'+
   '</div></div>'+
   '<div class="dv-sec">验收明细（应收 vs 实收 · 质检）</div>'+
   tblHTML(['材料 / 规格','应收数量','实收数量','合格','不合格','质检结果','单价','差异'],[
    ['WL-0101 镀锌钢管 DN100','3,200 m','3,200 m','3,200','0',tg('g','外观 / 规格合格'),'¥162.0','—'],
    ['WL-0232 喷淋头 ZSTX15','8,600 只','8,590 只','8,590','10',tg('y','10 只破损 · 待退'),'¥30.8','短缺 10 只']],720)+
   '<div class="dv-sec">消防专项质检（进场资质）</div>'+
   tblHTML(['检查项','结果','附件'],[
    ['3C 认证','3C-XXXXX · 已核验',tg('g','已上传 PDF')],
    ['型式检验报告',tg('y','2027-03 到期（90 天预警）'),tg('g','已上传 PDF')],
    ['产品合格证','与批次一致',tg('g','已上传 PDF')],
    ['外观 / 规格 / 压力等级','抽检 5% · 合格',tg('g','现场照片 4 张')]],720)+
   '<div class="dv-sec">异常处理</div><div class="kvg">'+
    '<div class="kv-row"><span>不合格部分</span><b>喷淋头 10 只 → '+tg('y','待退（供应商换货）')+'</b></div>'+
    '<div class="kv-row"><span>超量 / 超价</span><b>镀锌钢管数量超申请 '+tg('r','+6.7%')+' → 触发变更 / 签证流程</b></div>'+
    '<div class="kv-row"><span>让步接收</span><b>无</b></div>'+
    '<div class="kv-row"><span>验收人</span><b>李仓管 · 项目经理 王强（待确认）</b></div></div>'+
  '</div>'+
  '<div class="drawer-ft">'+
   '<button class="btn btn-ghost" data-drawer-close>退回修改</button>'+
   '<button class="btn btn-ghost" data-toast="演示：生成退货 / 待退单（10 只喷淋头）">生成退货单</button>'+
   '<button class="btn btn-primary" data-inb-ok="1">'+ICON.check+'<span>验收通过 · 上架入库</span></button>'+
  '</div></div>';
 document.body.appendChild(root);
}`,vt=`// 消安云平台 · 页面分片 inboundHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function inboundHTML(){
 var act=function(id,extra){return '<span class="ti-acts"><button class="mini-btn mini-no" data-toast="演示：入库单 '+id+' 详情 — 穿透项目 / 供应商 / 合同 / 发票 / 付款">详情</button>'+(extra==='ac'?'<button class="mini-btn mini-ok" data-inb-accept="'+id+'">验收</button>':extra==='sh'?'<button class="mini-btn mini-no" data-toast="演示：选择库位后上架，生成批次二维码">上架</button>':extra==='ln'?'<button class="mini-btn mini-no" data-toast="演示：关联到成本清单项后销项">关联成本项</button>':'')+'<button class="mini-btn mini-no" data-toast="演示：打印批次二维码">打印二维码</button><button class="mini-btn mini-no" data-toast="演示：更多（红冲 / 批量审核）">更多</button></span>'};
 var rows=[
  ['RK-2609-31','XX产业园喷淋系统','华信管业','ZC-2609-08','项目现场仓','WL-0101 镀锌钢管 DN100（PC-2609-05）','3,200 m · ¥162.0 · ¥51.84 万','12,000 / ¥168','3,200 / ¥162',tg('y','超量待核'),tg('o','待收货'),act('RK-2609-31','ac')],
  ['RK-2609-30','XX医院二期消防','天广消防','CG-2609-05','主仓 A','WL-0232 喷淋头 ZSTX15（PC-2609-04）','8,600 只 · ¥30.8 · ¥26.49 万','8,600 / ¥32.4','8,600 / ¥30.8',tg('g','正常'),tg('b','已验收待上架'),act('RK-2609-30','sh')],
  ['RK-2609-28','XX大厦维保','海湾代理','PO-2609-02','维保备件库','WL-0455 点型烟感 JTY-GD-3000（PC-2609-03）','1,200 只 · ¥82.0 · ¥9.84 万','1,240 / ¥92.9','1,200 / ¥86',tg('g','正常'),tg('g','已入库'),act('RK-2609-28','')],
  ['RK-2609-27','XX物流园智慧消防','安泰电子','CG-2609-06','项目现场库','WL-0688 防火卷帘 双轨双帘（PC-2609-02）','420 ㎡ · ¥632.0 · ¥26.54 万','420 / ¥620','430 / ¥586',tg('r','超价 +7.9%'),tg('r','异常 · 拒收'),act('RK-2609-27','ac')],
  ['RK-2609-26','XX产业园喷淋系统','金桥物资','CG-2609-04','主仓 A','WL-0917 耐火电缆 NH-RVS（PC-2609-01）','800 m · ¥12.5 · ¥1.00 万','—','800 / ¥12.8',tg('g','正常'),tg('g','已审核'),act('RK-2609-26','')],
  ['RK-2609-25','XX医院二期消防','正泰消防','无合同（先发生后关联）','维保备件库','WL-0803 灭火器 MFZ/ABC4（PC-2608-24）','120 具 · ¥63.5 · ¥0.76 万','—','—',tg('y','未关联预算'),tg('y','待关联成本项'),act('RK-2609-25','ln')],
  ['RK-2609-21','XX学校宿舍喷淋','华信管业','ZC-2608-19','主仓 A','WL-0158 沟槽管件 DN100（PC-2608-21）','180 件 · ¥120.0 · ¥2.16 万','200 / ¥118','180 / ¥120',tg('g','正常'),tg('g','已入库'),act('RK-2609-21','')],
  ['RK-2609-18','XX产业园喷淋系统','华信管业','ZC-2608-12（红冲）','主仓 A','WL-0101 镀锌钢管 DN100（PC-2608-18）','-200 m · ¥162.0 · -¥3.24 万','—','—',tg('gray','红冲'),tg('gray','已红冲'),act('RK-2609-18','')]];
 return '<div class="card-bd">'+
  '<div class="wb-top"><b>采购入库流程：</b>采购合同 / 订单 → AI 拍照 / 手工收货 → 验收（数量 · 消防 3C · 单据）→ 上架批次 → 库存增加 → 成本归集 → 价格库沉淀　<b>风控：</b>超量超价红灯触发变更 / 扣款 · 先发生后关联销项 · 订单-入库-发票三单匹配</div>'+
  '<div class="fbar"><select><option>项目：全部</option><option>XX产业园</option><option>XX医院</option><option>XX物流园</option><option>XX大厦维保</option></select><select><option>仓库：全部</option><option>公司库</option><option>项目现场库</option><option>维保备件库</option></select><select><option>供应商：全部</option><option>华信管业</option><option>金桥物资</option><option>海湾代理</option></select><select><option>关联合同 / 订单：全部</option><option>有合同 / 订单</option><option>无合同（先发生后关联）</option></select><select><option>单据状态：全部</option><option>待收货</option><option>已验收待上架</option><option>已入库</option><option>异常</option></select><select><option>超量超价：全部</option><option>超量</option><option>超价</option><option>正常</option></select><input class="fkw" placeholder="入库单号 / 材料关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
  '<div class="mat-opbar"><span class="opb-title">共 <b>8</b> 张入库单 · 待验收 2 · 异常 1 · 未关联 1</span><span style="flex:1"></span>'+
  '<button class="btn btn-ghost" data-inb-new="ai">'+ICON.cam+'<span>AI 拍照入库</span></button>'+
  '<button class="btn btn-ghost" data-toast="演示：从采购合同 / 订单生成入库单">'+ICON.plus+'<span>从订单生成</span></button>'+
  '<button class="btn btn-ghost" data-toast="演示：批量审核（勾选多行）">批量审核</button>'+
  '<button class="btn btn-ghost" data-toast="演示：批量关联成本项">批量关联成本项</button>'+
  '<button class="btn btn-ghost" data-toast="演示：导入 / 导出 Excel">'+ICON.dl+'<span>导入 / 导出</span></button>'+
  '<button class="btn btn-primary" data-toast="演示：打印 / 导出 PDF">打印</button></div>'+
  '<div class="table-wrap">'+tblHTML(['入库单号','关联项目','供应商','关联合同 / 订单','仓库','材料 · 批次','数量 · 单价 · 金额','预算量价','合同量价','超量超价','状态','操作'],rows,980)+'</div>'+
  '<div class="demo-note">点击单号 / 供应商 / 合同可循环穿透；验收通过后生成批次二维码并增加库存，入库量价写入成本清单项（六行对比），入库价沉淀价格库</div>';
}`,ut=`// 消安云平台 · 页面分片 initCItems —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function initCItems(){
 CITEMS=[
  {id:'01',name:'消防水系统',parent:true,spec:'—',unit:'—',qty:null,price:null,ctrl:'—'},
  {id:'01-01',name:'├ 镀锌钢管（管网）',spec:'DN100',unit:'m',qty:12000,price:164.0,ctrl:'量价双控'},
  {id:'01-02',name:'├ 喷淋头',spec:'ZSTX15 68℃',unit:'只',qty:8600,price:30.0,ctrl:'量价双控'},
  {id:'02',name:'消防电系统',parent:true,spec:'—',unit:'—',qty:null,price:null,ctrl:'—'},
  {id:'02-01',name:'├ 点型烟感',spec:'JTY-GD-3000',unit:'只',qty:1240,price:86.0,ctrl:'仅控量'}
 ];
 CITEMLOG=[['V2','镀锌钢管单价 166.0 → 164.0（李敏）','2026-09-05']];
}`,bt=`// 消安云平台 · 页面分片 inqSumHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function inqSumHTML(){
 var rows=INQ.map(function(q){return '<tr><td>'+q.id+'</td><td><b>'+q.name+'</b></td><td>'+q.qty.toLocaleString()+' '+q.unit+'</td><td>'+q.bids.length+' 家</td><td>¥'+Math.min.apply(null,q.bids.map(function(b){return b[1]})).toLocaleString()+'</td><td>¥'+Math.max.apply(null,q.bids.map(function(b){return b[1]})).toLocaleString()+'</td><td>'+q.bids.map(function(b){return b[0]+' ¥'+b[1]}).join(' / ')+'</td><td>'+tagHtml(q.status,q.status==='已汇总'?'green':'yellow')+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-toast="演示：最低价沉淀价格库">沉淀价格</button></span></td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">进行中询价</div><div class="m-num">1 份</div><div class="m-sub">XJ-2609-03 报价中</div></div><div class="metric"><div class="m-label">本月询价单</div><div class="m-num">3 份</div><div class="m-sub">8 家供应商参与</div></div><div class="metric"><div class="m-label">沉淀价格库</div><div class="m-num">2 条</div><div class="m-sub">二维码询价 → 价格库</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>竞价排名（镀锌钢管 DN100 · XJ-2609-05）</h3><div class="right"><span class="link-btn" data-toast="演示：扫码报价后自动汇总">刷新汇总</span></div></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['排名','供应商','报价(元/m)','较最低价','状态'],INQ[0].bids.map(function(b,i){return '<tr><td>'+tagHtml('第'+(i+1)+'名',i===0?'green':i===1?'yellow':'blue')+'</td><td><b>'+b[0]+'</b></td><td>¥'+b[1]+'</td><td>'+(i===0?'—':'+¥'+(b[1]-INQ[0].bids[0][1])+' ('+Math.round((b[1]-INQ[0].bids[0][1])/INQ[0].bids[0][1]*100)+'%)')+'</td><td>'+tagHtml('有效','green')+'</td></tr>'}).join(''),760)+'</div></div></section>'+
 '<section class="card"><div class="card-hd"><h3>询价单汇总</h3></div><div style="padding:16px">'+tblHTML(['询价单','材料','数量','参与家数','最低价','最高价','报价明细','状态','操作'],rows,1080)+'</div></section>'+
 '<section class="card"><div class="card-hd"><h3>供应商报价记录（并入 · 原独立页）</h3></div><div style="padding:16px">'+tblHTML(['供应商','供应材料','单位','最新报价','最高 / 最低','最近来源','状态'],[
  ['安泰电子','镀锌钢管 DN100','m','¥162','¥165 / ¥158','09-15 询价',tg('g','合作中')],
  ['鑫源钢贸','镀锌钢管 DN100','m','¥158','¥160 / ¥155','08-20 合同',tg('g','合作中')],
  ['天广消防','喷淋头 ZSTX15','只','¥30','¥32 / ¥28','09-14 询价',tg('g','合作中')],
  ['海湾代理','点型烟感','只','¥86','¥88 / ¥80','08-10 合同',tg('g','合作中')],
  ['安泰电子','防火卷帘 双轨双帘','㎡','¥620','¥630 / ¥615','09-01 成交',tg('g','合作中')]],960)+'</div></section>'+
 '<div class="demo-note">采购生成询价二维码 → 供应商微信扫码报价 → 自动汇总最高 / 最低价与竞价排名并沉淀价格库（企业自有供应商）；同一材料多家比价，报价 / 成交价沉淀价格库，供报价与成本测算引用</div>';
}`,gt=`// 消安云平台 · 页面分片 invLibHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function invLibHTML(){
 var rows=[
  ['FP-2609-091','销项 · 消防泵维修','¥8,500','XX大厦',tg('g','已开票'),'09-16'],
  ['FP-2609-090','进项 · 管材采购','¥168,000','华信管业',tg('g','已收票'),'09-15'],
  ['FP-2609-088','销项 · 维保年费','¥92,000','XX产业园',tg('b','待开票'),'09-15'],
  ['FP-2609-085','进项 · 喷淋头','¥31,200','金桥物资',tg('o','待收票'),'09-12'],
  ['FP-2609-082','销项 · 进度款','¥186,000','XX医院',tg('g','已开票'),'09-10']];
 return '<div class="card-bd"><div class="dv-sec">发票台账（销项开票 + 进项收票统一视图）</div>'+
  '<div class="table-wrap">'+tblHTML(['发票号','类型 · 内容','金额','对方','状态','日期','操作'],rows,1020)+'</div>'+
  '<div class="wb-total"><span>本月销项 ¥286,500 · 进项 ¥199,200 · 税负比可查</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出发票台账">导出台账</button></span></div></div>';
}`,mt=`// 消安云平台 · 页面分片 iotAssetHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function iotAssetHTML(){
 var key=curMenuKey;
 if(key.indexOf('孪生')>-1){
  var rows=[
   ['SB-001','感烟探测器 JTY-GD','孪生对象 XW-3F-01','楼层平面图 · 3F','09-10 绑定',tg('g','已绑定'),OKNO],
   ['SB-002','消防泵 1#','孪生对象 XW-B1-01','BIM 模型 · B1','09-08 绑定',tg('g','已绑定'),OKNO],
   ['SB-003','应急照明 B2-06','—','未绑定',tg('o','待绑定'),'—',OKNO]];
  return '<div class="card-bd"><div class="dv-sec">孪生对象绑定（设备 ↔ 3D / BIM 孪生对象 映射管理）</div>'+
   '<div class="table-wrap">'+tblHTML(['设备编号','设备','孪生对象','孪生场景','绑定时间','状态','操作'],rows,1020)+'</div>'+
   '<div class="wb-total"><span>已绑定 2 · 待绑定 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：绑定孪生对象">+ 绑定</button></span></div>'+
   '<div class="demo-note">设备与孪生对象绑定后，实时数据可直接映射到 3D / BIM 场景中展示（联动孪生场景）</div></div>';
 }
 if(key.indexOf('维保关联')>-1){
  var rows=[
   ['SB-001','感烟探测器 3F-18','XX产业园','维保合同 XW-2609-01','年度巡检','09-16',tg('g','正常'),OKNO],
   ['SB-002','消防泵 1#','XX大厦','维保合同 XW-2609-02','季度保养','09-20 计划',tg('b','已排程'),OKNO],
   ['SB-004','防火阀 5F-02','XX医院','改造项目 P-2609-05','未纳入维保',tg('y','关注'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">项目 / 维保关联（设备 → 项目 / 维保合同 归属关系）</div>'+
   '<div class="table-wrap">'+tblHTML(['设备编号','设备','项目','维保合同','服务类型','最近动作','状态','操作'],rows,1080)+'</div>'+
   '<div class="wb-total"><span>已关联维保 2 · 待关联 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：关联维保合同">+ 关联</button></span></div>'+
   '<div class="demo-note">设备归属项目与维保合同后，告警 / 工单自动带出合同与责任人（联动维保值班）</div></div>';
 }
 var rows=[
  ['SB-001','感烟探测器 JTY-GD','3F-18','XX产业园',tg('g','在线'),'09-16 10:30',OKNO],
  ['SB-002','消防泵 1#','B1-01','XX大厦',tg('g','在线'),'09-16 10:30',OKNO],
  ['SB-003','应急照明 B2-06','B2-06','XX商业广场',tg('o','离线'),'09-16 09:12',OKNO],
  ['SB-004','防火阀 5F-02','5F-02','XX医院',tg('g','在线'),'09-16 10:28',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">设备台账 / IoT 点位（设备 · 点位 · 项目 · 在线状态）</div>'+
  '<div class="table-wrap">'+tblHTML(['设备编号','设备','点位','项目','在线状态','最近上报','操作'],rows,1000)+'</div>'+
  '<div class="wb-total"><span>设备 1,286 台 · 在线 1,240 · 离线 46</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：绑定孪生对象">绑定孪生对象</button></span></div>'+
  '<div class="demo-note">设备台账与项目 / 维保关联，IoT 告警可转维保调度工单（联动维保值班）</div></div>';
}`,ft=`// 消安云平台 · 页面分片 iotMonHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function iotMonHTML(){
 var key=curMenuKey;
 if(key.indexOf('转调度工单')>-1){
  var rows=[
   ['GD-2609-009','消防泵 1# 压力低','XX大厦',tg('r','紧急'),'09-14 22:40',tg('g','已转 GD-2609-088'),OKNO],
   ['GD-2609-006','应急照明 B2-06 欠压','XX商业广场',tg('gray','普通'),'09-13 16:20',tg('g','已转 GD-2609-085'),OKNO],
   ['GD-2609-012','点型烟感 3F-18 离线','XX产业园',tg('o','高'),'09-15 09:12',tg('b','待转工单'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">告警转调度工单（IoT 告警一键生成维保工单 · 带出设备点位 / 项目 / 责任人）</div>'+
   '<div class="table-wrap">'+tblHTML(['告警编号','告警内容','项目','级别','时间','转单状态','操作'],rows,1020)+'</div>'+
   '<div class="wb-total"><span>已转 2 · 待转 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量转工单">批量转工单</button></span></div>'+
   '<div class="demo-note">告警转工单后自动派发给片区维保员，工单处理闭环回写告警状态（联动维保值班）</div></div>';
 }
 if(key.indexOf('告警')>-1){
  var rows=[
   ['GD-2609-012','点型烟感 3F-18 离线','XX产业园',tg('o','高'),'09-15 09:12',tg('b','待转工单'),OKNO],
   ['GD-2609-009','消防泵 1# 压力低','XX大厦',tg('r','紧急'),'09-14 22:40',tg('g','已转工单'),OKNO],
   ['GD-2609-006','应急照明 B2-06 欠压','XX商业广场',tg('gray','普通'),'09-13 16:20',tg('g','已转工单'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">告警中心（实时告警 · 转维保调度工单）</div>'+
   '<div class="table-wrap">'+tblHTML(['告警编号','告警内容','项目','级别','时间','转单状态','操作'],rows,1020)+'</div>'+
   '<div class="wb-total"><span>今日告警 4 · 紧急 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量转工单">批量转工单</button></span></div>'+
   '<div class="demo-note">IoT 告警一键转维保调度工单，带出设备点位 / 项目 / 责任人（联动维保值班）</div></div>';
 }
 if(key.indexOf('预测')>-1){
  var rows=[
   ['消防泵 1#','轴承磨损 72%','建议 30 天内保养',tg('o','预警'),OKNO],
   ['烟感 3F-18','离线频率上升','建议更换电池',tg('o','预警'),OKNO],
   ['防火阀 5F-02','开闭响应变慢','建议检查执行器',tg('b','关注'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">预测性维护（设备健康度 · 提前预警）</div>'+
   '<div class="table-wrap">'+tblHTML(['设备','健康分析','建议','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>预警 2 · 关注 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成保养计划">生成保养计划</button></span></div>'+
   '<div class="demo-note">预测性维护基于历史数据评估健康度，提前生成保养计划避免停机</div></div>';
 }
 var rows=[
  ['SB-001 感烟 3F-18','温度 24°C · 烟感正常',tg('g','正常'),'10:30:12'],
  ['SB-002 消防泵 1#','压力 0.62 MPa · 运行中',tg('g','正常'),'10:30:10'],
  ['SB-003 应急 B2-06','电量 12%',tg('r','欠压'),'10:29:58'],
  ['SB-004 防火阀 5F-02','开度 100% · 正常',tg('g','正常'),'10:30:08']];
 return '<div class="card-bd"><div class="dv-sec">实时监测（设备实时状态 · 阈值告警）</div>'+
  '<div class="table-wrap">'+tblHTML(['设备','实时数据','状态','时间'],rows,880)+'</div>'+
  '<div class="wb-total"><span>监测点位 1,286 · 实时刷新 5s</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：刷新实时数据">刷新</button></span></div>'+
  '<div class="demo-note">实时监测数据经 API 接入（IoT 集成），超阈值自动告警并联动工单</div></div>';
}`,wt=`// 消安云平台 · 页面分片 iotReportHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function iotReportHTML(){
 var key=curMenuKey;
 if(key.indexOf('维修记录')>-1){
  var rows=[
   ['SB-002 消防泵 1#','更换控制柜主板','09-14',tg('g','已完成'),OKNO],
   ['SB-001 感烟 3F-18','更换电池','09-12',tg('g','已完成'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">设备维修记录（IoT 设备 · 维修历史）</div>'+
   '<div class="table-wrap">'+tblHTML(['设备','维修内容','日期','状态','操作'],rows,880)+'</div>'+
   '<div class="wb-total"><span>本月维修 8 台</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看维修详情">查看详情</button></span></div>'+
   '<div class="demo-note">设备维修记录与维保工单 / 维修订单联动，形成设备全生命周期档案</div></div>';
 }
 if(key.indexOf('巡检报告')>-1){
  var rows=[
   ['线路一 · XX大厦','消防水系统 12 项检查',tg('g','合格'),'09-15',OKNO],
   ['线路二 · XX医院','喷淋压力不足 · 已转工单',tg('o','异常 1 项'),'09-15',OKNO]];
  return '<div class="card-bd"><div class="dv-sec">巡检报告（IoT 联动巡检 · 报告归档）</div>'+
   '<div class="table-wrap">'+tblHTML(['线路 · 项目','检查内容','结果','日期','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>本月巡检报告 18 份</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：下载巡检报告">下载报告</button></span></div>'+
   '<div class="demo-note">巡检报告自动归档到资料报告工作站，异常项自动生成整改 / 工单</div></div>';
 }
 var rows=[
  ['SB-001 感烟 3F-18','离线 2 次','09-12 · 09-14',tg('b','查看'),OKNO],
  ['SB-002 消防泵 1#','压力告警 1 次','09-14',tg('b','查看'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">设备历史工单（设备维度的工单追溯）</div>'+
  '<div class="table-wrap">'+tblHTML(['设备','工单摘要','日期','操作'],rows,880)+'</div>'+
  '<div class="wb-total"><span>设备关联工单 26 张</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看全部工单">查看全部</button></span></div>'+
  '<div class="demo-note">从设备可穿透其历史工单、维修记录、巡检报告，实现设备全生命周期追溯</div></div>';
}
/* ===== 波次C5 site / bid 补充 ===== */`,ht=`// 消安云平台 · 页面分片 iotSceneHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function iotSceneHTML(){
 var key=curMenuKey;
 if(key.indexOf('点位状态')>-1){
  var rows=[
   ['3F-18','点型感烟 JTY-GD','XX产业园 3F',tg('g','在线'),'10:30:12',OKNO],
   ['B1-01','消防泵 1#','XX大厦 B1',tg('g','运行中'),'10:30:10',OKNO],
   ['B2-06','应急照明','XX商业广场 B2',tg('r','欠压离线'),'10:29:58',OKNO],
   ['5F-02','防火阀','XX医院 5F',tg('g','正常'),'10:30:08',OKNO]];
  return '<div class="card-bd"><div class="dv-sec">设备点位状态（点位 · 设备 · 项目 · 实时状态一览）</div>'+
   '<div class="table-wrap">'+tblHTML(['点位','设备','项目 · 位置','状态','最近上报','操作'],rows,940)+'</div>'+
   '<div class="wb-total"><span>在线 3 · 异常 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：按楼层层级查看">层级查看</button></span></div>'+
   '<div class="demo-note">点位状态与楼层平面图联动：异常点位在孪生场景中高亮，点击转工单</div></div>';
 }
 var rows=[
  ['XX产业园 3F','楼层平面图','烟感 18 · 喷淋 24 · 应急 12',tg('g','全部在线'),OKNO],
  ['XX大厦 B1','B1 平面图','消防泵 2 · 风机 4',tg('g','在线'),OKNO],
  ['XX医院 5F','楼层平面图','防火阀 3 · 应急 8',tg('o','1 点位离线'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">3D / BIM 可视化 · 楼层平面图（设备点位实时状态）</div>'+
  '<div class="table-wrap">'+tblHTML(['场景','类型','点位构成','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>已建孪生场景 6 个</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：打开 3D / BIM 场景">打开 3D 场景</button></span></div>'+
  '<div class="demo-note">楼层平面图展示设备点位实时状态，离线 / 告警点位高亮，点击转工单</div></div>';
}`,yt=`// 消安云平台 · 页面分片 ljHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ljHTML(){
 function block(t,rows){return '<div class="dv-sec">'+t+'</div>'+tblHTML(['环节','数量','单价(元)','合价(万)','与预算偏差','状态','说明'],rows,860)}
 var a=[
  [tg('b','预算量价'),'12,000 m','168.0','201.60','—',tg('gray','基准'),'投标清单'],
  [tg('b','申请量价'),'12,600 m','168.0','211.68',tg('r','+5.0% 数量'),tg('r','超量'),'申请单 CL-2609-12'],
  [tg('b','合同量价'),'12,000 m','164.0','196.80','单价 -4 元',tg('g','正常'),'采购合同 CG-2609-08'],
  [tg('b','入库量价'),'11,800 m','163.2','192.58','-3.8% / -2.9%',tg('g','正常'),'入库单 RK-2609-21'],
  [tg('b','结算量价'),'—','—','—','—',tg('gray','未结算'),'—'],
  [tg('b','支付量价'),'¥163.0 万','—','163.00','按合同 82.8%',tg('y','接近节点'),'付款单 FK-2609-15']];
 var b=[
  [tg('b','预算量价'),'420 ㎡','620.0','26.04','—',tg('gray','基准'),'不平衡报价 · 仅控量'],
  [tg('b','申请量价'),'420 ㎡','620.0','26.04','—',tg('g','正常'),'—'],
  [tg('b','合同量价'),'430 ㎡','586.0','25.20','-3.2%',tg('g','正常'),'数量 +10 ㎡（签证 V-03）'],
  [tg('b','入库量价'),'430 ㎡','588.0','25.28',tg('y','量 +2.4%'),tg('y','关注'),'入库单 RK-2609-18'],
  [tg('b','结算量价'),'—','—','—','—',tg('gray','未结算'),'—'],
  [tg('b','支付量价'),'—','—','—','—',tg('gray','未付款'),'—']];
 return '<div class="card-bd">'+
  '<div class="wb-top"><b>六行量价链路：</b>预算 → 申请 → 合同 → 入库 → 结算 → 支付　<b>控制规则：</b>'+tg('b','量价双控')+tg('g','仅控量')+tg('o','仅控价')+tg('gray','不控')+'<span style="color:var(--t3)">价格变更 / 清单删除自动留痕并增减大项金额</span></div>'+
  block('清单项 A · 镀锌钢管 DN100（XX产业园 · 量价双控）',a)+
  block('清单项 B · 防火卷帘（XX物流园 · 仅控量 / 不平衡报价）',b)+
  '<div class="dv-sec">项目材料成本视图（主材 / 辅材 / 劳务 / 专包）</div>'+
  tblHTML(['分类','预算金额(万)','实际成本(万)','偏差','是否可支付'],[
  ['主材','812.0','786.4',tg('g','-3.2%'),tg('g','可支付')],
  ['辅材','128.0','133.5',tg('y','+4.3%'),tg('y','复核后支付')],
  ['劳务','436.0','452.2',tg('r','+3.7%'),tg('r','暂缓 · 班组扣款核对中')],
  ['专包 / 其他','214.0','209.1',tg('g','-2.3%'),tg('g','可支付')]],720)+
  '</div>';
}`,Tt=`// 消安云平台 · 页面分片 ljSetHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ljSetHTML(){
 var rows=[['消防水系统','镀锌钢管','量价双控','5%','3%','¥150','启用'],['消防水系统','喷淋头','量价双控','5%','3%','¥27','启用'],['消防电系统','点型烟感','仅控量','—','3%','—','启用'],['防排烟系统','防火卷帘','仅控价','5%','—','¥598','启用'],['智慧消防','电能表','不控','—','—','—','停用']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+tagHtml(r[2],r[2]==='量价双控'?'red':'blue')+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],r[6]==='启用'?'green':'blue')+'</td><td><span class="ti-acts"><button class="mini-btn mini-no" data-toast="演示：编辑控制规则">编辑</button></span></td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>5</b></div><div class="pill">量价双控 <b>2</b></div><div class="pill">仅控量 <b>1</b></div><div class="pill">仅控价 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>控制方式：全部</option><option>控制方式：量价双控</option><option>控制方式：仅控量</option><option>控制方式：仅控价</option></select><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['分类','材料','控制方式','超量阈值','超价阈值','参考价','状态','操作'],rows,980)+'</div>'+
 '<div class="demo-note">控制方式：量价双控 / 仅控量 / 仅控价 / 不控；不平衡报价项可设「仅控量不控价」，避免低价中标后无法采购</div>';
}`,kt=`// 消安云平台 · 页面分片 matCertHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function matCertHTML(){
 var rows=[['3C 认证','喷淋头 ZSTX15','天广消防','2026-12-31','剩余 105 天','有效'],['检验报告','镀锌钢管 DN100','正大集团','2027-03-15','有效','有效'],['合格证','点型烟感','海湾','2026-11-20','剩余 64 天','有效'],['消防产品认证','防火卷帘','安泰电子','2026-10-01','剩余 14 天','临期']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+(r[4].indexOf('临期')>-1?tagHtml(r[4],'red'):tagHtml(r[4],'green'))+'</td><td>'+tagHtml(r[5],r[5]==='有效'?'green':'red')+'</td><td><span class="ti-acts"><button class="mini-btn mini-no" data-toast="演示：查看 / 下载资质扫描件">查看</button></span></td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>4</b></div><div class="pill">有效 <b>3</b></div><div class="pill">30 天内临期 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>证件类型：全部</option><option>证件类型：3C 认证</option><option>证件类型：检验报告</option><option>证件类型：合格证</option></select><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['证件类型','关联材料','出具方','到期日','到期提醒','状态','操作'],rows,960)+'</div>'+
 '<div class="demo-note">材料资质文件（3C / 检验报告 / 合格证）到期预警，投标材料包自动抽取有效资质</div>';
}`,Mt=`// 消安云平台 · 页面分片 matOf —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function matOf(mid){return MATERIALS.find(function(x){return x.id===mid})}`,Xt=`/* ============ 菜单合并 V2：Tab 合并页（经营看板 / 商机与漏斗 / 证书台账 / 自动票税 / 资料与报告 / 协同办公 / 系统管理） ============ */
var __MTAB=__MTAB||{};
function mtBar(id){
 var m=MTPAGES[id],i=__MTAB[id]||0;
 var b=m.tabs.map(function(t,k){return '<button class="mtab-btn'+(k===i?' on':'')+'" data-mtab="'+id+'" data-mi="'+k+'">'+t[0]+'</button>'}).join('');
 return '<div class="mtab-bar"><div class="mtab-scroll">'+b+'</div></div>';
}
function mtBody(id){var m=MTPAGES[id],i=__MTAB[id]||0;return m.tabs[i][1]()}
function mtPage(id){
 return '<div class="page"><div class="mtab-wrap"><div class="mtab-hd"><div class="pg-title">'+MTPAGES[id].title+'</div>'+mtBar(id)+'</div><div class="mtab-body">'+mtBody(id)+'</div></div></div>';
}
function certBorrowHTML(){
 var rows=[
  ['注册消防工程师（吴斌）','刘畅','XX体育馆投标','09-14','09-25','—',tg('b','借出中'),tg('b','催还')],
  ['安许证（原件）','孙倩','客户资质报验','09-10','09-16','—',tg('b','借出中'),tg('b','催还')],
  ['营业执照（副本）','周凯','银行保函办理','08-28','09-05','09-04',tg('g','已归还'),tg('gray','查看')],
  ['建造师证 B 证（张伟）','王悦','XX医院投标','09-02','09-12','—',tg('r','逾期 4 天'),tg('o','紧急催还')]];
 var cols=['证书','借出人','用途','借出日期','约定归还','归还日期','状态','操作'];
 return '<div class="page"><div class="page-hd"><div class="pg-title">证书借还与归还</div><div class="pg-acts"><button class="btn btn-ghost" data-act="借出登记">借出登记</button><button class="btn btn-ghost" data-act="导出">导出</button></div></div>'+
 '<div class="card"><div class="card-bd" style="padding:0"><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr></thead><tbody>'+
 rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>'+
 '<div class="pg-foot">共 '+rows.length+' 条 · 10 条/页 · 第 1/1 页</div></div>';
}
var MTPAGES={
 bizboardt:{title:'经营看板',tabs:[['组合看板',bizBoardHTML],['老板驾驶舱',bizBossHTML],['经营报表',bizReportHTML]]},
 bizapprt:{title:'审批与洞察',tabs:[['待我审批',bizApprHTML],['智能业务洞察记录',bizInsightHTML]]},
 oppfunnelt:{title:'商机与漏斗',tabs:[['商机 / 销售漏斗',funnelHTML],['商机阶段推进',oppstageHTML],['销售指标',saleHTML]]},
 certledgert:{title:'证书台账',tabs:[['证书列表',bidCertHTML],['到期预警',certDashHTML],['借还与归还',certBorrowHTML]]},
 autotaxt:{title:'自动票税',tabs:[['自动开票任务',autoInvHTML],['自动收票挂接',autoRecvHTML]]},
 outboundt:{title:'出库与领用归还',tabs:[['出库 / 领用',outboundHTML],['归还 / 报废',returnScrapHTML]]},
 docarcht:{title:'资料归档',tabs:[['里程碑资料目录',docTreeHTML],['缺失提醒',docMissHTML],['智能归档',docArchHTML],['工程 / 财务审核',docAuditHTML]]},
 docrept:{title:'消防报告',tabs:[['报告模板',repTplHTML],['报告生成',repGenHTML],['报告下载',repDownHTML],['电子签',esigHTML]]},
 docacct:{title:'验收交付',tabs:[['验收资料',acceptDocHTML],['标准验收单',acceptStdHTML],['交付物料包',deliverPackHTML]]},
 oadoct:{title:'公告与收发文',tabs:[['公告',oaNoticeHTML],['收发文',oaDocHTML]]},
 oacart:{title:'用车与日程',tabs:[['用车申请',oaCarHTML],['日程',oaCalHTML]]},
 oamsgt:{title:'待办与消息中心',tabs:[['待办中心',oaDoneHTML],['消息通知',oaMsgHTML]]},
 eduknowt:{title:'知识库',tabs:[['企业 / 行业知识',eduKnowHTML],['故障库',eduFaultHTML],['价格库',priceLibHTML]]},
 sysorgt:{title:'组织与权限',tabs:[['组织人员',sysOrgHTML],['角色权限',sysRoleHTML],['租户管理',sysTenantHTML]]},
 sysmarkett:{title:'模块与计费',tabs:[['模块市场',sysMarketHTML],['租户计费 / 版本',sysBillHTML]]},
 sysapit:{title:'集成与运维',tabs:[['API 集成',sysApiHTML],['PaaS 低代码配置',sysPaasHTML],['安全日志',sysLogHTML],['数据备份',sysBackupHTML]]}
};
function bizboardt(){return mtPage('bizboardt')}
function bizapprt(){return mtPage('bizapprt')}
function oppfunnelt(){return mtPage('oppfunnelt')}
function certledgert(){return mtPage('certledgert')}
function autotaxt(){return mtPage('autotaxt')}
function outboundt(){return mtPage('outboundt')}
function docarcht(){return mtPage('docarcht')}
function docrept(){return mtPage('docrept')}
function docacct(){return mtPage('docacct')}
function oadoct(){return mtPage('oadoct')}
function oacart(){return mtPage('oacart')}
function oamsgt(){return mtPage('oamsgt')}
function eduknowt(){return mtPage('eduknowt')}
function sysorgt(){return mtPage('sysorgt')}
function sysmarkett(){return mtPage('sysmarkett')}
function sysapit(){return mtPage('sysapit')}

/* ---- 2026-09-18 菜单合并 V3（合同成本 + 采购仓储）：原数据配置页静态化后入 Tab ---- */
function costTplHTML(){
 var rows=[
  ['销售合同标准模板（2026）','销售 / 收入','工程合同','V5','38','09-10',tg('b','使用')],
  ['采购合同标准模板（2026）','采购 / 支出','材料 / 劳务','V4','26','09-08',tg('b','使用')],
  ['维保合同模板（年度）','销售 / 收入','维保合同','V3','19','09-05',tg('b','使用')],
  ['框架合同 + 子订单模板','采购 / 支出','框架合同','V2','8','08-28',tg('b','使用')],
  ['分包合同模板（含扣款条款）','采购 / 支出','劳务分包','V2','12','08-20',tg('b','使用')]];
 return '<div class="page"><div class="page-hd"><div class="pg-title">合同模板</div><div class="pg-acts"><button class="btn btn-ghost" data-toast="演示：新建合同模板（在线编辑 + 版本管理）">新建模板</button></div></div>'+
  '<div class="card"><div class="card-bd" style="padding:0"><table class="tbl"><thead><tr><th>模板名称</th><th>适用方向</th><th>类型</th><th>版本</th><th>使用次数</th><th>更新时间</th><th>操作</th></tr></thead><tbody>'+
  rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>'+
  '<div class="pg-foot">共 '+rows.length+' 个模板 · 销售 2 / 采购 2 / 维保 1 · 模板变更留版本痕进</div></div>';
}
function costVerHTML(){
 var rows=[
  ['BC-01','HT-2609-18 · XX产业园喷淋系统','补充协议','0.00','工期顺延 15 天','V3→V4',tg('o','客户签署中'),tg('b','查看对比')],
  ['BG-02','HT-2609-18 · XX产业园喷淋系统','签证','-1.20','管网分支设计变更（22 改 20 留痕）','V2',tg('g','已生效'),tg('b','查看留痕')],
  ['BQ-03','HT-2609-18 · XX产业园喷淋系统','签证','+0.80','3F 增加手动报警按钮 6 只','V2',tg('g','已生效'),tg('b','查看留痕')],
  ['BC-02','ZC-2609-08 · 喷淋主材采购','价格调整','-0.30','市场价回落，量价双控重算','V2',tg('y','待审批'),tg('b','查看对比')]];
 return '<div class="page"><div class="page-hd"><div class="pg-title">合同变更 / 版本</div><div class="pg-acts"><button class="btn btn-ghost" data-toast="演示：发起变更（补充协议 / 签证 / 价格调整 / 工期顺延）">发起变更</button></div></div>'+
  '<div class="card"><div class="card-bd" style="padding:0"><table class="tbl"><thead><tr><th>变更单</th><th>合同</th><th>变更类型</th><th>金额增减(万)</th><th>原因</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody>'+
  rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>'+
  '<div class="pg-foot">共 '+rows.length+' 条 · 待审批 3 / 已生效 7 / 已作废 4 · 每次变更后目标成本与合同额自动重算留痕</div></div>';
}
function costLoopHTML(){
 var rows=[
  ['销售合同链路','HT-2609-18 销售合同','项目 PJ-2609-02 → 客户 XX产业园','回项目 360°',tg('g','可逆穿透'),tg('b','演示穿透')],
  ['采购合同链路','ZC-2609-08 采购合同','供应商华信管业 → 订单 PO-2609-31 → 入库 RK-2609-31 → 发票 → 付款','回合同台账',tg('g','可逆穿透'),tg('b','演示穿透')],
  ['维保工单链路','WD-0916 报修工单','维修订单 WO-2609-11 → 开票 → 收款 → 满意度','回维保项目',tg('g','可逆穿透'),tg('b','演示穿透')]];
 return '<div class="page"><div class="page-hd"><div class="pg-title">循环穿透</div></div>'+
  '<div class="card"><div class="card-bd" style="padding:0"><table class="tbl"><thead><tr><th>链路</th><th>起点</th><th>途经单据</th><th>终点</th><th>穿透说明</th><th>操作</th></tr></thead><tbody>'+
  rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>'+
  '<p class="mn-tip">供应商 → 合同 → 订单 → 入库 → 发票 → 付款 → 项目，任一环节可反向跳回材料主数据，全链路可逆穿透</p></div>';
}
MTPAGES.costfw={title:'框架与专项合同',tabs:[['框架合同与子订单',frameHTML],['维保合同专项',wmContractHTML]]};
MTPAGES.costin={title:'合同录入与模板',tabs:[['新建 / AI·OCR 录入',contractWizHTML],['合同模板',costTplHTML]]};
MTPAGES.costap={title:'合同审批与变更',tabs:[['合同审批',contractApproveHTML],['合同变更 / 版本',costVerHTML]]};
MTPAGES.costfu={title:'履约 · 结算 · 穿透',tabs:[['履约与发货签收',fhSignHTML],['合同结算与核算',settleCalcHTML],['风险与业务助手',contractRiskHTML],['循环穿透',costLoopHTML]]};
MTPAGES.costtc={title:'目标成本与清单',tabs:[['目标成本',targetCostHTML],['清单导入',costImpHTML]]};
MTPAGES.costpay={title:'付款与智能洞察',tabs:[['付款申请',payReqHTML],['智能业务洞察',payInsightHTML],['多供应商付款决策',supPayHTML]]};
MTPAGES.costinv={title:'票税与发票',tabs:[['自动开票任务',autoInvHTML],['自动收票挂接',autoRecvHTML],['发票台账',invLibHTML]]};
MTPAGES.buysup={title:'供应商库',tabs:[['供应商档案',supArchHTML],['供应商评级',supLevelHTML],['黑名单',supBlackHTML]]};
MTPAGES.buycmp={title:'量价双控与超量超价预警',tabs:[['量价双控六行对比',ljHTML],['超量超价预警',overWarnHTML]]};
function costfw(){return mtPage('costfw')}
function costin(){return mtPage('costin')}
function costap(){return mtPage('costap')}
function costfu(){return mtPage('costfu')}
function costtc(){return mtPage('costtc')}
function costpay(){return mtPage('costpay')}
function costinv(){return mtPage('costinv')}
function buysup(){return mtPage('buysup')}
function buycmp(){return mtPage('buycmp')}
`,xt=`// 消安云平台 · 页面分片 oaCalHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaCalHTML(){
 var rows=[
  ['09-17 09:30','维保例会','会议室 A','赵经理',tg('b','今天'),OKNO],
  ['09-18 14:00','XX大厦 季度巡检','现场','钱进',tg('gray','明天'),OKNO],
  ['09-20 10:00','投标开标（XX产业园）','公共资源交易中心','张助理',tg('gray','周六'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">日程（会议 / 巡检 / 投标日程统一视图）</div>'+
  '<div class="table-wrap">'+tblHTML(['时间','事项','地点','参与人','日期','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>今日 1 项 · 本周 5 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新建日程">+ 新建日程</button></span></div></div>';
}`,Ot=`// 消安云平台 · 页面分片 oaCarHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaCarHTML(){
 var rows=[
  ['YC-2609-006','09-17 昆明 → 文山','维保巡检','杨帆',tg('b','待出发'),OKNO],
  ['YC-2609-004','09-16 昆明 → 楚雄','项目验收','王经理',tg('g','已归还'),OKNO],
  ['YC-2609-002','09-15 昆明市区','投标送标','张助理',tg('g','已归还'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">用车（申请 · 审批 · 归还）</div>'+
  '<div class="table-wrap">'+tblHTML(['用车单','行程','用途','使用人','状态','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>待出发 1 · 已归还 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：申请用车">+ 申请用车</button></span></div></div>';
}`,Lt=`// 消安云平台 · 页面分片 oaDocHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaDocHTML(){
 var rows=[
  ['SF-2609-006','致 XX 住建局：整改回复函','收文','09-15',tg('b','待办'),OKNO],
  ['SF-2609-004','发往 XX 物业：维保报价单','发文','09-12',tg('g','已归档'),OKNO],
  ['SF-2609-002','致 XX 业主：验收通知书','发文','09-10',tg('g','已归档'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">收发文（公文流转 · 审批后归档）</div>'+
  '<div class="table-wrap">'+tblHTML(['文号','标题 / 内容','类型','日期','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>待办 1 · 已归档 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新建发文">+ 新建</button></span></div></div>';
}`,Pt=`// 消安云平台 · 页面分片 oaDoneHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaDoneHTML(){
 var rows=[
  ['审批 · 付款 FK-2609-028','李班组 劳务结算','09-15 10:00',tg('g','已通过'),OKNO],
  ['审批 · 报销 BX-2609-024','资料打印（缺票据）','09-14 16:20',tg('r','已驳回'),OKNO],
  ['工单 · WX-2609-081','防火卷帘维修','09-15 11:30',tg('g','已完成'),OKNO],
  ['巡检 · 线路一','XX大厦 月度巡检','09-15 14:00',tg('g','已完成'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">已办 / 我发起（流程历史统一视图）</div>'+
  '<div class="table-wrap">'+tblHTML(['流程','事项','时间','结果','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>本月已办 26 项 · 我发起 12 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出流程历史">导出</button></span></div></div>';
}`,jt=`// 消安云平台 · 页面分片 oaExpHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaExpHTML(){
 var rows=[
  ['BX-2609-033','XX产业园 现场加油费','¥380','材料员 · 李工',tg('b','审批中'),OKNO],
  ['BX-2609-030','XX大厦 招待费','¥1,200','项目经理 · 王经理',tg('g','已通过'),OKNO],
  ['BX-2609-027','维保线路三 差旅费','¥860','维保员 · 杨帆',tg('g','已报销'),OKNO],
  ['BX-2609-024','XX医院 资料打印','¥120','资料员 · 张工',tg('y','已驳回 · 缺票据'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">费用报销（可计入项目「其他费用 / 间接费用」）</div>'+
  '<div class="table-wrap">'+tblHTML(['报销单','用途','金额','申请人','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>待审批 1 · 本月报销合计 ¥12,860</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发起报销">+ 发起报销</button></span></div>'+
  '<div class="demo-note">报销单支持附件（票据照片），按项目归集为间接费用，联动成本预算</div></div>';
}`,St=`// 消安云平台 · 页面分片 oaHrHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaHrHTML(){
 var rows=[
  ['HR-0098','张伟','项目经理','工程部','138****2211',tg('g','在职'),OKNO],
  ['HR-0102','李娜','材料员','采购部','139****5544',tg('g','在职'),OKNO],
  ['HR-0086','杨帆','维保员','维保部','137****8890',tg('g','在职'),OKNO],
  ['HR-0075','周凯','资料员','工程部','136****3322',tg('y','待离职交接'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">人事档案（在职 / 离职状态流转 · 敏感信息字段级权限）</div>'+
  '<div class="table-wrap">'+tblHTML(['工号','姓名','岗位','部门','手机','状态','操作'],rows,880)+'</div>'+
  '<div class="wb-total"><span>在职 68 人 · 离职 9 人</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新增员工">+ 新增</button></span></div>'+
  '<div class="demo-note">身份证 / 银行卡等敏感信息加密存储 + 字段级权限；员工离职自动触发客户与证书资产交接（防资产流失）</div></div>';
}`,_t=`// 消安云平台 · 页面分片 oaMsgHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaMsgHTML(){
 var rows=[
  ['系统','付款 FK-2609-032 审批提醒','09-16 10:30',tg('b','未读'),OKNO],
  ['工单','WX-2609-095 派工通知','09-16 14:25',tg('b','未读'),OKNO],
  ['系统','证书「一级注册消防工程师」30 天后到期','09-16 09:00',tg('o','未读'),OKNO],
  ['巡检','线路二 巡检报告已提交','09-15 17:40',tg('gray','已读'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">消息通知（审批 / 工单 / 预警 / 巡检 聚合）</div>'+
  '<div class="table-wrap">'+tblHTML(['来源','内容','时间','状态','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>未读 3 · 已读 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：全部标为已读">全部已读</button></span></div>'+
  '<div class="demo-note">消息支持推送系统 / 钉钉；待办中心聚合审批、工单、巡检、回款任务</div></div>';
}
/* ===== 波次B2 经营决策 ===== */`,Ht=`// 消安云平台 · 页面分片 oaNoticeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaNoticeHTML(){
 var rows=[
  ['GG-2609-018','关于国庆假期值班安排的通知','行政部','09-16',tg('b','置顶'),OKNO],
  ['GG-2609-015','9 月消防技能培训报名','培训中心','09-14',tg('g','已发布'),OKNO],
  ['GG-2609-012','供应商资质年审提醒','采购部','09-10',tg('g','已发布'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">公告（企业通知 · 系统消息 + 钉钉同步）</div>'+
  '<div class="table-wrap">'+tblHTML(['公告号','标题','发布部门','日期','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>置顶 1 · 已发布 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发布公告">+ 发布公告</button></span></div></div>';
}`,Ct=`// 消安云平台 · 页面分片 oaSealHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oaSealHTML(){
 var rows=[
  ['YJ-2609-008','维保合同 XW-2609-01 用印','合同章','李助理','09-15 借出',tg('b','使用中'),OKNO],
  ['YJ-2609-005','资质证书原件借出（投标）','资质章','王经理','09-12 借出',tg('b','使用中'),OKNO],
  ['YJ-2609-003','投标文件盖章','公章','张助理','09-08 归还',tg('g','已归还'),OKNO],
  ['YJ-2609-001','消防报告签章','电子签','王工','09-05 完成',tg('g','已用印'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">用印 / 证件（借用 · 用途 · 归还闭环 · 审计留痕）</div>'+
  '<div class="table-wrap">'+tblHTML(['单号','用途','印章 / 证件','经办人','时间','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>使用中 2 · 已归还 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：申请用印">+ 申请用印</button></span></div>'+
  '<div class="demo-note">用印 / 证件借用需审批，归还登记形成闭环；查看 / 下载 / 借出 / 续期全程留痕防资产流失</div></div>';
}`,At=`// 消安云平台 · 页面分片 ocrHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ocrHTML(){
 var rows=[
  ['1','WL-0101 镀锌钢管 DN100','m','3,000','¥168.0','¥50.40 万',tg('b','AI 识别 · 待确认')],
  ['2','WL-0232 喷淋头 ZSTX15','只','600','¥30.0','¥1.80 万',tg('b','AI 识别 · 待确认')],
  ['3','沟槽管件（批次）','件','180','¥120.0','¥2.16 万',tg('r','超合同单价 +4%')]];
 return '<div class="card-bd"><div class="ocr-grid">'+
  '<div><div class="dv-sec">第一步 · 上传手写送货单</div>'+
  '<div class="ocr-drop" data-toast="演示：调起相机 / 选择照片，AI+OCR 自动识别">'+ICON.cam.replace('class="ic"','class="ic" style="width:30px;height:30px;margin:0 auto 8px"')+'点击上传或拖入「手写送货单」照片<br/><span style="font-size:12px">AI / OCR 自动识别：货物名称 · 单位 · 数量 · 单价 · 金额</span></div>'+
  '<div class="dv-sec">识别结果</div><div class="banner" style="margin-bottom:0">'+ICON.check.replace('class="ic"','class="ic" style="width:16px;height:16px;color:var(--green);margin-top:3px"')+'<div>已识别 3 项货物，置信度 96%；红色项超合同单价，确认入库后触发 <b>变更 / 签证 / 扣款</b> 流程</div></div></div>'+
  '<div><div class="dv-sec">第二步 · 确认入库明细并关联</div>'+
  tblHTML(['#','货物名称（可修正）','单位','数量','单价','金额','校验'],rows,700)+
  '<div class="dv-sec">关联信息（自动带出 + 手动修正）</div><div class="kvg" style="grid-template-columns:1fr">'+
  '<div class="kv-row"><span>关联项目</span><b>XX产业园喷淋系统工程</b></div>'+
  '<div class="kv-row"><span>供应商 / 采购合同</span><b>华信管业 · ZC-2609-08</b></div>'+
  '<div class="kv-row"><span>入库仓库</span><b>项目现场仓 · 主仓 A</b></div>'+
  '<div class="kv-row"><span>预算清单关联</span><b>自动匹配 2 项 · 待确认 1 项</b></div></div>'+
  '<div class="wb-total" style="margin-top:12px"><span>入库合计 ¥54.36 万 · 将生成批次二维码 ×3</span><span style="margin-left:auto"><button class="mini-btn mini-no" data-act="手动修正">手动修正</button> <button class="mini-btn mini-ok" data-act="确认入库">确认入库</button></span></div></div></div></div>';
}`,Et=`// 消安云平台 · 页面分片 oppOf —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function oppOf(oid){return OPP.find(function(x){return x.id===oid})}`,Nt=`// 消安云平台 · 页面分片 oppstageHTML —— 阶段推进操作台（O1 真实流转 + 动态推进日志）
function oppLog(){window.__OPP_LOG=window.__OPP_LOG||[
 ['09-16','OPP-004','报价','郑洁','推进到「报价」并提醒 09-25 提交'],
 ['09-15','OPP-005','投标','孙倩','推进到「投标」并提醒 09-28 开标'],
 ['09-14','OPP-002','报价','王强','引用内部定额完成三档价对比'],
 ['09-12','OPP-001','需求确认','李敏','客户确认改造范围，进入勘察']];
 return window.__OPP_LOG}
function oppstageHTML(){
 var rows=OPP.map(function(o){var qs=LINK_QUOTES.filter(function(q){return q.oid===o.id});
  return '<tr><td>'+o.id+'</td><td><span class="link-btn" data-opid="'+o.id+'" style="cursor:pointer">'+o.name+'</span></td><td>'+tagHtml(o.stage,o.stage==='投标'||o.stage==='报价'?'yellow':o.stage==='勘察/方案'?'blue':'green')+'</td><td>'+o.owner+'</td><td>'+(o.days>=3?tagHtml(o.days+' 天未跟进','red'):tagHtml(o.days+' 天','green'))+'</td><td>'+(o.result?tagHtml(o.result,o.result==='赢单'?'green':o.result==='输单'?'red':'gray'):'—')+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-opp="'+o.id+'" data-act="阶段推进">推进</button><button class="mini-btn mini-no" data-opp="'+o.id+'" data-act="分支结果">分支结果</button>'+(qs.length?'<button class="mini-btn mini-no" data-quote="'+qs[0].id+'">报价</button>':'')+'</span></td></tr>'}).join('');
 var log=oppLog().map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+tagHtml(r[2],r[2]==='报价'?'yellow':r[2]==='投标'?'red':'blue')+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td></tr>'}).join('');
 return '<section class="card"><div class="card-h"><span class="ic purple"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6M2 9h20"/></svg></span><h3>自定义里程碑（可配置）</h3><span class="more" data-toast="演示：可拖拽排序 / 增删里程碑 / 设定停留时长">配置里程碑</span></div><div class="card-b"><div class="funnel">'+OPP_STAGES.map(function(s){var n=OPP.filter(function(o){return o.stage===s}).length;return '<div class="fl-col"><b>'+s+'</b><span>'+n+' 个</span></div>'}).join('')+'</div></div></section>'+
 '<section class="card"><div class="card-h"><span class="ic blue"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg></span><h3>阶段推进操作台</h3><span class="more"><button class="btn btn-primary" style="padding:5px 12px;font-size:12.5px" data-new="商机">'+ICON.plus.replace('class="ic"','class="ic" style="width:12px;height:12px"')+'<span>新建商机</span></button></span></div><div class="card-b"><div class="gm-tblw"><table class="gm-tb" style="min-width:1080px"><thead><tr><th>商机编号</th><th>商机名称</th><th>当前阶段</th><th>负责人</th><th>未跟进预警</th><th>结果</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></section>'+
 '<section class="card"><div class="card-h"><span class="ic green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><h3>推进记录</h3></div><div class="card-b"><div class="gm-tblw"><table class="gm-tb" style="min-width:960px"><thead><tr><th>时间</th><th>商机</th><th>阶段</th><th>操作人</th><th>说明</th></tr></thead><tbody>'+log+'</tbody></table></div></div></section>';
}
`,Ft=`// 消安云平台 · 页面分片 outboundHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function outboundHTML(){
 var rows=[
  ['CK-2609-028','镀锌钢管 DN100','800 m','XX产业园 · 喷淋班组','赵班',tg('b','部分领用'),OKNO],
  ['CK-2609-026','喷淋头 ZSTX15','240 只','XX产业园 · 喷淋班组','赵班',tg('b','已领用'),OKNO],
  ['CK-2609-024','烟感探测器','60 只','XX医院 · 维保工单 WX-2609-089','何工',tg('g','已领用'),OKNO],
  ['CK-2609-021','消防水带','6 盘','XX大厦 · 月度巡检','钱工',tg('b','部分领用'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">出库 / 领用（关联项目 / 劳务班组 / 维保工单 · 超领 / 损耗自动扣款回写财务）</div>'+
  '<div class="table-wrap">'+tblHTML(['出库单','物料','数量','关联对象','领用人','状态','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>今日出库 4 单 · 其中 1 单超领已生成扣款</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：扫码出库">扫码出库</button></span></div>'+
  '<div class="demo-note">班组超领 / 损耗 / 浪费自动生成扣款并回写劳务结算与财务付款，避免财务不知情多付</div></div>';
}`,It=`// 消安云平台 · 页面分片 overWarnHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function overWarnHTML(){
 var rows=[
  ['WL-0101 镀锌钢管 DN100','累计入库 3,200 m > 预算 3,000 m',tg('r','超量 +6.7%'),'09-16',OKNO],
  ['WL-0232 喷淋头 ZSTX15','入库价 ¥31.2 > 合同价 ¥30.0',tg('r','超价 +4%'),'09-15',OKNO],
  ['WL-0188 消防水带','领用 8 盘 > 预算 6 盘（班组超领）',tg('r','超领 · 已扣款'),'09-14',OKNO],
  ['WL-0071 应急照明','累计入库 260 只 > 合同 240 只',tg('o','超量 +8.3%'),'09-12',OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">超量超价项</div><div class="m-num">4 项</div><div class="m-sub">红 / 黄灯实时监控</div></div><div class="metric"><div class="m-label">已触发扣款</div><div class="m-num">1 笔</div><div class="m-sub">班组超领扣款</div></div></div>'+
  '<div class="table-wrap">'+tblHTML(['材料','预警内容','预警类型','触发日期','操作'],rows,980)+'</div>'+
  '<div class="demo-note">超量 / 超价红色预警不阻断业务，但强制走 变更 / 签证 / 扣款 闭环，风险暴露在过程中而非项目结束</div>';
}
/* ===== 波次A3 资料报告 ===== */`,Bt=`// 消安云平台 · 页面分片 ownBillHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ownBillHTML(){
 var rows=[
  ['P-2609-03','XX商业广场 维保年费','¥96,000','¥82,000','¥14,000',tg('b','待结算'),OKNO],
  ['P-2609-08','XX产业园 进度款','¥512,000','¥486,000','已结清',tg('g','已结清'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">账单 / 回款对账（业主只读 · 账单与付款记录）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目','账单类型','金额','已付','余额','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>待结算 1 · 已结清 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看账单明细">查看明细</button></span></div>'+
  '<div class="demo-note">业主可查看账单与付款进度，但隐藏企业成本与内部审批</div></div>';
}
/* ===== 波次C2 外部协作 ===== */`,Dt=`// 消安云平台 · 页面分片 ownProjHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ownProjHTML(){
 var key=curMenuKey;
 if(key.indexOf('现场照片')>-1){
  var rows=[
   ['P-2609-08','XX产业园喷淋工程','喷淋管道安装','09-16 施工中',tg('b','6 张'),OKNO],
   ['P-2609-05','XX医院消防改造','探测器安装','09-15 施工中',tg('b','8 张'),OKNO],
   ['P-2609-03','XX商业广场维保','月度巡检','09-12 已完成',tg('g','12 张'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">现场照片（业主只读查看 · 水印留痕）</div>'+
   '<div class="table-wrap">'+tblHTML(['项目','内容','日期','状态','照片数','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>本月照片 186 张</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看全部照片">查看全部</button></span></div>'+
   '<div class="demo-note">业主视角：仅查看进度 / 照片 / 报告，隐藏成本利润与内部审批</div></div>';
 }
 if(key.indexOf('进度查看')>-1){
  var rows=[
   ['P-2609-08','XX产业园喷淋工程','86%','管道安装 / 喷淋头安装',tg('g','正常'),OKNO],
   ['P-2609-05','XX医院消防改造','72%','探测器 / 主机安装',tg('y','滞后 5 天'),OKNO],
   ['P-2609-03','XX商业广场维保','月度计划','季度巡检',tg('g','正常'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">项目进度查看（业主只读）</div>'+
   '<div class="table-wrap">'+tblHTML(['项目','进度','当前工序','状态','操作'],rows,880)+'</div>'+
   '<div class="demo-note">业主可查看进度 / 里程碑 / 报告，不可查看成本与利润</div></div>';
 }
 var rows=[
  ['P-2609-08','XX产业园喷淋工程','新建 · 自营','2026-03 ~ 2026-12','昆明',tg('g','在建'),OKNO],
  ['P-2609-05','XX医院消防改造','改造 · 自营','2026-05 ~ 2026-11','昆明',tg('g','在建'),OKNO],
  ['P-2609-03','XX商业广场维保','维保','2026-01 ~ 2026-12','楚雄',tg('g','维保中'),OKNO],
  ['P-2609-01','XX物流园（联营）','新建 · 联营','2025-08 ~ 2026-10','南宁',tg('o','联营'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">我的项目（业主 / 甲方只读视图）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目编号','名称','类型','工期','区域','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>在建 2 · 维保 1 · 联营 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看项目详情">查看详情</button></span></div>'+
  '<div class="demo-note">业主服务隐藏成本、利润、内部审批等敏感数据</div></div>';
}`,qt=`// 消安云平台 · 页面分片 ownRepHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ownRepHTML(){
 var key=curMenuKey;
 if(key.indexOf('验收确认')>-1){
  var rows=[
   ['YS-2609-006','XX大厦 · 消防水系统','验收资料 12 项',tg('b','待业主确认'),OKNO],
   ['YS-2609-002','XX产业园 · 防排烟系统','验收资料 9 项',tg('g','业主已确认'),OKNO]];
  return '<div class="card-bd"><div class="dv-sec">验收确认（业主在线确认 · 验收单归档）</div>'+
   '<div class="table-wrap">'+tblHTML(['验收单','项目 · 系统','资料','状态','操作'],rows,900)+'</div>'+
   '<div class="wb-total"><span>待确认 1 · 已确认 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看验收资料">查看资料</button></span></div>'+
   '<div class="demo-note">业主确认后验收单进入归档，作为结算 / 质保金依据</div></div>';
 }
 if(key.indexOf('整改通知')>-1){
  var rows=[
   ['ZG-2609-005','XX医院 3F 喷淋渗漏',tg('r','待整改'),'09-16',OKNO],
   ['ZG-2609-002','XX大厦 B2 消防泵异响',tg('g','已整改 · 待复查'),'09-14',OKNO]];
  return '<div class="card-bd"><div class="dv-sec">整改通知查看（业主查看整改闭环进度）</div>'+
   '<div class="table-wrap">'+tblHTML(['整改单','问题','状态','日期','操作'],rows,880)+'</div>'+
   '<div class="wb-total"><span>待整改 1 · 待复查 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：查看整改详情">查看详情</button></span></div>'+
   '<div class="demo-note">整改闭环：发现 → 整改 → 复查，业主可实时查看</div></div>';
 }
 var rows=[
  ['BG-2609-018','XX医院 年度检测报告','PDF · 已签章','09-15',tg('g','可下载'),OKNO],
  ['BG-2609-015','XX产业园 维修报告','PDF · 已签章','09-12',tg('g','可下载'),OKNO],
  ['BG-2609-021','XX大厦 9 月维保报告','生成中','09-16',tg('b','待发布'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">消防报告下载（业主只读 · 签章后开放下载）</div>'+
  '<div class="table-wrap">'+tblHTML(['报告编号','报告','格式 · 签章','日期','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>可下载 2 · 待发布 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：下载报告">下载报告</button></span></div>'+
  '<div class="demo-note">报告经电子签后开放业主下载，下载留痕审计</div></div>';
}`,Rt=`// 消安云平台 · 页面分片 ownRepairHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ownRepairHTML(){
 var key=curMenuKey;
 if(key.indexOf('满意度')>-1){
  var rows=[
   ['XX医院 消防维保','钱进','4.8 分','服务及时 · 处理专业','09-16'], 
   ['XX大厦 消防维保','赵强','4.6 分','响应快','09-12'],
   ['XX商业广场 消防维保','周凯','3.9 分','到场略慢','09-10']];
  return '<div class="card-bd"><div class="dv-sec">满意度评价（业主扫码评价 · 历史记录）</div>'+
   '<div class="table-wrap">'+tblHTML(['项目','服务人员','评分','评价','日期'],rows,880)+'</div>'+
   '<div class="wb-total"><span>平均 4.4 分 · 已评价 26 次</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：评价本次服务">去评价</button></span></div>'+
   '<div class="demo-note">业主二维码扫码评价服务人员与服务情况，数据回传企业满意度台账</div></div>';
 }
 if(key.indexOf('工单进度')>-1){
  var rows=[
   ['WX-2609-095','喷淋末端渗漏',tg('b','处理中'),'钱进','预计 09-16 18:00'], 
   ['WX-2609-089','烟感失联',tg('b','处理中'),'何军','预计 09-16 17:00'],
   ['WX-2609-081','防火卷帘无法下降',tg('g','已完成'),'周凯','09-15 16:40']];
  return '<div class="card-bd"><div class="dv-sec">我的报修工单进度（业主实时查看）</div>'+
   '<div class="table-wrap">'+tblHTML(['工单号','问题','状态','处理人','预计完成'],rows,920)+'</div>'+
   '<div class="wb-total"><span>处理中 2 · 已完成 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：联系服务人员">联系服务</button></span></div>'+
   '<div class="demo-note">业主在线查看报修工单：发起 → 派工 → 处理 → 审核 → 回访全流程可见</div></div>';
 }
 var rows=[
  ['WX-2609-095','XX医院 3F 喷淋末端渗漏',tg('r','紧急'),'09-16 14:20',OKNO],
  ['WX-2609-091','XX医院 喷淋末端试水压力不足',tg('o','高'),'09-16 11:26',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">在线报修（业主提交 · 自动转维保工单池）</div>'+
  '<div class="table-wrap">'+tblHTML(['工单号','问题描述','紧急度','提交时间','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>本月业主报修 8 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：提交新报修">+ 提交报修</button></span></div>'+
  '<div class="demo-note">业主报修自动进入维保调度工单池，保内正常派工 / 保外生成维修订单确收</div></div>';
}`,Kt=`// 消安云平台 · 页面分片 payInsightHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function payInsightHTML(){
 var cards=[
  ['超合同付款比例','华信管业 · 累计付款 95% > 合同 80%',tg('r','红灯 · 禁止超比例')],
  ['超结算付款比例','XX医院 · 付款 ¥48 万 > 结算 ¥42 万',tg('r','红灯 · 超出结算 14%')],
  ['缺票','正泰消防 · 已付 ¥36.5 万缺票 1 张',tg('o','黄灯 · 补票后放行')],
  ['超项目可用资金','XX产业园 · 申请 6.2 万 > 可用余额 4.8 万',tg('r','红灯 · 超额 1.4 万')]];
 return '<div class="metrics"><div class="metric"><div class="m-label">今日拦截</div><div class="m-num">3 笔</div><div class="m-sub">红灯 / 黄灯付款申请</div></div><div class="metric"><div class="m-label">知情特批</div><div class="m-num">1 次</div><div class="m-sub">老板知情后特批</div></div></div>'+
  '<div class="dv-sec">智能业务洞察（付款时自动检查 ①超合同付款比例 ②超结算 ③缺票 ④超项目可用资金）</div>'+
  '<div class="qgrid" style="grid-template-columns:repeat(2,1fr)">'+cards.map(function(c){return '<div class="qtile"><div class="qi" style="font-size:14px">'+c[0]+'</div><span style="color:var(--t3);font-size:13px">'+c[1]+'</span><span style="margin-top:6px">'+c[2]+'</span></div>'}).join('')+'</div>'+
  '<div class="table-wrap" style="margin-top:12px">'+tblHTML(['付款单','供应商','金额','四检结果','处理'],[
   ['FK-2609-032','华信管业','¥8,500',tg('r','超合同付款比例'),'<button class="mini-btn mini-ok" data-toast="演示：老板知情后特批放行">知情后特批</button>'],
   ['FK-2609-030','天广消防','¥62,000',tg('g','四检通过'),'<button class="mini-btn mini-ok" data-toast="演示：正常放行">放行</button>'],
   ['FK-2609-028','李班组','¥48,000',tg('o','缺票 1 张'),'<button class="mini-btn mini-ok" data-toast="演示：先付款后补票">先付后补票</button>']],980)+'</div>'+
  '<div class="demo-note">亮红灯不代表不能付：老板可「知情后特批」，但每笔特批留痕，风险自动计入经营洞察记录</div>';
}`,Gt=`// 消安云平台 · 页面分片 payReqHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function payReqHTML(){
 var rows=[
  ['FK-2609-032','XX大厦消防泵维修款','华信管业','¥8,500','材料款','已付 ¥486 万 / 合同 ¥512 万',tg('b','审批中'),OKNO],
  ['FK-2609-030','XX产业园 管材进度款','天广消防','¥62,000','进度款','已付 ¥186 万 / 合同 ¥210 万',tg('g','已支付'),OKNO],
  ['FK-2609-028','XX医院 劳务结算','李班组','¥48,000','劳务款','扣款 2 笔 ¥1,200',tg('g','已支付'),OKNO],
  ['FK-2609-025','XX商业广场 风机款','正泰消防','¥36,500','设备款',tg('r','缺票 1 张'),tg('y','已驳回'),OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">待审批付款</div><div class="m-num">1 笔</div><div class="m-sub">¥8,500 · 驳回待重提 1 笔</div></div><div class="metric"><div class="m-label">本月已付</div><div class="m-num">¥186 万</div><div class="m-sub">自动带出合同 / 结算 / 收票</div></div></div>'+
  '<div class="fbar"><select><option>付款类型：全部</option><option>付款类型：材料款</option><option>付款类型：进度款</option><option>付款类型：劳务款</option><option>付款类型：设备款</option></select><select><option>状态：全部</option><option>状态：审批中</option><option>状态：已支付</option><option>状态：已驳回</option></select><input class="fkw" placeholder="合同 / 供应商关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
  '<div class="table-wrap">'+tblHTML(['付款单号','用途','供应商 / 班组','金额','类型','合同 / 结算带出','状态','操作'],rows,1120)+'</div>'+
  '<div class="demo-note">付款申请自动带出已付 / 结算 / 合同信息，可配置文本 / 选项 / 数字 / 附件 / 自动引用 / 过程管理明细；审批前必过智能业务洞察四检</div>';
}`,Wt=`// 消安云平台 · 页面分片 poOrderHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function poOrderHTML(){
 var rows=[
  ['PO-2609-021','华信管业','镀锌钢管 DN100','3,000 m','¥50.4 万','ZC-2609-08',tg('b','待收货'),OKNO],
  ['PO-2609-019','天广消防','喷淋头 ZSTX15','600 只','¥1.8 万','ZC-2609-05',tg('g','部分到货 240 只'),OKNO],
  ['PO-2609-016','安泰电子','烟感探测器','400 只','¥6.4 万','ZC-2609-03',tg('g','已完成'),OKNO],
  ['PO-2609-012','金桥物资','沟槽管件','180 件','¥2.16 万','框架订单',tg('g','已完成'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">采购订单（框架合同 / 采购合同直接下单 · 送货后联动 AI 拍照入库）</div>'+
  '<div class="table-wrap">'+tblHTML(['订单号','供应商','物料','数量','金额','来源合同','状态','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>待收货 1 · 部分到货 1 · 已完成 2</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：从框架合同生成订单">+ 生成订单</button></span></div>'+
  '<div class="demo-note">订单创建 → 审核 → 执行 → 结果确认完整闭环；供应商按订单送货 → AI 拍照入库 → 超量超价预警</div></div>';
}`,Jt=`// 消安云平台 · 页面分片 priceDrawer —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function priceDrawer(){
 var pid=curPriceId||'MAT-0101_内部定额';
 var idp=pid.split('_');var p=PRICES.find(function(x){return x.mid===idp[0]&&x.src===idp[1]});
 if(!p)p=PRICES[0];
 var M=matOf(p.mid);
 var prices=PRICES.filter(function(x){return x.mid===p.mid});
 var kv=function(k,v){return '<div class="kv-row"><span>'+k+'</span><b>'+v+'</b></div>'};
 var TYPES={'内部定额':'blue','询价价':'blue','合同价':'green','订单价':'green','入库价':'gray','结算价':'gray','市场价':'yellow'};
 var tabs=[
  {id:'multi',name:'多源价格对比',dyn:function(){
   /* 价格来源三大类：① 历史项目的内部报价数据沉淀（内部定额） ② 供应商采购价（询价 / 合同 / 订单 / 入库 / 结算） ③ 市场价 */
   var grpOf=function(s){return s==='内部定额'?0:(s==='市场价'?2:1)};
   var gset=[[],[],[]];prices.forEach(function(x){gset[grpOf(x.src)].push(x)});
   var ref=gset[0][0],rv=ref?ref.v:null;
   var range=function(a){var mn=a[0].v,mx=a[0].v;for(var gi=1;gi<a.length;gi++){if(a[gi].v<mn)mn=a[gi].v;if(a[gi].v>mx)mx=a[gi].v}return mn===mx?'¥'+nfmt(mn):'¥'+nfmt(mn)+' ~ ¥'+nfmt(mx)};
   var spread=function(a){var mn=a[0].v,mx=a[0].v;for(var gi=1;gi<a.length;gi++){if(a[gi].v<mn)mn=a[gi].v;if(a[gi].v>mx)mx=a[gi].v}return((mx-mn)/mn*100).toFixed(1)};
   var execDev=rv&&p.v!==rv?((p.v-rv)/rv*100).toFixed(1):null;
   var devTxt=execDev?(execDev+'% · '+(Math.abs(p.v-rv)/rv>0.05?'超 5% 阈值红灯':'正常')):'一致';
   var supN={};gset[1].forEach(function(x){if(x.who&&x.who!=='系统')supN[x.who]=1});
   var supCn=0;for(var sn in supN)supCn++;
   var srcCards=[
    {ic:ICON.book,cls:'blue',name:'① 历史项目的内部报价数据沉淀',sub:'历往项目报价 / 结算回流 · 内部定额',v:gset[0].length?range(gset[0]):'待维护',note:gset[0].length?gset[0].length+' 条 · 执行价 vs 基准 '+devTxt:'0 条 · 尚未沉淀'},
    {ic:ICON.box,cls:'green',name:'② 供应商采购价',sub:'询价 / 合同 / 订单 / 入库 / 结算沉淀',v:gset[1].length?range(gset[1]):'—',note:gset[1].length?gset[1].length+' 条 · '+supCn+' 家供应商'+(gset[1].length>1?' · 价差 '+spread(gset[1])+'%':''):'0 条 · 暂无采购沉淀'},
    {ic:ICON.chart,cls:'yellow',name:'③ 市场价',sub:'市场行情同步 · 区域信息价参照',v:gset[2].length?range(gset[2]):'暂无同步',note:gset[2].length?gset[2].length+' 条 · 最近同步 '+gset[2][gset[2].length-1].date:'0 条 · 可刷新行情同步'}];
   var cardsHTML='<div class="src-cards">'+srcCards.map(function(c){return '<div class="src-card '+c.cls+(c.v==='待维护'||c.v==='暂无同步'?' muted':'')+'"><div class="sc-h"><span class="sc-ic">'+c.ic+'</span><span>'+c.name+'</span></div><div class="sc-v">'+c.v+'</div><div class="sc-s">'+c.sub+'</div><div class="sc-s">'+c.note+'</div></div>'}).join('')+'</div>';
   var emptyTip=['（可从历史项目报价 / 结算数据沉淀）','（询价 / 采购 / 入库 / 结算自动沉淀）','（点右上「刷新行情」同步）'];
   var grpTbl=function(gi){
    var rs=gset[gi];
    if(!rs.length)return '<p class="mn-tip">'+srcCards[gi].name+' · 暂无记录'+(emptyTip[gi]||'')+'</p>';
    return tblHTML(['价格类型','单价','供应商','区域','来源单据','偏差率'],rs.map(function(x){var dev=(rv&&x.v!==rv)?((x.v-rv)/rv*100).toFixed(1):'—';var dc=dev==='—'?'gray':(Math.abs(parseFloat(dev))>5?'r':(Math.abs(parseFloat(dev))>2?'y':'g'));return [tagHtml(x.src,TYPES[x.src]||'blue'),'<b>¥'+nfmt(x.v)+'</b>',x.who||'—',x.region,'<span class="src-b" data-toast="演示：穿透来源单据">'+x.src+'</span><span class="src-note">'+x.note+'</span>',tg(dc,dev==='—'?'基准':dev+'%')]}),760);
   };
   return '<div class="price-comp">'+
    '<div class="dv-sec">价格来源构成（① 历史项目的内部报价数据沉淀 ② 供应商采购价 ③ 市场价）</div>'+
    cardsHTML+
    '<div class="dv-sec">① 历史项目的内部报价数据沉淀（'+gset[0].length+' 条）</div>'+grpTbl(0)+
    '<div class="dv-sec">② 供应商采购价（'+gset[1].length+' 条）</div>'+grpTbl(1)+
    '<div class="dv-sec">③ 市场价（'+gset[2].length+' 条）</div>'+grpTbl(2)+
    '</div>';}},
  {id:'basic',name:'基本信息',dyn:function(){
   return '<div class="dv-sec">材料信息</div><div class="kvg">'+kv('材料编码',M.code)+kv('名称 · 规格',M.name+' · '+M.spec)+kv('分类路径',M.cat||'消防水系统')+kv('单位',M.unit)+'</div>'+
    '<div class="dv-sec">价格信息</div><div class="kvg">'+kv('价格类型',tagHtml(p.src,TYPES[p.src]||'blue'))+kv('单价',nfmt(p.v))+(p.src==='市场价'?'':kv('税率 / 含税','13% · 含税'))+kv('币种','CNY')+'</div>'+
    '<div class="dv-sec">业务维度</div><div class="kvg">'+kv('供应商',p.who||'—')+kv('区域',p.region)+kv('项目',p.note.indexOf('项目')>-1?'已关联项目':'—（通用价）')+kv('项目类型','新建 / 改造 / 维保')+'</div>'+
    '<div class="dv-sec">时间版本与审批</div><div class="kvg">'+kv('生效 / 失效',p.date+' / 2027-06')+kv('版本','V1 · 只读保留')+kv('来源单据',p.note)+kv('审批记录','李敏 创建 → 孙倩 审批通过')+'</div>';}},
  {id:'ver',name:'版本历史',dyn:function(){
   return '<div class="dv-sec">改价留痕（不能覆盖历史）</div>'+
    tblHTML(['版本','修改前后','差额','原因','操作人 / 时间','操作'],[
     ['V3','¥155.0 → ¥'+nfmt(p.v),'+'+nfmt(p.v-155)+' (3.2%)','供应商调价 / 市场波动','李敏 · 09-'+p.date.slice(-2),'<span class="ti-acts"><button class="mini-btn mini-no" data-price-op="对比">对比</button><button class="mini-btn mini-no" data-price-op="恢复">恢复为当前价</button></span>'],
     ['V2','¥150.0 → ¥155.0','+5.0 (3.3%)','询价更新（天广 ¥30 → 新价）','孙倩 · 08-28','<span class="ti-acts"><button class="mini-btn mini-no" data-price-op="对比">对比</button><button class="mini-btn mini-no" data-price-op="恢复">恢复该版本</button></span>'],
     ['V1','¥152.0 → ¥150.0','-2.0 (1.3%)','内部定额首次维护','系统 · 2026-01','<span class="ti-acts"><button class="mini-btn mini-no" data-price-op="对比">对比</button><button class="mini-btn mini-no" data-price-op="恢复">恢复该版本</button></span>']],760)+
   '<p class="mn-tip">恢复基于旧版本生成新版本 V4，原版本保留只读，满足“22 元改 20 元要留痕”要求</p>';}},
  {id:'src',name:'来源穿透',dyn:function(){
   return '<div class="dv-sec">来源单据（点击穿透）</div><div class="qgrid">'+
    [['二维码询价单','XJ-2609-05 · 3 家报价 · 最高 ¥31.8 / 最低 ¥29.2'],['采购合同 / 订单','PO-2608-12 · 合同价沉淀'],['AI 拍照入库单','RK-2609-08 · OCR 识别 ¥161.5'],['结算单','JS-2609-02 · 结算价沉淀']].map(function(s){return '<div class="qtile" data-toast="演示：跳转查看「'+s[0]+'」— '+s[1]+'"><div class="qi">'+ICON.link+'</div><span>'+s[0]+' · '+s[1]+'</span></div>'}).join('')+'</div>'+
   '<div class="dv-sec">供应商档案</div><div class="kvg">'+kv('供应商',p.who||'—')+kv('评级 / 账期',tg('g','A 级')+' · 月结 30 天')+kv('信用 / 历史合作','良好 · 12 单 · ¥486 万')+kv('合作区域','昆明 / 广西')+'</div>';}},
  {id:'use',name:'使用追溯',dyn:function(){
   return '<div class="dv-sec">被引用对象</div><div class="kvg">'+kv('报价单 / 明细','BJ-2609-05 · 3 行')+kv('材料申请 / 提料','TL-2609-12 · 1 行')+kv('目标成本 / 清单项','CB-2609-01 · 量价双控')+kv('采购申请','SQ-2609-07')+kv('项目','XX产业园（改造）')+'</div>'+
   '<div class="dv-sec">循环穿透</div><div class="pen-chips">'+['材料','供应商','合同','订单','入库','发票','付款','项目'].map(function(n,i){return '<span class="pen-chip" data-toast="演示：跳转到 '+n+' 及其上下游单据">'+n+'</span>'+(i<7?'<span class="pen-arr">→</span>':'')}).join('')+'</div><p class="mn-tip">价格 → 材料 → 供应商 → 合同 → 入库 → 发票 → 付款 → 项目，可反向穿透</p>';}},
  {id:'log',name:'操作日志',dyn:function(){
   return '<div class="dv-sec">审计轨迹</div>'+tblHTML(['时间','操作人','动作','说明'],[
    ['09-16 10:20','系统','结算沉淀','结算单 JS-2609-02 → 价格库（结算价）'],
    ['09-15 14:20','李敏','价格更新','询价价 V2 生效，旧价失效保留'],
    ['09-12 09:00','孙倩','审批通过','价格 V2 审批'],
    ['09-10 16:05','系统','订单沉淀','框架订单 PO-2609-11 → 订单价'],
    ['2026-01-05','系统','首次维护','内部定额 V1 创建']],760)+
   '<p class="mn-tip">所有改价、审批、失效、导出、打印留痕，满足多租户审计与风控</p>';}}];
 if(!curPriceTab||!tabs.some(function(t){return t.id===curPriceTab}))curPriceTab='multi';
 var tab=tabs[0];for(var i=0;i<tabs.length;i++){if(tabs[i].id===curPriceTab)tab=tabs[i]}
 var body=tab.dyn();
 closeMatDrawer();
 var root=document.createElement('div');root.id='matDrawerRoot';
 var headKv=[['材料编码',M.code],['名称 · 规格',M.name+' · '+M.spec],['分类路径',M.cat||'消防水系统'],['单位',M.unit],
  ['价格类型',tagHtml(p.src,TYPES[p.src]||'blue')],['单价','¥'+nfmt(p.v)],['税率',p.src==='市场价'?'—':'13%'],['供应商',p.who||'—'],
  ['区域',p.region],['来源单据',p.note],['生效 / 版本',p.date+' / V1'],['状态 · 当前生效',tg('g','已生效')+' · '+(p.src==='内部定额'||p.src==='入库价'?tg('g','当前执行价'):'—')]];
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:760px">'+
  '<div class="drawer-hd"><h2>价格库 · '+M.name+'（'+p.src+'）</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="dt-head"><div class="dt-head-t">价格记录</div><div class="dt-head-g">'+headKv.map(function(k){return '<div class="k-pair"><span class="hi">'+k[0]+'</span><span class="hv">'+k[1]+'</span></div>'}).join('')+'</div></div>'+
   '<div class="dtabs">'+tabs.map(function(t){return '<div class="dtab '+(t.id===curPriceTab?'active':'')+'" data-id="'+t.id+'">'+t.name+'</div>'}).join('')+'</div>'+
   '<div class="dt-body">'+body+'</div>'+
  '</div>'+
  '<div class="drawer-ft">'+
   '<button class="btn btn-ghost" data-price-op="改价">'+ICON.gear+'<span>改价（生成新版本）</span></button>'+
   '<button class="btn btn-ghost" data-price-op="对比">版本对比</button>'+
   '<button class="btn btn-primary" data-price-op="引用">'+ICON.plus+'<span>引用到报价</span></button>'+
  '</div></div>';
 document.body.appendChild(root);
}`,Qt=`// 消安云平台 · 页面分片 priceLibHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function priceLibHTML(){
 var PRICE_F=window.PRICE_F||{tab:'all'};window.PRICE_F=PRICE_F;
 var TYPES={'内部定额':'blue','询价价':'blue','合同价':'green','订单价':'green','入库价':'gray','结算价':'gray','市场价':'yellow'};
 var rows=PRICES.map(function(p){var m=matOf(p.mid);if(!m)return null;
  var cur=(p.src==='内部定额'||p.src==='入库价')?tg('g','是'):'—';
  var ver=(p.src==='内部定额')?'V3':(p.src==='询价价'?'V2':'V1');
  var st=p.note.indexOf('结算')>-1?'已结算':(p.src==='市场价'?'已接入':'已生效');
  return {mid:p.mid,src:p.src,row:[m.code,'<b>'+m.name+'</b> · '+m.spec,m.cat||'消防水系统',m.unit,tagHtml(p.src,TYPES[p.src]||'blue'),p.who||'—',p.region+(p.note.indexOf('项目')>-1?' · 项目':'') ,'¥'+nfmt(p.v)+' · 13%',''+p.date+' / '+ver,'<span class="src-b" data-toast="演示：穿透来源单据「'+p.note+'」">'+p.note+'</span>',cur+' '+tg('g',st),'<span class="ti-acts"><button class="mini-btn mini-ok" data-pid="'+p.mid+'_'+p.src+'">详情</button><button class="mini-btn mini-no" data-price-op="改价">改价</button><button class="mini-btn mini-no" data-price-op="版本">版本</button><button class="mini-btn mini-no" data-price-op="引用">引用到报价</button><button class="mini-btn mini-no" data-price-op="作废">作废</button></span>']};}).filter(Boolean);
 var filtered=rows;
 if(PRICE_F.tab==='cur')filtered=rows.filter(function(r){return r.src==='内部定额'||r.src==='入库价'});
 else if(PRICE_F.tab!=='all')filtered=rows.filter(function(r){return r.src===PRICE_F.tab});
 var pill=function(id,name,count){var act=PRICE_F.tab===id?'active':'';return '<div class="pill '+act+'" data-price-tab="'+id+'">'+name+(count?' <b>'+count+'</b>':'')+'</div>'};
 return '<div class="wb-top"><b>价格库定位：</b>以材料（material_id）为核心，按 价格类型 + 供应商 + 区域 + 项目 + 生效期 + 版本 组织；当前执行价（内部定额 / 最近入库价）作为报价引用与量价双控基准，其余来源沉淀留档</div>'+
 '<div class="pills">'+pill('all','全部',rows.length)+pill('cur','当前执行价',6)+pill('内部定额','参考价 / 内部定额',5)+pill('询价价','询价价',3)+pill('合同价','合同价',3)+pill('订单价','订单价',1)+pill('入库价','入库价',4)+pill('结算价','结算价',1)+pill('市场价','市场行情',1)+'<div class="pill" data-toast="演示：打开供应商价目表（按供应商维度汇总报价历史，支持导出）">供应商价目表</div></div>'+
 '<div class="fbar"><select><option>分类：全部</option><option>消防水系统</option><option>消防电系统</option><option>防排烟系统</option><option>智慧消防</option></select><select><option>价格类型：全部</option><option>参考价 / 内部定额</option><option>询价价</option><option>合同价</option><option>订单价</option><option>入库价</option><option>结算价</option><option>市场价</option></select><select><option>供应商：全部</option><option>安泰电子</option><option>天广消防</option><option>海湾代理</option></select><select><option>区域：全部</option><option>昆明</option><option>地州</option><option>文山</option><option>楚雄</option><option>广西</option></select><select><option>生效日期：全部</option><option>本月</option><option>近 90 天</option></select><select><option>来源单据：全部</option><option>有来源</option><option>手工维护</option></select><select><option>状态：全部</option><option>已生效</option><option>待审批</option><option>已失效</option></select><input class="fkw" placeholder="材料编码 / 名称 / 型号…"/><span class="reset" data-price-tab="all" style="cursor:pointer">重置</span></div>'+
 '<div class="mat-opbar"><span class="opb-title">共 <b>'+filtered.length+'</b> 条价格记录 · 当前执行价 <b>6</b> · 待审批 <b>1</b> · 本月沉淀 <b>7</b></span><span style="flex:1"></span>'+
 '<button class="btn btn-ghost" data-price-op="新建">'+ICON.plus+'<span>新建价格</span></button>'+
 '<button class="btn btn-ghost" data-price-op="导入">'+ICON.dl+'<span>导入</span></button>'+
 '<button class="btn btn-ghost" data-price-op="导出">导出</button>'+
 '<button class="btn btn-ghost" data-price-op="批量调价">批量调价</button>'+
 '<button class="btn btn-ghost" data-price-op="批量审批">批量审批</button>'+
 '<button class="btn btn-ghost" data-price-op="批量失效">批量失效</button>'+
 '<button class="btn btn-ghost" data-price-op="刷新行情">刷新行情</button>'+
 '<button class="btn btn-primary" data-price-op="打印价目表">打印价目表</button></div>'+
 '<div class="table-wrap">'+tblHTML(['材料编码','名称 · 品牌 · 型号 · 规格','分类','单位','价格类型','供应商','区域 · 项目','单价 · 税率','生效 / 版本','来源单据','状态 · 当前生效','操作'],filtered.map(function(r){return r.row}),1180)+'</div>'+
 '<div class="demo-note">只有「已生效 + 当前生效」的价格作为报价默认引用与量价双控基准；来源单据可穿透到询价单 / 采购合同 / AI 入库单 / 结算单；执行价偏离市场价超阈值自动预警</div>';
}`,Vt=`// 消安云平台 · 页面分片 priceViewHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function priceViewHTML(){
 var rows=PRICES.filter(function(p){return p.src==='内部定额'}).map(function(p){var m=matOf(p.mid);return '<tr><td>'+m.code+'</td><td><b>'+m.name+'</b></td><td>'+m.spec+'</td><td>'+m.unit+'</td><td><b>¥'+p.v.toLocaleString()+'</b></td><td>'+p.date+'</td><td>'+tagHtml('内部定额','blue')+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-toast="演示：引用到报价编制工作台">引用</button><button class="mini-btn mini-no" data-toast="演示：查看价格历史与来源单据">历史</button></span></td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">内部定额条目</div><div class="m-num">1,268 条</div><div class="m-sub">人工 / 材料 / 机械定额</div></div><div class="metric"><div class="m-label">价格来源</div><div class="m-num">5 类</div><div class="m-sub">定额 / 询价 / 合同 / 入库 / 结算</div></div><div class="metric"><div class="m-label">本月沉淀</div><div class="m-num">32 条</div><div class="m-sub">询比价 + 入库回流</div></div></div>'+
 '<div class="pills"><div class="pill active">内部定额 <b>5</b></div><div class="pill" data-toast="演示：跳转价格库全量">价格库 <b>1,268</b></div><div class="pill" data-toast="演示：按来源筛选">按来源 <b>5</b></div></div>'+
 '<div class="fbar"><select><option>类别：全部</option><option>类别：管材</option><option>类别：设备</option><option>类别：人工</option></select><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['材料编码','材料名称','规格','单位','内部定额价','版本 / 生效','来源','操作'],rows,960)+'</div>'+
 '<div class="demo-note">报价时调取当前生效价格版本；每次询价 / 合同 / 入库生成新版本并保留来源单据（红圈 PaaS 价格库沉淀）</div>';
}`,zt=`// 消安云平台 · 页面分片 proj360HTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function proj360HTML(){
 var cards=PROJS.map(function(p){return '<div class="p360-card" data-proj="'+p.id+'"><div class="p360-hd"><b>'+p.id+'</b>'+tagHtml(p.type,p.type==='改造'?'yellow':'blue')+tagHtml(p.mode,p.mode==='自营'?'green':'blue')+'</div><div class="p360-name">'+p.name+'</div><div class="p360-rows"><span>目标成本</span><b>¥'+(p.budget).toFixed(2)+' 万</b></div><div class="p360-rows"><span>当前进度</span><b>'+p.progress+'</b></div><div class="p360-rows"><span>负责人</span><b>'+p.owner+'</b></div><div class="p360-rows"><span>来源</span><b>'+p.from+'</b></div><div class="p360-tip">点击穿透：报价单 / 投标 / 商机 / 客户 → 量价双控六行</div></div>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">360 项目</div><div class="m-num">'+PROJS.length+' 个</div><div class="m-sub">全部支持循环穿透</div></div><div class="metric"><div class="m-label">目标成本合计</div><div class="m-num">¥'+(PROJS.reduce(function(a,p){return a+p.budget},0)).toFixed(2)+' 万</div><div class="m-sub">由报价清单反向生成</div></div><div class="metric"><div class="m-label">票税</div><div class="m-num">开票 ¥1.2 亿</div><div class="m-sub">收票 ¥0.8 亿 · 税负 3.2%</div></div><div class="metric"><div class="m-label">风险项目</div><div class="m-num">1 个</div><div class="m-sub">付款超合同 / 工期逾期</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>项目 360 卡片</h3><div class="right"><span class="link-btn" data-toast="演示：按类型 / 经营方式 / 区域筛选">筛选</span></div></div><div class="card-bd"><div class="p360-grid">'+cards+'</div></div></section>'+
 '<div class="demo-note">点击任一项目卡片进入 360 详情，从项目可反向跳转回报价单、投标、商机、客户（循环穿透）</div>';
}`,$t=`// 消安云平台 · 页面分片 projArchHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projArchHTML(){
 var stages=[['① 立项阶段','1','中标通知书 · 已归档','立项审批表 · 已归档','决策文件 · 缺失'],['② 合同阶段','2','施工合同 · 已归档','补充协议 · 审核中','廉政协议 · 缺失','保险单 · 缺失'],['③ 施工阶段','18','施工方案 / 技术交底 · 已归档','隐蔽验收记录 · 缺 12','材料合格证 · 缺 6'],['④ 竣工阶段','3','竣工图 · 审核中','消防检测报告 · 已归档','结算书 · 待提交'],['⑤ 维保阶段','11','维保合同 · 已归档','月度维保报告 · 缺 8','年度检测报告 · 缺 3']].map(function(s){return '<tr><td><b>'+s[0]+'</b></td><td style="color:var(--red)">缺失 '+s[1]+' 项</td><td>'+s.slice(2).map(function(x){var m=x.indexOf('缺失')>-1;return '<span class="'+(m?'tag r':'tag g')+'">'+x+'</span>'}).join(' ')+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">应归档资料</div><div class="m-num">342 份</div><div class="m-sub">5 个里程碑目录</div></div><div class="metric"><div class="m-label">已归档</div><div class="m-num">298 份</div><div class="m-sub">归档率 87.1%</div></div><div class="metric"><div class="m-label">缺失 / 待审核</div><div class="m-num" style="color:var(--red)">35 项</div><div class="m-sub">缺失红点提醒 · 智能归档</div></div></div>'+
 '<div class="dv-sec">里程碑资料目录（按阶段 · 缺失红点）</div>'+
 '<div class="table-wrap">'+tblHTML(['阶段','缺失情况','资料项'],stages,1180)+'</div>'+
 '<div class="dv-sec">智能归档（审批流附件自动归类 · 相当于「图书管理员」）</div>'+
 '<div class="gs-chips-wrap" style="padding:8px 0"><span class="gs-chip">合同审批附件 → 自动归入 ② 合同阶段</span><span class="gs-chip">入库单 / 发票 → 自动归入 ③ 施工阶段</span><span class="gs-chip" data-toast="演示：扫描资料目录并智能归档">+ 发起智能归档</span></div>'+
 '<div class="dv-sec">工程 / 财务审核</div>'+
 '<div class="table-wrap">'+tblHTML(['资料','所属项目','提交人','审核节点','状态'],[
  ['竣工图（电子版）','XX政务中心','何军','工程审核',tg('o','待审核')],
  ['消防检测报告','XX医院二期','质检组','技术审核',tg('g','已归档')],
  ['结算书','XX产业园一期','成控部','财务审核',tg('r','未通过 · 需补签章')]],1180)+'</div>'+
 '<div class="demo-note">工程资料与财务资料需分别审核，未通过视为未归档；验收资料、消防报告归入验收目录</div>';
}`,Zt=`// 消安云平台 · 页面分片 projBoardHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projBoardHTML(){
 var n=PROJS.length,nOn=0,nDone=0,nWm=0,nJv=0,nRisk=0;
 PROJS.forEach(function(x){if(x.status==='在建')nOn++;if(x.status==='已竣工')nDone++;if(x.type==='维保')nWm++;if(x.mode==='联营')nJv++;if(x.risk===1)nRisk++});
 var tiles=[['项目总数',String(n),''],['在建项目',String(nOn),''],['已竣工 / 已结算',String(nDone),'g'],['维保项目',String(nWm),''],['联营项目',String(nJv),''],['风险项目',String(nRisk),'r']];
 var grp={};PROJS.forEach(function(x){var g=x.type==='维保'?'维保':(x.type==='改造'?'改造 / 维修':'新建');if(!grp[g])grp[g]={n:0,on:0,jv:0,amt:0};grp[g].n++;if(x.status==='在建')grp[g].on++;if(x.mode==='联营')grp[g].jv++;grp[g].amt+=(x.cont||0)});
 var rows=['新建','改造 / 维修','维保'].map(function(g){var o=grp[g]||{n:0,on:0,jv:0,amt:0};return '<tr><td>'+g+'</td><td>'+o.n+'</td><td>'+(o.n/n*100).toFixed(1)+'%</td><td>'+o.on+'</td><td>'+o.jv+'</td><td>¥'+nfmt(o.amt)+' 万</td></tr>'}).join('');
 var cards=PROJS.slice(0,5).map(function(c){var isR=c.risk===1;return '<div class="p360-card" data-proj="'+c.id+'"><div class="p360-hd"><b>'+(isR?'风险项目':(c.status||'在建'))+'</b>'+tagHtml(isR?'风险':'正常',isR?'red':'green')+'</div><div class="p360-name">'+c.name+' · '+(c.stage||'')+'</div><div class="p360-rows"><span>类型 / 方式 / 区域</span><b>'+c.type+' · '+c.mode+' · '+(c.region||'—')+'</b></div><div class="p360-rows"><span>经营情况</span><b>'+(isR?'红灯：进度滞后 · 目标成本 ¥'+nfmt(c.budget)+' 万':'进度 '+c.progress+' · 目标成本 ¥'+nfmt(c.budget)+' 万')+'</b></div><div class="p360-tip">点击穿透项目 360 / 合同 / 成本 / 风险</div></div>'}).join('');
 return '<div class="metrics">'+tiles.map(function(t){return '<div class="metric"><div class="m-label">'+t[0]+'</div><div class="m-num">'+t[1]+'</div><div class="m-sub">'+t[2]+'</div></div>'}).join('')+'</div>'+
 '<div class="dv-sec">项目组合统计（按类型 · 区域 · 经营方式）</div>'+
 '<div class="table-wrap">'+tblHTML(['项目类型','项目数','占比','在建','联营','合同金额'],rows,760)+'</div>'+
 '<div class="dv-sec">项目组合看板（点击卡片穿透 360）</div><div class="p360-grid">'+cards+'</div>';
}`,Ut=`// 消安云平台 · 页面分片 projChangeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projChangeHTML(){
 var rows=[['BG-2609-03','XX医院二期','01-02 喷淋头','22.0 元','20.0 元','-2.0 元','删除 300 只 · 大项自动扣减 ¥6,600','09-16','王强','已留痕'],['BG-2609-02','XX物流园','03-01 风管','342 元','358 元','+16 元','材料涨价 · 签证待确认','09-15','赵磊','已留痕'],['BG-2609-01','XX产业园','02-01 烟感','—','—','—','设计变更：新增 80 只','09-12','李敏','已留痕']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td><td>'+r[8]+'</td><td>'+tagHtml(r[9],'green')+'</td></tr>'}).join('');
 var visa=[['QS-2609-04','XX医院二期','管井变更','¥18,600','签证资料 3 份 · 照片 12 张','09-16','已回传'],['QS-2609-03','XX物流园','风管顺延','¥9,200','监理确认单 · 影像','09-15','已回传'],['QS-2609-02','XX产业园','井道加宽','¥6,800','变更单 + 现场照片','09-12','待回传']].map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],r[6]==='已回传'?'green':'red')+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">变更留痕</div><div class="m-num">3 项</div><div class="m-sub">22→20 元 · 删除自动扣减</div></div><div class="metric"><div class="m-label">签证待确认</div><div class="m-num">1 项</div><div class="m-sub">风管涨价 ¥9,200</div></div><div class="metric"><div class="m-label">费用同步预算</div><div class="m-num">✓</div><div class="m-sub">变更金额自动回写目标成本</div></div></div>'+
 '<div class="dv-sec">变更发起与留痕（清单项修改 · 版本对比 · 大项自动扣减）</div>'+
 '<div class="table-wrap">'+tblHTML(['变更单','项目','清单项','原单价','新单价','差额','影响说明','日期','责任人','状态'],rows,1280)+'</div>'+
 '<div class="dv-sec">补充协议 / 签证资料回传</div>'+
 '<div class="table-wrap">'+tblHTML(['签证单','项目','事项','金额','资料','日期','状态'],visa,1180)+'</div>'+
 '<div class="mat-opbar"><span class="opb-title">变更触发补充协议 / 签证，费用同步预算，资料回传闭环后才算关闭</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：发起清单项变更">发起变更</button><button class="btn btn-ghost" data-toast="演示：生成补充协议">补充协议</button><button class="btn btn-primary" data-toast="演示：上传签证资料回传">回传资料</button></div>'+
 '<div class="demo-note">变更留痕：22 元改 20 元、删除项自动扣减大项金额；费用同步预算，资料回传闭环</div>';
}`,Yt=`// 消安云平台 · 页面分片 projCloseHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projCloseHTML(){
 var rows=[['销售合同（收入）','XX医院二期','¥1,860 万','已收 95%','质保金 5% · 2027-11-30 到期'],['材料合同','钢贸 / 管网','¥168.3 万','已付 100%','已结算'],['劳务合同','风管班组','¥128,000','已付 98%','结算单已确认'],['分包合同','消防电分包','¥72 万','已付 85%','待收票'],['检测服务','第三方检测','¥18 万','已付 100%','报告已归档']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td></tr>'}).join('');
 var audit=[['XX政务中心消防工程','¥326 万','结算已确认','92%','后评估：报价毛利 22% vs 实际 19.6%（风管损耗超预期）','已关闭'],['XX学校宿舍改造','¥118 万','结算已确认','100%','经验：勘察照片完整 → 报价偏差 <1%','已关闭']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+tagHtml(r[5],'green')+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">待结算项目</div><div class="m-num">2 个</div><div class="m-sub">XX医院二期 · XX产业园</div></div><div class="metric"><div class="m-label">质保金待收</div><div class="m-num">¥93 万</div><div class="m-sub">4 个项目 · 到期提醒已设</div></div><div class="metric"><div class="m-label">已关闭</div><div class="m-num">4 个</div><div class="m-sub">后评估 100% 完成</div></div></div>'+
 '<div class="dv-sec">项目结算（以竣工图 / 签证单 / 变更单为依据 · 明确审计时限）</div>'+
 '<div class="table-wrap">'+tblHTML(['合同','关联项目','金额','收付状态','结算 / 质保金'],rows,1180)+'</div>'+
 '<div class="dv-sec">项目关闭与后评估（经验教训 · 知识库沉淀）</div>'+
 '<div class="table-wrap">'+tblHTML(['项目','结算金额','结算状态','归档率','后评估结论','状态'],audit,1180)+'</div>'+
 '<div class="mat-opbar"><span class="opb-title">关闭前检查：资料归档 100% · 结算确认 · 质保金登记 · 后评估完成</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：发起结算单">发起结算</button><button class="btn btn-ghost" data-toast="演示：提交审计时限跟踪">提交审计</button><button class="btn btn-primary" data-toast="演示：项目关闭并生成后评估">关闭项目</button></div>'+
 '<div class="demo-note">后评估结论沉淀到组织过程资产 / 知识库，反哺下次投标报价与成本测算</div>';
}`,tn=`// 消安云平台 · 页面分片 projGanttHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projGanttHTML(){
 var rows=[
  ['1','消防水系统 / 管网安装','09-01','09-20','09-01','09-18','96%','王强','8% 提前'],
  ['2','消防水系统 / 喷淋头安装','09-15','10-05','09-16','—','35%','王强','—'],
  ['3','消防电系统 / 穿线布管','09-05','09-25','09-06','09-24','92%','李敏','—'],
  ['4','报警系统 / 设备安装','09-25','10-15','—','—','0%','李敏','—'],
  ['5','防排烟 / 风管安装','09-10','09-30','09-12','—','40%','赵磊','滞后 2 天'],
  ['6','系统调试 / 第三方检测','10-20','11-05','—','—','0%','质检组','—']].map(function(r){var lag=r[8].indexOf('滞后')>-1;var done=r[8].indexOf('提前')>-1;
  var pct=parseInt(r[6])||0;
  return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td><div class="gbar"><div class="gfill" style="width:'+pct+'%'+(lag?';background:var(--orange)':'')+'"></div></div><span style="font-size:12px;color:var(--t2)">'+r[6]+'</span></td><td>'+r[7]+'</td><td>'+(lag?tg('r',r[8]):(done?tg('g',r[8]):(r[8]==='—'?tg('gray','—'):tg('g',r[8]))))+'</td></tr>'}).join('');
 var logs=[['09-17','王强','管网试压完成 3 段，明日喷淋支管','正常'],['09-17','李敏','报警总线穿线 92%，剩余 3F 井道','正常'],['09-16','赵磊','风管班组到货延迟，已申请顺延','滞后']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+tagHtml(r[3],r[3]==='滞后'?'red':'green')+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">计划完成率</div><div class="m-num">78%</div><div class="m-sub">6 项工序 · 2 项提前</div></div><div class="metric"><div class="m-label">滞后工序</div><div class="m-num">1 项</div><div class="m-sub">防排烟风管安装</div></div><div class="metric"><div class="m-label">下一里程碑</div><div class="m-num">10-20</div><div class="m-sub">系统调试启动</div></div></div>'+
 '<div class="dv-sec">进度计划 / 横道图（计划 vs 实际）</div>'+
 '<div class="table-wrap">'+tblHTML(['序号','工序','计划开始','计划结束','实际开始','实际完成','进度条 / 完成%','负责人','状态'],rows,1180)+'</div>'+
 '<div class="dv-sec">工序汇报</div>'+
 '<div class="table-wrap">'+tblHTML(['日期','汇报人','完成内容','状态'],logs,1180)+'</div>'+
 '<div class="dv-sec">滞后预警</div><div class="demo-note" style="margin-top:0"><span style="color:#ad6800;font-weight:600">⚠ 防排烟 / 风管安装</span>：计划 09-30 完成，实际仅 40%，滞后 2 天，超阈值已自动预警 → 已触发「签证资料回传」待确认</div>'+
 '<div class="mat-opbar"><span class="opb-title">横道图视图：甘特条表示计划区间，填充表示实际进度</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：导入 MS Project 计划">导入计划</button><button class="btn btn-ghost" data-toast="演示：新增工序 / 里程碑">新增工序</button><button class="btn btn-primary" data-toast="演示：保存并同步 WBS">保存同步</button></div>';
}`,nn=`// 消安云平台 · 页面分片 projLaborHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projLaborHTML(){
 var teams=[['风管班组（赵大强）','8 人','5 个','09-01 进场','计件 + 出勤','¥128,000','正常'],['水电班组（刘建国）','12 人','6 个','09-02 进场','出勤计日','¥96,000','正常'],['消防电班组（孙立）','6 人','3 个','09-05 进场','计件 + 出勤','¥72,000','待审核']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+tagHtml(r[4],'blue')+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],r[6]==='正常'?'green':'yellow')+'</td></tr>'}).join('');
 var workers=[['张某某','风管班组','5301XXX','尾号 8832','已购','已完成 12 学时','09-17 ✓'],['李某某','水电班组','5301XXX','尾号 6601','已购','已完成 12 学时','09-17 ✓'],['王某某','消防电班组','5301XXX','尾号 1129','待购','—','09-16 ✓']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+tagHtml(r[4],r[4]==='已购'?'green':'red')+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td></tr>'}).join('');
 var pay=[['风管班组','赵大强','09-01 ~ 09-15','计件 128,000 + 出勤 15 天','超领损耗扣款 -2,300','¥125,700','待付款'],['水电班组','刘建国','09-01 ~ 09-15','计日 96,000','—','¥96,000','已付'],['消防电班组','孙立','09-05 ~ 09-15','计件 72,000','旷工扣款 -600','¥71,400','待审核']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td style="color:var(--red)">'+r[4]+'</td><td>'+r[5]+'</td><td>'+tagHtml(r[6],r[6]==='已付'?'green':(r[6]==='待付款'?'yellow':'blue'))+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">班组</div><div class="m-num">3 个</div><div class="m-sub">26 人实名在册</div></div><div class="metric"><div class="m-label">今日出勤</div><div class="m-num">24 人</div><div class="m-sub">水印拍照 + 勾选统计</div></div><div class="metric"><div class="m-label">待结算</div><div class="m-num">¥197,100</div><div class="m-sub">超领 / 损耗扣款已扣</div></div></div>'+
 '<div class="dv-sec">劳务班组</div><div class="table-wrap">'+tblHTML(['班组','人数','工种','进场','结算方式','累计应付','状态'],teams,1080)+'</div>'+
 '<div class="dv-sec">人员实名制（身份证 · 银行卡 · 保险 · 安全教育）</div><div class="table-wrap">'+tblHTML(['姓名','班组','身份证号','银行卡','保险','安全教育','今日出勤'],workers,1180)+'</div>'+
 '<div class="dv-sec">出勤拍照水印（证据留痕）</div>'+
 '<div class="gs-chips-wrap" style="padding:8px 0"><span class="gs-chip">09-17 早 · 风管班组 · 8 人合影（水印）</span><span class="gs-chip">09-17 早 · 水电班组 · 12 人（水印）</span><span class="gs-chip" data-toast="演示：上传带水印出勤照片">+ 拍照上传</span></div>'+
 '<div class="dv-sec">计件 + 出勤双风控 · 劳务结算 / 扣款</div>'+
 '<div class="table-wrap">'+tblHTML(['班组','负责人','结算周期','结算依据','扣款 / 核减','应付金额','状态'],pay,1180)+'</div>'+
 '<div class="demo-note">出勤以「拍照水印 + 勾选人员」双证据统计，防范恶意讨薪；结算时超领 / 损耗 / 浪费自动生成扣款并回写财务付款，避免财务不知情多付</div>';
}`,an=`function projListHTML(){
 window.PROJF=window.PROJF||{regions:{},inds:{},owners:{},status:'all',kw:'',page:1,per:8};
 var F=window.PROJF;
 var cnt=function(list,fn){var m={};list.forEach(function(x){var k=fn(x);if(k!=null)m[k]=(m[k]||0)+1});return m};
 var amt=function(list,fn){var m={};list.forEach(function(x){var k=fn(x);if(k!=null)m[k]=(m[k]||0)+(x.cont||0)});return m};
 var cReg=cnt(PROJS,function(p){return p.region});
 var cInd=cnt(PROJS,function(p){return p.industry});
 var cOwn=cnt(PROJS,function(p){return p.owner});
 var cSta=cnt(PROJS,function(p){return p.status});
 var aReg=amt(PROJS,function(p){return p.region});
 var aInd=amt(PROJS,function(p){return p.industry});
 var aOwn=amt(PROJS,function(p){return p.owner});
 var riskN=PROJS.filter(function(p){return p.risk===1}).length;
 var list=PROJS.filter(function(p){
  if(Object.keys(F.regions).length&&!F.regions[p.region])return false;
  if(Object.keys(F.inds).length&&!F.inds[p.industry])return false;
  if(Object.keys(F.owners).length&&!F.owners[p.owner])return false;
  if(F.status==='risk'?p.risk!==1:(F.status!=='all'&&p.status!==F.status))return false;
  if(F.kw&&p.name.indexOf(F.kw)<0&&p.id.toLowerCase().indexOf(F.kw.toLowerCase())<0&&(p.customer||'').indexOf(F.kw)<0)return false;
  return true});
 var pages=Math.max(1,Math.ceil(list.length/F.per)),pg=Math.min(F.page,pages);F.page=pg;
 var rows=list.slice((pg-1)*F.per,pg*F.per);
 var tAmt=list.reduce(function(a,p){return a+(p.cont||0)},0);
 var tIng=list.filter(function(p){return p.status==='在建'}).length;
 var tRisk=list.filter(function(p){return p.risk===1}).length;
 var chk=function(){return '<span class="ck"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg></span>'};
 var fitem=function(dim,val,on,cntN,amtN){return '<div class="fitem'+(on?' sel':'')+'" data-pf-fac="'+dim+'|'+val+'">'+chk()+val+'<span class="cnt"><span class="amt num">'+amtN+'</span><span class="n num">'+cntN+'</span></span></div>'};
 var fgroup=function(dim,ic,icCls,name,items,open){return '<div class="fgroup'+(open?' open':'')+'" data-dim="'+dim+'"><div class="fgroup-h" data-pf-grp="'+dim+'"><span class="gi '+icCls+'">'+ic+'</span>'+name+'<svg class="caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></div><div class="fgroup-b">'+items+'</div></div>'};
 var regItems=Object.keys(cReg).map(function(r){return fitem('regions',r,F.regions[r]||false,cReg[r],'¥'+nfmt(Math.round(aReg[r]))+'万')}).join('');
 var indItems=Object.keys(cInd).map(function(i){return fitem('inds',i,F.inds[i]||false,cInd[i],'¥'+nfmt(Math.round(aInd[i]))+'万')}).join('');
 var ownItems=Object.keys(cOwn).map(function(o){return fitem('owners',o,F.owners[o]||false,cOwn[o],'¥'+nfmt(Math.round(aOwn[o]))+'万')}).join('');
 var selN=Object.keys(F.regions).length+Object.keys(F.inds).length+Object.keys(F.owners).length;
 var chip=function(dim,val){var dn={regions:'地区',inds:'行业',owners:'负责人'}[dim];return '<span class="chip"><span class="d">'+dn+'</span>'+val+'<span class="x" data-pf-chip="'+dim+'|'+val+'">✕</span></span>'};
 var chips='';for(var d in F.regions)chips+=chip('regions',d);for(var d2 in F.inds)chips+=chip('inds',d2);for(var d3 in F.owners)chips+=chip('owners',d3);
 var hasFacet=selN>0;
 var stab=function(k,name,c,cls,on){return '<span class="stab'+(cls?' '+cls:'')+(on?' active':'')+'" data-pf-st="'+k+'">'+name+' <span class="c num" data-pf-cnt="'+k+'">'+c+'</span></span>'};
 var stabRisk=F.status==='risk';
 var svgWarn='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
 var tr=function(p){
  var prg=parseFloat(String(p.progress||'0').replace('%',''))||0;
  var barC=prg>=100?'var(--green)':(p.risk===1?'var(--red)':(prg>=60?'var(--blue)':'#7fa8f0'));
  var mgCls=p.status==='待启动'?'n':(p.gm>=20?'g':(p.gm>=15?'a':'r'));
  var mgTxt=p.status==='待启动'?'目标 '+(p.gm||0)+'%':(p.gm||0)+'%';
  var avCls={王强:'b1',李敏:'b2',孙倩:'b3'}[p.owner]||'b4';
  return '<tr data-proj="'+p.id+'"'+(p.risk===1?' class="hl"':'')+'>'+
  '<td><div class="p-name"><span class="nm">'+p.name+'</span><span class="cd">'+p.id+'</span></div></td>'+
  '<td><div class="reg"><span>'+p.region+'</span><i></i><span class="ind">'+p.industry+'</span></div></td>'+
  '<td class="rt num money">¥'+nfmt(p.cont||0)+' 万</td>'+
  '<td><span class="mg '+mgCls+'">'+mgTxt+'</span></td>'+
  '<td><div class="pbar"><span class="bar"><i style="width:'+Math.max(2,prg)+'%;background:'+barC+'"></i></span><b class="num">'+prg+'%</b></div></td>'+
  '<td><div class="st-wrap"><span class="tag '+(p.status==='在建'?'green':(p.status==='待启动'?'gray':(p.status==='收尾中'?'blue':'amber')))+'"><i></i>'+p.status+'</span>'+(p.risk===1?'<span class="risk-t">'+svgWarn+'滞后</span>':'')+'</div></td>'+
  '<td><div class="who"><span class="av '+avCls+'">'+p.owner.slice(0,1)+'</span>'+p.owner+'</div></td>'+
  '<td><div class="ops"><span class="op">进入</span><span class="op more">⋯</span></div></td></tr>'};
 var rowsHtml=list.length?rows.map(tr).join(''):'';
 var icK1='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>';
 var icK2='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
 var icK3='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>';
 var icK4='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
 return '<div class="pj-layout"><aside class="facets"><div class="facet-head"><h3>维度筛选</h3><span class="clear'+(selN?'':' off')+'" data-pf-fclear="1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>清空</span></div>'+
 fgroup('regions','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>','blue','按地区',regItems,true)+
 fgroup('inds','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V9l6 3v9"/><path d="M8 9h.01M8 13h.01M8 17h.01"/></svg>','amber','按行业',indItems,true)+
 fgroup('owners','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>','purple','按负责人',ownItems,true)+
 '<div class="fsum"><span>合计</span><span class="num">'+list.length+' 个 · ¥'+nfmt(Math.round(tAmt))+' 万</span></div></aside>'+
 '<main class="main"><div class="crumbs">项目现场 <span>/</span> 项目主数据 <span>/</span> <b>项目列表 / 立项</b></div>'+
 '<div class="page-head"><h1>项目列表 <span class="cnt num">共 '+list.length+' 个</span></h1>'+
 '<div class="head-tools"><div class="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input data-pf-kw placeholder="搜索项目…" value="'+(F.kw||'')+'"/></div>'+
 '<div class="actions"><button class="btn" data-pf-board="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>组合看板</button>'+
 '<button class="btn" data-toast="演示：导出 Excel / PDF（模拟下载）"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>导出</button>'+
 '<button class="btn btn-primary" data-toast="演示：新建立项向导（新建 / 改造 / 维保）"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>新建立项</button></div></div></div>'+
 '<div class="kpis">'+
 '<div class="kpi"><div class="lb">'+icK1+'当前项目数</div><div class="v num">'+list.length+'<small>个</small></div></div>'+
 '<div class="kpi"><div class="lb">'+icK2+'合同额合计</div><div class="v num">¥'+nfmt(Math.round(tAmt))+'<small>万</small></div></div>'+
 '<div class="kpi"><div class="lb">'+icK3+'在建</div><div class="v num">'+tIng+'<small>个</small></div></div>'+
 '<div class="kpi"><div class="lb">'+icK4+'滞后预警</div><div class="v num'+(tRisk?' bad':'')+'">'+tRisk+'<small>个</small></div></div></div>'+
 '<div class="panel"><div class="tool-top">'+
 stab('all','全部',list.length,'',F.status==='all')+
 stab('在建','在建',cSta['在建']||0,'',F.status==='在建')+
 stab('risk','滞后预警',riskN,'alert',stabRisk)+
 stab('待启动','待启动',cSta['待启动']||0,'',F.status==='待启动')+
 stab('收尾中','收尾中',cSta['收尾中']||0,'',F.status==='收尾中')+
 stab('已竣工','已竣工',cSta['已竣工']||0,'',F.status==='已竣工')+
 '</div>'+
 '<div class="chips'+(hasFacet||F.status!=='all'||F.kw?' show':'')+'"><span class="lb">已选：</span>'+chips+'<span class="clear-all" data-pf-clear="1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>清空全部</span></div>'+
 '<div class="tbl-wrap"><table class="tbl pj-tbl"><thead><tr><th>项目</th><th>地区 · 行业</th><th class="rt">合同额</th><th>毛利率</th><th style="width:150px">进度</th><th>状态</th><th>负责人</th><th style="width:100px">操作</th></tr></thead>'+
 '<tbody>'+rowsHtml+'</tbody></table>'+
 '<div class="empty'+(list.length?'':' show')+'"><div class="eic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div><b>没有符合条件的项目</b>试试减少维度筛选条件，或清空后重新选择<br><button class="btn" data-pf-clear="1">清空筛选条件</button></div></div>'+
 '<div class="tbl-foot"><span>共 <b class="num">'+list.length+'</b> 条记录</span><div class="pager">'+
 (pg>1?'<span class="pg" data-pf-pg="'+(pg-1)+'">‹</span>':'<span class="pg dis">‹</span>')+
 '<span class="pg on num">'+pg+'</span>'+
 (pg<pages?'<span class="pg" data-pf-pg="'+(pg+1)+'">›</span>':'<span class="pg dis">›</span>')+
 '</div></div></div>'+
 '<div class="footer-note">维度树支持按租户配置（可增加：项目类型 / 经营方式 / 部门等维度）· 数量与金额实时统计 · 点击行进入项目 360 详情</div></main></div>';
}
`,sn=`// 消安云平台 · 页面分片 projMonitorHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projMonitorHTML(){
 var rows=[
  ['01-01','镀锌钢管（管网）','12,000 m','¥150','量价双控','12,000','¥168','11,000','¥166','10,800','¥165','10,800','¥165','10,800','¥165','正常'],
  ['01-02','喷淋头','8,600 只','¥27','量价双控','8,600','¥28','8,200','¥27.5','7,900','¥27.2','7,900','¥27.2','7,900','¥27.2','正常'],
  ['02-01','点型烟感','1,240 只','¥86','仅控量','1,240','—','1,180','—','1,150','—','1,150','—','1,150','—','正常'],
  ['03-01','镀锌钢板风管','3,800 ㎡','¥342','量价双控','3,800','¥345','3,200','¥348','3,050','¥351','3,050','¥351','2,980','¥349','超量 +2.3%'],
  ['05-02','应急疏散指示','620 套','¥158','仅控价','620','¥158','—','¥160','—','¥163','—','¥163','—','¥163','超价 +3.2%']].map(function(r){var over=r[15]!=='正常';
  return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+tagHtml(r[4],r[4]==='量价双控'?'red':'blue')+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td><td>'+r[8]+'</td><td>'+r[9]+'</td><td>'+r[10]+'</td><td>'+r[11]+'</td><td>'+r[12]+'</td><td>'+r[13]+'</td><td>'+r[14]+'</td><td>'+(over?tg('r',r[15]):tg('g',r[15]))+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">目标成本</div><div class="m-num">¥1,201.8 万</div><div class="m-sub">由报价清单反向生成</div></div><div class="metric"><div class="m-label">已发生成本</div><div class="m-num">¥886.4 万</div><div class="m-sub">申请 / 合同 / 入库 / 结算 / 支付</div></div><div class="metric"><div class="m-label">偏差</div><div class="m-num" style="color:#ad6800">+2 项</div><div class="m-sub">超量 1 · 超价 1 · 红灯已预警</div></div></div>'+
 '<div class="dv-sec">六行量价对比（预算 → 申请 → 合同 → 入库 → 结算 → 支付）</div>'+
 '<div class="table-wrap"><div style="overflow:auto"><table class="tbl" style="min-width:1500px"><thead><tr><th>成本项</th><th>名称</th><th>预算量 / 单价</th><th>控制方式</th><th colspan="2">申请</th><th colspan="2">合同</th><th colspan="2">入库</th><th colspan="2">结算</th><th colspan="2">支付</th><th>状态</th></tr><tr style="background:var(--bg)"><th></th><th></th><th></th><th></th><th>量</th><th>价</th><th>量</th><th>价</th><th>量</th><th>价</th><th>量</th><th>价</th><th>量</th><th>价</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
 '<div class="mat-opbar"><span class="opb-title">红灯不阻断业务，但强制暴露风险：触发变更 / 签证或班组扣款，资料回传后才可继续采购</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：导出六行量价报表">导出报表</button><button class="btn btn-ghost" data-toast="演示：发起变更签证">发起变更</button><button class="btn btn-primary" data-toast="演示：查看未关联数据并销项">未关联数据 / 销项</button></div>'+
 '<div class="demo-note">先发生后关联：无预算先采购 / 先付款进入「未关联数据」，导入清单后手动关联成本项并最终销项，确保每笔付款有成本归口</div>';
}`,en=`// 消安云平台 · 页面分片 projQaHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projQaHTML(){
 var items=[['动火作业','现场核查','是否办证','必查'],['临时用电','现场核查','三级配电 / 漏保','必查'],['消防产品进场','资料核查','3C 认证 / 检验报告','必查'],['隐蔽工程','验收核查','影像留存 / 签证','必查'],['高处作业','现场核查','安全带 / 防护','必查']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+tagHtml(r[3],'red')+'</td></tr>'}).join('');
 var rect=[['R-2609-07','XX物流园','临时用电不规范','09-16 发现','王强','09-17 整改完成','待复查','o'],['R-2609-06','XX广场','动火作业证缺失','09-15 发现','赵磊','已整改回传','已复查通过','g'],['R-2609-05','XX学校','卷帘门调试异常','09-14 发现','孙倩','整改中','复查中','b']].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+tagHtml(r[7],r[7]==='g'?'green':(r[7]==='o'?'orange':'blue'))+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">待整改</div><div class="m-num">1 项</div><div class="m-sub">临时用电 · 今日 18:00 前</div></div><div class="metric"><div class="m-label">待复查</div><div class="m-num">2 项</div><div class="m-sub">整改完成待确认</div></div><div class="metric"><div class="m-label">本周巡检</div><div class="m-num">14 次</div><div class="m-sub">覆盖 5 个在建项目</div></div></div>'+
 '<div class="dv-sec">标准检查项库（巡检必须逐项检查，不能只写「一切正常」）</div>'+
 '<div class="table-wrap">'+tblHTML(['检查项','类型','检查要点','要求'],items,1080)+'</div>'+
 '<div class="dv-sec">整改闭环（发现 → 整改 → 复查）</div>'+
 '<div class="table-wrap">'+tblHTML(['整改单','项目','问题描述','发现日期','责任人','整改反馈','复查','状态'],rect,1180)+'</div>'+
 '<div class="mat-opbar"><span class="opb-title">闭环规则：发现必须拍照记录，整改必须回传，复查通过才关闭</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：发起巡检并逐项检查">发起巡检</button><button class="btn btn-ghost" data-toast="演示：新增标准检查项">新增检查项</button><button class="btn btn-primary" data-toast="演示：登记整改单并派发责任人">登记整改</button></div>';
}`,dn=`// 消安云平台 · 页面分片 projRiskHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projRiskHTML(){
 var rows=[['资金','XX商业广场综合体','采购付款超合同比例 +12%','高','r','付款洞察红灯 · 老板特批后可付','处理中'],['进度','XX物流园改造','防排烟风管安装滞后 2 天','高','r','已触发签证资料回传','处理中'],['税务','XX医院二期','税率 6% 与项目类型待核','中','o','财务核对中','监控'],['证书','XX厂房维保','操作员证书 76 天后到期','中','o','复训已报名','监控'],['合同','XX学校改造','质保金 2026-11-30 到期','低','g','到期提醒已设置','正常'],['成本','XX产业园','烟感超价 +3.2%（市场价上涨）','低','g','待调价审批','监控']].map(function(r){return '<tr><td>'+tagHtml(r[0],'blue')+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+tagHtml(r[3],r[3]==='高'?'red':(r[3]==='中'?'orange':'green'))+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">高风险</div><div class="m-num" style="color:var(--red)">2</div><div class="m-sub">资金 · 进度</div></div><div class="metric"><div class="m-label">中风险</div><div class="m-num" style="color:#ad6800">3</div><div class="m-sub">税务 · 证书 · 合同</div></div><div class="metric"><div class="m-label">低风险</div><div class="m-num">2</div><div class="m-sub">成本 · 供应商</div></div></div>'+
 '<div class="dv-sec">风险登记册（资金 / 合同 / 税务 / 采购 / 安全 / 成本 / 供应商 · 按类型亮灯）</div>'+
 '<div class="table-wrap">'+tblHTML(['风险类型','关联项目','风险描述','等级','来源 / 预警','当前处理','状态'],rows,1180)+'</div>'+
 '<div class="dv-sec">工期倒计时 / 逾期预警</div>'+
 '<div class="p360-grid"><div class="p360-card"><div class="p360-hd"><b>XX医院二期</b><span class="tag r">09-28</span></div><div class="p360-name">竣工验收节点</div><div class="p360-rows"><span>剩余</span><b style="color:#ad6800">11 天</b></div><div class="p360-rows"><span>前置条件</span><b>调试完成 · 资料齐全</b></div></div><div class="p360-card"><div class="p360-hd"><b>XX产业园一期</b><span class="tag y">09-30</span></div><div class="p360-name">隐蔽验收节点</div><div class="p360-rows"><span>剩余</span><b>13 天</b></div><div class="p360-rows"><span>前置条件</span><b>隐蔽影像 / 签证回传</b></div></div><div class="p360-card"><div class="p360-hd"><b>XX学校宿舍</b><span class="tag g">10-12</span></div><div class="p360-name">中间检查节点</div><div class="p360-rows"><span>剩余</span><b>25 天</b></div><div class="p360-rows"><span>前置条件</span><b>喷淋支管完成 80%</b></div></div></div>'+
 '<div class="mat-opbar"><span class="opb-title">风险亮灯来源：付款智能洞察 · 进度偏差 · 证书到期 · 发票异常 · 供应商评级</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：新增风险登记">登记风险</button><button class="btn btn-ghost" data-toast="演示：配置风险触发条件 / 提醒人">配置规则</button><button class="btn btn-primary" data-toast="演示：一键提醒全部责任人">提醒责任人</button></div>';
}`,rn=`// 消安云平台 · 页面分片 projWbsHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function projWbsHTML(){
 var rows=[
  ['1','消防水系统','—','—','—','2 项','¥224.7 万'],
  ['1.1','├ 管材 / 管件','01-01','量价双控','镀锌钢管 DN100 · 12,000m','1 项','¥196.8 万'],
  ['1.2','├ 喷淋','01-02','量价双控','喷淋头 ZSTX15 · 8,600 只','1 项','¥27.9 万'],
  ['2','消防电系统','—','—','—','3 项','¥68.4 万'],
  ['2.1','├ 火灾报警','02-01','仅控量','点型烟感 JTY-GD-3000 · 1,240 只','1 项','¥11.5 万'],
  ['2.2','├ 应急疏散','02-02','仅控量','应急灯 / 疏散指示 · 620 套','1 项','¥9.8 万'],
  ['3','防排烟系统','—','—','—','2 项','¥156.0 万'],
  ['3.1','├ 风管','03-01','量价双控','镀锌钢板风管 · 3,800 ㎡','1 项','¥128.6 万'],
  ['4','调试 / 检测 / 验收','—','—','—','4 项','¥41.2 万'],
  ['4.1','├ 系统调试','04-01','不控','第三方检测报告','1 项','¥18.0 万']].map(function(r){var lv=r[0].split('.').length;
  return '<tr><td>'+r[0]+'</td><td style="padding-left:'+(lv*16)+'px">'+r[1]+'</td><td>'+r[2]+'</td><td>'+tagHtml(r[3],r[3]==='量价双控'?'red':(r[3]==='仅控量'?'blue':'gray'))+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td></tr>'}).join('');
 return '<div class="wb-top"><b>WBS 工作分解结构：</b>以「工程 → 专业 → 工序」树状分解，每个 WBS 节点关联清单成本项（cost_item）与控制方式，是进度跟踪与成本归集的核心骨架</div>'+
 '<div class="pills"><div class="pill active">全部 <b>10</b></div><div class="pill">一级 · 工程 <b>4</b></div><div class="pill">二级 · 专业 <b>4</b></div><div class="pill">三级 · 工序 <b>2</b></div></div>'+
 '<div class="fbar"><select><option>控制方式：全部</option><option>量价双控</option><option>仅控量</option><option>仅控价</option><option>不控</option></select><input class="fkw" placeholder="搜索 WBS 节点 / 清单项…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="mat-opbar"><span class="opb-title">WBS 共 <b>10</b> 节点 · 关联成本项 <b>10</b> · 已控量价 <b>6</b></span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：新增一级 / 子级 WBS 节点">'+ICON.plus+'<span>新增节点</span></button><button class="btn btn-ghost" data-toast="演示：导入投标清单生成 WBS">导入清单生成</button><button class="btn btn-ghost" data-toast="演示：编辑节点关联成本项">编辑</button><button class="btn btn-primary" data-toast="演示：保存 WBS 并同步进度计划">保存并生成进度计划</button></div>'+
 '<div class="table-wrap">'+tblHTML(['层级','WBS 节点','关联成本项','控制方式','范围 / 工程量','子项','目标成本'],rows,1080)+'</div>'+
 '<div class="demo-note">WBS 是成本控制、进度跟踪和跨模块协同的核心：节点状态（未开始 / 进行中 / 已完成 / 滞后）回写进度监控与六行量价</div>';
}`,on=`// 消安云平台 · 页面分片 ptypeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function ptypeHTML(){
 return '<div class="metrics"><div class="metric"><div class="m-label">项目类型</div><div class="m-num">3 类</div><div class="m-sub">新建 / 改造 / 维保</div></div><div class="metric"><div class="m-label">经营方式</div><div class="m-num">2 种</div><div class="m-sub">自营 / 联营</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>项目类型与流程差异</h3></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['项目类型','售前环节','成本源头','适用场景'],[
  ['新建','无现场勘察','新建清单','新增消防工程'],
  ['改造 / 维修','先勘察后报价','报价单（勘察联动价格库）','既有设施改造 / 维修'],
  ['维保','续签商机','维保合同','年度维保服务']].map(function(r){return '<tr><td>'+tagHtml(r[0],r[0]==='改造 / 维修'?'yellow':'blue')+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>'}).join(''),960)+'</div></div></section>'+
 '<section class="card"><div class="card-hd"><h3>经营方式</h3></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['经营方式','管理要点','合规要求'],[
  ['自营','精细化管理：目标成本 / 量价双控','正常税务、发票闭环'],
  ['联营','资金往来、发票合规强管控','防止虚开套现，管住走款']].map(function(r){return '<tr><td>'+tagHtml(r[0],r[0]==='自营'?'green':'yellow')+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>'}).join(''),960)+'</div></div></section>'+
 '<div class="demo-note">改造项目后续施工阶段（收款 / 进度 / 结算 / 收票 / 付款）与新建一致，但成本源头是报价单而非单纯新建清单</div>';
}

/* ============ 合同可编辑清单树 ============ */`,ln=`// 消安云平台 · 页面分片 qrHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function qrHTML(){
 var rows=[
  ['1','安泰电子','¥29.2','¥251.1 万','13%','月结 30 天',tg('g','A级')+' · 历史 8 单',tg('b','最低价'),tg('b','选为中标')],
  ['2','华信管业','¥30.5','¥262.3 万','13%','月结 60 天',tg('g','A级')+' · 历史 12 单','',tg('b','选为中标')],
  ['3','金桥物资','¥31.8','¥273.5 万','13%','货到付款',tg('y','B级')+' · 历史 3 单',tg('o','最高价'),tg('b','选为中标')],
  ['—','正泰消防','—','—','—','—',tg('gray','待报价'),'',tg('gray','催报价')]];
 return '<div class="card-bd">'+
  '<div class="qr-wrap"><div>'+
  '<div class="qr"></div>'+
  '<div style="text-align:center;font-size:12px;color:var(--t2);margin-top:10px;line-height:1.9">询价单 XJ-2609-05 · 镀锌钢管 DN100 × 3,000m<br/>截止 09-17 18:00<br/><span class="tag b">供应商微信扫码即可报价，无需登录系统</span><br/><span style="color:var(--t3)">仅限企业自有供应商 · 非公开招采平台</span><br/><button class="mini-btn mini-no" data-act="刷新二维码" style="margin-top:6px">刷新二维码</button></div></div>'+
  '<div>'+tblHTML(['排名','供应商','单价(元/m)','总价(万)','税率','账期','评级 / 历史','竞价','操作'],rows,820)+'</div></div>'+
  '<div class="wb-total" style="margin-top:12px"><span>最高价 ¥31.8 · 最低价 ¥29.2 · 价差 8.9% · 报价结果自动沉淀价格库</span><span style="margin-left:auto"><button class="mini-btn mini-no" data-act="导出比价表">导出比价表</button> <button class="mini-btn mini-ok" data-act="生成采购合同 / 订单">生成采购合同 / 订单</button></span></div>';
}`,cn=`// 消安云平台 · 页面分片 quoteDashHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function quoteDashHTML(){
 var tiles=[['报价客户数','46',''],['关联商机','23',''],['已审核报价单','15','g'],['待审核','3','y'],['毛利 <10% 明细','4 笔','r'],['平均审批时长','6.2 h','']];
 var funnel=[['报价单',24,100],['已发送客户',18,75],['客户确认',12,50],['中标',6,25]];
 var low=[
  ['BJ-2608-21','XX体育馆 · 防排烟','¥982.0 万','17.0%','低于 20% 目标线','已归档未中标原因'],
  ['BJ-2607-18','XX厂房维修 · 报警','¥42.6 万','8.6%',tg('r','低于 10% 预警线'),'审批打回重报'],
  ['BJ-2607-09','XX商城维保 · 年度','¥28.0 万','9.2%',tg('r','低于 10% 预警线'),'特批通过'],
  ['BJ-2606-22','XX仓库改造 · 水系统','¥66.0 万','7.8%',tg('r','低于 10% 预警线'),'未中标 · 原因：低价竞争']];
 var dept=[['商务一部',52],['商务二部',31],['智慧消防事业部',17]];
 return '<div class="card-bd">'+
  '<div class="cert-tiles">'+tiles.map(function(t){return '<div class="cert-tile"><div class="ct-k">'+t[0]+'</div><div class="ct-v '+(t[2]==='r'?'hot':(t[2]==='y'?'mid':''))+'"'+(t[2]==='g'?' style="color:var(--green)"':'')+'>'+t[1]+'</div></div>'}).join('')+'</div>'+
  '<div class="grid-main" style="margin-bottom:0">'+
  '<section class="card"><div class="card-hd"><h3>报价转化漏斗（本季）</h3><span class="sub">点击下钻</span></div><div class="card-bd">'+
  funnel.map(function(f){return '<div class="fun-row" data-toast="演示：下钻查看该阶段报价单列表"><span class="fl2">'+f[0]+'</span><span class="fb"><i style="width:'+f[2]+'%"></i></span><b>'+f[1]+'</b></div>'}).join('')+
  '<div class="dv-sec">健康指标</div><div class="kvg"><div class="kv-row"><span>报价响应速度</span><b>2.1 h</b></div><div class="kv-row"><span>审批一次通过率</span><b>78%</b></div><div class="kv-row"><span>整体中标转化率</span><b>25%</b></div><div class="kv-row"><span>平均成交折扣</span><b>92 折</b></div></div>'+
  '</div></section>'+
  '<section class="card"><div class="card-hd"><h3>销售 / 板块报价金额分布</h3></div><div class="card-bd">'+
  dept.map(function(d){return '<div class="fun-row"><span class="fl2">'+d[0]+'</span><span class="fb"><i style="width:'+d[1]+'%"></i></span><b>'+d[1]+'%</b></div>'}).join('')+
  '<div class="dv-sec">审批节点效率</div><div class="kvg"><div class="kv-row"><span>成控审核均值</span><b>3.4 h</b></div><div class="kv-row"><span>总经理均值</span><b>2.8 h</b></div><div class="kv-row"><span>超 24h 单据</span><b>1 笔</b></div><div class="kv-row"><span>本月打回</span><b>2 笔</b></div></div>'+
  '</div></section></div>'+
  '<div class="dv-sec">毛利率偏低报价明细（<10% 红色 · <20% 提示）</div>'+
  tblHTML(['报价单号','项目 / 板块','报价金额','毛利率','预警','处置'],low,820)+
  '</div>';
}`,pn=`// 消安云平台 · 页面分片 quoteVerHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function quoteVerHTML(){
 var vers=[
  ['V3 · 当前',tg('b','待审批'),'王悦','2026-09-16 10:20','防火卷帘策略下调、钢管上浮调整'],
  ['V2',tg('g','已发送客户'),'王悦','2026-09-12 15:40','初报客户版（含 8% 上浮）'],
  ['V1',tg('gray','草稿'),'王悦','2026-09-08 09:10','引用价格库 V2026.08 初稿']];
 var diff=[
  ['防火卷帘 · 报价单价','<span class="diff-del">¥620.0</span>','<span class="diff-add">¥586.0</span>','-5.5%','策略性让利（不平衡报价 · 仅控量）'],
  ['镀锌钢管 · 报价单价','<span class="diff-del">¥181.4</span>','<span class="diff-add">¥186.0</span>','+2.5%','上浮由 8% 调至 10.7%'],
  ['镀锌钢管 · 数量','<span class="diff-del">3,200 m</span>','<span class="diff-add">3,050 m</span>','-4.7%','现场复核（KC-2609-01）'],
  ['报价总价','<span class="diff-del">¥1,188.2 万</span>','<span class="diff-add">¥1,205.6 万</span>','+1.5%','毛利率 22.0%（≥12% 预警线 ✓）']];
 return '<div class="card-bd">'+
  '<div class="dv-sec">BJ-2609-05 · 版本历史（点「对比」看差异 / 「回滚」生成新版本）</div>'+
  tblHTML(['版本','状态','创建人','时间','变更摘要'],vers,760)+
  '<div class="dv-sec">V2 → V3 差异对比（红=删除线 · 绿=新值）</div>'+
  tblHTML(['对比项','V2（已发送）','V3（当前）','变化','说明'],diff,760)+
  '<div class="wb-total" style="margin-top:12px"><span>回滚不删除历史：恢复 V2 后将生成 V4 并保留完整留痕</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-act="回滚到 V2">回滚到 V2</button> <button class="mini-btn mini-no" data-act="复制为新报价">复制为新报价</button></span></div>'+
  '</div>';
}`,vn=`// 消安云平台 · 页面分片 renderClient360 —— 客户 360° 档案（O4）
// 数据：CLIENTS / OPP / LINK_QUOTES / CONTRACTS / __FOLLOW 动态聚合；事件 data-opp / data-quote / data-detail 走委托
function clientFollows(cid){window.__FOLLOW=window.__FOLLOW||[
 {d:'09-16',who:'李敏',mode:'电话',cid:'CL-001',note:'确认 09-20 提交报价，业主关注付款方式'},
 {d:'09-15',who:'王强',mode:'拜访',cid:'CL-002',note:'现场勘察完成，拍照 8 张已上传，待出报价'},
 {d:'09-14',who:'郑洁',mode:'电话',cid:'CL-006',note:'维保续签价格已谈妥，待发起报价单'},
 {d:'09-13',who:'孙倩',mode:'拜访',cid:'CL-005',note:'投标材料已交，09-28 开标，提醒保证金'},
 {d:'09-12',who:'周凯',mode:'拜访',cid:'CL-003',note:'首次接触，客户有智慧消防需求，下次带方案'},
 {d:'09-10',who:'王强',mode:'电话',cid:'CL-004',note:'需求确认，已约 09-19 二次沟通'}];
 return cid?window.__FOLLOW.filter(function(f){return f.cid===cid}):window.__FOLLOW}
function renderClient360(cid){
 var C=null;for(var i=0;i<CLIENTS.length;i++){if(CLIENTS[i].id===cid){C=CLIENTS[i];break}}
 if(!C)return;
 var opps=OPP.filter(function(o){return o.cid===cid});
 var quotes=LINK_QUOTES.filter(function(q){return q.cid===cid});
 var cts=CONTRACTS.filter(function(c){return (c.party||'').indexOf(C.name.slice(0,4))>-1||C.name.indexOf((c.party||'').slice(0,4))>-1});
 var fws=clientFollows(cid);
 var oppSum=opps.reduce(function(a,o){return a+o.amt},0);
 var qSum=quotes.reduce(function(a,q){return a+(q.amt||0)},0);
 var IC={
  user:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  target:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>',
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  phone:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/></svg>'
 };
 var card=function(icCls,icSvg,title,more,inner){return '<section class="card"><div class="card-h"><span class="ic '+icCls+'">'+icSvg+'</span><h3>'+title+'</h3>'+(more?'<span class="more">'+more+'</span>':'')+'</div><div class="card-b">'+inner+'</div></section>'};
 var TBL=function(heads,rows,minW){return '<div class="gm-tblw"><table class="gm-tb"'+(minW?' style="min-width:'+minW+'px"':'')+'><thead><tr>'+heads.map(function(h){return h.indexOf('>')===0?'<th class="rt">'+h.slice(1)+'</th>':'<th>'+h+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td class="'+(typeof c==='object'&&c.rt?'rt':'')+'">'+(c==null?'—':(typeof c==='object'?c.v:c))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'};
 var KVGC=function(items){return '<div class="kv-grid">'+items.map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>'};
 var badge=function(cls,txt){return '<span class="tag '+cls+'"><i></i>'+txt+'</span>'};
 var stT=function(s){return s==='报价'?'yellow':s==='投标'?'yellow':s==='勘察/方案'?'blue':'green'};
 var qT=function(s){return s==='已中标'?'green':s==='未中标'?'red':s==='待审批'?'yellow':s==='已作废'?'gray':'blue'};
 $('#viewDash').style.display='none';var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="bid">市场投标</span><span>/</span><span class="seg" data-goseg="bid">客户与商机</span><span>/</span><span class="seg cur-seg">客户 360</span></div>'+
 '<section class="hero"><div class="hero-top"><div class="title-wrap">'+
  '<h1>'+C.name+' <span class="code num">'+C.id+'</span></h1>'+
  '<div class="badges">'+(C.tier==='A'?badge('red','重点客户'):C.tier==='B'?badge('amber','重要客户'):badge('gray','普通客户'))+'<span class="tag blue"><i></i>'+C.industry+'</span></div>'+
  '<div class="meta">'+
   '<span>'+IC.phone.replace('class="ic"','class="ic" style="width:13px;height:13px"')+'<b>'+C.contact+'</b> '+C.phone+'</span>'+
   '<span>'+IC.user.replace('class="ic"','class="ic" style="width:13px;height:13px"')+C.region+'</span>'+
   '<span>'+IC.clock.replace('class="ic"','class="ic" style="width:13px;height:13px"')+'最近跟进 '+C.last+'</span>'+
  '</div></div>'+
  '<div class="actions">'+
  '<button class="btn" data-back="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>返回列表</button>'+
  '<button class="btn btn-primary" data-toast="演示：新建跟进记录（支持拍照留痕）"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>新建跟进</button>'+
  '</div></div>'+
  '<div class="kpis">'+
   '<div class="kpi"><div class="lb">'+IC.target+'商机</div><div class="v num">'+opps.length+'<small> 个</small></div><div class="sub">合计 ¥'+oppSum+' 万</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.doc+'报价单</div><div class="v num">'+quotes.length+'<small> 单</small></div><div class="sub">合计 ¥'+qSum+' 万</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.money+'合同</div><div class="v num">'+cts.length+'<small> 份</small></div><div class="sub">'+(cts.length?'点击行查看详情':'暂无合同')+'</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.clock+'跟进记录</div><div class="v num">'+fws.length+'<small> 次</small></div><div class="sub">电话 '+fws.filter(function(f){return f.mode==='电话'}).length+' · 拜访 '+fws.filter(function(f){return f.mode==='拜访'}).length+'</div></div>'+
  '</div></section>'+
 '<div class="content cdetail"><div class="col">'+
  card('blue',IC.user,'客户档案','','<div class="kv-grid c1">'+
   [['客户编号',C.id],['行业',C.industry],['区域',C.region],['联系人',C.contact],['联系电话',C.phone],['客户等级',badge(C.tier==='A'?'red':C.tier==='B'?'amber':'gray',C.tier==='A'?'重点':C.tier==='B'?'重要':'普通')],['最近跟进',C.last],['跟进方式','电话 / 拜访 / 拍照留痕']].map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>')+
  card('green',IC.target,'商机与漏斗','','<div class="dv-sec" style="margin-bottom:8px">共 '+opps.length+' 个商机 · 合计 ¥'+oppSum+' 万 · 按阶段动态归集</div>'+
   (opps.length?TBL(['商机编号','商机名称','阶段','金额(万)','负责人','下一步','>操作'],opps.map(function(o){return [o.id,o.name,{v:'<span class="tag '+(o.stage==='报价'||o.stage==='投标'?'amber':o.stage==='勘察/方案'?'blue':'green')+'"><i></i>'+o.stage+'</span>',rt:false},{rt:true,v:o.amt},o.owner,o.next,'<span style="white-space:nowrap"><button class="mini-btn mini-ok" data-opp="'+o.id+'" data-act="阶段推进">推进</button><button class="mini-btn mini-no" data-quote="'+(quotes[0]?quotes[0].id:'')+'"'+(quotes[0]?'':' data-toast="该商机暂无报价单，可在报价台账新建"')+'>报价</button></span>']}),760):'<p class="mn-tip">暂无商机 — 新建商机后自动归集至此</p>'))+
  card('purple',IC.doc,'报价单','','<div class="dv-sec" style="margin-bottom:8px">'+quotes.length+' 张报价单 · 与商机 / 报价台账同源</div>'+
   (quotes.length?TBL(['报价单号','报价名称','类型','金额(万)','状态','>操作'],quotes.map(function(q){return [q.id,q.name,q.type==='仅清单'?'仅清单':'含价',{rt:true,v:(q.amt||'—')},{v:'<span class="tag '+qT(q.status)+'"><i></i>'+q.status+'</span>',rt:false},'<button class="mini-btn mini-ok" data-quote="'+q.id+'">查看</button>']}),720):'<p class="mn-tip">暂无报价单 — 从商机下推报价单后自动汇总</p>'))+
  card('blue',IC.money,'合同','','<div class="dv-sec" style="margin-bottom:8px">'+cts.length+' 份合同 · 以我方视角（销售 / 采购）</div>'+
   (cts.length?TBL(['合同编号','合同名称','类型','金额(万)','状态'],cts.map(function(c){return [c.id,c.name,c.type,{rt:true,v:c.amt.toFixed(2)},{v:stTg(c.st),rt:false}]}),760):'<p class="mn-tip">暂无合同 — 中标后由合同台账自动关联</p>'))+
  card('amber',IC.clock,'跟进记录','','<div class="dv-sec" style="margin-bottom:8px">近 30 天 '+fws.length+' 次跟进 · 电话 / 拜访均拍照留痕</div>'+
   (fws.length?TBL(['日期','跟进人','方式','沟通总结','>状态'],fws.map(function(f){return [f.d,f.who,{v:'<span class="tag '+(f.mode==='电话'?'blue':'green')+'"><i></i>'+f.mode+'</span>',rt:false},f.note,{v:'<span class="tag green"><i></i>正常</span>',rt:false}]}),760):'<p class="mn-tip">暂无跟进记录</p>'))+
 '</div></div>'+
 '<div class="footer-note">客户 360° 由商机 / 报价 / 合同 / 跟进四源动态聚合 · 支持按客户穿透全链路</div>';
 window.scrollTo(0,0);
}
`,un=`// 消安云平台 · 页面分片 renderContractDetail —— 合同详情页（参照项目 360 语言：Hero + KPI + ptabs + 卡片化 Tab）
// 2026-09-18：DET.contract / contractData(cid) 数据驱动；事件 data-ctab 由 app-core 委托处理
function renderContractDetail(cid){
 var D=(cid&&cid!=='HT-2609-18')?(contractData(cid)||DET.contract):DET.contract;
 window.__curCid=D.short;
 if(!window.__ctab)window.__ctab=D.tabs[0].id;
 if(!D.tabs.some(function(t){return t.id===window.__ctab}))window.__ctab=D.tabs[0].id;
 var curTab=window.__ctab;
 /* ---------- 卡片化组件（自足，函数级不冲突） ---------- */
 var IC={
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>',
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  link:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  pen:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  warn:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  scan:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
  prg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
  team:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cert:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></svg>'
 };
 var card=function(icCls,icSvg,title,more,inner){return '<section class="card"><div class="card-h"><span class="ic '+icCls+'">'+icSvg+'</span><h3>'+title+'</h3>'+(more?'<span class="more">'+more+'</span>':'')+'</div><div class="card-b">'+inner+'</div></section>'};
 var TBL=function(heads,rows,minW){return '<div class="gm-tblw"><table class="gm-tb"'+(minW?' style="min-width:'+minW+'px"':'')+'><thead><tr>'+heads.map(function(h){if(h.indexOf('>')===0)return '<th class="rt">'+h.slice(1)+'</th>';return '<th>'+h+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td class="'+(typeof c==='object'&&c.rt?'rt':'')+'">'+(c==null?'—':(typeof c==='object'?c.v:c))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'};
 var KVGC=function(items){return '<div class="kv-grid">'+items.map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>'};
 var METRIC=function(label,v,sub){return '<div class="metric"><div class="m-label">'+label+'</div><div class="m-num">'+v+'</div><div class="m-sub">'+(sub||'—')+'</div></div>'};
 var num=function(t){var m=String(t||'').match(/[\\d][\\d,.]*/);return m?parseFloat(m[0].replace(/,/g,'')):0};
 /* ---------- KPI 解析 ---------- */
 var kvOf=function(secName,key){var r='';D.head.forEach(function(s){if(s.sec===secName){s.kvs.forEach(function(k){if(k[0].indexOf(key)>-1)r=k[1]})}});return r};
 var cont=num(kvOf('基本信息','合同金额'))||num(kvOf('合同概要','合同金额'));
 var recvRaw=kvOf('经营数据','累计产值 / 收款');var recv=0;if(recvRaw){var parts=String(recvRaw).split('/');if(parts[1])recv=num(parts[1])}
 var payRaw=kvOf('经营数据','累计结算 / 付款');var pay=0;if(payRaw){var parts2=String(payRaw).split('/');if(parts2[1])pay=num(parts2[1])}
 var cashRaw=kvOf('经营数据','现金流');var cashSign=cashRaw.indexOf('-')>-1?'-':'+';var cash=cashRaw?num(cashRaw):0;
 var rpPct=cont>0?Math.min(100,Math.round(recv/cont*100)):0;
 var badge=function(cls,txt){return '<span class="tag '+cls+'"><i></i>'+txt+'</span>'};
 /* ---------- Tab body ---------- */
 var tabObj=null;for(var i=0;i<D.tabs.length;i++){if(D.tabs[i].id===curTab)tabObj=D.tabs[i]}
 var body='';
 if(!tabObj){body=''}
 else if(tabObj.type==='tbl'){body=card('blue',IC.doc,tabObj.name,'',TBL(tabObj.headers,tabObj.rows))}
 else if(tabObj.type==='items'){body=card('purple',IC.prg,tabObj.name,'',renderContractItems())}
 else if(tabObj.type==='kv'){body=tabObj.groups.map(function(g){return card('blue',IC.doc,g.sec,'',KVGC(g.kvs))}).join('')}
 else if(tabObj.type==='files'){body=card('blue',IC.doc,tabObj.name,'','<div class="fg-groups">'+tabObj.groups.map(function(g){
  var items=g.files.length?g.files.map(function(f,i){return '<div class="fg-item"><span class="f-ic '+f.t.toLowerCase()+'">'+f.t+'</span><div class="fi-info"><div class="f-n">'+f.n+'</div><div class="f-m">'+f.by+' 上传于 '+f.date+' · '+f.size+'</div></div><span class="f-st">'+(f.st?tg(f.st[0],f.st[1]):'')+'</span><span class="f-ops"><button class="op" data-vf="'+f.n+'">查看</button><button class="op danger" data-df="'+g.name+'|'+i+'">删除</button></span></div>'}).join(''):'<div class="empty-mini">暂无文件，点击右上角「上传」</div>';
  return '<div class="fg-group"><div class="fg-head"><span class="fg-title">'+g.name+'</span><span class="fg-count">'+g.files.length+' 个文件</span><button class="op" data-up="'+g.name+'" style="margin-left:auto;border:1px solid var(--line);border-radius:6px;padding:3px 10px">＋ 上传</button></div>'+items+'</div>'}).join('')+'</div>')}
 else if(tabObj.type==='logs'){body=card('purple',IC.clock,tabObj.name,'','<div class="tlx">'+tabObj.logs.map(function(l){return '<div class="tlxi'+(l[1]?' warn':'')+'"><span class="t-dot"></span><div class="t-time num">'+l[0]+'</div><div class="t-text">'+l[2]+'</div></div>'}).join('')+'</div>')}
 else if(tabObj.type==='ver'){body=
  card('amber',IC.pen,'版本历史（对比高亮 / 恢复生成新版本）','',TBL(['版本','变更说明','操作'],tabObj.versions.map(function(v){return [v[0],v[1],'<span class="ti-acts" style="margin:0"><button class="mini-btn mini-no" data-act="版本对比">对比</button><button class="mini-btn mini-no" data-act="恢复该版本">恢复</button></span>']}),760))+
  card('green',IC.check,'业务助手 · 风险审核（按企业审核项配置）','',KVGC(tabObj.ai))}
 else if(tabObj.type==='links'){body=card('purple',IC.link,tabObj.name,'','<div class="qgrid">'+tabObj.links.map(function(l){return '<div class="qtile" data-toast="演示：跳转查看「'+l+'」（可反向穿透回合同）"><div class="qi">'+IC.link+'</div><span>'+l+'</span></div>'}).join('')+'</div>')}
 /* ---------- 头部信息 ---------- */
 var meta1=kvOf('基本信息','合同编号 / 名称');var meta2=kvOf('基本信息','对方单位');
 var typeTxt=kvOf('基本信息','合同类型');var statusTxt=kvOf('基本信息','当前状态')||kvOf('基本信息','当前状态 / 版本');
 var verTxt=kvOf('基本信息','当前状态 / 版本');if(verTxt&&verTxt.indexOf('V')>-1)verTxt=verTxt.replace(/^.*?(V\\d[\\w\\s·（）]*)$/,'$1');
 var modeTxt=kvOf('基本信息','经营方式')||kvOf('合同概要','业务类型');
 var head1=D.head&&D.head[0]&&D.head[0].kvs?D.head[0].kvs:[];
 var actS=null;
 $('#viewDash').style.display='none';var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="cost">合同成本</span><span>/</span><span class="seg" data-goseg="cost">合同管理</span><span>/</span><span class="seg cur-seg">'+(meta1||D.title)+'</span></div>'+
 '<section class="hero"><div class="hero-top"><div class="title-wrap">'+
  '<h1>'+(meta1||D.title)+' <svg class="copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></h1>'+
  '<div class="badges">'+(typeTxt&&typeTxt.indexOf('<')===0?typeTxt:(typeTxt?badge('blue',String(typeTxt).replace(/<[^>]+>/g,'')):''))+(statusTxt&&statusTxt.indexOf('<')===0?statusTxt:(statusTxt?badge('green',String(statusTxt).replace(/<[^>]+>/g,'').split(' · ')[0]):''))+(verTxt&&verTxt!==statusTxt?badge('gray',String(verTxt).replace(/<[^>]+>/g,'')):'')+'</div>'+
  '<div class="meta">'+
   '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/></svg>'+(meta2||'—')+'</span>'+
   '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>我方主体 · 诺盾博达消防工程有限公司</span>'+
   '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>更新于 09-17 18:24</span>'+
  '</div></div>'+
  '<div class="actions">'+
  '<button class="btn" data-back="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>返回列表</button>'+
  '<button class="btn" data-toast="演示：打印 / 导出 PDF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>打印 / 导出</button>'+
  '<button class="btn btn-primary" data-toast="演示：发起付款（智能洞察先行校验）"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>发起付款</button>'+
  '<button class="btn icon" data-toast="演示：更多合同操作（变更 / 归档 / 权限）">⋯</button></div></div>'+
  '<div class="kpis">'+
   '<div class="kpi"><div class="lb">'+IC.money+'合同金额</div><div class="v num">¥'+cont.toFixed(cont%1?2:0)+'<small> 万</small></div><div class="sub">'+(kvOf('基本信息','合同金额 / 税率')||'—')+'</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.check+'累计收款</div><div class="v num">¥'+recv.toFixed(2)+'<small> 万</small></div><div class="bar"><i style="width:'+rpPct+'%;background:var(--blue)"></i></div><div class="sub">占合同额 '+rpPct+'%</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.money+'累计付款</div><div class="v num">¥'+pay.toFixed(2)+'<small> 万</small></div><div class="bar"><i style="width:'+(cont>0?Math.min(100,Math.round(pay/cont*100)):0)+'%;background:var(--amber)"></i></div><div class="sub">占合同额 '+(cont>0?Math.round(pay/cont*100):0)+'%</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.prg+'现金流</div><div class="v num">'+(cashRaw?cashSign+'¥'+cash.toFixed(2):'—')+'<small> 万</small></div><div class="sub"><span class="'+(cashSign==='-'?'warn':'up')+'">'+(cashRaw?('现金流 '+(cashSign==='-'?'紧张':'充裕')):'—')+'</span></div></div>'+
   '<div class="kpi"><div class="lb">'+IC.check+'回款进度</div><div class="v num">'+rpPct+'<small> %</small></div><div class="bar"><i style="width:'+rpPct+'%;background:linear-gradient(90deg,#2f6bff,#6c8dff)"></i></div><div class="sub">按已收 / 合同额</div></div>'+
  '</div></section>'+
 ''+
 '<nav class="ptabs">'+D.tabs.map(function(t){return '<span class="ptab'+(t.id===curTab?' active':'')+'" data-ptab="__contract" data-ctab="'+t.id+'">'+t.name+'</span>'}).join('')+'</nav>'+
 '<div class="content cdetail"><div class="col">'+body+'</div></div>'+
 '<div class="footer-note">合同详情由 PaaS 低代码配置生成 · 字段 / Tab / 取值均可按角色与业态自定义 · 以我方视角区分销售 / 采购合同</div>';
 window.scrollTo(0,0);
 if(D.risk&&D.risk.length&&!window.__ctRiskT){window.__ctRiskT=1;setTimeout(function(){window.__ctRiskT=0;toast(D.risk.map(function(r){return '• '+r}).join('<br>'),'risk')},450)}
 setTimeout(function(){var ps=v.querySelectorAll('.ptab');for(var i=0;i<ps.length;i++){(function(p){p.onclick=function(e){if(e&&e.stopPropagation)e.stopPropagation();window.__ctab=p.getAttribute('data-ctab')||'proj';renderContractDetail(window.__curCid)}})(ps[i])}
  /* 附件 · 查看 / 删除 / 上传（直接绑定，避开平台全局委托） */
  v.querySelectorAll('[data-vf]').forEach(function(b){b.onclick=function(){toast('预览：'+b.getAttribute('data-vf')+'（演示）')}});
  v.querySelectorAll('[data-up]').forEach(function(b){b.onclick=function(){var g=b.getAttribute('data-up');var t=D&&D.tabs?D.tabs.filter(function(x){return x.type==='files'})[0]:null;if(t){t.groups.forEach(function(gr){if(gr.name===g)gr.files.push({n:'现场核验记录-新上传.jpg',t:'JPG',c:'#b37feb',size:'3.1 MB',by:'管理员',date:'09-18 10:20',st:['g','已归档']})});renderContractDetail(window.__curCid);toast('上传成功（模拟）')}}});
  v.querySelectorAll('[data-df]').forEach(function(b){b.onclick=function(){var parts=b.getAttribute('data-df').split('|');var g=parts[0],i=+parts[1];var t=D&&D.tabs?D.tabs.filter(function(x){return x.type==='files'})[0]:null;if(t&&t.groups){t.groups.forEach(function(gr){if(gr.name===g&&gr.files[i])gr.files.splice(i,1)});renderContractDetail(window.__curCid);toast('附件已删除')}}});
 },0);
}
`,bn=`// 消安云平台 · 页面分片 renderContractItems —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function renderContractItems(){
 if(!CITEMS)initCItems();
 var rows=CITEMS.map(function(it,idx){
  if(it.parent){
   return '<tr><td>'+it.id+'</td><td><b>'+it.name+'</b></td><td>'+it.spec+'</td><td>'+it.unit+'</td><td>—</td><td>—</td><td><b>¥'+calcParent(it).toFixed(2)+' 万</b></td><td>—</td><td></td></tr>';
  }
  return '<tr><td>'+it.id+'</td><td>'+it.name+'</td><td>'+it.spec+'</td><td>'+it.unit+'</td>'+
   '<td>'+it.qty.toLocaleString()+'</td>'+
   '<td><input class="wb-num" style="width:74px" data-cip="'+idx+'" value="'+it.price+'"/></td>'+
   '<td>¥'+(it.qty*it.price/10000).toFixed(2)+' 万</td>'+
   '<td>'+tg(it.ctrl==='仅控量'?'o':'b',it.ctrl)+'</td>'+
   '<td><button class="mini-btn mini-no" data-cdel="'+idx+'">删除</button></td></tr>';
 }).join('');
 var log=CITEMLOG.map(function(l){return '<div class="kv-row"><span>'+l[0]+' · '+l[2]+'</span><b>'+l[1]+'</b></div>'}).join('');
 return '<div class="wb-top" style="margin-bottom:8px"><b>可编辑清单树：</b>修改单价后失焦即时重算大项金额<span class="tag b">价格变更自动留痕并增减大项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-cadd="1">+ 添加明细</button> <button class="mini-btn mini-ok" data-csave="1">保存并生成 V4</button></span></div>'+
  '<div class="tbl-wrap"><table class="tbl" style="min-width:860px"><thead><tr><th>编码</th><th>名称（树状）</th><th>规格</th><th>单位</th><th>数量</th><th>单价(元)</th><th>合价</th><th>控制方式</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
  '<div class="dv-sec">变更留痕（保存后写入版本）</div><div class="kvg">'+log+'</div>';
}
/* ============ 维保值班工作站（录音重点：保内/保外 · 片区线路 · 工单闭环 · 维修确收） ============ */`,gn=`// 消安云平台 · 页面分片 renderContractNew —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function renderContractNew(){
 var body='';
 var c9nm=cnEdit?'XX产业园喷淋系统主合同':'XX新区消防改造工程合同',c9pt=cnEdit?'XX产业园开发有限公司':'XX新区建设投资有限公司',c9amt=cnEdit?'¥3,860,000.00':'¥1,860,000.00',c9amtW=cnEdit?'¥386.00 万':'¥186.00 万',c9day=cnEdit?'120 天':'90 天',c9date=cnEdit?'2026-09-10':'2026-10-08';
 if(cnStep===0){
  body='<div class="dv-sec">① 关联项目</div><div class="wb-top" style="margin-bottom:0"><b>项目：</b><select class="wb-sel" style="width:240px"><option>XX产业园一期喷淋系统（PJ-2609-02）</option><option>XX国际大厦消防改造</option><option>新项目（无项目直签）</option></select><b>项目经理：</b>李敏（自动带出）</div>'+
  '<div class="dv-sec">② 合同性质与细类</div><div class="wb-top" style="margin-bottom:0">'+
  '<span class="pill active">销售合同（收入）</span><span class="pill">采购合同（支出）</span><span class="pill">框架合同</span>　细类：<select class="wb-sel"><option>工程总承包</option><option>材料合同</option><option>劳务合同</option><option>分包合同</option><option>机械合同</option><option>软硬件合同</option></select></div>'+
  '<div class="dv-sec">③ 创建方式（多来源 · 全程留痕）</div><div class="pick-tiles">'+
  '<div class="qtile" data-csrc="ocr"><div class="qi">'+ICON.plus+'</div><span>手动填写 / 上传文件<br/><span style="color:var(--t3);font-size:11px">AI·OCR 识别回填 + 要素匹配主数据（对方单位工商核验 / 项目关联 / 材料编码匹配）</span></span></div>'+
  '<div class="qtile" data-csrc="tpl"><div class="qi">'+ICON.file+'</div><span>使用标准模板<br/><span style="color:var(--t3);font-size:11px">公司范本 · 风险条款内置 · 模板变量自动替换</span></span></div>'+
  '<div class="qtile" data-csrc="etpl"><div class="qi">'+ICON.arch+'</div><span>使用企业模板<br/><span style="color:var(--t3);font-size:11px">含客户专属条款</span></span></div>'+
  '<div class="qtile" data-csrc="copy"><div class="qi">'+ICON.layers+'</div><span>复制历史合同<br/><span style="color:var(--t3);font-size:11px">HT-2608-22 等 · 差异高亮</span></span></div>'+
  '<div class="qtile" data-csrc="opp"><div class="qi">'+ICON.check+'</div><span>商机 / 报价转合同<br/><span style="color:var(--t3);font-size:11px">从商机 360 或报价单（已通过 / 已中标）转入 · 客户 / 项目 / 清单反填</span></span></div></div>';
 }else if(cnStep===1){
  body='<div class="ocr-grid">'+
  '<div><div class="dv-sec">上传合同文件 → AI / OCR 自动回填</div><div class="ocr-drop" data-toast="演示：上传 Word / PDF / 扫描件，AI 识别并回填右侧全部字段">'+ICON.cam.replace('class="ic"','class="ic" style="width:26px;height:26px;margin:0 auto 6px"')+'上传《'+(cnEdit?'XX产业园喷淋系统施工合同':'XX新区消防改造工程合同')+'.docx》<br/><span style="font-size:12px">支持 Word · PDF · 图片 · 扫描件</span></div>'+
  '<div class="banner" style="margin-bottom:0">'+ICON.check.replace('class="ic"','class="ic" style="width:16px;height:16px;color:var(--green);margin-top:3px"')+'<div>OCR 识别完成（置信度 97%）· 以下字段已自动回填，<b>橙色为待人工确认</b></div></div></div>'+
  '<div><div class="dv-sec">基本信息（已回填 · 可修正）</div><div class="kvg">'+
  '<div class="kv-row"><span>合同编号</span><b>'+(cnEdit?'HT-2609-18 <span style="color:var(--yellow)">（确认）</span>':'HT-2610-01 <span style="color:var(--yellow)">（预占号 · 审批通过后正式挂牌）</span>')+'</b></div>'+
  '<div class="kv-row"><span>合同名称</span><b>'+c9nm+'</b></div>'+
  '<div class="kv-row"><span>对方单位</span><b>'+c9pt+' <span style="color:var(--green)">✓ 工商核验通过</span></b></div>'+
  '<div class="kv-row"><span>联系人</span><b>张经理 138****3312（自动校验）</b></div>'+
  '<div class="kv-row"><span>合同金额</span><b>'+c9amt+'</b></div>'+
  '<div class="kv-row"><span>税率</span><b>9%（专用发票）</b></div>'+
  '<div class="kv-row"><span>工期</span><b>'+c9day+' <span style="color:var(--yellow)">（确认，较均值偏紧）</span></b></div>'+
  '<div class="kv-row"><span>签订日期</span><b>'+c9date+'</b></div></div>'+
  '<div class="dv-sec">条款库快速插入（点击插入到正文）</div><div class="gs-chips-wrap">'+
  '<span class="gs-chip" data-act="插入付款条款">+ 付款条款</span><span class="gs-chip" data-act="插入违约条款">+ 违约责任</span><span class="gs-chip" data-act="插入保密条款">+ 保密条款</span><span class="gs-chip" data-act="插入质保条款">+ 质保条款</span><span class="gs-chip" data-act="插入争议解决">+ 争议解决</span></div>'+
  '<div style="font-size:12px;color:var(--t3);margin-top:8px">支持富文本 / 插入表格图片 · 模板变量 <code>{{甲方名称}}</code> 自动替换</div></div></div>';
 }else if(cnStep===2){
  body='<div class="dv-sec">① 清单 / 标的明细（支出合同可关联材料 · 劳务清单树；支持 Excel 导入）</div>'+
  tblHTML(['清单编码','名称（树状）','规格','单位','数量','单价(元)','合价(万)','控制方式','变更留痕'],[
  ['01','消防水系统','','—','—','—','98.20','—','—'],
  ['01-01','├ 镀锌钢管（管网）','DN100','m','12,000','164.0','196.80',tg('b','量价双控'),tg('g','V2 单价 166→164')],
  ['01-02','├ 喷淋头','ZSTX15','只','8,600','30.0','25.80',tg('b','量价双控'),'—'],
  ['02','消防电系统','','—','—','—','66.40','—','—'],
  ['02-01','├ 点型烟感','JTY-GD','只','1,240','86.0','10.66',tg('o','仅控量'),'—']],860)+
  '<div class="dv-sec">② 付款计划（按节点）</div>'+
  tblHTML(['期次','比例','金额(万)','付款条件','计划日期'],[
  ['第 1 期 · 预付款','30%','115.80','合同签订并收到预付款发票后 7 日内','2026-09-20'],
  ['第 2 期 · 进度款','40%','154.40','第 2 期产值审定（40%）后','2026-11-30'],
  ['第 3 期 · 竣工款','25%','96.50','竣工验收合格后','2027-01-15'],
  ['第 4 期 · 质保金','5%','19.30','质保期满 1 年且无质量问题','2028-09-10']],720)+
  '<div class="banner" style="margin-bottom:0">'+ICON.info+'<div>收款计划（销售 / 收入）与付款计划（采购 / 支出）分开维护；节点条件将驱动<b>付款智能洞察</b>校验</div></div>';
 }else if(cnStep===3){
  body='<div class="dv-sec">① 按金额 / 类型自动匹配审批分支</div>'+
  tblHTML(['规则','条件','审批链','状态'],[
  ['R-01（命中 ✓）','主合同且金额 ≥ 100 万','部门经理 → 成控总监 → 总经理（终审）',tg('g','自动匹配')],
  ['R-02','金额 < 10 万','部门经理一级审批',tg('gray','未命中')],
  ['R-03','支出合同 · 材料类','采购负责人 → 成控 → 分管副总',tg('gray','未命中')]],760)+
  '<div class="dv-sec">② 本次审批链（可视化）</div><div class="flow-chain">'+
  '<span class="fc">'+ICON.users.replace('class="ic"','class="ic" style="width:14px;height:14px"')+'李敏 · 发起人</span><span class="fa">→</span>'+
  '<span class="fc">王强 · 部门经理</span><span class="fa">→</span>'+
  '<span class="fc">郑洁 · 成控总监（会签）</span><span class="fa">→</span>'+
  '<span class="fc">'+ICON.gear.replace('class="ic"','class="ic" style="width:14px;height:14px"')+'王志明 · 总经理（终审）</span></div>'+
  '<div class="dv-sec">③ 高级审批能力</div><div class="gs-chips-wrap">'+
  '<span class="gs-chip" data-act="说明：会签">会签（全部同意才过）</span><span class="gs-chip" data-act="说明：并行审批">并行审批</span><span class="gs-chip" data-act="说明：加签">加签</span><span class="gs-chip" data-act="说明：转签">转签</span><span class="gs-chip" data-act="说明：审批人本人发起自动跳过">本人自动跳过</span><span class="gs-chip" data-act="说明：出差委托代审">出差委托</span><span class="gs-chip" data-act="说明：审批人可在钉钉完成审批">钉钉审批 ✓</span></div>';
 }else{
  body='<div class="dv-sec">提交前确认（汇总）</div><div class="kvg" style="grid-template-columns:repeat(3,1fr)">'+
  '<div class="kv-row"><span>项目</span><b>'+(cnEdit?'XX产业园喷淋系统工程':'新项目（无项目直签）')+'</b></div>'+
  '<div class="kv-row"><span>性质 / 细类</span><b>主合同 · 工程总承包</b></div>'+
  '<div class="kv-row"><span>对方单位</span><b>'+c9pt+'</b></div>'+
  '<div class="kv-row"><span>金额 / 税率</span><b>'+c9amtW+' · 9%</b></div>'+
  '<div class="kv-row"><span>工期 / 质保</span><b>'+c9day+' · 24 个月</b></div>'+
  '<div class="kv-row"><span>清单 / 付款</span><b>2 大项 5 明细 · 4 期付款</b></div>'+
  '<div class="kv-row"><span>附件 / OCR</span><b>施工合同.docx · 已识别回填</b></div>'+
  '<div class="kv-row"><span>审批流</span><b>部门经理 → 成控 → 总经理</b></div>'+
  '<div class="kv-row"><span>业务助手预检</span><b>'+tg('y','1 项提示：工期偏紧 15%')+'</b></div></div>'+
  '<div class="banner" style="margin-bottom:0">'+ICON.info+'<div>提交后生成审批实例并推送钉钉；每次保存自动生成版本，可在详情页「版本与业务助手」对比 / 回滚</div></div>';
 }
 $('#viewDash').style.display='none';
 var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="cost">合同成本</span><span>/</span><span class="seg" data-goseg="cost">合同管理</span><span>/</span><span class="seg cur-seg">'+(cnEdit?'编辑合同':'新建合同')+'</span></div>'+
 '<div class="page-head"><h1>'+(cnEdit?'编辑合同 · HT-2609-18':'新建合同（向导）')+'</h1><div class="page-actions"><button class="btn btn-ghost" data-back="1">'+ICON.up+'<span>返回</span></button>'+(cnEdit?'<button class="btn btn-ghost" data-cexit="1">退出编辑</button>':'')+'</div></div>'+
 (cnEdit?'<div class="banner">'+ICON.info+'<div>已载入 <b>HT-2609-18（V3 签订版）</b> 全部数据；保存后将生成 <b>V4</b> 版本，原 V3 保留留痕。已签订合同修改自动转入「变更」审批流程。</div></div>':'')+
 cnStepsHTML()+
 '<div class="cn-body">'+body+'</div>'+
 '<div class="cn-foot">'+
  '<span style="font-size:12px;color:var(--t3)">草稿自动保存 · 每次保存生成新版本</span>'+
  '<span>'+(cnStep>0?'<button class="btn btn-ghost" data-cnprev="1">上一步</button>':'')+
  (cnStep<4?'<button class="btn btn-primary" data-cnnext="1">下一步：'+CN_STEPS[cnStep+1]+'</button>'
  :'<button class="btn btn-ghost" data-act="保存草稿">保存草稿</button><button class="btn btn-primary" data-cnsubmit="1">提交审批</button>')+'</span></div>';
 window.scrollTo(0,0);
}`,mn=`// 消安云平台 · 页面分片 renderOpp360 —— 商机 360° 详情（与客户 360 / 项目 360 同构）
// 数据：OPP / OPP_STAGES / CLIENTS / LINK_QUOTES / BIDS / CONTRACTS / clientFollows / oppLog 动态聚合；事件 data-opp / data-quote / data-clid / data-back 走委托
function renderOpp360(oid){
 var O=null;for(var i=0;i<OPP.length;i++){if(OPP[i].id===oid){O=OPP[i];break}}
 if(!O)return;
 var C=null;for(var j=0;j<CLIENTS.length;j++){if(CLIENTS[j].id===O.cid){C=CLIENTS[j];break}}
 var quotes=LINK_QUOTES.filter(function(q){return q.oid===O.id});
 var bids=BIDS.filter(function(b){return b.oid===O.id});
 var cts=C?CONTRACTS.filter(function(c){return (c.party||'').indexOf(C.name.slice(0,4))>-1||C.name.indexOf((c.party||'').slice(0,4))>-1}):[];
 var fws=C?clientFollows(C.id):[];
 var logs=oppLog().filter(function(r){return r[1]===O.id});
 var qSum=quotes.reduce(function(a,q){return a+(q.amt||0)},0);
 var curIdx=OPP_STAGES.indexOf(O.stage);
 var IC={
  target:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>',
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  user:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
 };
 var card=function(icCls,icSvg,title,more,inner){return '<section class="card"><div class="card-h"><span class="ic '+icCls+'">'+icSvg+'</span><h3>'+title+'</h3>'+(more?'<span class="more">'+more+'</span>':'')+'</div><div class="card-b">'+inner+'</div></section>'};
 var TBL=function(heads,rows,minW){return '<div class="gm-tblw"><table class="gm-tb"'+(minW?' style="min-width:'+minW+'px"':'')+'><thead><tr>'+heads.map(function(h){return h.indexOf('>')===0?'<th class="rt">'+h.slice(1)+'</th>':'<th>'+h+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td class="'+(typeof c==='object'&&c.rt?'rt':'')+'">'+(c==null?'—':(typeof c==='object'?c.v:c))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'};
 var KVGC=function(items){return '<div class="kv-grid">'+items.map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>'};
 var badge=function(cls,txt){return '<span class="tag '+cls+'"><i></i>'+txt+'</span>'};
 var stT=function(s){return s==='报价'?'yellow':s==='投标'?'yellow':s==='勘察/方案'?'blue':'green'};
 var qT=function(s){return s==='已中标'?'green':s==='未中标'?'red':s==='待审批'?'yellow':s==='已作废'?'gray':'blue'};
 var tl='<div style="display:flex;gap:4px">'+OPP_STAGES.map(function(s,i){
  var seg=i<curIdx?'var(--blue)':i===curIdx?'var(--blue)':'var(--line)';
  var lbl=i===curIdx?'color:var(--blue);font-weight:600':i<curIdx?'color:var(--t2)':'color:var(--t3)';
  return '<div style="flex:1;text-align:center"><div style="height:6px;border-radius:3px;background:'+seg+'"></div><div style="font-size:11px;margin-top:6px;'+lbl+'">'+s+'</div></div>'}).join('')+'</div>';
 $('#viewDash').style.display='none';var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="bid">市场投标</span><span>/</span><span class="seg" data-goseg="bid">客户与商机</span><span>/</span><span class="seg cur-seg">商机 360</span></div>'+
 '<section class="hero"><div class="hero-top"><div class="title-wrap">'+
  '<h1>'+O.name+' <span class="code num">'+O.id+'</span></h1>'+
  '<div class="badges">'+badge(stT(O.stage),O.stage)+(O.result?badge(O.result==='赢单'?'green':O.result==='输单'?'red':'gray','分支结果 · '+O.result):'')+(O.days>=3?badge('red',O.days+' 天未跟进'):badge('green','跟进正常'))+'</div>'+
  '<div class="meta">'+
   '<span>'+IC.user.replace('class="ic"','class="ic" style="width:13px;height:13px"')+'<b>'+(C?C.name:'—')+'</b></span>'+
   '<span>'+IC.user.replace('class="ic"','class="ic" style="width:13px;height:13px"')+'负责人 '+O.owner+'</span>'+
   '<span>'+IC.clock.replace('class="ic"','class="ic" style="width:13px;height:13px"')+'最近更新 '+O.updated+'</span>'+
  '</div></div>'+
  '<div class="actions">'+
  '<button class="btn" data-back="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>返回列表</button>'+
  '<button class="btn btn-primary" data-opp="'+O.id+'" data-act="阶段推进"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>阶段推进</button>'+
  (quotes.length?'<button class="btn" data-quote="'+quotes[0].id+'">查看报价单</button>':'<button class="btn" data-opp-quote="'+O.id+'">下推报价</button>')+
  '</div></div>'+
  '<div class="kpis">'+
   '<div class="kpi"><div class="lb">'+IC.money+'商机金额</div><div class="v num">¥'+O.amt+'<small> 万</small></div><div class="sub">当前阶段 '+O.stage+'</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.doc+'关联报价单</div><div class="v num">'+quotes.length+'<small> 单</small></div><div class="sub">合计 ¥'+qSum+' 万</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.target+'关联投标</div><div class="v num">'+bids.length+'<small> 个</small></div><div class="sub">'+(bids.length?bids[0].node+' · '+bids[0].deadline:'暂无投标')+'</div></div>'+
   '<div class="kpi"><div class="lb">'+IC.clock+'跟进记录</div><div class="v num">'+fws.length+'<small> 次</small></div><div class="sub">阶段日志 '+logs.length+' 条</div></div>'+
  '</div></section>'+
 '<div class="content cdetail"><div class="col">'+
  card('blue',IC.target,'商机档案','','<div class="kv-grid c3">'+
   [['商机编号',O.id],['所属客户',C?'<span class="link-btn" data-clid="'+C.id+'">'+C.name+' ▸</span>':'—'],['商机阶段',badge(stT(O.stage),O.stage)],['商机金额','¥'+O.amt+' 万'],['负责人',O.owner],['下一步动作',O.next],['未跟进天数',O.days+' 天'+(O.days>=3?'（预警）':'')],['最近更新',O.updated],['分支结果',O.result||'—']].map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>')+
  card('purple',IC.target,'阶段推进路径','','<div class="dv-sec" style="margin-bottom:10px">里程碑共 '+OPP_STAGES.length+' 站 · 当前第 '+(curIdx+1)+' 站「'+O.stage+'」</div>'+tl+
   (logs.length?'<div style="margin-top:12px">'+TBL(['日期','操作人','动作说明'],logs.map(function(r){return [r[0],r[3],r[4]]}),680):'')+
   (logs.length?'':'<p class="mn-tip">暂无推进日志 — 点右上「阶段推进」记录动作</p>'))+
  card('green',IC.doc,'关联报价单','','<div class="dv-sec" style="margin-bottom:8px">'+quotes.length+' 张报价单 · 从商机下推生成，报价清单可反向生成目标成本</div>'+
   (quotes.length?TBL(['报价单号','报价名称','金额(万)','毛利率','状态','>操作'],quotes.map(function(q){return [q.id,q.name,{rt:true,v:q.amt},{rt:true,v:(q.gm||'—')},{v:'<span class="tag '+qT(q.status)+'"><i></i>'+q.status+'</span>',rt:false},'<button class="mini-btn mini-ok" data-quote="'+q.id+'">查看</button>']}),720):'<p class="mn-tip">暂无报价单 — 在报价与勘察模块从该商机下推新建</p>'))+
  card('amber',IC.target,'关联投标','','<div class="dv-sec" style="margin-bottom:8px">'+bids.length+' 个投标节点 · 与投标管理模块同源</div>'+
   (bids.length?TBL(['投标编号','当前节点','保证金(万)','开标时间','结果'],bids.map(function(b){return [b.id,b.node,{rt:true,v:b.bond},b.deadline,b.result||'—']}),680):'<p class="mn-tip">暂无投标 — 进入投标阶段后自动关联</p>'))+
  card('blue',IC.money,'关联合同','','<div class="dv-sec" style="margin-bottom:8px">'+cts.length+' 份合同 · 中标签约后由合同台账自动承接</div>'+
   (cts.length?TBL(['合同编号','合同名称','金额(万)','状态'],cts.map(function(c){return [c.id,c.name,{rt:true,v:c.amt.toFixed(2)},{v:stTg(c.st),rt:false}]}),680):'<p class="mn-tip">暂无合同 — 商机「中标 / 签约」后点「转合同 / 销售订单」承接</p>'))+
  card('amber',IC.clock,'客户跟进记录','','<div class="dv-sec" style="margin-bottom:8px">'+(C?C.name+' · ':'')+'近 30 天 '+fws.length+' 次跟进</div>'+
   (fws.length?TBL(['日期','跟进人','方式','沟通总结'],fws.map(function(f){return [f.d,f.who,{v:'<span class="tag '+(f.mode==='电话'?'blue':'green')+'"><i></i>'+f.mode+'</span>',rt:false},f.note]}),680):'<p class="mn-tip">暂无跟进记录</p>'))+
 '</div></div>'+
 '<div class="footer-note">商机 360° 由客户 / 报价 / 投标 / 合同 / 跟进五源动态聚合 · 支持商机→报价→投标→合同全链路穿透</div>';
 window.scrollTo(0,0);
}
`,fn=`// 消安云平台 · 页面分片 renderProj360 —— 项目详情页（项目头 + 公共12 Tab + 动态 Tab）
// 2026-09-18 V4：Hero + KPI + pill Tab + overview 两栏；其余 Tab 全部卡片化（.card + gm-tb 表格 + kv-grid + metrics）
function renderProj360(pid){
 var p=PROJS.find(function(x){return x.id===pid});if(!p)return;
 var prgP=parseFloat(String(p.progress||'0%').replace('%',''))||0;
 var remDays=p.planE?Math.max(0,Math.round((new Date(p.planE)-new Date())/86400000)):'—';
 var W2=function(n){return '¥'+nfmt(n)};
 window.__projId=pid;
 var rm=function(k){return p[k]!=null?p[k]:'—'};
 var W=function(n){return '¥'+nfmt(n)+' 万'};
 var rnd=function(n){return n==null?0:Math.round(n)};
 /* ---------- 关联合同反查（从 CONTRACTS 台账实时反查，不硬编码） ---------- */
 var relCs=[];for(var rci=0;rci<CONTRACTS.length;rci++){var rcc=CONTRACTS[rci];if(rcc.dir==='销售'&&(rcc.proj===p.name||projOf(rcc.proj)===p))relCs.push(rcc)}
 var relC=null;for(var rcj=0;rcj<relCs.length;rcj++){if(relCs[rcj].type==='主合同'){relC=relCs[rcj];break}}
 if(!relC&&relCs.length)relC=relCs[0];
 var relSum=0;for(var rck=0;rck<relCs.length;rck++){relSum+=(relCs[rck].amt||0)}
 /* ---------- 卡片化通用组件 ---------- */
 var IC={
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>',
  cal:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>',
  link:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  warn:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  chain:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></svg>',
  money:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  target:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2"/></svg>',
  gm:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>',
  prg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
  team:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  box:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
  cert:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  scan:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
  eye:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  pen:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>'
 };
 var card=function(icCls,icSvg,title,more,inner){return '<section class="card"><div class="card-h"><span class="ic '+icCls+'">'+icSvg+'</span><h3>'+title+'</h3>'+(more?'<span class="more">'+more+'</span>':'')+'</div><div class="card-b">'+inner+'</div></section>'};
 var TBL=function(heads,rows,minW){return '<div class="gm-tblw"><table class="gm-tb"'+(minW?' style="min-width:'+minW+'px"':'')+'><thead><tr>'+heads.map(function(h){if(h.indexOf('>')===0)return '<th class="rt">'+h.slice(1)+'</th>';return '<th>'+h+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td class="'+(typeof c==='object'&&c.rt?'rt':'')+'">'+(c==null?'—':(typeof c==='object'?c.v:c))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'};
 var RT=function(v){return {rt:true,v:v}};
 var KVGC=function(items,cols){return '<div class="kv-grid'+(cols?' c'+cols:'')+'">'+items.map(function(x){return '<div class="kv-item"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('')+'</div>'};
 var METRIC=function(label,v,sub){return '<div class="metric"><div class="m-label">'+label+'</div><div class="m-num">'+v+'</div><div class="m-sub">'+(sub||'—')+'</div></div>'};
 var kv=function(k,v){return '<div class="kv-row"><span>'+k+'</span><b>'+v+'</b></div>'};
 var sec=function(t){return '<div class="dv-sec">'+t+'</div>'};
 var KVG=function(items){return '<div class="kvg">'+items.map(function(x){return kv(x[0],x[1])}).join('')+'</div>'};
 var CONT=function(inner){return '<div class="content p360 c1"><div class="col">'+inner+'</div></div>'};
 var tabs=[
 {id:'overview',name:'项目概况',dyn:function(){
  var icArr='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  var icWarn='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
  var fld=function(k,v,full){return '<div class="field'+(full?' full':'')+'"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>'};
  var actS=new Date(p.planS||'2026-10-01');actS.setDate(actS.getDate()-30);
  var fmtD=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  var totalDays=Math.round((new Date(p.planE||'2027-06-30')-new Date(p.planS||'2026-10-01'))/86400000);
  var elapsed=Math.max(1,Math.round((new Date()-actS)/86400000));
  var basic=card('blue',IC.doc,'基本信息','编辑 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
   '<div class="fields">'+fld('项目地址',p.address||'—',true)+fld('区域',p.region||'昆明')+fld('客户 / 业主','<a data-proj="'+p.id+'">'+(p.customer||'—')+'</a>')+fld('所属部门','工程部')+fld('立项来源 / 时间',(p.from.split(' · ')[0]||'—')+' · '+(p.id==='PJ-2608-11'?'2026-07-20':'2026-08-28'))+'</div>');
  var plan=card('purple',IC.cal,'计划与工期','查看甘特图 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
   '<div class="tl-chips"><span class="chip">总工期 <b class="num">'+totalDays+' 天</b></span><span class="chip">已进行 <b class="num">'+elapsed+' 天</b></span><span class="chip">实际开工较计划 <b style="color:var(--green)">提前 30 天</b></span></div>'+
   '<div class="tl"><div class="fill" style="width:8%"></div>'+
   '<div class="tl-node done"><span class="pt"></span><span class="d num">'+fmtD(actS)+'</span><span class="s">实际开工</span></div>'+
   '<div class="tl-node base"><span class="pt"></span><span class="d num">'+(p.planS||'—')+'</span><span class="s">计划开工（基线）</span></div>'+
   '<div class="tl-node base"><span class="pt"></span><span class="d num">'+(p.planE||'—')+'</span><span class="s">计划竣工（基线）</span></div>'+
   '<div class="tl-node"><span class="pt" style="border-style:dashed"></span><span class="d">待定</span><span class="s">实际竣工（在建）</span></div></div>');
  var linkCard=card('green',IC.link,'关联对象','',
   '<div class="chain">'+
   '<div class="node-card"><div class="t">关联投标</div><div class="n num">'+(p.from.split(' · ')[0]||'—')+(p.from.indexOf('—')<0?' <span class="tag green" style="padding:1px 8px;font-size:11px"><i></i>中标</span>':'')+'</div><div class="m">'+(p.from.indexOf('—')<0?'投标报价 '+W2(Math.round((p.cont||0)/0.972))+' 万':'暂未关联投标 / 商机')+'</div></div>'+
   '<div class="arr">'+icArr+'</div>'+
   '<div class="node-card"><div class="t">关联销售合同</div><div class="n num">'+(relC?relC.id+(relCs.length>1?' 等 '+relCs.length+' 份':''):'待关联')+'</div><div class="m num">'+(relC?'合同额 '+W2(relSum)+' 万':'尚未关联销售合同')+'</div></div>'+
   '<div class="arr">'+icArr+'</div>'+
   '<div class="node-card" style="background:var(--blue-bg);border-color:#cdddff"><div class="t">本项目</div><div class="n num" style="color:var(--blue-d)">'+p.id+'</div><div class="m">'+p.name+'</div></div></div>'+
   '<div class="files">'+['中标通知书','合同正本','预算清单'].map(function(f){return '<span class="file">'+IC.doc.replace('width="14"','width="13"').replace('height="14"','height="13"')+f+'<span class="ok">已归档</span></span>'}).join('')+'</div>');
  var perf=card('blue','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>','履约总览','',
   '<div class="ring-wrap"><div class="ring" style="background:conic-gradient(var(--blue) 0 '+prgP+'%,#e8edf5 '+prgP+'% 100%)"><div><b class="num">'+prgP+'%</b><small>产值进度</small></div></div>'+
   '<div class="ring-info"><div class="row"><span>剩余工期</span><b class="num">'+remDays+' 天</b></div><div class="row"><span>计划竣工</span><b class="num">'+(p.planE||'—')+'</b></div><div class="row"><span>数据更新</span><b class="num">09-17 18:24</b></div></div></div>'+
   (p.type==='改造'?'<div class="mile">'+icWarn+'<span>存在 1 条滞后预警（进度维度），建议查看 <b>风险中心</b> 并上报纠偏措施。</span></div>':''));
  var _pool=['王强','李敏','孙倩','王磊','赵敏'];
  var _own=_pool.indexOf(p.owner)>=0?p.owner:'王强';
  var _rest=_pool.filter(function(x){return x!==_own});
  var _tech=_rest[0],_doc=_rest[1];
  var team=card('amber',IC.team,'项目团队','成员权限',
   '<div class="members">'+
   '<div class="member"><div class="av b1">'+_own.slice(0,1)+'</div><div><div class="n">'+_own+'</div><div class="r">项目经理 · 工程部</div></div><span class="tag blue lead" style="padding:1px 9px;font-size:11px"><i></i>负责人</span></div>'+
   '<div class="member"><div class="av b2">'+_tech.slice(0,1)+'</div><div><div class="n">'+_tech+'</div><div class="r">技术负责人</div></div></div>'+
   '<div class="member"><div class="av b3">'+_doc.slice(0,1)+'</div><div><div class="n">'+_doc+'</div><div class="r">资料员</div></div></div></div>');
  var feed=card('blue',IC.clock,'最近动态','全部日志',
   '<div class="feed"><div class="feed-item"><span class="pt2"></span><div><div class="tx"><b>'+p.owner+'</b> 更新了当前进度至 <b class="num">'+(p.progress||'0%')+'</b></div><div class="tm num">09-17 18:24</div></div></div>'+
   '<div class="feed-item"><span class="pt2"></span><div><div class="tx">项目<b>实际开工</b>，较计划提前 30 天</div><div class="tm num">'+fmtD(actS)+' 09:00</div></div></div>'+
   '<div class="feed-item gray"><span class="pt2"></span><div><div class="tx">立项创建'+(relC?'，关联合同 '+relC.id+' 生效':'')+'</div><div class="tm num">08-28 14:32</div></div></div></div>');
  return '<div class="content p360"><div class="col">'+basic+plan+linkCard+'</div><div class="col">'+perf+team+feed+'</div></div>';
  }},
 {id:'biz',name:'经营信息',dyn:function(){
  var cont=p.cont||0,actual=p.actual||0,budget=p.budget||0;
  var prog=prgP/100||0;
  var baseGM=cont>0?Math.round((cont-budget)/cont*1000)/10:0;
  var estTotal=prog>0?Math.round(actual/prog):budget;
  var estGM=cont>0?Math.round((cont-estTotal)/cont*1000)/10:0;
  var bar=function(label,v,max,tone){var w=Math.max(3,Math.min(100,Math.round(v/max*100)));return '<div class="gm-row"><span>'+label+'</span><div class="gm-track"><div class="gm-bar '+tone+'" style="width:'+w+'%"></div></div><b>'+(tone==='red'?tg('r',v+'%'):tg(v+'%'))+'</b></div>'};
  return card('blue',IC.gm,'经营指标（项目 360 · 自动出表）','','<div class="metrics">'+
   METRIC('施工合同额',W(cont),relC?('销售合同 '+relC.id):'销售合同 待关联')+
   METRIC('累计产值',W(rnd(cont*prog)),(prgP||0)+'% 进度')+
   METRIC('毛利润',W(Math.max(0,cont-actual)),(p.gm||0)+'% 毛利率')+
   METRIC('现金流量',W(rnd(cont*0.31)),'资金效能 '+(actual?rnd(cont/actual*100):0)+'%')+
   METRIC('税负比','3.2%','税差 +0.4%（进项充足）')+'</div>')+
  card('green',IC.target,'毛利动态测算（预算 vs 实际 vs 预测）','',
   '<div class="gm-card">'+bar('目标毛利率（按目标成本）',baseGM,60,'green')+bar('实际已发生',Math.round(prgP),100,'blue')+bar('预测毛利率（完工估算）',Math.max(0,estGM),60,estGM<baseGM?'red':'green')+'</div>'+
   '<p class="mn-tip">预测毛利率按已发生成本 / 进度外推完工总成本测算；低于目标毛利率时自动标红，提示成本超支风险（成控财务关注）</p>')+
  card('blue',IC.money,'销售经营（收入侧）','',
   KVGC([['累计收款',W(rnd(cont*0.41))],['应收余额',W(rnd(cont*0.59))],['已开票未回款',W(rnd(cont*0.22))],['质保金','5% · '+W(rnd(cont*0.05))+' · 2028-06 到期'],['施工合同得收率','41%']]))+
  card('amber',IC.box,'采购经营（支出侧）','',
   KVGC([['累计结算',W(rnd(cont*0.46))],['累计付款',W(rnd(cont*0.38))],['剩余未付',W(rnd(cont*0.08))],['供应商付款总额',W(rnd(cont*0.37))],['材料 / 劳务 / 专包','55% / 26% / 12%']]))+
  '<p class="mn-tip">经营信息由各岗位录入数据自动汇总（项目 360 报表），不需专人做表；指标可按 PaaS 后台配置取数与运算</p>';}},
 {id:'wbs',name:'WBS 与进度',dyn:function(){
  return card('purple',IC.prg,'WBS 分解（1 / 1.1 / 1.1.1 树状）','',
   TBL(['层级','任务','责任人','计划开始','计划结束','实际开始','实际结束','完成','状态'],[
    ['1','消防水系统','王强','09-01','10-31','09-01','10-15','62%',tg('g','进行中')],
    ['1.1','管材 / 管件（镀锌钢管）','王强','09-01','09-25','09-01','09-22','100%',tg('g','已完成')],
    ['1.2','喷淋系统安装','王强','09-20','10-31','09-24','—','58%',tg('y','进行中')],
    ['1.3','消火栓 / 阀门','李敏','10-01','10-31','—','—','0%',tg('gray','未开始')],
    ['2','消防电系统','李敏','09-05','11-15','09-06','—','45%',tg('g','进行中')],
    ['2.1','火灾报警布线','李敏','09-05','10-20','09-06','—','70%',tg('y','进行中')],
    ['3','防排烟系统','孙倩','10-15','12-10','—','—','0%',tg('gray','未开始')]],760))+
  card('blue',IC.prg,'进度横道图（示意）','',
   '<div class="gantt">'+[['1 消防水系统',62,'09-01 ~ 10-31'],['1.2 喷淋系统安装',58,'09-20 ~ 10-31'],['2 消防电系统',45,'09-05 ~ 11-15'],['2.1 火灾报警布线',70,'09-05 ~ 10-20'],['3 防排烟系统',0,'10-15 ~ 12-10']].map(function(g){
    return '<div class="gantt-row"><span>'+g[0]+'</span><div class="gantt-track"><div class="gantt-bar" style="width:'+Math.max(4,g[1]*1.6)+'%"></div></div><span>'+g[1]+'% · '+g[2]+'</span></div>'}).join('')+'</div>')+
  card('green',IC.check,'里程碑','',
   TBL(['里程碑','计划日期','实际日期','状态'],[
    ['施工准备完成','09-15','09-12',tg('g','已完成')],['主体安装完成','11-30','—',tg('y','进行中')],['调试 / 验收','2027-06','—',tg('gray','未开始')]],560))+
  card('amber',IC.warn,'滞后预警','',
   KVGC([['滞后节点','1.2 喷淋系统安装（超计划 4 天）'],['预警级别',tg('y','黄色预警')],['超期天数','4 天'],['处理','已通知项目经理，调整工序优先级']]));}},
 {id:'fund',name:'合同与资金',dyn:function(){
  return card('blue',IC.doc,'销售合同（收入）','查看合同详情 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
   TBL(['合同编号','名称','客户','金额','税率','质保金','状态'],
    (relCs.length?relCs.map(function(c){return [c.id,c.name,c.party,W(c.amt),'9%','5%',tg(c.st==='已结算'?'g':'b',c.st)]}):[['—','暂无关联销售合同',p.customer||'—','—','—','—',tg('gray','待关联')]]),700))+
  card('amber',IC.box,'采购合同（支出）','',
   TBL(['合同编号','类型','供应商','金额','累计结算','累计付款','状态'],[
    ['ZC-2609-08','材料','华信管业',W(rnd((p.cont||0)*0.22)),W(rnd((p.cont||0)*0.16)),W(rnd((p.cont||0)*0.13)),tg('g','履约中')],
    ['ZC-2609-11','劳务','XX劳务班组（赵）',W(rnd((p.cont||0)*0.18)),W(rnd((p.cont||0)*0.10)),W(rnd((p.cont||0)*0.08)),tg('y','结算中')],
    ['ZC-2608-30','分包','XX机电分包',W(rnd((p.cont||0)*0.12)),W(rnd((p.cont||0)*0.09)),W(rnd((p.cont||0)*0.07)),tg('g','履约中')]],700))+
  card('purple',IC.link,'框架合同与子订单','',
   TBL(['子订单编号','范围','金额','回款计划','状态'],[
    ['PO-2609-31','镀锌钢管 / 管件框架子订单',W(326.4),'分批结算',tg('g','执行中')]],700))+
  (p.mode==='联营'?card('red',IC.eye,'联营资金往来（合规管控）','',
   KVGC([['走款记录','共 6 笔 · ¥1,860 万（全部留痕）'],['对账单','季度对账 · 最近 2026-08 已核对'],['合规标记','资金走款与合同匹配 · 无虚开套现风险'],['可见性','联营方仅见资金往来，不展示自营细项成本']])):'');}},
 {id:'cost',name:'成本清单',dyn:function(){
  return card('purple',IC.target,'成本树（树状结构，控制方式可逐项设置）','',
   TBL(['层级','成本项','单位','预算量','预算价','控制方式','状态'],[
    ['1','消防水系统','—','—','—','量价双控','预算'],
    ['1.1','管材 / 管件','—','—','—','量价双控','预算'],
    ['1.1.1','镀锌钢管 DN100','m','1,860','168.0',tg('b','量价双控'),'已发生'],
    ['1.1.2','沟槽管件 DN100','件','420','86.5',tg('b','量价双控'),'已发生'],
    ['1.2','喷淋系统','—','—','—','量价双控','预算'],
    ['1.2.1','喷淋头 ZSTX15','只','2,450','45.0','仅控量','已发生'],
    ['2','消防电系统','—','—','—','仅控量','预算'],
    ['2.1','点型感烟探测器','只','1,280','78.0','仅控量','已发生']],820))+
  card('blue',IC.money,'六行量价对比（预算 → 申请 → 合同 → 入库 → 结算 → 支付）','',
   TBL(['成本项','量价','预算','申请','合同','入库','结算','支付','偏差'],[
    ['镀锌钢管 DN100','数量','1,860','1,860','1,840','1,820','1,800','1,800','-3%'],
    ['镀锌钢管 DN100','单价','168.0','168.0','166.5','166.0','165.0','165.0',tg('g','-1.8%')],
    ['喷淋头 ZSTX15','数量','2,450','2,450','2,400','2,380','2,360','—','-3.7%'],
    ['点型感烟探测器','单价','78.0','78.0','76.0','75.5','75.0','—',tg('g','-3.8%')]],860))+
  card('amber',IC.pen,'变更留痕（不能覆盖原数据）','',
   TBL(['版本','变更项','修改前后','原因','操作人 / 时间'],[
    ['V3','镀锌钢管 DN100 预算价','168.0 → 165.0','供应商调价','李敏 · 09-12'],
    ['V2','删除明细「沟槽管件」4 项','自动扣减大项金额','设计变更','王强 · 09-08'],
    ['V1','清单导入','—','投标清单导入','系统 · 08-30']],700))+
  card('green',IC.link,'先发生后关联 / 销项','',
   KVGC([['未关联数据','2 笔 · ¥36.5 万（无预算先发生）'],['关联状态',tg('y','2 笔待关联')],['销项状态','0 笔已销项'],['操作','手动关联成本项 → 参与六行量价 → 销项']]));}},
 {id:'tax',name:'票税与现金流',dyn:function(){
  var cont=p.cont||0;
  return card('blue',IC.money,'回款四态（自动统计 · 节点达成自动生成开票提醒）','','<div class="metrics">'+
   METRIC('已回款',W(rnd(cont*0.41)),tg('g','资金已到位'))+
   METRIC('已开票未回款',W(rnd(cont*0.22)),tg('y','提醒中'))+
   METRIC('待开票（节点达成）',W(rnd(cont*0.37)),tg('y','提醒中'))+
   METRIC('质保金',W(rnd(cont*0.05)),'2028-06 到期')+'</div>')+
  card('purple',IC.cal,'回款节点（可设置提前提醒）','',
   TBL(['节点','应收日期','金额','提前提醒','状态'],[
    ['首付款（30%）','2026-09-25',W(rnd(cont*0.3)),tg('y','提前 30 天提醒中'),tg('y','待回款')],
    ['进度款一（25%）','2026-12-10',W(rnd(cont*0.25)),'提前 30 天','待计划'],
    ['竣工款（35%）','2027-06-30',W(rnd(cont*0.35)),'提前 30 天','待计划'],
    ['质保金（5%）','2028-06-30',W(rnd(cont*0.05)),'到期提醒','待计划']],760))+
  card('blue',IC.doc,'收款与开票记录','',
   TBL(['单据','日期','金额','备注'],[
    ['收款 SK-2609-02','09-12',W(rnd(cont*0.20)),'银行到账 · 水单已附'],
    ['开票 KP-2609-06','09-13',W(rnd(cont*0.18)),'增值税专用发票 9%'],
    ['自动收票（供应商）','09-10',W(rnd(cont*0.08)),'税务抓取 · 自动匹配挂接']],700))+
  card('green',IC.scan,'自动开票 / 自动收票','',
   KVGC([['开票任务待确认','1 项（进度款一）'],['自动收票挂接','供应商发票按销售方 / 名称 / 金额 / 项目匹配 · 人工确认'],['现金流成本结算','按项目归集 · 现金余额 '+W(rnd(cont*0.31))],['应收统计','已开票未回款 '+W(rnd(cont*0.22))+' · 无逾期']]));}},
 {id:'pay',name:'供应商付款',dyn:function(){
  return card('blue',IC.team,'本项目供应商汇总','点击供应商可穿透其他项目',
   TBL(['供应商','评级','合同金额','已结算','已收票','已付款','剩余未付','付款比例'],[
    ['华信管业',tg('g','A 级'),W(rnd((p.cont||0)*0.22)),W(rnd((p.cont||0)*0.16)),W(rnd((p.cont||0)*0.14)),W(rnd((p.cont||0)*0.13)),W(rnd((p.cont||0)*0.03)),'68%'],
    ['XX劳务班组（赵）',tg('y','B 级'),W(rnd((p.cont||0)*0.18)),W(rnd((p.cont||0)*0.10)),W(rnd((p.cont||0)*0.06)),W(rnd((p.cont||0)*0.08)),W(rnd((p.cont||0)*0.02)),'80%'],
    ['XX机电分包',tg('y','B 级'),W(rnd((p.cont||0)*0.12)),W(rnd((p.cont||0)*0.09)),W(rnd((p.cont||0)*0.05)),W(rnd((p.cont||0)*0.07)),W(rnd((p.cont||0)*0.02)),'75%']],860))+
  card('amber',IC.eye,'智能业务洞察（付款审批前自动检查）','',
   KVGC([
    ['超合同付款比例','华信管业 68% · 未超（80% 线） · '+tg('g','绿灯')],
    ['超结算付款比例','劳务 80% vs 结算 55% · 已超 · '+tg('r','红灯 · 需特批')],
    ['缺票','劳务累计付款 80% · 收票仅 60% · '+tg('r','红灯 · 缺票')],
    ['超项目可用资金余额','可用余额充足 · '+tg('g','绿灯')]]))+
  '<p class="mn-tip">点击供应商可穿透查看其在本企业其他项目的合同 / 结算 / 收票 / 付款，供老板决策先批谁、批多少</p>';}},
 {id:'exec',name:'现场执行',dyn:function(){
  return card('green',IC.check,'质量安全（标准检查项巡检 → 整改闭环）','',
   TBL(['类型','检查项','结果','隐患','整改状态'],[
    ['质量','镀锌钢管壁厚 / 镀层','合格','—',tg('g','已复查')],
    ['安全','临时用电 / 高空作业','发现问题','脚手架未固定',tg('y','已整改 · 待复查')],
    ['质量','喷淋头间距','合格','—',tg('g','已复查')]],700))+
  card('purple',IC.team,'劳务（实名制 + 出勤水印，防范恶意讨薪）','',
   KVGC([['劳务班组','XX劳务班组（赵）· 评级 B'],['人员实名制','12 人 · 身份证 / 银行卡 / 保险 / 安全教育齐全'],['出勤方式','拍照水印 + 勾选人员 · 出勤天数自动统计'],['本月出勤','186 人次 · 水印照片已留存']]))+
  card('amber',IC.money,'劳务结算与扣款','',
   TBL(['结算单','计件量','结算金额','扣款','回写财务'],[
    ['JS-2609-03','消防水系统安装',W(48.6),tg('r','-¥1.2 万（超领损耗）'),tg('g','已回写付款扣除')]],700))+
  card('blue',IC.box,'材料现场（提料 / AI 入库 / 领用）','',
   TBL(['单据','材料','数量','金额','状态'],[
    ['TL-2609-12','镀锌钢管 DN100','320 m',W(5.4),tg('g','已入库')],
    ['RK-2609-31','AI 拍照入库 · 沟槽管件','120 件',W(1.0),tg('g','已验收')],
    ['CL-2609-05','领用（劳务班组）','180 m',W(3.0),tg('y','超领扣款')]],700));}},
 {id:'doc',name:'资料归档',dyn:function(){
  return card('blue',IC.doc,'里程碑资料目录（缺失红点提醒）','',
   TBL(['里程碑','应归档','已归档','缺失','状态'],[
    ['立项与合同','8 项','8 项','0',tg('g','齐备')],
    ['施工过程（质量 / 安全 / 材料）','24 项','21 项','3',tg('r','缺失 3 项')],
    ['竣工验收','12 项','4 项','8',tg('r','缺失 8 项')]],700))+
  card('amber',IC.cert,'工程 / 财务审核','',
   KVGC([['工程审核','施工过程资料 21/24 · 已初审'],['财务审核',tg('y','未审核（未通过视为未归档，影响收款）')],['智能归档','审批流中的合同 / 发票 / 订单附件自动归类到资料目录']]))+
  card('green',IC.check,'验收与报告','',
   KVGC([['验收资料','验收单 / 测试报告 · 归档中'],['消防报告','由巡检 / 维保 / 验收数据生成 · 电子签完成'],['交付物料包','待竣工验收后生成']]));}},
 {id:'risk',name:'风险中心',dyn:function(){
  return card('red',IC.warn,'风险登记（按类型亮灯）','',
   TBL(['风险类型','等级','触发条件','当前值 / 阈值','状态','责任人'],[
    ['资金',tg('r','高'),'劳务付款超结算比例','80% / 75%',tg('y','处理中'),'成控财务'],
    ['材料',tg('y','中'),'累计入库超预算量','96% / 100%',tg('g','监控中'),'采购仓管'],
    ['进度',tg('y','中'),'1.2 喷淋安装滞后','超 4 天 / 3 天',tg('y','处理中'),'项目经理'],
    ['合同',tg('g','低'),'变更签证回传','已回传 100%',tg('g','正常'),'资料员'],
    ['税务',tg('g','低'),'缺票','60% / 100%',tg('g','监控中'),'财务']],820))+
  card('blue',IC.eye,'业务助手 / 智能洞察记录','',
   KVGC([
    ['付款红灯','劳务付款超结算比例 · 缺票（红灯，老板可知情后特批）'],
    ['材料超量超价','暂无'],
    ['证书过期','项目负责人证书 2027-03 到期（90 天预警）'],
    ['风控结论','资金风险优先处理：先要求劳务补票再批付']]));}},
 {id:'chain',name:'循环穿透视图',dyn:function(){
  return card('purple',IC.chain,'穿透路径（正向 + 反向）','',
   '<div class="pen-chips">'+['项目','销售合同','支出合同','供应商','订单','发货签收','入库单','发票','付款','项目'].map(function(n,i){return '<span class="pen-chip" data-toast="演示：跳转到 '+n+'（循环穿透）">'+n+'</span>'+(i<9?'<span class="pen-arr">→</span>':'')}).join('')+'</div>')+
  card('blue',IC.link,'快捷入口（点击任意对象循环跳转）','',
   '<div class="qgrid">'+[['销售合同',relC?(relC.id+(relCs.length>1?' 等 '+relCs.length+' 份':'')):'待关联'],['支出合同','ZC-2609-08 · ZC-2609-11'],['供应商','华信管业 · 劳务班组 · 机电分包'],['采购订单','PO-2609-31'],['发货签收','FH-2609-05 · QS-2609-05'],['入库单','RK-2609-31（AI 拍照入库）'],['发票','KP-2609-06 · 收票 4 张'],['付款单','FK-2609-04 · FK-2609-07']].map(function(l){return '<div class="qtile" data-toast="演示：跳转查看「'+l[0]+' — '+l[1]+'」（可反向穿透回项目）"><div class="qi">'+IC.link+'</div><span>'+l[0]+' · '+l[1]+'</span></div>'}).join('')+'</div>')+
  '<p class="mn-tip">从供应商可反向跳转其在本企业其他项目的合同与订单，再回到本项目，形成循环穿透</p>';}},
 {id:'log',name:'操作日志',dyn:function(){
  return card('blue',IC.clock,'审计轨迹（状态流转而非物理删除）','',
   TBL(['时间','操作人','操作类型','操作对象','变更前 → 变更后'],[
    ['09-17 18:20','孙倩','资料归档','验收资料','待归档 → 已归档'],
    ['09-16 10:05','李敏','成本变更','镀锌钢管预算价','168.0 → 165.0（V3）'],
    ['09-12 14:30','采购仓管','入库确认','RK-2609-31','待验收 → 已入库'],
    ['09-10 09:00','成控财务','付款审批','FK-2609-04','审批中 → 已通过（知情特批）'],
    ['08-28 16:40','商务投标','立项',p.id,'中标 → 项目立项'],
    ['08-28 16:40','系统','创建','项目','—']],820))+
  '<p class="mn-tip">所有查看、下载、变更、审批、穿透、导出均留痕，满足审计与追溯</p>';}}];
 if(p.type==='改造'||p.type==='维修')tabs.push({id:'survey',name:'勘察与报价',dyn:function(){
  return card('purple',IC.scan,'现场勘察（改造 / 维修项目特有）','',
   TBL(['勘察单','勘察人','日期','消防电系统','防排烟','照明 / 水系统'],[
    ['KC-2609-01','王强','09-02','主机老旧 · 回路 12 个','风阀缺失 3 处','水系统压力正常']],900))+
  card('blue',IC.link,'价格库引用（关联 material_id）','',
   TBL(['材料','参考价 / 内部定额','询价价','合同价','区域','来源'],[
    ['点型感烟探测器','¥78.0','¥76.5','¥75.5','昆明',tg('b','内部定额')],
    ['镀锌钢管 DN100','¥168.0','¥166.0','¥165.0','昆明',tg('g','合同价')],
    ['喷淋头 ZSTX15','¥45.0','¥44.0','—','昆明',tg('b','询价价')]],860))+
  card('green',IC.money,'综合单价上浮（整体按比例 / 单项 / 总量）','',
   KVGC([['上浮方式','整体按比例 12%'],['上浮前合价',W(682.5)],['上浮后合价',W(764.4)],['备注','可在报价单按比例一起上浮、单个上浮、总量上浮']]))+
  card('amber',IC.target,'报价单 → 目标成本反写','',
   KVGC([['报价单','BJ-2609-05 · 含价报价 · 已打印（企业 Logo）'],['目标成本反写','报价清单反向生成成本项 · 控制方式已设置'],['中标后','报价清单 → 项目目标成本 → 量价双控基准']]));}});
 if(p.type==='维保')tabs.push({id:'wm',name:'维保专项',dyn:function(){
  return card('green',IC.cert,'保内 / 保外与片区线路','',
   KVGC([['warranty_type',tg('g','保内')],['片区','昆明组'],['线路计划','线路一（含本项目 · 共 4 个项目）'],['维保合同','WB-2609-02 · ¥72 万 / 年']]))+
  card('purple',IC.clock,'工单闭环（发起 → 调度 → 处理 → 分析 → 审核 → 回访）','',
   TBL(['工单号','类型','状态','派工','处理','回访'],[
    ['WO-2609-18','报修工单',tg('g','已完成 · 已回访'),'李师傅','探测器更换','满意度 5 星'],
    ['WO-2609-21','巡检工单',tg('y','处理中'),'王师傅','线路巡检中','—']],700))+
  card('amber',IC.money,'维修订单确收（保外必须确收后开票收款）','',
   TBL(['维修订单','费用','是否保外','is_confirmed','开票 / 收款'],[
    ['RO-2609-03','¥4,800',tg('r','保外'),tg('g','已确收'),tg('g','已开票 · 已收款')]],700))+
  card('blue',IC.team,'满意度与续签','',
   KVGC([['业主满意度','最近 4.8 / 5.0 · 二维码评价'],['到期日','2027-06-30'],['续签商机','已进入商机池 · 预计 2027-03 谈判']]));}});
 var cur=(window.__projTab||{})[pid]||tabs[0].id;
 var tab=tabs[0];for(var i=0;i<tabs.length;i++){if(tabs[i].id===cur)tab=tabs[i]}
 var body=tab.dyn();
 var twoCol=tab.id==='overview';
 $('#viewDash').style.display='none';var v=$('#viewPage');v.style.display='';
 var badge=function(cls,txt){return '<span class="tag '+cls+'"><i></i>'+txt+'</span>'};
 var bTag=p.type==='改造'?'amber':(p.type==='维保'?'green':'blue');
 var bMode=p.mode==='联营'?'amber':'blue';
 var bStatus=(p.stage==='施工中'||p.stage==='施工准备')?'green':'yellow';
 var gmTarget=((p.cont||0)-(p.budget||0))/(p.cont||0)*100;
 var gmDelta=((p.gm||0)-gmTarget).toFixed(1);
 var costRate=Math.round((p.budget||0)/(p.cont||0)*1000)/10;
 var actRate=Math.round((p.actual||0)/(p.budget||0)*1000)/10;
 var icDocS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
 var icMoney='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
 var icTarget='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2"/></svg>';
 var icGm='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>';
 var icPrg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>';
 var kpi=function(icon,lb,v,barCfg,sub){return '<div class="kpi"><div class="lb">'+icon+lb+'</div><div class="v num">'+v+'</div>'+(barCfg?'<div class="bar"><i style="width:'+barCfg.w+'%;background:'+barCfg.c+'"></i></div>':'')+'<div class="sub">'+sub+'</div></div>'};
 var metaS=function(icon,txt){return '<span>'+icon+txt+'</span>'};
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="site">项目现场</span><span>/</span><span class="seg" data-goseg="site">项目主数据</span><span>/</span><span class="seg cur-seg">项目详情（项目 360）</span></div>'+
 '<section class="hero"><div class="hero-top"><div class="title-wrap">'+
  '<h1>'+p.name+' <span class="code num">'+p.id+'</span><svg class="copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></h1>'+
  '<div class="badges">'+badge(bTag,p.type)+badge('green',p.status||'在建')+badge(bMode,p.mode)+(p.type==='改造'?badge('red','滞后预警'):'')+'</div>'+
  '<div class="meta">'+metaS('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',p.region||'昆明')+metaS('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/></svg>',p.customer||'—')+metaS('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>','项目经理 · '+p.owner)+metaS('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>','更新于 09-17 18:24')+'</div></div>'+
  '<div class="actions">'+
  '<button class="btn" data-back="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>返回列表</button>'+
  '<button class="btn" data-toast="演示：项目 360 报表导出（经营 / 成本 / 资金）"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>导出 360 报表</button>'+
  '<button class="btn btn-primary" data-toast="演示：进入项目现场工作站执行管理"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>进入项目管理</button>'+
  '<button class="btn icon" data-toast="演示：更多项目操作（归档 / 权限 / 设置）">⋯</button></div></div>'+
  '<div class="kpis">'+
   kpi(icDocS,'销售合同额','<span style="font-size:16px;font-weight:500">'+W2(p.cont||0)+'</span><small> 万</small>',null,relC?(relC.id+' · '+relC.st):'待关联销售合同')+
   kpi(icTarget,'目标成本','<span style="font-size:16px;font-weight:500">'+W2(p.budget||0)+'</span><small> 万</small>',{w:Math.min(100,Math.round(costRate)),c:'var(--blue)'},'成本率 '+costRate+'%')+
   kpi(icMoney,'实际成本','<span style="font-size:16px;font-weight:500">'+W2(p.actual||0)+'</span><small> 万</small>',{w:Math.min(100,Math.round(actRate)),c:'var(--green)'},'占目标成本 '+actRate+'%')+
   kpi(icGm,'毛利率','<span style="font-size:16px;font-weight:500">'+(p.gm||0)+'</span><small> %</small>',null,'<span class="up">▲ 较目标 +'+gmDelta+'pp</span>')+
   kpi(icPrg,'当前进度','<span style="font-size:16px;font-weight:500">'+prgP+'</span><small> %</small>',{w:Math.min(100,prgP),c:'linear-gradient(90deg,#2f6bff,#6c8dff)'},'较上周 +3%')+
  '</div></section>'+
 '<nav class="ptabs">'+tabs.map(function(t){return '<span class="ptab'+(t.id===tab.id?' active':'')+'" data-ptab="'+t.id+'">'+t.name+(t.id==='risk'?'<span class="rd"></span>':'')+'</span>'}).join('')+'</nav>'+
 (twoCol?body:CONT(body));
 window.scrollTo(0,0);
}
`,wn=`// 消安云平台 · 页面分片 renderSurvey —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function renderSurvey(kid){
 var s=SURVEYS.find(function(x){return x.id===kid});if(!s)return;
 var items=SURVEY_ITEMS[kid]||[];
 $('#viewDash').style.display='none';var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="bid">市场投标</span><span>/</span><span class="seg" data-goseg="bid">报价与勘察</span><span>/</span><span class="seg cur-seg">'+s.id+'</span></div>'+
 '<div class="page-head"><h1>现场勘察单 '+s.id+' · '+s.proj+'</h1><div class="page-actions">'+
  '<button class="btn btn-ghost" data-back="1">'+ICON.up+'<span>返回列表</span></button>'+
  '<button class="btn btn-ghost" data-toast="演示：打印 / 导出勘察单 PDF">'+ICON.dl+'<span>打印 / 导出</span></button>'+
  (s.quote?'<button class="btn btn-primary" data-toast="已关联报价单 '+s.quote+'">'+ICON.check+'<span>查看关联报价 '+s.quote+'</span></button>'
  :'<button class="btn btn-primary" data-quote-survey="'+s.id+'">'+ICON.plus+'<span>一键生成报价</span></button>')+'</div></div>'+
 '<div class="dt-card"><div class="dt-sec"><h4>勘察信息</h4><div class="kvg">'+
  '<div class="kv-row"><span>勘察单号</span><b>'+s.id+'</b></div><div class="kv-row"><span>关联商机</span><b>'+s.oid+'</b></div><div class="kv-row"><span>客户</span><b>'+clName(oppOf(s.oid).cid)+'</b></div>'+
  '<div class="kv-row"><span>项目类型</span><b>'+tagHtml(s.type,s.type==='改造'?'yellow':'blue')+'</b></div><div class="kv-row"><span>勘察系统</span><b>'+s.sys+'</b></div>'+
  '<div class="kv-row"><span>勘察人</span><b>'+s.owner+' · '+s.date+'</b></div><div class="kv-row"><span>现场照片</span><b>'+s.photos+' 张（已上传留痕）</b></div>'+
  '<div class="kv-row"><span>情况摘要</span><b>'+s.points+'</b></div></div></div></div>'+
 '<div class="dt-card"><div class="card-hd"><h3>勘察明细（'+items.length+' 项）</h3><div class="right"><span class="link-btn" data-toast="演示：补充现场照片 / 追加勘察项">补充</span></div></div><div style="padding:16px">'+
 '<div class="table-wrap">'+tblHTML(['系统','部位 / 设备','现场情况','数量','单位','处理建议','照片'],items.map(function(it){return '<tr><td>'+it[0]+'</td><td><b>'+it[1]+'</b></td><td>'+it[2]+'</td><td>'+(it[3]==='—'?'待复核':it[3])+'</td><td>'+it[4]+'</td><td>'+it[5]+'</td><td>'+tagHtml(it[6]+' 张','blue')+'</td></tr>'}).join(''),960)+'</div></div></div>'+
 ''+
 '<div class="demo-note">勘察项一键带入报价明细，作为报价编制数据源头；后续投标 / 施工阶段可穿透回看</div>';
 window.scrollTo(0,0);
 if(s.quote)setTimeout(function(){toast('已生成报价：'+s.quote+' · 报价编制工作台可继续调价 / 上浮，勘察明细为报价数据源头','ok')},450);
}`,hn=`// 消安云平台 · 页面分片 repDownHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function repDownHTML(){
 var rows=[
  ['BG-2609-015','XX产业园 维修报告','FM-03','PDF · 已签章',tg('g','可下载'),OKNO],
  ['BG-2609-018','XX医院 年度检测报告','FM-02','PDF · 待签章',tg('b','待签章后下载'),OKNO],
  ['BG-2609-012','XX商业广场 验收报告','FM-04','PDF · 草稿',tg('y','草稿不可下载'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">报告下载（PDF · 带企业 Logo 与签章）</div>'+
  '<div class="table-wrap">'+tblHTML(['报告编号','项目 · 报告','模板','格式 · 签章','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>可下载 1 · 待签章 1 · 草稿 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量打包下载">批量下载</button></span></div>'+
  '<div class="demo-note">报告下载留痕审计：谁在何时下载了哪份报告；未签章 / 未审核的报告禁止下载交付</div></div>';
}`,yn=`// 消安云平台 · 页面分片 repGenHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function repGenHTML(){
 var rows=[
  ['BG-2609-021','XX大厦 9 月维保报告','FM-01','自动填充 12 项数据',tg('b','生成中'),OKNO],
  ['BG-2609-018','XX医院 年度检测报告','FM-02','自动填充 46 项数据',tg('g','已生成 · 待签章'),OKNO],
  ['BG-2609-015','XX产业园 维修报告','FM-03','自动填充 8 项数据',tg('g','已签章 · 已交付'),OKNO],
  ['BG-2609-012','XX商业广场 验收报告','FM-04','待补充整改闭环',tg('y','草稿'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">报告生成（模板 → 自动填充 → 电子签 → 交付）</div>'+
  '<div class="table-wrap">'+tblHTML(['报告编号','项目 · 报告','模板','数据填充','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>生成中 1 · 待签章 1 · 已交付 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成报告">+ 生成报告</button></span></div>'+
  '<div class="demo-note">合同与报告可调用电子签 / CA 数字证书完成签章（联动电子签管理）</div></div>';
}`,Tn=`// 消安云平台 · 页面分片 repTplHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function repTplHTML(){
 var rows=[
  ['FM-01','月度维保报告','维保值班','维保记录 / 故障处理 / 建议',tg('g','在用'),OKNO],
  ['FM-02','年度消防检测报告','检测评估','检测项目 / 结果 / 结论',tg('g','在用'),OKNO],
  ['FM-03','消防设施维修报告','维修确收','维修内容 / 费用 / 照片',tg('g','在用'),OKNO],
  ['FM-04','验收报告','项目收尾','验收项 / 整改闭环',tg('b','草稿'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">报告模板（企业自定义 · 引用数据自动填充）</div>'+
  '<div class="table-wrap">'+tblHTML(['模板编号','模板名称','适用场景','内容组成','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>在用模板 3 · 草稿 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新建报告模板">+ 新建模板</button></span></div>'+
  '<div class="demo-note">报告模板引用各模块数据自动填充，支持电子签 / CA 数字证书签章</div></div>';
}`,kn=`// 消安云平台 · 页面分片 reqCartHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function reqCartHTML(){
 var rows=[
  ['WL-0101','镀锌钢管','DN100','m','12,000','8,400','3,600','<input class="wb-num" value="1200"/>',dt('g')+' 预算内'],
  ['WL-0232','喷淋头','ZSTX15','只','8,600','6,900','1,700','<input class="wb-num" value="600"/>',dt('g')+' 预算内'],
  ['WL-0455','点型烟感','JTY-GD','只','1,240','1,180','60','<input class="wb-num" value="120"/>',dt('r')+' 超量 +60'],
  ['WL-0512','电缆桥架','200×100','m','3,200','2,980','220','<input class="wb-num" value="200"/>',dt('y')+' 临界 92%']];
 return '<div class="card-bd">'+
  '<div class="wb-top"><b>申请项目：</b><select class="wb-sel" style="width:200px"><option>XX产业园喷淋系统工程</option></select><b>带出清单：</b>投标清单 / 目标成本树<span class="tag b">像购物下单：清单勾选 · 只填数量 · 价格自动带出</span><span style="margin-left:auto">申请人：李敏 · 2026-09-16</span></div>'+
  tblHTML(['编码','材料名称','规格','单位','预算量','已申请量','剩余可申请','本次申请数量','校验'],rows,860)+
  '<div class="wb-total"><span>本次合计 4 项 · 预计金额 <b>¥28.6 万</b></span><span style="margin-left:auto"><button class="mini-btn mini-no" data-act="暂存">暂存</button> <button class="mini-btn mini-ok" data-act="提交材料申请">提交材料申请</button></span></div></div>';
}`,Mn=`// 消安云平台 · 页面分片 returnScrapHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function returnScrapHTML(){
 var rows=[
  ['TH-2609-011','喷淋头 ZSTX15（规格不符）','60 只','金桥物资',tg('b','待退货'),OKNO],
  ['GH-2609-009','应急照明（损坏）','8 只','维保备件库',tg('g','已报废'),OKNO],
  ['TH-2609-007','镀锌钢管（剩余）','200 m','项目现场仓',tg('g','已归还入库'),OKNO],
  ['GH-2609-004','感烟探测器（烧毁）','12 只','维保备件库',tg('g','已报废'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">归还 / 报废（退货红冲 · 报废核销 · 剩余料归还入库）</div>'+
  '<div class="table-wrap">'+tblHTML(['单据号','物料','数量','处理对象','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>本月退货 2 单 · 报废 2 单 · 归还 1 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成红冲单">+ 新增</button></span></div>'+
  '<div class="demo-note">退货 / 红冲保留审计轨迹；报废需审批，物料状态流转（在库 → 已领用 → 报废）而非物理删除</div></div>';
}`,Xn=`// 消安云平台 · 页面分片 saleHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function saleHTML(){
 return '<div class="metrics"><div class="metric"><div class="m-label">本月新增商机</div><div class="m-num">3 个</div><div class="m-sub">¥1,886 万</div></div><div class="metric"><div class="m-label">报价提交数</div><div class="m-num">4 份</div><div class="m-sub">本月</div></div><div class="metric"><div class="m-label">中标数</div><div class="m-num">1 个</div><div class="m-sub">中标率 25%</div></div><div class="metric"><div class="m-label">人均商机额</div><div class="m-num">¥314 万</div><div class="m-sub">6 人</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>阶段转化率</h3><div class="right"><span class="link-btn" data-toast="演示：按季度切换">近 3 个月</span></div></div><div class="card-bd"><div class="chart"><div class="cb">'+[['初步→需求',82],['需求→勘察',67],['勘察→报价',75],['报价→投标',80],['投标→中标',50]].map(function(d,i){var mx=82;return '<div class="col"><div class="bar '+(d[1]===mx?'hot':'')+'" style="height:'+Math.round(d[1]/mx*70)+'%"><i>'+d[1]+'%</i></div><span class="xl">'+d[0]+'</span></div>'}).join('')+'</div></div></div></section>'+
 '<section class="card"><div class="card-hd"><h3>赢单 / 丢单原因</h3></div><div style="padding:16px">'+tblHTML(['类型','原因','数量','占比'],[
  ['赢单','价格有竞争力（引用内部定额控价）','2','50%'],
  ['赢单','客户关系深（跟进频次高）','1','25%'],
  ['丢单','报价偏高','1','25%'],
  ['丢单','资质不符（证书未及时更新）','0','0%']].map(function(r){return '<tr><td>'+tagHtml(r[0],r[0]==='赢单'?'green':'red')+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>'}).join(''),700)+'</div></section>';
}`,xn=`// 消安云平台 · 页面分片 settleCalcHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function settleCalcHTML(){
 var hs=[['HS-2609-06','XX产业园喷淋系统 · 第 6 期','386.00','-0.40（变更 01）','82.40','82.40','154.40','19.30','已审定'],['HS-2609-05','XX国际大厦 · 第 3 期','1,860.00','+8.60（签证 03）','562.80','180.60','410.20','93.00','已审定'],['HS-2609-04','XX医院二期 · 第 2 期','1,205.60','—','96.50','96.50','150.00','60.28','待审批'],['HS-2609-03','XX学校改造 · 竣工结算','118.00','+2.10','120.10','120.10','118.00','5.90','审计中']];
 var rows=hs.map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td><td>'+tagHtml(r[8],r[8]==='已审定'?'green':(r[8]==='待审批'?'yellow':'blue'))+'</td></tr>'}).join('');
 var xs=SETTLE_XS.map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td></tr>'}).join('');
 var cg=[['ZX-2609-01','管网材料','金桥物资','168.30','120.60','86.20','96.00','71.5%','47.70'],['ZX-2609-02','喷淋材料','天广消防','27.90','22.30','18.60','22.00','83.4%','5.60'],['ZX-2609-03','报警设备','安泰电子','11.50','—','—','—','0%','11.50']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+r[7]+'</td><td>'+r[8]+'</td></tr>'}).join('');
 var cAll=0,cSale=0,cPur=0;CONTRACTS.forEach(function(c){var a=c.amt||0;cAll+=a;if(c.dir==='销售')cSale++;if(c.dir==='采购')cPur++});
 var hSum=0,wSum=0;hs.forEach(function(r){hSum+=parseFloat(r[4])||0;wSum+=parseFloat(r[7])||0});
 var arSum=0;SETTLE_XS.forEach(function(r){arSum+=(parseFloat(String(r[6]).replace(/,/g,''))||0)});
 var setRate=Math.round(hSum/cAll*1000)/10;
 return '<div class="wb-top"><b>合同结算与核算：</b>合同核算单 / 结算清单按合同汇总「原合同金额 → 变更金额 → 累计结算 → 本期应结 → 已付累计 → 尾款余额 → 支付条件」，数据来自项目 360 / 经营报表自动归集，销售与采购分侧展示</div>'+
 '<div class="metrics"><div class="metric"><div class="m-label">合同总额</div><div class="m-num">¥'+nfmt(Math.round(cAll))+' 万</div><div class="m-sub">销售 '+cSale+' · 采购 '+cPur+'</div></div><div class="metric"><div class="m-label">累计结算</div><div class="m-num">¥'+nfmt(Math.round(hSum*10)/10)+' 万</div><div class="m-sub">结算率 '+setRate+'%</div></div><div class="metric"><div class="m-label">应收余额</div><div class="m-num" style="color:#ad6800">¥'+nfmt(Math.round(arSum*10)/10)+' 万</div><div class="m-sub">销售侧 3 份合同余额合计</div></div><div class="metric"><div class="m-label">质保金待收</div><div class="m-num">¥'+nfmt(Math.round(wSum*10)/10)+' 万</div><div class="m-sub">4 笔到期提醒已设</div></div></div>'+
 '<div class="dv-sec">合同核算单（原合同金额 · 变更 · 累计结算 · 已付 · 尾款）</div>'+
 '<div class="table-wrap">'+tblHTML(['核算单号','期间 / 项目','原合同金额','变更金额','累计结算','本期应结','已付累计','尾款 / 质保金','状态'],rows,1280)+'</div>'+
 '<div class="dv-sec">销售侧（产值 · 开票 · 收款 · 应收余额 · 质保金）</div>'+
 '<div class="table-wrap">'+tblHTML(['销售合同','项目','合同金额','累计产值','累计收款','累计开票','应收余额','质保金'],xs,1180)+'</div>'+
 '<div class="dv-sec">采购侧（结算 · 收票 · 付款 · 剩余未结算）</div>'+
 '<div class="table-wrap">'+tblHTML(['采购合同','类型','供应商','合同金额','累计结算','累计付款','累计收票','付款比例','剩余未结算'],cg,1280)+'</div>'+
 '<div class="mat-opbar"><span class="opb-title">经营指标联动：毛利润 / 现金流 / 税负比来自项目 360 自动报表，无需专人做表</span><span style="flex:1"></span><button class="btn btn-ghost" data-toast="演示：新建合同核算单">新建核算单</button><button class="btn btn-ghost" data-toast="演示：发起对账单">发起对账</button><button class="btn btn-primary" data-toast="演示：跳转开票 / 收票任务">开票 / 收票</button></div>'+
 '<div class="demo-note">发货单 / 签收单是结算依据：签收合格 → 对账 → 合同核算单 → 开票收票 → 付款，形成「合同 → 发货 → 签收 → 入库 → 核算 → 发票 → 付款」闭环</div>';
}`,On=`// 消安云平台 · 页面分片 siteCountHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteCountHTML(){
 var rows=[
  ['P-2609-08','XX产业园喷淋工程','2026-12-31','剩余 105 天',tg('g','正常'),OKNO],
  ['P-2609-05','XX医院消防改造','2026-11-30','剩余 74 天 · 滞后 5 天',tg('o','滞后'),OKNO],
  ['P-2609-01','XX物流园（联营）','2026-10-15','剩余 28 天',tg('r','紧迫'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">工期倒计时 / 逾期预警（计划 vs 实际自动对比）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目','类型','计划完工','剩余 / 状态','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>正常 1 · 滞后 1 · 紧迫 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：生成进度预警">生成预警</button></span></div>'+
  '<div class="demo-note">偏差超阈值自动红色预警并通知责任人，防止工期失控</div></div>';
}`,Ln=`// 消安云平台 · 页面分片 siteLogHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteLogHTML(){
 var rows=[
  ['09-16','XX产业园喷淋工程','管道安装完成 80% · 喷头进场 600 只','王工',tg('g','已提交'),OKNO],
  ['09-15','XX医院消防改造','探测器安装 3F 完成 · 主机调试中','李工',tg('g','已提交'),OKNO],
  ['09-14','XX商业广场维保','季度巡检完成 · 隐患 1 项转工单','钱工',tg('g','已提交'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">施工日志（每日记录 · 现场留痕）</div>'+
  '<div class="table-wrap">'+tblHTML(['日期','项目','当日内容','记录人','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>本月日志 86 条</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：填写今日日志">+ 写日志</button></span></div>'+
  '<div class="demo-note">施工日志联动工序汇报与现场照片，作为进度与结算证据</div></div>';
}`,Pn=`// 消安云平台 · 页面分片 siteRecvHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteRecvHTML(){
 var rows=[
  ['CK-2609-028','镀锌钢管 DN100','800 m','喷淋班组',tg('b','部分领用'),OKNO],
  ['CK-2609-026','喷淋头 ZSTX15','240 只','喷淋班组',tg('g','已领用'),OKNO],
  ['AI-2609-031','烟感探测器','60 只','AI 入库 · 关联工单',tg('g','已入库'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">现场收货 / 领用（关联出库单与成本项）</div>'+
  '<div class="table-wrap">'+tblHTML(['单据','物料','数量','关联班组 / 工单','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>今日现场收货 3 单 · 领用 2 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：现场收货登记">+ 现场收货</button></span></div>'+
  '<div class="demo-note">现场收货 / 领用自动归集到成本项，超领 / 损耗生成扣款</div></div>';
}`,jn=`// 消安云平台 · 页面分片 siteRvHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteRvHTML(){
 var rows=[
  ['P-2609-03','XX商业广场维保','2026-08 关闭','续签率 100% · 满意度 4.6',tg('g','复盘完成'),OKNO],
  ['P-2609-01','XX物流园（联营）','2026-06 关闭','联营资金风险教训 · 走款规则修订',tg('g','复盘完成'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">项目后评估（复盘 · 经验教训 · 知识沉淀）</div>'+
  '<div class="table-wrap">'+tblHTML(['项目','类型','关闭时间','复盘要点','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>已复盘 2 · 待复盘 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发起复盘">+ 发起复盘</button></span></div>'+
  '<div class="demo-note">项目关闭后进入后评估，沉淀经验教训与组织过程资产，反哺投标与执行</div></div>';
}`,Sn=`// 消安云平台 · 页面分片 siteSuppHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteSuppHTML(){
 var rows=[
  ['XY-2609-006','XX产业园 · 签证补充协议','+¥26,400','业主原因',tg('b','审批中'),OKNO],
  ['XY-2609-004','XX医院 · 变更补充协议','+¥18,200','设计变更',tg('g','已生效'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">补充协议（变更 / 签证生成 · 费用同步预算）</div>'+
  '<div class="table-wrap">'+tblHTML(['协议号','项目 · 内容','金额','原因','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>审批中 1 · 已生效 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发起补充协议">+ 发起补充协议</button></span></div>'+
  '<div class="demo-note">补充协议生效后费用自动同步预算，变更留痕并参与量价双控</div></div>';
}`,_n=`// 消安云平台 · 页面分片 siteVisaHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function siteVisaHTML(){
 var rows=[
  ['QZ-2609-005','XX产业园 · 新增喷淋支管','业主原因','照片 / 签证单 8 份',tg('b','待回传'),OKNO],
  ['QZ-2609-003','XX医院 · 加装防火门','业主原因','资料已回传',tg('g','已审核'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">签证资料回传（业主原因必须完善签证资料 · 否则收款无依据）</div>'+
  '<div class="table-wrap">'+tblHTML(['签证单','内容','原因','资料','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>待回传 1 · 已审核 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：上传签证资料">上传资料</button></span></div>'+
  '<div class="demo-note">业主原因变更必须完善签证资料，否则后续收款无依据；班组原因损耗则形成扣款</div></div>';
}`,Hn=`// 消安云平台 · 页面分片 stockTakeHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function stockTakeHTML(){
 var rows=[
  ['PD-2609-003','项目现场仓 A','2026-09-16','2,800 项','盘盈 3 · 盘亏 2',tg('b','待审批'),OKNO],
  ['PD-2609-002','维保备件库','2026-09-10','96 项','账实一致',tg('g','已审批'),OKNO],
  ['PD-2609-001','公司库','2026-09-05','1,240 项','盘亏 1（应急照明）',tg('g','已审批'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">盘点（盘盈 / 盘亏调整单 · 审批后写入库存事务）</div>'+
  '<div class="table-wrap">'+tblHTML(['盘点单','仓库','盘点日期','盘点项数','差异结果','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>盘点差异 5 项 · 涉及金额 ¥1,280</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：发起盘点">+ 发起盘点</button></span></div>'+
  '<div class="demo-note">盘盈 / 盘亏通过盘点调整单处理，不直接改入库单；差异审批后生成库存事务留痕</div></div>';
}`,Cn=`// 消安云平台 · 页面分片 supArchHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function supArchHTML(){
 var rows=[
  ['HS-011','华信管业','昆明','张经理','消防管材 · 资质齐全','12','¥486 万',tg('g','A级'),OKNO],
  ['HS-021','天广消防','昆明','李经理','消防设备 · 3C 认证','8','¥312 万',tg('g','A级'),OKNO],
  ['HS-032','金桥物资','文山','王经理','管件 · 资质齐全','3','¥52 万',tg('y','B级'),OKNO],
  ['HS-045','正泰消防','楚雄','陈经理','探测器 · 授权经销','2','¥31 万',tg('y','B级'),OKNO],
  ['HS-018','安泰电子','昆明','刘经理','报警主机 · 区域代理','5','¥128 万',tg('g','A级'),OKNO],
  ['HS-027','海湾代理','南宁','周经理','海湾产品 · 广西区域','4','¥96 万',tg('y','B级'),OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">供应商总数</div><div class="m-num">36 家</div><div class="m-sub">A 级 12 · B 级 19 · C 级 5</div></div><div class="metric"><div class="m-label">本月新增</div><div class="m-num">2 家</div><div class="m-sub">资质已核验</div></div><div class="metric"><div class="m-label">累计采购额</div><div class="m-num">¥1,105 万</div><div class="m-sub">本年已发生</div></div></div>'+
 '<div class="fbar"><select><option>区域：全部</option><option>区域：昆明</option><option>区域：文山</option><option>区域：楚雄</option><option>区域：广西</option></select><select><option>评级：全部</option><option>评级：A 级</option><option>评级：B 级</option><option>评级：C 级</option></select><input class="fkw" placeholder="供应商 / 联系人关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['供应商编码','名称','区域','联系人','资质','合作项目','累计合同额','评级','操作'],rows,1120)+'</div>'+
 '<div class="demo-note">供应商建档防流失：资质、评级、历史合同 / 订单 / 入库 / 结算 / 付款全记录；点击查看其在不同区域、不同项目的材料价格（反哺价格库）</div>';
}`,An=`// 消安云平台 · 页面分片 supBlackHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function supBlackHTML(){
 var rows=[
  ['金桥物资（原 HS-032）','交付 200 只喷淋头规格不符，拒收 2 次','2026-06-18','¥18 万','09-02 完成整改复评',tg('r','拉黑中'),OKNO],
  ['XX 电器（原 HS-076）','伪造 3C 证书，消防验收不通过','2026-04-22','¥65 万','—',tg('r','永久拉黑'),OKNO],
  ['XX 线缆（原 HS-088）','供货掺杂非标线缆，涉诉处理中','2026-03-10','¥32 万','—',tg('r','永久拉黑'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">供应商黑名单（拉黑原因 · 损失金额 · 整改复评）</div>'+
  '<div class="table-wrap">'+tblHTML(['供应商','拉黑原因','拉黑时间','关联损失','整改复评','状态','操作'],rows,1120)+'</div>'+
  '<div class="wb-total"><span>黑名单 3 家 · 阻断新询价 / 新订单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出黑名单">导出黑名单</button></span></div>'+
  '<div class="demo-note">黑名单供应商在询比价、采购合同、采购订单中不可选；消防 3C / 型式检验造假一律永久拉黑</div></div>';
}
/* ===== 波次A1 合同成本剩余 ===== */`,En=`// 消安云平台 · 页面分片 supLevelHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function supLevelHTML(){
 var rows=[
  ['华信管业','92','88','95','90',tg('g','A级'),'年度合作 12 单 · 价格稳定',OKNO],
  ['天广消防','90','92','88','91',tg('g','A级'),'3C 认证齐全 · 交付准时',OKNO],
  ['安泰电子','86','90','84','88',tg('g','A级'),'技术支持及时',OKNO],
  ['金桥物资','78','80','75','79',tg('y','B级'),'交期偶有延迟',OKNO],
  ['正泰消防','80','82','72','78',tg('y','B级'),'付款条款需沟通',OKNO],
  ['海湾代理','74','78','70','76',tg('y','B级'),'报价偏高',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">供应商评级（按 价格 / 质量 / 交期 / 服务 四维评分，季度自动更新）</div>'+
  '<div class="table-wrap">'+tblHTML(['供应商','价格分','质量分','交期分','服务分','综合评级','说明','操作'],rows,1080)+'</div>'+
  '<div class="wb-total"><span>评分自动采集：询价价差 / 到货合格率 / 交期准时率 / 售后响应</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：季度评级重算">立即重算</button></span></div>'+
  '<div class="demo-note">评级影响后续询比价中标倾向：A 级供应商在询比价中优先展示（联动采购与询比价）</div></div>';
}`,Nn=`// 消安云平台 · 页面分片 supPayHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function supPayHTML(){
 var rows=[
  ['华信管业','¥512,000','¥486,000','¥168,000','¥8,500','可批 ¥18,000',tg('g','优先支付'),OKNO],
  ['天广消防','¥210,000','¥186,000','¥86,400','¥62,000',tg('y','接近上限'),OKNO],
  ['安泰电子','¥128,000','¥96,000','¥42,800','0',tg('g','可正常批'),OKNO],
  ['正泰消防','¥96,000','¥82,000','0',tg('r','缺票'),tg('r','缺票暂缓'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">同项目多供应商付款决策（老板从项目维度看各供应商合同 / 结算 / 收票 / 付款，决定先批谁、批多少）</div>'+
  '<div class="table-wrap">'+tblHTML(['供应商','合同金额','累计付款','累计收票','待批金额','可批额度','决策建议','操作'],rows,1120)+'</div>'+
  '<div class="wb-total"><span>项目 XX产业园 · 4 家供应商 · 可用资金 ¥4.8 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：按风险顺序批量审批">批量审批</button></span></div>'+
  '<div class="demo-note">同一项目多家供应商同时申请付款时，老板按合同 / 结算 / 收票 / 资金余额综合决策，缺票项暂缓</div></div>';
}
/* ===== 波次A2 采购仓储剩余 ===== */`,Fn=`// 消安云平台 · 页面分片 supQuoteHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function supQuoteHTML(){
 var rows=[['安泰电子','镀锌钢管 DN100','m','¥162','¥165','¥158','09-15 询价','合作中'],['鑫源钢贸','镀锌钢管 DN100','m','¥158','¥160','¥155','08-20 合同','合作中'],['天广消防','喷淋头 ZSTX15','只','¥30','¥32','¥28','09-14 询价','合作中'],['海湾代理','点型烟感','只','¥86','¥88','¥80','08-10 合同','合作中'],['安泰电子','防火卷帘 双轨双帘','㎡','¥620','¥630','¥615','09-01 成交','合作中']].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td><td>'+tagHtml(r[7],'green')+'</td></tr>'}).join('');
 return '<div class="pills"><div class="pill active">全部 <b>5</b></div><div class="pill">合作中 <b>5</b></div></div>'+
 '<div class="fbar"><select><option>供应商：全部</option><option>供应商：安泰电子</option><option>供应商：天广消防</option><option>供应商：海湾代理</option></select><select><option>材料：全部</option><option>材料：镀锌钢管</option><option>材料：喷淋头</option></select><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['供应商','供应材料','单位','最新报价','最高','最低','最近来源','状态'],rows,1000)+'</div>'+
 '<div class="demo-note">供应商报价记录：同一材料多家比价，报价 / 成交价沉淀价格库，供报价与成本测算引用</div>';
}`,In=`// 消安云平台 · 页面分片 surveyHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function surveyHTML(){
 var rows=SURVEYS.map(function(s){return '<tr><td>'+s.id+'</td><td><b>'+s.proj+'</b></td><td>'+tagHtml(s.type,s.type==='改造'?'yellow':'blue')+'</td><td>'+s.sys+'</td><td>'+s.items+' 项</td><td>'+s.photos+' 张</td><td>'+s.owner+'</td><td>'+s.date+'</td><td>'+tagHtml(s.status,s.status==='已勘察·待报价'?'yellow':s.status.indexOf('未中标')>-1?'red':'blue')+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-survey="'+s.id+'">查看</button>'+(s.quote?'<button class="mini-btn mini-no" data-toast="已关联报价单 '+s.quote+'">报价</button>':'<button class="mini-btn mini-ok" data-quote-survey="'+s.id+'">生成报价</button>')+'</span></td></tr>'}).join('');
 return '<div class="metrics"><div class="metric"><div class="m-label">本月勘察单</div><div class="m-num">2 份</div><div class="m-sub">改造 / 维修 / 智慧消防项目</div></div><div class="metric"><div class="m-label">已生成报价</div><div class="m-num">1 份</div><div class="m-sub">KC-2609-01 → BJ-2609-05</div></div><div class="metric"><div class="m-label">平均拍照</div><div class="m-num">8 张/单</div><div class="m-sub">现场证据留痕</div></div></div>'+
 '<div class="pills"><div class="pill active">全部 <b>3</b></div><div class="pill">改造项目 <b>2</b></div><div class="pill">智慧消防 <b>1</b></div><div class="pill">已勘察·待报价 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>勘察系统：全部</option><option>勘察系统：消防水系统</option><option>勘察系统：消防电系统</option><option>勘察系统：防排烟系统</option></select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-08 ~ 09</span><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['勘察单号','项目','类型','勘察系统','明细项','照片','勘察人','日期','状态','操作'],rows,1080)+'</div>'+
 '<div class="demo-note">改造 / 维修 / 智慧消防项目特有环节：先勘察后报价，勘察项联动价格库生成报价，避免现场乱报价</div>';
}`,Bn=`// 消安云平台 · 页面分片 sysApiHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysApiHTML(){
 var rows=[
  ['税务开票','双向','自动开票 / 自动收票','合同 → 发票','已授权',tg('g','正常'),OKNO],
  ['电子签 / CA','单向','报告 / 合同签章','合同 → 签章',tg('g','正常'),'已授权',OKNO],
  ['IoT 设备','单向','实时监测 / 告警','设备 → 平台',tg('b','对接中'),'评估中',OKNO],
  ['ERP / 财务','双向','凭证 / 对账','单据 → 凭证',tg('y','待评估'),'需字段映射',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">API 集成（方向 · 触发 · 字段 · 频率 · 失败处理 · 数据责任）</div>'+
  '<div class="table-wrap">'+tblHTML(['集成对象','方向','用途','数据流','授权','状态','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>已授权 2 · 对接中 1 · 待评估 1</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：申请 API 密钥">申请密钥</button></span></div>'+
  '<div class="demo-note">API 接口免费提供；与税务 / ERP / 物联网深度对接需评估字段映射与费用</div></div>';
}`,Dn=`// 消安云平台 · 页面分片 sysBackupHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysBackupHTML(){
 var rows=[
  ['自动备份','每日 02:00','近 30 天',tg('g','成功'),'09-16 02:00',OKNO],
  ['自动备份','每周日 02:00','近 12 周',tg('g','成功'),'09-15 02:00',OKNO],
  ['手动备份','管理员触发','快照',tg('b','待执行'),'—',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">数据备份（自动 / 手动 · 恢复演练）</div>'+
  '<div class="table-wrap">'+tblHTML(['备份类型','频率','保留','状态','最近时间','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>自动备份成功率 100% · 上月恢复演练通过</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：立即备份">立即备份</button></span></div>'+
  '<div class="demo-note">数据、安全、运维三大支撑体系：备份 + 恢复演练 + 日志监控，保障业务连续性</div></div>';
}
/* ===== 波次C1 业主服务 ===== */`,qn=`// 消安云平台 · 页面分片 sysBillHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysBillHTML(){
 return '<div class="metrics"><div class="metric"><div class="m-label">当前版本</div><div class="m-num">专业版</div><div class="m-sub">68 人 · 5 年</div></div><div class="metric"><div class="m-label">年费</div><div class="m-num">¥58,800</div><div class="m-sub">选配另计</div></div><div class="metric"><div class="m-label">下次续费</div><div class="m-num">2029-09</div><div class="m-sub">支持 3 年 / 5 年</div></div></div>'+
  '<div class="table-wrap">'+tblHTML(['计费项','规格','单价','数量','金额','周期'],[
   ['基础席位','20–30 人档','¥800 / 人 / 年','28','¥22,400','年'],
   ['额外席位','31–68 人','¥600 / 人 / 年','40','¥24,000','年'],
   ['业务助手','选配','¥300 / 月','12','¥3,600','月'],
   ['实施服务','上线陪跑','¥8,800 / 次','1','¥8,800','一次性']],920)+'</div>'+
  '<div class="demo-note">按使用人数收费（20–30 人档），可选三年 / 五年；选配能力单独计费，实施约 1.5–2.5 个月上线</div>';
}`,Rn=`// 消安云平台 · 页面分片 sysLogHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysLogHTML(){
 var rows=[
  ['09-16 10:24','张成控','改价 WL-0101 22→20','价格库',tg('g','正常'),OKNO],
  ['09-16 09:30','李材管','导出材料主数据','材料库',tg('g','正常'),OKNO],
  ['09-15 17:20','王经理','特批付款 FK-2609-032','资金与发票',tg('o','特批'),OKNO],
  ['09-15 11:05','周凯','下载合同 ZC-2609-08','合同档案',tg('g','正常'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">安全日志（谁在何时做了什么 · 审计追溯）</div>'+
  '<div class="table-wrap">'+tblHTML(['时间','操作人','操作','模块','结果','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>今日日志 186 条 · 敏感操作 3 条</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：导出安全日志">导出日志</button></span></div>'+
  '<div class="demo-note">查看 / 下载 / 改价 / 审批 / 特批 / 导出全留痕，满足 SaaS 多租户审计与风控</div></div>';
}`,Kn=`// 消安云平台 · 页面分片 sysMarketHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysMarketHTML(){
 var rows=[
  ['录单（AI 识别单据）','已开通','¥0 / 基础版',tg('g','启用中'),OKNO],
  ['业务助手（六不准审核）','已开通','¥300 / 月',tg('g','启用中'),OKNO],
  ['智能归档（图书管理员）','可选配','¥200 / 月',tg('b','未开通'),OKNO],
  ['知识库 AI（问答 / 检索）','可选配','¥500 / 月',tg('b','未开通'),OKNO],
  ['数字孪生 / IoT 接入','可选配','按点位计费',tg('b','未开通'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">模块市场（选配能力独立计费）</div>'+
  '<div class="table-wrap">'+tblHTML(['模块','状态','计费','开通状态','操作'],rows,900)+'</div>'+
  '<div class="wb-total"><span>已开通 2 · 可选配 3</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：申请开通模块">申请开通</button></span></div>'+
  '<div class="demo-note">AI 录单 / 业务助手 / 智能归档 / 知识库 AI 等能力单独计费，按企业需求选配</div></div>';
}`,Gn=`// 消安云平台 · 页面分片 sysOrgHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysOrgHTML(){
 var rows=[
  ['工程部','12 人','王经理','项目经理 4 · 施工员 6 · 资料员 2',tg('g','正常'),OKNO],
  ['采购部','5 人','李经理','采购员 3 · 仓管 2',tg('g','正常'),OKNO],
  ['维保部','18 人','赵经理','维保员 14 · 调度 2 · 备件 2',tg('g','正常'),OKNO],
  ['财务部','4 人','张会计','会计 2 · 出纳 2',tg('g','正常'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">组织人员（部门 · 岗位 · 人数）</div>'+
  '<div class="table-wrap">'+tblHTML(['部门','人数','负责人','岗位构成','状态','操作'],rows,940)+'</div>'+
  '<div class="wb-total"><span>全员 68 人 · 5 个部门</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新增部门 / 成员">+ 新增</button></span></div></div>';
}`,Wn=`// 消安云平台 · 页面分片 sysPaasHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysPaasHTML(){
 var rows=[
  ['表单设计','付款申请 / 报销单','拖拉拽 26 个表单',tg('g','已用'),OKNO],
  ['流程设计','审批流 42 条','节点 / 条件 / 会签',tg('g','已用'),OKNO],
  ['报表设计','经营报表 12 张','指标 / 口径配置',tg('g','已用'),OKNO],
  ['字段 / 映射','自定义字段 36 个','取值映射',tg('g','已用'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">PaaS 低代码配置（表单 / 流程 / 报表 / 字段 拖拉拽配置 · 培养企业超级管理员）</div>'+
  '<div class="table-wrap">'+tblHTML(['配置类型','现有资产','说明','状态','操作'],rows,960)+'</div>'+
  '<div class="wb-total"><span>表单 26 · 流程 42 · 报表 12 · 字段 36</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：进入低代码设计器">进入设计器</button></span></div>'+
  '<div class="demo-note">平台不是标准化死产品：表单 / 流程 / 报表 / 字段均可配置，随企业成长迭代；实施：启动 → 调研 → 搭建 → 确认 → 培训 → 上线</div></div>';
}`,Jn=`// 消安云平台 · 页面分片 sysRoleHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysRoleHTML(){
 var rows=[
  ['老板 / 高管','经营驾驶舱 / 项目 360 / 风险中心','只读 · 特批','全部数据','16',tg('g','启用'),OKNO],
  ['项目经理','项目现场 / 进度 / 质量 / 劳务','编辑','本部门项目',tg('b','8'),tg('g','启用'),OKNO],
  ['采购员','采购询比价 / 订单','编辑','采购范围','6',tg('g','启用'),OKNO],
  ['成控 / 财务','价格库 / 结算 / 付款 / 发票','编辑 · 审批','全项目',tg('b','10'),tg('g','启用'),OKNO],
  ['维保员','维保工单 / 值班','编辑','本片区',tg('b','5'),tg('g','启用'),OKNO],
  ['外部供应商','询价 / 订单 / 对账','只读',tg('r','仅己方数据'),'3',tg('g','启用'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">角色权限（RBAC · 工作站 / 菜单 / 数据范围 / 字段 / 按钮 五级控制）</div>'+
  '<div class="table-wrap">'+tblHTML(['角色','可见菜单','操作','数据范围','权限点数','状态','操作'],rows,1080)+'</div>'+
  '<div class="wb-total"><span>角色 8 个 · 权限点 96 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：新建角色">+ 新建角色</button></span></div>'+
  '<div class="demo-note">权限必须控制到 工作站 / 二级菜单 / 数据范围 / 字段 / 按钮，不能只隐藏一级菜单；业主 / 供应商隐藏成本利润</div></div>';
}`,Qn=`// 消安云平台 · 页面分片 sysTenantHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function sysTenantHTML(){
 var rows=[
  ['诺盾消防','主租户','68 人','专业版 · 5 年',tg('g','启用'),OKNO],
  ['XX 消防工程公司（演示）','演示租户','30 人','标准版 · 3 年',tg('b','试用中'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">租户管理（多租户 SaaS · 隔离与计费）</div>'+
  '<div class="table-wrap">'+tblHTML(['租户','类型','人数','版本','状态','操作'],rows,880)+'</div>'+
  '<div class="wb-total"><span>租户 2 · 数据隔离 + 字段级权限</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：开通新租户">+ 开通租户</button></span></div>'+
  '<div class="demo-note">红圈 PaaS：生产平台交付客户，租户数据隔离，支持按使用人数计费（20–30 人）</div></div>';
}`,Vn=`// 消安云平台 · 页面分片 tagHtml —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function tagHtml(t,k){var c=k==='red'?'tag-red':k==='yellow'?'tag-yellow':k==='blue'?'tag-blue':k==='green'?'tag-green':'';return '<span class="'+c+'">'+t+'</span>'}`,zn=`// 消安云平台 · 页面分片 targetCostHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function targetCostHTML(){
 var raws=[['01','消防水系统','—','—','—','—'],['01-01','├ 镀锌钢管（管网）','DN100','m','12,000','¥196.8 万'],['01-02','├ 喷淋头','ZSTX15 68℃','只','8,600','¥27.9 万'],['02','消防电系统','—','—','—','—'],['02-01','├ 点型烟感','JTY-GD-3000','只','1,240','¥11.5 万']];
 var rows=raws.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+r[5]+'</td></tr>'}).join('');
 var costSum=0;raws.forEach(function(r){var m=String(r[5]).match(/[\\d.]+/);if(m)costSum+=parseFloat(m[0])});
 return '<div class="metrics"><div class="metric"><div class="m-label">目标成本（BJ-2609-05 反向生成）</div><div class="m-num">¥'+nfmt(Math.round(costSum*10)/10)+' 万</div><div class="m-sub">报价清单明细合计</div></div><div class="metric"><div class="m-label">控制方式</div><div class="m-num">量价双控</div><div class="m-sub">超量超价自动预警</div></div><div class="metric"><div class="m-label">当前执行偏差</div><div class="m-num">+1.2%</div><div class="m-sub">材料申请 vs 目标成本</div></div></div>'+
 '<section class="card"><div class="card-hd"><h3>目标成本清单（由中标报价单反向生成）</h3><div class="right"><span class="link-btn" data-toast="演示：与量价双控六行链路联动">关联量价双控</span></div></div><div style="padding:16px"><div class="table-wrap">'+tblHTML(['序号','清单项','规格','单位','数量','目标成本'],rows,760)+'</div></div></section>'+
 '<div class="demo-note">中标 / 确认后报价清单反向生成项目目标成本，作为材料申请、招采、入库、结算、付款的成本控制基线</div>';
}`,$n=`// 消安云平台 · 页面分片 wmContractHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmContractHTML(){
 var rows=[
  ['WB-2609-02','XX商城年度消防维保','昆明组','保内','GB25201',tg('g','王海 · 一级消防工程师'),tg('g','李强 · 操作员证'),tg('g','已授权'),'2027-09-30',tg('b','续签商机 1 个')],
  ['WB-2609-01','XX医院维保+检测','昆明组','保内','GB25201 / GB/T 44481—2024',tg('g','王海 · 一级消防工程师'),tg('g','李强 · 操作员证'),tg('g','已授权'),'2027-06-30',tg('gray','正常')],
  ['WB-2608-09','XX酒店消防维保（保外）','文山组','保外','GB25201',tg('g','陈军 · 一级消防工程师'),tg('y','张伟 · 待年审'),tg('g','已授权'),'2026-12-31',tg('r','保外维修订单 3 个待确收')],
  ['WB-2607-05','XX政务中心维保','楚雄组','保内','GB25201',tg('g','王海 · 一级消防工程师'),tg('g','李强 · 操作员证'),tg('y','待授权'),'2026-11-15',tg('gray','正常')]];
 return '<div class="metrics"><div class="metric"><div class="m-label">维保合同</div><div class="m-num">4 份</div><div class="m-sub">保内 3 · 保外 1</div></div><div class="metric"><div class="m-label">片区覆盖</div><div class="m-num">3 组</div><div class="m-sub">昆明 / 文山 / 楚雄</div></div><div class="metric"><div class="m-label">负责人持证</div><div class="m-num">100%</div><div class="m-sub">一级消防工程师在岗</div></div><div class="metric"><div class="m-label">续签商机</div><div class="m-num">2 个</div><div class="m-sub">金额约 ¥72 万</div></div></div>'+
 '<div class="pills"><div class="pill active">全部 <b>4</b></div><div class="pill">保内 <b>3</b></div><div class="pill">保外 <b>1</b></div><div class="pill">昆明组 <b>2</b></div><div class="pill">文山组 <b>1</b></div><div class="pill">楚雄组 <b>1</b></div></div>'+
 '<div class="table-wrap">'+tblHTML(['合同编号','合同名称','片区','保内 / 保外','适用标准','项目负责人（执业证书）','操作员（资格证）','联网授权','到期日','提醒'],rows,1220,'wmservice')+'</div>'+
 '<div class="demo-note">维保合同合规必备：服务类型 + 适用标准（GB25201 / GB/T 44481—2024）+ 项目负责人（一级注册消防工程师）及证书编号 + 消防设施操作员资格证书 + 联网用户线上授权；保外 / 人为损坏必须生成订单联动开票收款</div>';
}`,Zn=`// 消安云平台 · 页面分片 wmDispatchHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmDispatchHTML(){
 var rows=[
  ['WX-2609-095','赵强','钱进','昆明组','09-16 15:00 到场','09-16 15:30',tg('b','处理中'),OKNO],
  ['WX-2609-093','赵强','赵强','昆明组','09-16 13:00 到场','09-16 13:45',tg('b','处理中'),OKNO],
  ['WX-2609-089','杨帆','何军','文山组','09-16 09:30 到场','09-16 11:20',tg('g','已处理待审核'),OKNO],
  ['GD-2609-012','杨帆','吴斌','文山组','09-16 10:00 到场','09-16 10:30',tg('g','已处理待审核'),OKNO],
  ['WX-2609-081','赵强','周凯','昆明组','09-15 16:00 到场','09-15 16:40',tg('g','已回访'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">派工单（工单 → 派工 → 处理 → 审核 → 回访）</div>'+
  '<div class="table-wrap">'+tblHTML(['工单号','派工人','执行人','片区','计划到场','实际完成','状态','操作'],rows,1060)+'</div>'+
  '<div class="wb-total"><span>今日已派 4 单 · 待回访 1 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量派工">批量派工</button></span></div>'+
  '<div class="demo-note">保内故障正常派工；保外 / 人为损坏 / 更换设备必须生成维修订单确收，否则「活干了没人签单，公司收不到钱」</div></div>';
}`,Un=`// 消安云平台 · 页面分片 wmFlowHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmFlowHTML(){
 var rows=[
  ['WX-2609-095','XX医院 3F 喷淋渗漏（保外）','刘护士',tg('b','发起'),tg('b','已派工 · 钱进'),tg('b','处理中'),tg('gray','待审核'),tg('gray','待回访'),tg('b','进行中'),'<button class="mini-btn mini-ok" data-act="生成维修订单">生成维修订单</button>'],
  ['WX-2609-089','XX学校烟感失联（保内）','杨帆',tg('g','已发起'),tg('g','已派工 · 何军'),tg('g','已处理'),tg('b','审核中'),tg('gray','待回访'),tg('b','进行中'),'<button class="mini-btn mini-no" data-toast="演示：查看工单闭环详情（保内不计费）">查看详情</button>'],
  ['WX-2609-081','XX商业广场防火卷帘（保外）','李主管',tg('g','已发起'),tg('g','已派工 · 周凯'),tg('g','已处理'),tg('g','已审核'),tg('g','已回访 · 满意'),tg('g','已闭环'),'<button class="mini-btn mini-ok" data-act="生成维修订单">生成维修订单</button>'],
  ['GD-2609-012','XX产业园烟感离线（保内）','IoT 系统',tg('g','已发起'),tg('g','已派工 · 吴斌'),tg('g','已处理'),tg('g','已审核'),tg('gray','待回访'),tg('b','进行中'),'<button class="mini-btn mini-no" data-toast="演示：查看工单闭环详情（保内不计费）">查看详情</button>']];
 return '<div class="card-bd"><div class="dv-sec">报修工单闭环（发起 → 调度 → 处理 → 原因分析 → 主管审核 → 回访）</div>'+
  '<div class="table-wrap">'+tblHTML(['工单号','问题 / 客户','提交人','发起','调度','处理','审核','回访','整体状态','操作'],rows,1240)+'</div>'+
  '<div class="demo-note">每个节点留痕：处理人汇报处理情况、原因分析、主管审核、回访业主；保外更换设备自动联动维修订单确收与开票收款</div></div>';
}`,Yn=`// 消安云平台 · 页面分片 wmInvoiceHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmInvoiceHTML(){
 var rows=[
  ['RP-2609-016','XX大厦 · 更换消防泵控制柜主板','¥8,500',tg('b','待开票'),tg('gray','未收款'),'—',OKNO],
  ['RP-2609-012','XX产业园 · 应急照明更换','¥2,200',tg('b','待开票'),tg('gray','未收款'),'—',OKNO],
  ['RP-2609-009','XX医院 · 喷淋头更换（保外）','¥5,600',tg('g','已开票'),tg('b','待收款'),'09-15',OKNO],
  ['RP-2609-005','XX物流园 · 水泵维修（保外）','¥4,800',tg('g','已开票'),tg('g','已收款'),'09-12',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">维修确收 → 联动开票收款（财务闭环）</div>'+
  '<div class="table-wrap">'+tblHTML(['维修订单','项目 / 内容','金额','开票状态','收款状态','开票日期','操作'],rows,1120)+'</div>'+
  '<div class="wb-total"><span>本月确收 ¥14.3 万 · 已开票 ¥10.4 万 · 已收款 ¥4.8 万</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量开票">批量开票</button></span></div>'+
  '<div class="demo-note">确收订单自动生成开票任务（联动自动开票），收款后核销；与资金与发票模块数据互通</div></div>';
}`,ta=`// 消安云平台 · 页面分片 wmIoHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmIoHTML(){
 var rows=[
  ['GD-2609-012','点型烟感 3F-18','XX产业园','离线告警','中',tg('o','高'),'09-15 09:12',tg('g','已转工单 WX-2609-094'),OKNO],
  ['GD-2609-009','消防泵 1#','XX大厦','压力低告警','高',tg('r','紧急'),'09-14 22:40',tg('g','已转工单 WX-2609-088'),OKNO],
  ['GD-2609-006','应急照明 B2-06','XX商业广场','电池欠压','低',tg('gray','普通'),'09-13 16:20',tg('b','待确认转单'),OKNO],
  ['GD-2609-003','防火阀 5F-02','XX医院','开闭异常','中',tg('o','高'),'09-12 08:05',tg('gray','已忽略 · 误报'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">IoT 告警 → 转维保调度工单（告警中心联动）</div>'+
  '<div class="table-wrap">'+tblHTML(['告警编号','设备 / 点位','项目','告警类型','级别','紧急度','告警时间','转单状态','操作'],rows,1180)+'</div>'+
  '<div class="wb-total"><span>今日告警 4 条 · 已转工单 2 条 · 误报 1 条</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：批量转工单">批量转工单</button></span></div>'+
  '<div class="demo-note">IoT 告警可一键转维保调度工单（数字孪生与 IoT 工作站联动），按设备点位自动带出项目与责任人</div></div>';
}`,na=`// 消安云平台 · 页面分片 wmLogHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmLogHTML(){
 var rows=[
  ['09-16 13:42','赵强','昆明组 · 线路一','XX大厦消火栓系统检查正常，拍摄 6 张','6 张',tg('g','已提交'),OKNO],
  ['09-16 11:26','钱进','昆明组 · 线路二','XX医院喷淋末端试水压力不足，报修工单 WX-2609-091','3 张',tg('g','已提交'),OKNO],
  ['09-15 17:30','杨帆','文山组 · 线路三','XX学校烟感 12 只失联，建议更换（已生成维修订单）','5 张',tg('g','已提交'),OKNO],
  ['09-15 10:15','何军','楚雄组','XX商业广场风机运行正常，噪音偏大待观察','2 张',tg('y','待补充'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">值班日志（巡检 / 维修 / 现场照片留痕）</div>'+
  '<div class="table-wrap">'+tblHTML(['时间','值班人','片区 / 线路','内容摘要','照片','状态','操作'],rows,1040)+'</div>'+
  '<div class="wb-total"><span>本月日志 46 条 · 照片 214 张</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：上传现场照片与维护情况">+ 写日志</button></span></div></div>';
}`,aa=`// 消安云平台 · 页面分片 wmPartsHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmPartsHTML(){
 var rows=[
  ['LY-2609-021','烟感探测器 JTY-GD','12 只','何军','XX学校 · WX-2609-089',tg('b','领用中'),OKNO],
  ['LY-2609-019','消防水带 80 型','6 盘','钱进','XX医院 · 月度巡检',tg('g','已归还'),OKNO],
  ['LY-2609-016','灭火器 MFZ/ABC4','20 具','赵强','XX大厦 · 年度检查',tg('g','已归还'),OKNO],
  ['LY-2609-012','应急照明灯','8 只','吴斌','XX产业园 · 维修',tg('b','领用中'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">维保备件领用 / 归还（联动备件库存）</div>'+
  '<div class="table-wrap">'+tblHTML(['领用单号','备件','数量','领用人','关联工单 / 用途','状态','操作'],rows,1080)+'</div>'+
  '<div class="wb-total"><span>领用中 2 单 · 已归还 2 单</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：扫码领用 / 归还">扫码领用</button></span></div>'+
  '<div class="demo-note">备件领用关联工单与项目，归还后回写备件库存；超领 / 损耗自动生成扣款并回写财务</div></div>';
}`,sa=`// 消安云平台 · 页面分片 wmPlanHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmPlanHTML(){
 var rows=[
  ['JH-2609-01','XX大厦 · 月度维保','月度','09-20','赵强',tg('b','待执行'),OKNO],
  ['JH-2609-02','XX医院 · 季度巡检','季度','09-25','钱进',tg('b','待执行'),OKNO],
  ['JH-2609-03','XX产业园 · 半年检测','半年','10-05','杨帆',tg('gray','已排期'),OKNO],
  ['JH-2609-04','XX商业广场 · 月度维保','月度','09-18','何军',tg('b','待执行'),OKNO],
  ['JH-2609-05','XX物流园 · 年度检测','年度','10-12','吴斌',tg('gray','已排期'),OKNO],
  ['JH-2609-06','XX政务中心 · 月度维保','月度','09-08','赵强',tg('g','已完成'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">维保计划（按合同周期自动生成 + 手动调整）</div>'+
  '<div class="table-wrap">'+tblHTML(['计划编号','项目 / 计划类型','周期','计划执行','负责人','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>本月待执行 3 项 · 已完成 1 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：按合同生成维保计划">+ 自动排计划</button></span></div>'+
  '<div class="demo-note">维保计划联动排班值班：计划生成后自动进入排班表，避免漏检</div></div>';
}`,ia=`// 消安云平台 · 页面分片 wmPoolHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmPoolHTML(){
 var rows=[
  ['WX-2609-095','报修工单','XX医院 3F 喷淋末端渗漏','高',tg('r','紧急'),'09-16 14:20','刘护士',tg('b','待派工')],
  ['WX-2609-093','报修工单','XX大厦 B2 消防泵启动异常','中',tg('o','高'),'09-16 11:05','王经理',tg('b','待派工')],
  ['WX-2609-089','巡检转单','XX学校 12 只烟感失联','中',tg('o','高'),'09-15 17:30','杨帆',tg('b','待派工')],
  ['GD-2609-012','IoT 告警转单','XX产业园 3F 烟感离线告警','中',tg('o','高'),'09-15 09:12','系统',tg('b','待派工')],
  ['WX-2609-081','报修工单','XX商业广场防火卷帘无法下降','低',tg('gray','普通'),'09-14 15:40','李主管',tg('b','待派工')]];
 return '<div class="metrics"><div class="metric"><div class="m-label">待派工</div><div class="m-num">5 个</div><div class="m-sub">今日新增 3 个</div></div><div class="metric"><div class="m-label">紧急工单</div><div class="m-num">1 个</div><div class="m-sub">红色优先派工</div></div><div class="metric"><div class="m-label">平均响应</div><div class="m-num">28 分钟</div><div class="m-sub">近 30 天派工响应</div></div></div>'+
 '<div class="fbar"><select><option>工单来源：全部</option><option>工单来源：报修工单</option><option>工单来源：巡检转单</option><option>工单来源：IoT 告警</option></select><select><option>紧急度：全部</option><option>紧急度：紧急</option><option>紧急度：高</option><option>紧急度：普通</option></select><input class="fkw" placeholder="工单号 / 客户关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['工单号','类型','问题描述','紧急度','级别','提交时间','提交人','状态','操作'],rows,1120)+'</div>'+
 '<div class="demo-note">工单池按紧急度排队，点击「派工」进入派工单，形成 发起 → 调度 → 处理 → 审核 → 回访 闭环</div>';
}`,ea=`// 消安云平台 · 页面分片 wmProjHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmProjHTML(){
 var kind=curMenuKey.indexOf('保外')>-1?'保外':'保内';
 var rows=[
  ['WM-2609-01','XX大厦消防维保','XX物业集团','昆明组',tg(kind==='保外'?'r':'b',kind),'2026-01 ~ 2026-12','2026-12-31','09-15',tg('g','正常'),OKNO],
  ['WM-2609-02','XX医院消防设施维保','XX医院','昆明组',tg(kind==='保外'?'r':'b',kind),'2025-08 ~ 2026-08','2026-08-31','09-12',tg('y','临期 45 天'),OKNO],
  ['WM-2609-03','XX产业园一期维保','XX产业园','文山组',tg(kind==='保外'?'r':'b',kind),'2026-03 ~ 2027-03','2027-03-15','09-10',tg('g','正常'),OKNO],
  ['WM-2609-04','XX商业广场消防维保','XX商业广场','楚雄组',tg(kind==='保外'?'r':'b',kind),'2026-05 ~ 2027-05','2027-05-20','09-08',tg('g','正常'),OKNO],
  ['WM-2608-18','XX物流园消防维保','XX物流园','广西组',tg(kind==='保外'?'r':'b',kind),'2025-10 ~ 2026-10','2026-10-12','09-05',tg('y','临期 25 天'),OKNO],
  ['WM-2608-11','XX政务中心维保','XX政务中心','昆明组',tg(kind==='保外'?'r':'b',kind),'2024-06 ~ 2026-06','2026-06-30','09-02',tg('r','已到期 · 续签中'),OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">'+kind+'项目</div><div class="m-num">'+(kind==='保外'?14:38)+' 个</div><div class="m-sub">合同期内维保服务</div></div><div class="metric"><div class="m-label">本月到期</div><div class="m-num">5 个</div><div class="m-sub">进入续签商机池</div></div><div class="metric"><div class="m-label">续签率</div><div class="m-num">82%</div><div class="m-sub">到期客户续约比例</div></div><div class="metric"><div class="m-label">临期预警</div><div class="m-num">3 个</div><div class="m-sub">45 天内到期</div></div></div>'+
 '<div class="pills"><div class="pill active">全部 <b>6</b></div><div class="pill">'+kind+' <b>'+(kind==='保外'?2:4)+'</b></div><div class="pill">临期 / 到期 <b>3</b></div><div class="pill">续签中 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>片区：全部</option><option>片区：昆明组</option><option>片区：文山组</option><option>片区：楚雄组</option><option>片区：广西组</option></select><select><option>状态：全部</option><option>状态：正常</option><option>状态：临期</option><option>状态：已到期</option></select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09</span><input class="fkw" placeholder="项目 / 客户关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['维保编号','项目','客户','片区',kind,'服务期','到期时间','上次巡检','状态','操作'],rows,1100)+'</div>'+
 '<div class="demo-note">维保与新建 / 改造流程必须分开：'+kind+'项目按片区管理，到期自动进入续签商机，联动「区域 / 线路分组」与「排班值班」</div>';
}`,da=`// 消安云平台 · 页面分片 wmRenewHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmRenewHTML(){
 var rows=[
  ['XX政务中心消防维保','XX政务中心','昆明组','¥12.8 万 / 年','2026-06-30 已到期',tg('r','续签谈判中'),OKNO],
  ['XX学校宿舍维保','XX学校','文山组','¥6.5 万 / 年','2026-10-15',tg('b','已出续签报价'),OKNO],
  ['XX物流园消防维保','XX物流园','广西组','¥9.2 万 / 年','2026-10-12',tg('b','待客户确认'),OKNO],
  ['XX医院消防维保','XX医院','昆明组','¥18.6 万 / 年','2026-08-31 已到期',tg('r','价格谈判中'),OKNO],
  ['XX商业广场维保','XX商业广场','楚雄组','¥15.4 万 / 年','2027-05-20',tg('gray','未到期 · 提前 8 个月'),OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">续签商机</div><div class="m-num">5 个</div><div class="m-sub">到期 / 临期项目</div></div><div class="metric"><div class="m-label">预计年费</div><div class="m-num">¥62.5 万</div><div class="m-sub">续签报价合计</div></div><div class="metric"><div class="m-label">已出报价</div><div class="m-num">3 份</div><div class="m-sub">其中 2 份待确认</div></div></div>'+
 '<div class="pills"><div class="pill active">全部 <b>5</b></div><div class="pill">已到期 <b>2</b></div><div class="pill">谈判中 <b>2</b></div><div class="pill">已出报价 <b>1</b></div></div>'+
 '<div class="fbar"><select><option>片区：全部</option><option>片区：昆明组</option><option>片区：文山组</option><option>片区：广西组</option></select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09</span><input class="fkw" placeholder="项目关键字…"/><span class="reset" data-toast="演示：筛选条件已重置">重置</span></div>'+
 '<div class="table-wrap">'+tblHTML(['项目','客户','片区','续签年费','合同到期','状态','操作'],rows,1040)+'</div>'+
 '<div class="demo-note">到期项目进入续签商机池，可一键生成续签报价（引用价格库），防止客户流失</div>';
}`,ra=`// 消安云平台 · 页面分片 wmRepairHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmRepairHTML(){
 var rows=[
  ['RP-2609-018','WX-2609-089','XX学校','更换烟感 12 只（保外）','¥3,600',tg('r','保外'),tg('b','待客户确收'),OKNO],
  ['RP-2609-016','WX-2609-088','XX大厦','更换消防泵控制柜主板（保外）','¥8,500',tg('r','保外'),tg('b','已确收 · 待开票'),OKNO],
  ['RP-2609-014','WX-2609-081','XX商业广场','防火卷帘维修（保内）','¥0',tg('g','保内'),tg('g','已确收 · 不计费'),OKNO],
  ['RP-2609-012','WX-2609-078','XX产业园','应急照明更换（保外人为损坏）','¥2,200',tg('r','保外'),tg('g','已确收 · 待开票'),OKNO]];
 return '<div class="metrics"><div class="metric"><div class="m-label">待确收订单</div><div class="m-num">1 个</div><div class="m-sub">保外维修费用</div></div><div class="metric"><div class="m-label">本月确收额</div><div class="m-num">¥14.3 万</div><div class="m-sub">保外维修订单</div></div><div class="metric"><div class="m-label">待开票</div><div class="m-num">2 单</div><div class="m-sub">¥10.7 万</div></div></div>'+
 '<div class="table-wrap">'+tblHTML(['维修订单号','关联工单','项目','维修内容','费用','保内 / 保外','确收状态','操作'],rows,1180)+'</div>'+
 '<div class="demo-note">保外 / 人为损坏 / 更换设备必须生成维修订单并确收，否则「活干了没人签单，公司收不到钱」；确收后联动开票收款</div>';
}`,oa=`// 消安云平台 · 页面分片 wmRouteHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmRouteHTML(){
 var groups=[['昆明组','12 个项目','组长：赵强','09-15 线路巡检完成'],['文山组','5 个项目','组长：杨帆','09-14 线路巡检完成'],['楚雄组','4 个项目','组长：何军','09-12 线路巡检完成'],['广西组','6 个项目','组长：吴斌','09-10 线路巡检完成']];
 var rows=[
  ['线路一（昆明主城）','4','38 km','每周一次','赵强','09-15','09-22',tg('g','正常'),OKNO],
  ['线路二（昆明南市）','3','26 km','每周一次','钱进','09-15','09-22',tg('g','正常'),OKNO],
  ['线路三（地州：文山 / 楚雄）','6','520 km','每两周一次','杨帆','09-12','09-26',tg('g','正常'),OKNO],
  ['线路四（广西南宁）','5','460 km','每两周一次','吴斌','09-10','09-24',tg('y','下次 2 天后'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">片区组织（录音：昆明组 / 地州 / 广西分片区管理）</div>'+
  '<div class="qgrid" style="grid-template-columns:repeat(4,1fr)">'+groups.map(function(g){return '<div class="qtile" data-toast="演示：打开片区「'+g[0]+'」项目清单"><div class="qi" style="font-size:16px;font-weight:600">'+g[1].split(' ')[0]+'</div><span><b>'+g[0]+'</b></span><span style="color:var(--t3)">'+g[2]+' · '+g[3]+'</span></div>'}).join('')+'</div>'+
  '<div class="dv-sec">巡检线路计划（一次巡检多个项目）</div>'+
  '<div class="table-wrap">'+tblHTML(['线路','覆盖项目','单圈里程','巡检频率','负责人','上次执行','下次计划','状态','操作'],rows,1080)+'</div>'+
  '<div class="demo-note">线路计划支持一次巡检跑多个项目，跑完上传现场照片与维护情况，形成线路巡检闭环</div></div>';
}`,la=`// 消安云平台 · 页面分片 wmRoutePlanHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmRoutePlanHTML(){
 var rows=[
  ['线路一','XX大厦 → XX医院 → XX学校','3','09-16 08:30','赵强',tg('g','已跑完 · 6 张现场照'),OKNO],
  ['线路二','XX商业广场 → XX酒店','2','09-17 09:00','钱进',tg('b','今日执行'),OKNO],
  ['线路三','XX产业园 → XX物流园（地州）','2','09-19 07:00','杨帆',tg('gray','待出发'),OKNO],
  ['线路四','XX政务中心 → XX医院二期','2','09-21 09:00','吴斌',tg('gray','待出发'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">巡检线路执行单（一次巡检多项目 · 跑完上传照片和维护情况）</div>'+
  '<div class="table-wrap">'+tblHTML(['线路','途经项目','项目数','计划出发','执行人','执行状态','操作'],rows,1040)+'</div>'+
  '<div class="demo-note">巡检线路计划与「区域 / 线路分组」联动：片区管理员按线路派工，跑完自动沉淀巡检记录到值班日志</div></div>';
}`,ca=`// 消安云平台 · 页面分片 wmSatHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmSatHTML(){
 var rows=[
  ['XX医院 消防维保','钱进','09-16 维修后','扫码 8 次',tg('g','4.8 分'),'服务及时 · 处理专业','09-16 15:40',OKNO],
  ['XX大厦 消防维保','赵强','09-12 月度巡检后','扫码 6 次',tg('g','4.6 分'),'响应快 · 现场整洁','09-12 17:20',OKNO],
  ['XX商业广场 消防维保','周凯','09-10 维修后','扫码 5 次',tg('y','3.9 分'),'到场略慢，已回访','09-10 16:00',OKNO],
  ['XX产业园 消防维保','吴斌','09-08 巡检后','扫码 7 次',tg('g','4.9 分'),'主动提出隐患建议','09-08 11:30',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">业主满意度二维码（扫码填写 · 评价服务人员和服务情况）</div>'+
  '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:12px"><div style="width:96px;height:96px;background:repeating-conic-gradient(#111 0% 25%,#fff 0% 50%) 50%/16px 16px;border:1px solid #ddd;border-radius:6px;position:relative"><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600">二维码</span></div><div><b>服务评价二维码</b><div style="color:var(--t3);font-size:13px;margin:4px 0">业主微信扫码 → 评价服务人员 / 服务情况 / 满意度评分 → 数据沉淀至客户满意度台账</div><button class="mini-btn mini-ok" data-toast="演示：下载 / 打印二维码贴纸">打印二维码贴纸</button></div></div>'+
  '<div class="table-wrap">'+tblHTML(['项目','服务人员','评价场景','扫码次数','评分','评价内容','时间','操作'],rows,1140)+'</div>'+
  '<div class="demo-note">满意度调查提升服务质量，高满意度业主更可能带来改造项目（联动续签商机与市场投标）</div></div>';
}`,pa=`// 消安云平台 · 页面分片 wmShiftHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmShiftHTML(){
 var rows=[
  ['09-17 周四','赵强 · 昆明组','08:30 ~ 18:00','日班 · 线路一',tg('b','在岗'),OKNO],
  ['09-17 周四','钱进 · 昆明组','18:00 ~ 次日 08:00','夜班 · 值班电话',tg('b','在岗'),OKNO],
  ['09-18 周五','杨帆 · 文山组','08:30 ~ 18:00','日班 · 线路三',tg('gray','待接班'),OKNO],
  ['09-18 周五','何军 · 楚雄组','08:30 ~ 18:00','日班 · 机动',tg('gray','待接班'),OKNO],
  ['09-19 周六','吴斌 · 广西组','08:30 ~ 18:00','日班 · 线路四',tg('gray','已排班'),OKNO]];
 return '<div class="card-bd"><div class="dv-sec">排班值班表（联动维保计划与工单，按片区 / 线路排班）</div>'+
  '<div class="table-wrap">'+tblHTML(['日期','值班人 · 片区','时段','值班类型','状态','操作'],rows,980)+'</div>'+
  '<div class="wb-total"><span>今日在岗 2 人 · 覆盖 4 个片区</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：按维保计划自动排班">+ 自动排班</button></span></div>'+
  '<div class="demo-note">考试合格 → 证书生效 → 允许排班 / 值班上岗（联动知识考试与证书管理，无证不可排班）</div></div>';
}`,va=`// 消安云平台 · 页面分片 wmStockHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function wmStockHTML(){
 var rows=[
  ['烟感探测器 JTY-GD','JTY-GD','只','156','80',tg('g','充足'),'维保备件库 A1','09-16',OKNO],
  ['消防水带 80 型','80 型','盘','24','30',tg('r','低于安全库存'),'维保备件库 A2','09-15',OKNO],
  ['灭火器 MFZ/ABC4','ABC4','具','48','40',tg('y','接近安全线'),'维保备件库 B1','09-14',OKNO],
  ['应急照明灯','LED-5W','只','62','40',tg('g','充足'),'维保备件库 B2','09-12',OKNO],
  ['喷淋头 ZSTX15','DN15','只','180','100',tg('g','充足'),'维保备件库 A3','09-10',OKNO]];
 return '<div class="card-bd"><div class="dv-sec">备件库存台账（维保备件库 · 支持安全库存预警与扫码溯源）</div>'+
  '<div class="table-wrap">'+tblHTML(['备件','规格','单位','库存','安全库存','状态','库位','更新时间','操作'],rows,1140)+'</div>'+
  '<div class="wb-total"><span>低于安全库存 1 项 · 临近 1 项</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-toast="演示：一键生成采购申请 / 询价">一键补货</button></span></div>'+
  '<div class="demo-note">备件库存不足可一键生成采购申请或询价（联动采购仓储），批次二维码支持扫码溯源</div></div>';
}
/* ============ 供应商库（采购仓储 · 档案 / 评级 / 黑名单） ============ */`,ua=`// 消安云平台 · 页面分片 workbenchHTML —— 由 app-pages.js 机械拆出（2026-09-18），函数签名与内容勿手改；全局工具/数据在 app-core.js / app-data.js。
function workbenchHTML(){
 var mode=wbMode==='list';
 var rows=window.WBR||(window.WBR=[
  ['1','WL-0101','镀锌钢管','DN100','m','3,200','168.0','162.0','25.0','181.4','+8%','58.05 万',''],
  ['2','WL-0232','喷淋头','ZSTX15 68℃','只','8,600','30.0','28.0','6.0','32.4','+8%','27.86 万',''],
  ['3','WL-0455','点型烟感','JTY-GD-3000','只','1,240','86.0','82.0','18.0','92.9','+8%','11.52 万',''],
  ['4','WL-0688','防火卷帘','双轨双帘 4㎡','㎡','420','620.0','598.0','120.0','586.0','-5.5%','24.61 万','low'],
  ['5','RG-001','喷淋系统安装人工','综合','项','1','386,000','352,000','352,000','380,160','+8%','38.02 万','']]);
 var trs=mode?rows.map(function(r){return '<tr data-toast="演示：编辑该明细项"><td>'+r.slice(0,6).join('</td><td>')+'</td><td><span class="link-btn" data-toast="演示：上传规格 / 技术参数">补充规格</span></td></tr>'}).join('')
  :rows.map(function(r){var low=r[12]==='low';
  return '<tr data-toast="演示：编辑该明细项"><td>'+r.slice(0,11).join('</td><td>')+'</td><td><span class="'+(low?'wb-low':'')+'">'+r[11]+'</span></td><td>'+(low?tg('r','低于成本'):tg('gray','正常'))+'</td></tr>'}).join('');
 var detailTh=mode?'<tr><th>序号</th><th>编码</th><th>设备 / 材料名称</th><th>规格 / 技术参数</th><th>单位</th><th>数量</th><th>备注</th></tr>'
  :'<tr><th>序号</th><th>编码</th><th>名称</th><th>规格</th><th>单位</th><th>数量</th><th>参考价</th><th>成本价</th><th>其中人工费</th><th>报价单价</th><th>上浮 %</th><th>合价</th><th>状态</th></tr>';
 var rightPanel=mode?
  '<div class="wb-panel wb-right"><h4>仅清单模式</h4><div class="banner">'+ICON.info.replace('class="ic"','class="ic" style="width:16px;height:16px;color:var(--blue);margin-top:3px"')+'<div><b>合同已约定总价：¥ 1,860,000</b><br/><span style="font-size:12px">本报价只报供货范围 / 清单，不体现单价与合价；清单作为合同附件</span></div></div><div class="dv-sec">勘察记录摘要</div><div style="font-size:12px;color:var(--t2);line-height:1.7">KC-2609-01：3F 主机老化、12 只烟感失联；管网锈蚀渗漏 2 处。现场照片 8 张已关联。</div><div class="dv-sec">清单校验</div><div style="font-size:12px;color:var(--t2);line-height:1.7">与合同约定供货范围核对：3 大项 8 明细 · 无缺漏项 ✓</div></div>'
  :'<div class="wb-panel wb-right"><h4>三档价对比</h4><div class="pr"><span>参考价 / 内部定额</span><b>价格库 V2026.09</b></div><div class="pr"><span>成本价</span><b>含采管费 3%</b></div><div class="pr"><span>市场价 / 上次成交</span><b>安泰电子 ¥165</b></div><div class="dv-sec">勘察记录摘要</div><div style="font-size:12px;color:var(--t2);line-height:1.7">KC-2609-01：3F 主机老化、12 只烟感失联；管网锈蚀渗漏 2 处。现场照片 8 张已关联。</div><div class="dv-sec">参数化报价（智慧消防）</div><div style="font-size:12px;color:var(--t2);line-height:1.7">建筑面积 46,000 ㎡ · 点位 8,600 · 接入系统 6 → 自动测算板块报价 ¥186 万</div></div>';
 var totalBar=mode?
  '<div class="wb-total"><span>清单项 <b>'+rows.length+' 项</b></span><span>报价方式 <b>仅清单</b>（总价以合同约定为准）</span><span>合同约定总价 <b>¥1,860,000</b></span><span style="margin-left:auto"><button class="mini-btn mini-no" data-act="保存草稿">保存草稿</button> <button class="mini-btn mini-ok" data-act="提交审批">提交审批</button> <button class="mini-btn mini-ok" data-act="生成报价单">生成报价单</button> <button class="mini-btn mini-no" data-act="打印预览">打印预览</button></span></div>'
  :(function(){var wq=window.WBR||rows,sec=0,cost=0;wq.forEach(function(r){sec+=parseFloat(String(r[5]).replace(/,/g,''))*parseFloat(String(r[9]).replace(/,/g,''));cost+=parseFloat(String(r[5]).replace(/,/g,''))*parseFloat(String(r[6]).replace(/,/g,''))});sec=sec/10000;cost=cost/10000;var tot=sec*1.09,mgv=tot-cost,mgr=tot>0?mgv/tot*100:0;return '<div class="wb-total"><span>板块小计 <b>¥'+sec.toFixed(2)+' 万</b></span><span>报价总价 <b>¥'+tot.toFixed(2)+' 万</b></span><span>成本合计 <b>¥'+cost.toFixed(2)+' 万</b></span><span>毛利额 <b class="m-trend '+(mgv>=0?'up':'down')+'">¥'+mgv.toFixed(2)+' 万</b></span><span>毛利率 <b class="m-trend '+(mgr>=12?'up':'down')+'">'+mgr.toFixed(1)+'%</b>'+(mgr<12?'（⚠ 低于 12% 预警线，提交需总经理特批）':'（高于预警线 ✓）')+'</span><span>税率 9%</span><span style="margin-left:auto">'})()+'<button class="mini-btn mini-no" data-adj="1">批量调价</button> <button class="mini-btn mini-no" data-act="保存草稿">保存草稿</button> <button class="mini-btn mini-ok" data-act="提交审批">提交审批</button> <button class="mini-btn mini-ok" data-act="生成报价单">生成报价单</button> <button class="mini-btn mini-no" data-act="打印预览">打印预览</button></span></div>';
 var SRC=window.WB_SRC||null;
 var objName=SRC?SRC.name+'（'+SRC.type+'来源）':'XX医院二期消防工程（商机）';
 var srcTag=SRC?'<span class="tag b">来源：'+SRC.type+' · '+SRC.id+'（信息已带入）</span>':'<span class="tag y">来源：独立新建 · 可不关联商机</span>';
 return '<div class="card-bd">'+
  '<div class="wb-top"><b>报价对象：</b>'+objName+srcTag+'<b>策略：</b>整体上浮 <input class="wb-num" value="8"/> %　总量上浮 <input class="wb-num" value="0"/> %　<b>成本预警线：</b>毛利率 ≥ 12%　<b>板块：</b><select class="wb-sel"><option>全部板块</option><option>消防水系统</option><option>消防电系统</option><option>防排烟系统</option><option>报警系统</option></select><b>参数化：</b><span class="link-btn" data-param="1">智慧消防报价</span><span class="wb-modes"><span class="wb-mode'+(mode?'':' on')+'" data-wbmode="price">含价报价</span><span class="wb-mode'+(mode?' on':'')+'" data-wbmode="list">仅清单</span></span></div>'+
  '<div class="wb-grid">'+
  '<div class="wb-panel"><h4>报价结构树</h4><div class="wb-tree"><div class="on">消防水系统</div><div>消防电系统</div><div>防排烟系统</div><div>火灾自动报警系统</div><div>气体灭火</div><div style="border-top:1px dashed var(--line);margin-top:6px;padding-top:8px;color:var(--blue)">智慧消防 ▾</div><div class="ct-sub">硬件</div><div class="ct-sub">数据采集</div><div class="ct-sub">平台软件</div><div class="ct-sub">数字孪生</div></div></div>'+
  '<div class="wb-panel" style="overflow:auto"><h4>报价明细'+(mode?'（仅清单 · 无价格）':'（消防水系统）')+'</h4><div class="tbl-wrap"><table class="tbl" style="min-width:'+(mode?640:860)+'px"><thead>'+detailTh+'</thead><tbody>'+trs+'</tbody></table></div></div>'+
  rightPanel+
  '</div>'+
  totalBar+
  '</div>';
}`,ba=`
<header class="topbar">
  <button class="hamburger" id="hamburger" aria-label="打开菜单"><svg class="ic" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
  <div class="brand">
    <div class="logo"><svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5.2-3.4 8.9-8 11-4.6-2.1-8-5.8-8-11V5l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="fill:none"/></svg></div>
    <span class="brand-name">诺盾博达</span>
  </div>
  <div class="tabs-wrap" id="tabsWrap"><nav class="tabs-strip" id="tabStrip"></nav></div>
  <div class="hright">
    <button class="hbtn" id="btnSearch" title="全局搜索（Ctrl+K）" aria-label="全局搜索"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></button>
    <button class="hbtn" id="btnBell" title="消息" aria-label="消息通知"><svg class="ic" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="dot-badge" id="bellBadge">4</span></button>
    <button class="hbtn ai-btn" id="btnAI" title="AI 助手" aria-label="AI 助手"><svg class="ic" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/></svg><span>AI 助手</span></button>
    <div class="avatar" id="btnAvatar" role="button" aria-label="当前用户：王志明" tabindex="0">全</div>
  </div>
</header>

<div class="dd" id="ddAvatar" style="width:272px">
  <div class="dd-head"><div style="display:flex;gap:10px;align-items:center"><div class="avatar avatar-lg" id="avatarBig">全</div><div><div style="font-weight:600">王志明</div><div style="font-size:12px;color:var(--t3)" id="avatarRole">当前视角：演示全视角</div></div></div></div>
  <div class="dd-title">切换视角（菜单与数据随视角变化）</div>
  <div class="role-list" id="roleList"></div>
  <div class="dd-sep" id="adminSep" style="display:none"></div>
  <div id="adminBox" style="display:none">
    <div class="dd-item" data-act="租户管理"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>租户管理</div>
    <div class="dd-item" data-act="模块市场"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>模块市场</div>
    <div class="dd-item" data-act="计费 / 版本"><svg class="ic" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>计费 / 版本</div>
    <div class="dd-sep"></div>
  </div>
  <div class="dd-item" data-act="个人设置"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>个人设置</div>
  <div class="dd-item" data-act="退出登录" style="color:var(--red)"><svg class="ic" style="color:var(--red)" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>退出登录</div>
</div>

<div class="dd" id="ddBell" style="width:300px">
  <div class="dd-head" style="font-weight:600">消息通知</div>
  <div class="noti-item"><span class="dot r" style="margin-top:5px"></span><div><div class="nt">紧急告警 · XX医院门诊楼</div><div class="nd">消防主机离线已2小时 · 08:47</div></div></div>
  <div class="noti-item"><span class="dot y" style="margin-top:5px"></span><div><div class="nt">审批提醒 · 采购单</div><div class="nd">¥12.6万 待您审批 · 10分钟前</div></div></div>
  <div class="noti-item"><span class="dot g" style="margin-top:5px"></span><div><div class="nt">系统通知</div><div class="nd">XX大厦竣工验收申请已提交 · 09:32</div></div></div>
  <div class="dd-sep"></div><div class="dd-item" id="readAll" style="justify-content:center;color:var(--blue)">全部已读</div>
</div>

<aside class="sidebar" id="sidebar">
  <div class="side-search" id="sideSearch">
    <div class="si-wrap">
      <svg class="ic" style="width:14px;height:14px" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
      <input id="menuSearch" placeholder="搜索菜单，跨全部导航…" autocomplete="off" aria-label="搜索菜单"/>
      <button class="si-clr" id="siClr" title="清空" aria-label="清空搜索"><svg class="ic" style="width:11px;height:11px" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
  </div>
  <div class="search-meta" id="searchMeta"></div>
  <nav class="side-menu" id="sideMenu"></nav>
  <button class="side-trigger" id="btnCollapse" title="收起菜单栏" aria-label="收起或展开菜单栏"><svg class="ic" viewBox="0 0 24 24"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 9 4 12 7 15"/><line x1="4" y1="12" x2="9" y2="12"/></svg></button>
</aside>

<main class="content">
  <div id="viewDash"></div>
  <div id="viewPage" style="display:none"></div>
</main>

<div class="gs-mask" id="gsMask">
  <div class="gs-panel">
    <div class="gs-input">
      <svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
      <input id="gsInput" placeholder="搜索项目 / 合同 / 设备 / 工单 / 人员 / 菜单…" autocomplete="off" aria-label="全局搜索"/>
      <kbd>Esc</kbd>
    </div>
    <div class="gs-body" id="gsBody"></div>
    <div class="gs-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span><span style="margin-left:auto">示意数据 · 菜单结果可真实跳转</span></div>
  </div>
</div>

<nav class="mtabs" id="mtabs"></nav>
<div class="overlay" id="overlay"></div>

<div class="drawer" id="aiDrawer">
  <div class="drawer-hd"><h3><svg class="ic" style="color:var(--blue)" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/></svg>诺盾博达 AI 助手</h3><button class="icon-btn" id="aiClose" aria-label="关闭 AI 助手"><svg class="ic" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
  <div class="drawer-bd" id="aiBody"><div class="chatai bot">您好，我是诺盾博达 AI 助手 👋 已接入您当前视角的数据（演示），试试问我：</div></div>
  <div class="chips"><span class="chip" data-q="当前视角下最紧急的事项是什么？">当前视角最紧急事项？</span><span class="chip" data-q="汇总今日告警">汇总今日告警</span><span class="chip" data-q="生成经营周报">生成经营周报</span></div>
  <div class="drawer-ft"><input id="aiInput" placeholder="输入问题，回车发送…" aria-label="向 AI 助手提问"/><button class="send-btn" id="aiSend" aria-label="发送"><svg class="ic" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>
</div>

<div class="drawer" id="devDrawer">
  <div class="drawer-hd"><h3 id="devTitle"></h3><button class="icon-btn" id="devClose" aria-label="关闭设备详情"><svg class="ic" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
  <div class="drawer-bd" id="devBody"></div>
  <div class="drawer-ft"><button class="btn btn-primary" style="flex:1;justify-content:center" id="devDisp">转派工单</button><button class="btn btn-ghost" style="flex:1;justify-content:center" id="devCurve">查看历史曲线</button></div>
</div>

<div class="modal" id="modalNew">
  <div class="modal-hd"><h3 id="modalTitle">新建</h3><button class="icon-btn" id="mClose" aria-label="关闭"><svg class="ic" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
  <div class="modal-bd">
    <div class="fld full"><label for="fldName">名称 / 事项<b>*</b></label><input id="fldName" placeholder="请输入"/></div>
    <div class="fld"><label for="fldType">类型</label><select id="fldType"><option>消防工程</option><option>消防维保</option><option>智慧消防</option><option>其他</option></select></div>
    <div class="fld"><label for="fldOwner">负责人</label><select id="fldOwner"><option>王志明（我）</option><option>王强</option><option>李敏</option></select></div>
    <div class="fld"><label for="fldDate">计划日期</label><input id="fldDate" type="date" value="2026-09-20"/></div>
    <div class="fld"><label for="fldProj">关联项目</label><select id="fldProj"><option>XX国际大厦消防改造</option><option>XX产业园喷淋工程</option><option>不关联</option></select></div>
    <div class="fld full"><label for="fldNote">备注</label><input id="fldNote" placeholder="选填"/></div>
  </div>
  <div class="modal-ft"><button class="btn btn-ghost" id="mCancel">取消</button><button class="btn btn-primary" id="mSubmit">提交</button></div>
</div>

<div class="modal" id="modalAdj">
  <div class="modal-hd"><h3>批量调价</h3><button class="icon-btn" id="adjClose" aria-label="关闭批量调价"><svg class="ic" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
  <div class="modal-bd">
    <div class="fld full"><label for="adjScope">调价范围</label><select id="adjScope"><option>全部明细</option><option>仅勾选明细（3 项）</option><option>消防水系统板块</option><option>防排烟板块</option></select></div>
    <div class="fld full"><label for="adjReg">区域系数（一键应用区域行情）</label><select id="adjReg" data-adjreg="1"><option value="1.00">昆明 · ×1.00（基准）</option><option value="1.05">文山 / 楚雄 · ×1.05</option><option value="1.08">广西 · ×1.08</option><option value="1.12">地州偏远 · ×1.12</option><option value="1.20">新疆 · ×1.20</option></select></div>
    <div class="fld"><label for="adjDir">调价方向</label><select id="adjDir"><option>上浮</option><option>下浮</option></select></div>
    <div class="fld"><label for="adjPct">系数 %</label><input id="adjPct" type="number" value="5"/></div>
    <div class="fld full"><label for="adjPrev">调价预览</label><div id="adjPrev" style="padding:10px;background:#fafafa;border-radius:6px;font-size:13px;line-height:1.9"></div></div>
  </div>
  <div class="modal-ft"><button class="btn btn-ghost" id="adjCancel">取消</button><button class="btn btn-primary" id="adjOk">应用调价</button></div>
</div>
<div class="toast" id="toast"></div>`,ga=`/* ============ 图标 ============ */
var P=function(d){return '<svg class="ic" viewBox="0 0 24 24">'+d+'</svg>'};
var ICON={
 chart:P('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
 target:P('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
 file:P('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
 box:P('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
 clip:P('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'),
 tool:P('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
 layers:P('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
 arch:P('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
 book:P('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
 users:P('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
 home:P('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
 gear:P('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
 link:P('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
 plus:P('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
 check:P('<polyline points="20 6 9 17 4 12"/>'),
 warn:P('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
 info:P('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
 cam:P('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
 money:P('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
 cal:P('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
 dl:P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
 grid:P('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
 radio:P('<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 2.4 10.55M4.93 19.07a10 10 0 0 1-2.4-10.55"/>'),
 lock:P('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
 plug:P('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><line x1="12" y1="18" x2="12" y2="22"/>'),
 up:P('<polyline points="18 15 12 9 6 15"/>'),
 clock:P('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')
};
var CHEV='<svg class="ic chev" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

var MICON={biz:'chart',bid:'target',cost:'file',buy:'box',site:'clip',wm:'tool',oa:'users',owner:'home',ext:'link',sys:'gear'};
function tg(c,t){return '<span class="tag '+c+'">'+t+'</span>'}
function dt(c){return '<span class="dot '+c+'"></span>'}
var OKNO='<span class="ti-acts" style="margin:0"><button class="mini-btn mini-ok" data-act="通过">通过</button><button class="mini-btn mini-no" data-act="驳回">驳回</button></span>';
var HTOPS='<span class="ti-acts" style="margin:0"><button class="mini-btn mini-ok" data-act="查看">查看</button><button class="mini-btn mini-no" data-act="变更">变更</button><button class="mini-btn mini-no" data-act="发起付款">付款</button></span>';
var CERTOPS='<span class="ti-acts" style="margin:0"><button class="mini-btn mini-ok" data-act="查看">查看</button><button class="mini-btn mini-no" data-act="续期">续期</button><button class="mini-btn mini-no" data-act="借出">借出</button></span>';
var QOPS='<span class="ti-acts" style="margin:0"><button class="mini-btn mini-ok" data-act="查看">查看</button><button class="mini-btn mini-no" data-adj="1">调价</button><button class="mini-btn mini-no" data-act="生成报价单">生成报价单</button><button class="mini-btn mini-no" data-act="转合同 / 销售订单">转合同</button></span>';

/* ============ 导航数据 ============ */
var S=[
 {id:'biz',n:'经营决策'},{id:'bid',n:'市场投标'},{id:'cost',n:'合同成本'},
 {id:'buy',n:'采购仓储'},{id:'site',n:'项目现场'},{id:'wm',n:'维保值班'},
 {id:'oa',n:'协同办公'},{id:'owner',n:'业主服务'},{id:'ext',n:'外部协作'},{id:'sys',n:'系统管理'}
];
var ALL=S.map(function(x){return x.id});
var SUB={
 biz:[
  {g:'经营驾驶舱',ic:'chart',items:['经营看板']},
  {g:'回款与资金',ic:'money',items:['回款与资金']},
  {g:'风险中心',ic:'warn',items:['风险中心']},
  {g:'审批与洞察',ic:'check',items:['审批与洞察']}],
 bid:[
  {g:'客户与商机',ic:'users',items:['客户档案','跟进记录 / 拜访总结','商机与漏斗']},
  {g:'投标管理',ic:'target',items:['投标登记','节点看板','标书协作','中标 / 未中标','丢标分析']},
  {g:'证书业绩',ic:'file',items:['证书台账','投标材料包 / 业绩库']},
  {g:'报价与勘察',ic:'money',items:['现场勘察记录','报价编制工作台','报价单','价格库引用']}],
 cost:[
  {g:'合同管理',ic:'file',items:['合同台账','框架与专项合同','合同录入与模板','合同审批与变更','履约结算与穿透']},
  {g:'成本预算',ic:'box',items:['目标成本与清单','量价双控设置','变更签证','销项与未关联']},
  {g:'资金与发票',ic:'money',items:['付款与智能洞察','票税与发票']}],
 buy:[
  {g:'材料主数据',ic:'grid',items:['材料主数据列表','价格库','资质文件']},
  {g:'采购与询比价',ic:'box',items:['材料申请 / 提料','询价单 / 二维码','询比价汇总 / 竞价排名','采购合同 / 订单']},
  {g:'供应商库',ic:'users',items:['供应商库']},
  {g:'库存与出入库',ic:'box',items:['采购入库','出库与领用归还','库存台账','库存预警','盘点']},
  {g:'成本对比',ic:'warn',items:['量价双控与超量超价预警']}],
 site:[
  {g:'项目主数据',ic:'clip',items:['项目列表 / 立项']},
  {g:'项目计划',ic:'clip',items:['WBS 分解','进度计划 / 横道图','目标成本']},
  {g:'项目执行',ic:'clip',items:['工序汇报','施工日志','劳务管理','质量安全','现场收货 / 领用']},
  {g:'项目监控',ic:'chart',items:['进度监控 / 滞后预警','成本监控 / 六行量价','风险与问题']},
  {g:'项目收尾',ic:'check',items:['竣工验收','项目结算与关闭','项目后评估']},
  {g:'变更与现场',ic:'file',items:['变更发起','补充协议','签证资料回传','工期倒计时 / 逾期预警']},
  {g:'资料与报告',ic:'arch',items:['资料看板','资料归档','消防报告','验收交付']}],
 wm:[
  {g:'维保项目',ic:'clip',items:['保内项目','保外项目','区域 / 线路分组','续签商机']},
  {g:'计划与排班',ic:'clock',items:['维保计划','巡检线路计划','排班值班','值班日志']},
  {g:'调度工单',ic:'tool',items:['工单池','派工单','报修工单闭环']},
  {g:'维修确收',ic:'check',items:['维修订单 / 费用确收','联动开票收款','业主满意度二维码']},
  {g:'备件仓库',ic:'box',items:['维保领用 / 归还','备件库存']},
  {g:'设备与 IoT',ic:'radio',items:['设备资产','孪生场景','IoT 监测与告警','设备报告']}],
 oa:[
  {g:'行政办公',ic:'grid',items:['费用报销','公告与收发文','用印 / 证件','人事档案','用车与日程']},
  {g:'流程消息',ic:'check',items:['待办与消息中心']},
  {g:'知识培训与考试',ic:'book',items:['知识库','考试与培训','岗位资格']}],
 owner:[
  {g:'我的项目',ic:'clip',items:['项目列表','进度查看','现场照片']},
  {g:'服务报告',ic:'file',items:['消防报告下载','验收确认','整改通知查看']},
  {g:'报修评价',ic:'check',items:['在线报修','我的报修工单进度','满意度评价','账单 / 回款对账']}],
 ext:[
  {g:'我的询价',ic:'link',items:['待报价询价','已报价 / 历史报价']},
  {g:'订单送货',ic:'box',items:['采购订单','送货 / 收货确认']},
  {g:'对账结算',ic:'money',items:['对账单','结算单','收票 / 发票确认']}],
 sys:[
  {g:'组织权限',ic:'users',items:['组织与权限']},
  {g:'模块计费',ic:'grid',items:['模块与计费']},
  {g:'集成配置',ic:'link',items:['集成与运维']}]
};
var ROLES=[
 {n:'演示全视角',av:'全',d:'显示全部 10 个一级（合并后）',st:ALL,home:'biz',admin:true},
 {n:'老板 / 高管',av:'董',d:'默认进入 经营决策',st:['biz','bid','cost','site','wm','oa'],home:'biz'},
 {n:'商务 / 投标',av:'投',d:'默认进入 市场投标',st:['bid','cost','site','oa'],home:'bid'},
 {n:'成控 / 财务',av:'财',d:'默认进入 合同成本',st:['cost','buy','site','biz','oa'],home:'cost'},
 {n:'采购 / 仓管',av:'采',d:'默认进入 采购仓储',st:['buy','site','oa'],home:'buy'},
 {n:'项目经理',av:'项',d:'默认进入 项目现场',st:['site','buy','wm','oa'],home:'site'},
 {n:'维保 / 值班 / 调度',av:'值',d:'默认进入 维保值班',st:['wm','oa'],home:'wm'},
 {n:'技术 / 运维',av:'技',d:'默认进入 维保值班 · 设备与 IoT',st:['wm','site','oa'],home:'wm'},
 {n:'资料员 / 档案',av:'档',d:'默认进入 项目现场 · 资料与报告',st:['site','wm','oa'],home:'site'},
 {n:'员工 / 学员',av:'员',d:'默认进入 协同办公 · 知识培训与考试',st:['oa'],home:'oa'},
 {n:'业主 / 甲方',av:'业',d:'默认进入 业主服务',st:['owner'],home:'owner'},
 {n:'供应商 / 外部',av:'外',d:'仅授权数据 · 隐藏成本利润',st:['ext'],home:'ext'},
 {n:'系统管理员',av:'管',d:'全部导航 + 系统配置',st:ALL,home:'sys',admin:true}
];

/* ============ 13 首页 Dashboard ============ */
var DASH={
biz:{title:'老板驾驶舱',banner:'',quicks:[['chart','项目360'],['file','经营月报'],['warn','风险中心'],['check','审批中心']],
 metrics:[
  {k:'在建项目',v:'18',u:'个',sub:'进行中 13 · 待验收 5'},
  {k:'年度产值',v:'2.86',u:'亿',sub:'完成年度目标 72%',bars:[22,30,38,45,52,60,68,72]},
  {k:'累计回款',v:'2.14',u:'亿',sub:'回款率 74.8%',tr:'↑ 3.1% 环比',tc:'up'},
  {k:'预估毛利率',v:'19.2',u:'%',sub:'较上月 +0.8pt',st:'g'},
  {k:'风险预警',v:'7',u:'项',sub:'红色 2 · 黄色 5',st:'r',jump:'risk'},
  {k:'今日待我审批',v:'6',u:'项',sub:'最久滞留 1.5 天',st:'y',jump:'ap'}],
 main:{type:'kanban',title:'多项目组合看板',sub:'点击卡片穿透项目 360°',cols:[
  {name:'健康项目',cards:[
   {t:'XX产业园一期消防工程',tag:'工程',tc:'b',lamp:'g',pct:64,lines:[['年度产值','¥3,860万'],['回款率','82%'],['负责人','李敏']]},
   {t:'XX学校迁建消防配套',tag:'工程',tc:'b',lamp:'g',pct:41,lines:[['年度产值','¥2,450万'],['回款率','60%'],['负责人','孙倩']]}]},
  {name:'关注项目',cards:[
   {t:'XX商业广场综合体',tag:'工程',tc:'b',lamp:'y',pct:78,lines:[['年度产值','¥5,210万'],['回款率','68%'],['负责人','王强']]},
   {t:'年度维保合同群（23个）',tag:'维保',tc:'g',lamp:'g',pct:72,lines:[['年度产值','¥860万'],['回款率','90%'],['负责人','赵磊']]}]},
  {name:'风险项目',cards:[
   {t:'XX智慧物流园消防工程',tag:'工程',tc:'b',lamp:'r',pct:61,lines:[['风险','🔴 付款超合同 3.2%'],['回款率','45%'],['负责人','周凯']]},
   {t:'XX酒店消防改造',tag:'工程',tc:'b',lamp:'r',pct:88,lines:[['风险','🔴 工期逾期 5 天'],['回款率','55%'],['负责人','郑洁']]}]}]},
 side:{title:'风险与审批',tabs:[
  {id:'ap',name:'待我审批',items:[
   {tag:'付款',tc:'o',t:'XX广场项目进度款',d:'¥120万 · 分包付款 · 提交人：王强',time:'1小时前',acts:[['通过'],['驳回']]},
   {tag:'合同',tc:'b',t:'采购分包合同 · 风管安装',d:'¥45万 · 提交人：孙倩',time:'2小时前',acts:[['通过'],['驳回']]},
   {tag:'报销',tc:'gray',t:'差旅费报销',d:'¥0.86万 · 提交人：周凯',time:'3小时前',acts:[['通过'],['驳回']]},
   {tag:'用章',tc:'o',t:'竣工资料盖章申请',d:'合同专用章 · XX政务中心项目',time:'昨天',acts:[['通过'],['驳回']]}]},
  {id:'risk',name:'风险预警',items:[
   {lamp:'r',t:'超付预警 · XX智慧物流园',d:'累计付款超合同 3.2%',time:'待处理'},
   {lamp:'r',t:'工期逾期 · XX酒店改造',d:'已逾期 5 天，影响开业节点',time:'待处理'},
   {lamp:'y',t:'合同缺票 · XX商业广场',d:'缺票金额 ¥86万',time:'待处理'},
   {lamp:'y',t:'成本超量 · XX学校钢管',d:'超预算 12%',time:'待处理'},
   {lamp:'y',t:'质保金到期 · XX大厦',d:'10-08 到期 ¥32万',time:'待处理'},
   {lamp:'y',t:'回款逾期 · XX酒店',d:'应收逾期 60 天',time:'待处理'}]},
  {id:'ms',name:'经营简报',items:[
   {tag:'系统',tc:'b',t:'9月经营月报已生成',d:'可在报表中心查看',time:'08:30'},
   {tag:'市场',tc:'g',t:'本月中标 2 个项目',d:'合同额合计 ¥1,860万',time:'昨天'},
   {tag:'财务',tc:'gray',t:'现金流周报已推送',d:'本周净流入 ¥286万',time:'昨天'}]}]},
 bottom:{title:'回款节点提醒（未来 30 天）',headers:['项目 / 合同','回款条件','金额(万)','计划日期','状态','负责人'],rows:[
  ['XX产业园一期','第3期进度款','386.0','09-22',tg('g','正常'),'李敏'],
  ['XX商业广场综合体','第2期进度款','521.0','09-26',tg('y','催收中'),'王强'],
  ['XX智慧物流园','预付款','298.0','09-30',tg('r','已逾期'),'周凯'],
  ['年度维保合同群','季度服务费','86.0','10-05',tg('g','正常'),'赵磊'],
  ['XX酒店改造','竣工结算款','352.0','10-12',tg('y','资料补充中'),'郑洁']]},
 entries:[['chart','项目360'],['check','审批中心'],['warn','风险中心'],['file','报表中心'],['tool','维保总览'],['layers','IoT总览']]},

bid:{title:'投标与客户跟进看板',banner:'',quicks:[['users','新建客户'],['target','新建商机'],['file','新建投标'],['file','生成报价单']],
 metrics:[
  {k:'本月新增客户',v:'8',u:'家',sub:'累计客户 136 家',tr:'↑ 2 较上月',tc:'up'},
  {k:'商机数',v:'23',u:'个',sub:'预计金额 ¥4,860万'},
  {k:'本月投标',v:'11',u:'个',sub:'本周开标 3 场 · 截标 2 场'},
  {k:'中标率',v:'42.8',u:'%',sub:'本年度累计',tr:'↑ 5.2% 环比',tc:'up',st:'g'},
  {k:'保证金待回收',v:'58',u:'万',sub:'3 笔在途',st:'y'},
  {k:'证书 30 天内到期',v:'9',u:'本',sub:'已进入红色预警',st:'r'}],
 main:{type:'kanban',title:'投标阶段漏斗看板',sub:'线索 → 商机 → 投标 → 中标',cols:[
  {name:'线索',cards:[
   {t:'XX文体中心消防改造',lines:[['预计金额','约¥800万'],['跟进人','刘畅'],['下一步','上门拜访 09-19']]},
   {t:'XX食品厂报警系统',lines:[['预计金额','约¥260万'],['跟进人','刘畅'],['下一步','发送资料 09-18']]}]},
  {name:'商机',cards:[
   {t:'XX医院二期消防工程',tag:'入围',tc:'b',lines:[['预计金额','¥1,200万'],['短名单确认','09-20'],['决策人','已触达']]},
   {t:'XX数据中心消防系统',tag:'推进中',tc:'b',lines:[['预计金额','¥2,300万'],['下一步','方案汇报 09-24'],['竞争','3 家']]}]},
  {name:'投标中',cards:[
   {t:'XX医院门诊楼改造',tag:'已封标',tc:'g',lines:[['开标','09-18 09:30'],['保证金','¥10万'],['标书','完成']]},
   {t:'XX体育馆消防专项',tag:'编制中',tc:'o',lines:[['截标','09-22 17:00'],['证书核验','已通过'],['商务标','待定稿']]}]},
  {name:'已中标',cards:[
   {t:'XX政务中心消防工程',tag:'中标',tc:'g',lines:[['合同额','¥1,560万'],['下一步','合同签订'],['保证金','待退']]},
   {t:'XX产业园三期',tag:'中标',tc:'g',lines:[['合同额','¥300万'],['状态','已签合同'],['进场','09-26']]}]}]},
 side:{title:'跟进提醒',tabs:[
  {id:'flw',name:'跟进提醒',items:[
   {lamp:'y',t:'今日未跟进 · XX食品厂',d:'上次跟进 09-02，已间隔 14 天',time:'今日'},
   {lamp:'y',t:'今日未跟进 · XX文体中心',d:'上次跟进 09-10',time:'今日'},
   {tag:'证书',tc:'o',t:'建造师证到期提醒',d:'张伟·机电建造师 09-30 到期',time:'14天'},
   {tag:'保证金',tc:'b',t:'保证金退回 · XX智慧园区',d:'预计 09-25 到账 ¥10万',time:'09-25'},
   {lamp:'r',t:'逾期未跟进 · XX建材市场',d:'已逾期 7 天',time:'逾期'}]},
  {id:'cal',name:'投标日历',items:[
   {tag:'开标',tc:'b',t:'XX医院门诊楼 · 09-18 09:30',d:'XX市公共资源交易中心',time:'周三'},
   {tag:'答疑',tc:'gray',t:'XX体育馆 · 09-19 14:00',d:'线上答疑',time:'周四'},
   {tag:'截标',tc:'o',t:'XX体育馆 · 09-22 17:00',d:'投标文件上传截止',time:'下周一'},
   {tag:'开标',tc:'b',t:'XX数据中心 · 09-26 09:30',d:'评标周期约5天',time:'下周五'}]},
  {id:'ms',name:'消息',items:[
   {tag:'中标',tc:'g',t:'中标通知书 · XX政务中心',d:'请及时领取并安排合同签订',time:'09:20'},
   {tag:'财务',tc:'gray',t:'保证金退回到账',d:'XX医院一期 ¥10万 已到账',time:'08:50'},
   {tag:'日程',tc:'b',t:'客户来访预约',d:'XX医院基建处 09-20 上午',time:'昨天'}]}]},
 bottom:{title:'客户 / 商机列表',headers:['客户 / 项目','阶段','预计金额(万)','负责人','最近跟进','操作'],rows:[
  ['XX医院二期消防工程',tg('b','商机'),'1,200','刘畅','09-14 电话跟进',tg('b','详情')],
  ['XX数据中心消防系统',tg('b','商机'),'2,300','刘畅','09-13 技术交流',tg('b','详情')],
  ['XX政务中心消防工程',tg('g','已中标'),'1,560','刘畅','09-12 中标通知',tg('b','详情')],
  ['XX文体中心消防改造',tg('gray','线索'),'800','王悦','09-05 初步接触',tg('b','详情')],
  ['XX体育馆消防专项',tg('o','投标中'),'980','王悦','09-15 封标',tg('b','详情')]]},
 entries:[['users','客户管理'],['target','商机池'],['file','投标看板'],['money','报价工作台'],['file','证书台账'],['money','保证金台账']]},

cost:{title:'合同 · 预算 · 成本 · 付款风控台',banner:'',quicks:[['file','新建合同'],['file','发起变更'],['money','付款申请'],['box','维护价格库']],
 metrics:[
  {k:'待审合同',v:'5',u:'份',sub:'销售 2 · 采购 3',st:'y'},
  {k:'待结算',v:'3',u:'项',sub:'金额 ¥712万'},
  {k:'变更待确认',v:'7',u:'项',sub:'涉及金额 ¥86.4万',st:'y'},
  {k:'成本超控项',v:'4',u:'项',sub:'红 2 · 黄 2',st:'r'},
  {k:'本月付款计划',v:'1,860',u:'万',sub:'已付 42%'},
  {k:'价格库条目',v:'1,268',u:'条',tr:'↑ 32 本月更新',tc:'up'}],
 main:{type:'table',title:'预算执行概览（量价对比）',sub:'超量 / 超价 红黄绿标识',headers:['项目 / 清单项','预算量价','申请量价','合同量价','入库量价','支付量价','执行状态'],rows:[
  ['XX广场 / 镀锌钢管DN100','12,000m · ¥54万','12,600m · ¥57万','12,000m · ¥54万','11,800m · ¥53万','¥49万',tg('r','超量 +5%')],
  ['XX产业园 / 喷淋头','8,600只 · ¥25.8万','8,400只 · ¥25.2万','8,600只 · ¥25.8万','8,000只 · ¥24万','¥21万',tg('g','正常')],
  ['XX医院 / 桥架200×100','3,200m · ¥28.8万','3,200m · ¥30.2万','3,200m · ¥29.6万','2,900m · ¥26.8万','¥24万',tg('y','超价 +2.8%')],
  ['XX学校 / 报警设备','486点 · ¥38.9万','480点 · ¥38.2万','486点 · ¥38.9万','460点 · ¥36.8万','¥30万',tg('g','正常')],
  ['XX物流园 / 防火卷帘','26樘 · ¥62.4万','27樘 · ¥66.8万','26樘 · ¥62.4万','20樘 · ¥48万','¥48万',tg('r','超量+超价')]]},
 side:{title:'合同与付款待办',tabs:[
  {id:'ht',name:'合同付款待办',items:[
   {tag:'合同',tc:'b',t:'销售合同补充协议 · XX广场',d:'工期顺延 30 天条款待确认',time:'1小时前',acts:[['通过'],['驳回']]},
   {tag:'付款',tc:'o',t:'付款申请 · XX产业园第3期',d:'¥86万 · 进度款 70%',time:'2小时前',acts:[['通过'],['驳回']]},
   {tag:'发票',tc:'r',t:'发票异常 · XX医院项目',d:'缺发票联，请补充',time:'4小时前'},
   {tag:'结算',tc:'gray',t:'结算确认 · XX政务中心',d:'结算金额 ¥326万',time:'昨天',acts:[['通过'],['驳回']]},
   {tag:'变更',tc:'y',t:'变更签证 · XX医院',d:'增加声光报警 +¥3.2万',time:'昨天',acts:[['通过'],['驳回']]}]},
  {id:'ck',name:'超控预警',items:[
   {lamp:'r',t:'超量+超价 · 防火卷帘采购',d:'XX物流园 · 偏差 +3.8% / +7.1%',time:'09-15'},
   {lamp:'r',t:'超量 · 镀锌钢管',d:'XX广场 · 申请超预算 5%',time:'09-14'},
   {lamp:'y',t:'超价 · 桥架',d:'XX医院 · 合同价超目标价 2.8%',time:'09-12'},
   {lamp:'y',t:'临界 · 人工费',d:'XX学校 · 已用预算 92%',time:'09-10'}]}]},
 bottom:{title:'超量超价预警列表',headers:['预警项','项目','类型','偏差','触发时间','处理状态'],rows:[
  ['防火卷帘采购','XX物流园',tg('r','超量超价'),'+3.8% / +7.1%','09-15',tg('o','待处理')],
  ['镀锌钢管 DN100','XX广场',tg('r','超量'),'+5.0%','09-14',tg('b','已发起变更')],
  ['桥架 200×100','XX医院',tg('y','超价'),'+2.8%','09-12',tg('b','比价中')],
  ['人工费（安装班组）','XX学校',tg('y','临界'),'预算使用 92%','09-10',tg('gray','监控中')]]},
 entries:[['file','合同看板'],['file','主合同'],['file','支出合同'],['box','清单预算'],['money','结算管理'],['box','价格库']]},

buy:{title:'采购 · 询比价 · 出入库 · 库存预警台',banner:'',quicks:[['file','发起采购申请'],['cam','生成询价二维码'],['box','拍照入库'],['dl','出库领用']],
 metrics:[
  {k:'待处理采购申请',v:'9',u:'单',sub:'今日新增 3',st:'y'},
  {k:'进行中询价',v:'6',u:'单',sub:'今日截止 2 单'},
  {k:'待收货',v:'12',u:'单',sub:'今日到货 2 批'},
  {k:'库存预警',v:'5',u:'项',sub:'低于安全库存',st:'r'},
  {k:'待对账供应商',v:'3',u:'家',sub:'8 月账期'},
  {k:'未关联数据',v:'6',u:'笔',sub:'先发生后关联 · 最长挂账 23 天',st:'y'}],
 main:{type:'kanban',title:'询比价 / 订单跟踪看板',sub:'扫码询价 · 比价 · 发货 · 入库',cols:[
  {name:'询价中',cards:[
   {t:'镀锌钢管 DN100 × 3,000m',tag:'竞价中',tc:'b',lines:[['报价区间','¥49.8 - 53.2万'],['已报','3/5 家'],['截止','09-17 18:00']]},
   {t:'灭火器 MFZ/ABC4 × 800具',tag:'询价中',tc:'b',lines:[['报价区间','¥3.1 - 3.4万'],['已报','2/4 家'],['截止','09-18 18:00']]}]},
  {name:'已下单',cards:[
   {t:'报警设备 486点 · XX学校',tag:'已签合同',tc:'g',lines:[['中标供应商','安泰电子'],['合同额','¥38.9万'],['交期','09-24']]},
   {t:'桥架 200×100 · XX医院',tag:'待发货',tc:'o',lines:[['中标供应商','金桥物资'],['合同额','¥29.6万'],['发货','09-18']]}]},
  {name:'已发货',cards:[
   {t:'喷淋头 8,000只 · XX产业园',tag:'在途',tc:'b',lines:[['物流','专车运输'],['预计到','09-18 上午'],['收货','李仓管']]},
   {t:'防火卷帘 6樘 · XX物流园',tag:'在途',tc:'b',lines:[['物流','大件专运'],['预计到','09-19'],['收货','周仓管']]}]},
  {name:'待入库',cards:[
   {t:'水带 80型 × 200盘',tag:'质检中',tc:'y',lines:[['已到货','09-16'],['待办','压力质检'],['仓库','主仓 A2']]},
   {t:'电线电缆 NH-RVS',tag:'今日到',tc:'o',lines:[['预约入库','14:00'],['随车','质检报告'],['仓库','主仓 B1']]}]}]},
 side:{title:'库存预警 / 缺料提醒',tabs:[
  {id:'kc',name:'库存预警',items:[
   {lamp:'r',t:'灭火器 MFZ/ABC4',d:'库存 120 / 安全库存 300',time:'缺180',acts:[['补货']]},
   {lamp:'r',t:'手动报警按钮',d:'库存 45 / 安全库存 100',time:'缺55',acts:[['补货']]},
   {lamp:'y',t:'水带 80型',d:'库存 96 / 安全库存 150',time:'缺54'},
   {lamp:'y',t:'应急照明灯',d:'库存 210 / 安全库存 300',time:'缺90'},
   {lamp:'y',t:'风阀执行器',d:'库存 18 / 安全库存 30',time:'缺12'}]},
  {id:'sh',name:'待收货',items:[
   {tag:'今日',tc:'o',t:'电线电缆 NH-RVS',d:'预约入库 14:00 · 主仓 B1',time:'14:00'},
   {tag:'今日',tc:'o',t:'水带 200盘',d:'已到货 · 质检中',time:'待验收'},
   {tag:'明日',tc:'b',t:'喷淋头 8,000只',d:'XX产业园 · 预计 09-18 上午',time:'09-18'},
   {tag:'后天',tc:'gray',t:'防火卷帘 6樘',d:'XX物流园 · 预计 09-19',time:'09-19'}]}]},
 bottom:{title:'出入库流水（今日）',headers:['时间','单据','物料','数量','项目 / 仓库','经手人'],rows:[
  ['13:05',tg('b','出库'),'灭火器 MFZ/ABC4','40具','XX大厦维保','李仓管'],
  ['11:40',tg('g','入库'),'烟感探测器','200只','主仓 A1','王仓管'],
  ['10:22',tg('b','出库'),'水带 80型','24盘','XX医院巡检','李仓管'],
  ['09:47',tg('g','入库'),'桥架配件','6箱','主仓 B2','王仓管'],
  ['09:10',tg('b','出库'),'电线电缆 NH-RVS','800m','XX产业园','赵仓管']]},
 entries:[['users','供应商'],['grid','材料库'],['box','材料申请'],['cam','二维码询价'],['box','量价双控'],['warn','库存预警']]},

site:{title:'我负责的项目执行台',banner:'',quicks:[['file','提交施工日志'],['box','发起材料申请'],['clip','上报进度'],['warn','登记整改']],
 metrics:[
  {k:'我负责项目',v:'12',u:'个',sub:'进行中 9 · 待验收 3'},
  {k:'滞后项目',v:'2',u:'个',sub:'红 1 · 黄 1',st:'r'},
  {k:'待整改隐患',v:'6',u:'项',sub:'待整改 4 · 待复查 2',st:'y'},
  {k:'今日待填施工日志',v:'3',u:'份',sub:'截止 18:00',st:'y'},
  {k:'材料待收货',v:'8',u:'单',sub:'今日到货 2 批'},
  {k:'劳务出勤待确认',v:'26',u:'人',sub:'涉及 3 个班组',st:'y'}],
 main:{type:'kanban',title:'项目进度看板',sub:'按阶段 · 卡片可点入详情',cols:[
  {name:'施工准备',cards:[
   {t:'XX科技园火灾自动报警系统',pct:15,lamp:'g',lines:[['项目经理','陈晨'],['下一节点','进场交底 09-22'],['工期','60天']]},
   {t:'XX物流中心消防水系统',pct:8,lamp:'g',lines:[['项目经理','周凯'],['下一节点','图纸会审 09-25'],['工期','90天']]}]},
  {name:'施工中',cards:[
   {t:'XX国际大厦消防改造',pct:72,lamp:'y',lines:[['项目经理','王强'],['下一节点','竣工验收 09-28'],['劳务','18人']],tag:'滞后风险',tc:'o'},
   {t:'XX产业园喷淋系统工程',pct:48,lamp:'g',lines:[['项目经理','李敏'],['下一节点','隐蔽验收 09-30'],['劳务','26人']]},
   {t:'XX医院门诊楼报警系统',pct:90,lamp:'r',lines:[['项目经理','赵磊'],['下一节点','消防检测 09-20'],['劳务','8人']],tag:'节点临近',tc:'r'},
   {t:'XX学校宿舍喷淋改造',pct:35,lamp:'g',lines:[['项目经理','刘洋'],['下一节点','中间检查 10-12'],['劳务','12人']]},
   {t:'XX商业广场防排烟工程',pct:58,lamp:'y',lines:[['项目经理','孙倩'],['下一节点','隐蔽验收 10-05'],['劳务','15人']]}]},
  {name:'调试验收',cards:[
   {t:'XX数据中心气体灭火系统',pct:82,lamp:'y',lines:[['项目经理','吴斌'],['下一节点','联动调试 09-24']]},
   {t:'XX酒店报警系统改造',pct:76,lamp:'r',lines:[['项目经理','郑洁'],['下一节点','检测报告 09-27']],tag:'逾期5天',tc:'r'},
   {t:'XX厂房电气火灾监测',pct:68,lamp:'y',lines:[['项目经理','何军'],['下一节点','验收申报 10-08']]}]},
  {name:'竣工结算',cards:[
   {t:'XX政务中心消防工程',pct:100,lamp:'g',lines:[['状态','待结算 ¥326万'],['资料','归档 92%']]},
   {t:'XX体育馆消防改造',pct:100,lamp:'y',lines:[['状态','结算审核中'],['资料','缺验收意见书']]}]}]},
 side:{title:'质安与审批',tabs:[
  {id:'za',name:'质安整改',items:[
   {lamp:'r',t:'隐患 · XX物流园',d:'临时用电不规范 · 待整改（今天18:00前）',time:'09-16'},
   {lamp:'y',t:'隐患 · XX广场',d:'动火作业证缺失 · 待整改',time:'09-15'},
   {lamp:'b',t:'复查 · XX学校卷帘门调试',d:'整改完成待安全员复查',time:'09-15'},
   {tag:'质检',tc:'o',t:'桥架安装观感质检',d:'XX医院 · 待复查',time:'09-14'}]},
  {id:'sp',name:'待我审批',items:[
   {tag:'变更',tc:'y',t:'设计变更 · XX医院',d:'增加声光报警 +¥3.2万',time:'2小时前',acts:[['通过'],['驳回']]},
   {tag:'材料',tc:'b',t:'材料申请 · XX学校',d:'镀锌钢管 1,200m',time:'3小时前',acts:[['通过'],['驳回']]},
   {tag:'进度',tc:'g',t:'进度申报 · XX产业园',d:'申报至 48%（第6周）',time:'昨天',acts:[['通过'],['驳回']]},
   {tag:'劳务',tc:'gray',t:'劳务班组进场',d:'XX广场风管班组 8 人',time:'昨天',acts:[['通过'],['驳回']]}]},
  {id:'ms',name:'消息',items:[
   {tag:'通知',tc:'b',t:'XX大厦竣工验收申请已提交',d:'待安排验收计划',time:'09:32'},
   {tag:'天气',tc:'o',t:'明日有雨',d:'XX产业园现场请停止动火与吊装',time:'08:00'},
   {tag:'安全',tc:'g',t:'今日安全巡查已完成',d:'XX医院项目 · 无新增隐患',time:'07:40'}]}]},
 bottom:{title:'我负责的项目',headers:['项目名称','类型','进度','健康度','下一节点','操作'],rows:[
  ['XX国际大厦消防改造',tg('b','工程'),'72%',dt('y')+' 关注','竣工验收 09-28',tg('b','详情')],
  ['XX产业园喷淋系统工程',tg('b','工程'),'48%',dt('g')+' 正常','隐蔽验收 09-30',tg('b','详情')],
  ['XX医院消防维保(2026)',tg('g','维保'),'86%',dt('r')+' 风险','季度报告 09-19',tg('b','详情')],
  ['XX数据中心气体灭火',tg('b','工程'),'82%',dt('y')+' 关注','联动调试 09-24',tg('b','详情')],
  ['XX政务中心消防工程',tg('b','工程'),'100%',dt('g')+' 正常','结算审核中',tg('b','详情')],
  ['XX学校宿舍喷淋改造',tg('b','工程'),'35%',dt('g')+' 正常','中间检查 10-12',tg('b','详情')]]},
 entries:[['clip','项目概览'],['file','施工日志'],['warn','质量安全'],['box','材料申请'],['file','变更签证'],['arch','验收资料']]},

wm:{title:'值班 · 工单 · 告警 · 派工调度台',banner:'',quicks:[['file','发起报修'],['users','派工/接单'],['check','值班打卡'],['file','填写值班日志']],
 metrics:[
  {k:'今日值班班次',v:'6',u:'班',sub:'白班 4 · 夜班 2'},
  {k:'待派工单',v:'8',u:'单',sub:'紧急 1',st:'y'},
  {k:'进行中工单',v:'15',u:'单',sub:'今日应完 9'},
  {k:'IoT 实时告警',v:'4',u:'条',sub:'紧急 2',st:'r'},
  {k:'待填值班日志',v:'2',u:'份',sub:'白班 · 前日夜班',st:'y'},
  {k:'备件待领',v:'3',u:'项',sub:'工单关联领用'}],
 main:{type:'kanban',title:'调度工单池',sub:'按紧急度 · 一键派工',cols:[
  {name:'待派工',cards:[
   {t:'XX医院门诊楼 · 主机离线',tag:'告警',tc:'r',lamp:'r',lines:[['紧急度','🔴 紧急'],['产生','2小时前'],['建议','就近派单']]},
   {t:'XX商城 · 防火门闭门器损坏',tag:'报修',tc:'b',lines:[['紧急度','普通'],['预约','今日 18:00 前'],['业主','已报修']]},
   {t:'XX大厦 · 手报误响确认',tag:'报修',tc:'b',lines:[['紧急度','普通'],['位置','3F 东走廊'],['来源','IoT联动']]}]},
  {name:'处理中',cards:[
   {t:'XX产业园 · 9月月度巡检',tag:'巡检',tc:'g',lines:[['工程师','李强'],['进度','3/5 楼层'],['预计','16:00 完成']]},
   {t:'XX商城 · 水压偏低处置',tag:'告警',tc:'r',lines:[['工程师','张伟'],['状态','已到场'],['原因','稳压泵故障排查中']]},
   {t:'XX学校 · 应急灯更换',tag:'报修',tc:'b',lines:[['工程师','王芳'],['备件','已领用 12 只'],['预计','明日完成']]}]},
  {name:'待审核',cards:[
   {t:'XX大厦 · 季度保养',tag:'巡检',tc:'g',lines:[['工程师','赵磊'],['待办','项目经理审核'],['报告','已生成']]},
   {t:'XX产业园 · 排烟阀维修',tag:'报修',tc:'b',lines:[['工程师','张伟'],['待办','客户签字确认'],['拍照','5 张已上传']]}]},
  {name:'今日已完成',cards:[
   {t:'XX政务中心 · 主机复位',tag:'告警',tc:'g',lamp:'g',lines:[['工程师','张伟'],['闭环','已闭环'],['耗时','40分钟']]},
   {t:'XX医院 · 喷淋头更换',tag:'报修',tc:'g',lamp:'g',lines:[['工程师','王芳'],['客户','已确认'],['评价','⭐5.0']]}]}]},
 side:{title:'值班与告警',tabs:[
  {id:'bj',name:'实时告警',items:[
   {lamp:'r',t:'主机离线 · XX医院门诊楼',d:'已离线 2 小时',time:'08:47',acts:[['转派工单']]},
   {lamp:'r',t:'水压低 · XX商城 B2',d:'0.08MPa 低于阈值',time:'09:12',acts:[['转派工单']]},
   {lamp:'y',t:'电气温度 · XX产业园配电房',d:'68℃ 趋势上升',time:'10:05',acts:[['转派工单']]},
   {lamp:'y',t:'误报确认 · XX大厦 3F 烟感',d:'疑似装修粉尘',time:'10:20',acts:[['转派工单']]}]},
  {id:'zb',name:'今日值班',items:[
   {tag:'白班',tc:'g',t:'08:00 - 20:00 · 张伟 / 李强',d:'消控室值班 · 已打卡',time:'正常'},
   {tag:'夜班',tc:'b',t:'20:00 - 08:00 · 王芳',d:'待打卡（20:00 前）',time:'未打卡',acts:[['值班打卡']]},
   {tag:'备班',tc:'gray',t:'陈晨 · 机动支援',d:'今日支援 XX商城水压处置',time:'执行中'}]}]},
 bottom:{title:'巡检线路计划',headers:['巡检线路','所属项目','周期','下次执行','进度','状态'],rows:[
  ['XX医院门诊楼巡检线','XX医院','周巡','09-17（今日）','0/6 点位',tg('g','今日执行')],
  ['XX产业园A座巡检线','XX产业园','月度','09-18','3/5 楼层',tg('b','进行中')],
  ['XX大厦消防设施线','XX大厦','季度','09-22','0/8 点位',tg('gray','待开始')],
  ['XX商城防火分区线','XX商城','月度','09-25','0/9 分区',tg('gray','待开始')]]},
 entries:[['clip','工单池'],['users','派工调度'],['cal','排班值班'],['box','备件仓库'],['file','服务报告'],['file','值班日志']]},

iot:{title:'设备孪生可视化监测台',banner:'',quicks:[['layers','打开3D场景'],['warn','处理告警'],['clip','生成巡检'],['dl','导出台账']],
 metrics:[
  {k:'在线设备',v:'1,286',u:'台',sub:'在线率 97.9%',st:'g'},
  {k:'告警设备',v:'7',u:'台',sub:'火警类 2',st:'r'},
  {k:'离线设备',v:'23',u:'台',sub:'最长离线 2 天',st:'y'},
  {k:'今日告警',v:'15',u:'条',sub:'已处理 11 · 处理率 73%'},
  {k:'预测性维护',v:'3',u:'项',sub:'主机备电 · 消防泵 · 摄像头'}],
 main:{type:'twin',title:'孪生楼层平面 · 设备点位',sub:'点击点位查看实时数据与工单',
  cats:[['火灾探测器','#1890ff',598],['消防主机','#722ed1',12],['自动喷水/水压','#52c41a',152],['消火栓','#13c2c2',88],['电气火灾','#faad14',52],['防火分隔','#ff4d4f',36],['应急照明','#8c8c8c',210],['视频监控','#2f54eb',116]],
  floors:['F3','F2','F1'],
  pts:[
   {f:'F2',x:30,y:38,st:'g',ty:'消防主机',n:'2F 消防主机',code:'ZJ-B2-01',val:'运行正常 · 主电 220V'},
   {f:'F2',x:68,y:36,st:'r',ty:'火灾探测器',n:'2F 东走廊烟感',code:'YG-2F-012',val:'感烟 3.2 %obs/m · 火警确认'},
   {f:'F2',x:84,y:66,st:'g',ty:'应急照明',n:'2F 应急照明箱',code:'YJ-2F-01',val:'电池 92% · 充电正常'},
   {f:'F3',x:25,y:28,st:'o',ty:'视频监控',n:'3F 西北角摄像头',code:'SP-3F-08',val:'离线 2 天 · 网络异常'},
   {f:'F3',x:55,y:40,st:'y',ty:'电气火灾',n:'3F 配电房温度传感器',code:'DQ-3F-03',val:'68℃ · 接近阈值 70℃'},
   {f:'F3',x:78,y:58,st:'g',ty:'气体灭火',n:'3F 机房气体灭火控制器',code:'QT-3F-01',val:'备电正常 · 无预警'},
   {f:'F1',x:22,y:32,st:'r',ty:'自动喷水',n:'消防泵出口压力变送器',code:'XSF-B1-01',val:'0.08 MPa · 低于阈值 0.10'},
   {f:'F1',x:55,y:52,st:'g',ty:'火灾探测器',n:'1F 大堂烟感',code:'YG-1F-006',val:'正常 · 自检通过'},
   {f:'F1',x:82,y:68,st:'g',ty:'消火栓',n:'1F 东侧消火栓',code:'SH-1F-02',val:'栓口压力 0.32 MPa 正常'}]},
 side:{title:'实时告警 / 设备动态',tabs:[
  {id:'bj',name:'实时告警',items:[
   {lamp:'r',t:'烟感火警 · 2F 东走廊烟感',d:'YG-2F-012 · 3.2%obs/m',time:'10:32',acts:[['转派工单']]},
   {lamp:'r',t:'水压低 · 消防泵出口',d:'0.08MPa · 建议检查稳压泵',time:'09:12',acts:[['转派工单']]},
   {lamp:'y',t:'配电房温度 68℃',d:'DQ-3F-03 · 趋势上升',time:'10:05',acts:[['转派工单']]},
   {lamp:'o',t:'设备离线 · 3F 西北摄像头',d:'SP-3F-08 · 已通知网管',time:'昨天'}]},
  {id:'dt',name:'设备动态',items:[
   {tag:'巡检',tc:'g',t:'喷淋末端试水完成',d:'最不利点压力 0.15MPa 合格',time:'09-15'},
   {tag:'预测',tc:'b',t:'2F 主机备电 <30%',d:'建议 7 日内更换蓄电池组',time:'预测'},
   {tag:'预测',tc:'b',t:'消防泵累计运行 2,000h',d:'建议安排季度保养',time:'预测'}]}]},
 bottom:{title:'设备台账（监测中）',headers:['设备编码','设备名称','类型','位置','实时值','状态','操作'],rows:[
  ['YG-2F-012','2F 东走廊烟感',tg('b','火灾探测器'),'2F 东走廊','3.2 %obs/m',tg('r','火警'),tg('b','详情')],
  ['XSF-B1-01','消防泵出口压力变送器',tg('g','自动喷水'),'B1 泵房','0.08 MPa',tg('r','低限'),tg('b','详情')],
  ['DQ-3F-03','配电房温度传感器',tg('o','电气火灾'),'3F 配电房','68 ℃',tg('y','注意'),tg('b','详情')],
  ['ZJ-B2-01','2F 消防主机',tg('gray','主机'),'2F 消控室','运行正常',tg('g','在线'),tg('b','详情')],
  ['QT-3F-01','气体灭火控制器',tg('gray','气体灭火'),'3F 机房','备电正常',tg('g','在线'),tg('b','详情')],
  ['SP-3F-08','3F 西北角摄像头',tg('b','视频监控'),'3F 西北角','—',tg('gray','离线'),tg('b','详情')]]},
 entries:[['box','设备台账'],['layers','孪生场景'],['warn','告警中心'],['chart','IoT监测'],['tool','预测维护'],['cam','视频联动']]},

doc:{title:'资料归档与消防报告台',banner:'',quicks:[['arch','上传/智能归档'],['file','生成消防报告'],['check','发起电子签'],['dl','下载报告']],
 metrics:[
  {k:'应归档资料',v:'342',u:'份',sub:'本月新增 28'},
  {k:'已归档',v:'298',u:'份',sub:'归档率 87.1%',tr:'↑ 3.2% 本月',tc:'up'},
  {k:'缺失资料',v:'44',u:'份',sub:'施工 18 · 验收 12',st:'r'},
  {k:'待生成报告',v:'5',u:'份',sub:'消防检测 2 · 维保月报 3',st:'y'},
  {k:'待签章文件',v:'3',u:'份',sub:'电子签 2 · 用印 1',st:'y'}],
 main:{type:'tree',title:'里程碑资料目录',sub:'按项目阶段 · 缺失标红',groups:[
  {n:'① 立项阶段',miss:1,items:[{n:'中标通知书',t:'已归档',c:'g'},{n:'立项审批表',t:'已归档',c:'g'},{n:'决策文件',t:'缺失',c:'r'}]},
  {n:'② 合同阶段',miss:2,items:[{n:'施工合同（主合同）',t:'已归档',c:'g'},{n:'补充协议',t:'审核中',c:'o'},{n:'廉政协议',t:'缺失',c:'r'},{n:'保险单',t:'缺失',c:'r'}]},
  {n:'③ 施工阶段',miss:18,items:[{n:'施工方案 / 技术交底',t:'已归档',c:'g'},{n:'隐蔽验收记录（缺12）',t:'缺失',c:'r'},{n:'材料合格证（缺6）',t:'缺失',c:'r'}]},
  {n:'④ 验收阶段',miss:12,items:[{n:'消防检测报告',t:'审核中',c:'o'},{n:'竣工验收记录（缺3）',t:'缺失',c:'r'},{n:'消防验收意见书（缺9）',t:'缺失',c:'r'}]},
  {n:'⑤ 维保阶段',miss:11,items:[{n:'维保合同',t:'已归档',c:'g'},{n:'月度维保报告（缺8）',t:'缺失',c:'r'},{n:'年度检测报告（缺3）',t:'缺失',c:'r'}]}]},
 side:{title:'报告与签章',tabs:[
  {id:'bg',name:'报告任务',items:[
   {tag:'生成中',tc:'b',t:'消防检测报告 · XX大厦',d:'数据聚合 80% · 预计今日完成',time:'80%'},
   {tag:'待生成',tc:'gray',t:'维保月报 × 3 项目',d:'XX医院 · XX商城 · XX产业园',time:'9月'},
   {tag:'模板',tc:'o',t:'年度检测报告 · XX医院',d:'待选择报告模板',time:'待办'},
   {tag:'完成',tc:'g',t:'竣工资料包 · XX政务中心',d:'已生成 PDF · 186MB',time:'昨天'}]},
  {id:'dz',name:'电子签',items:[
   {lamp:'y',t:'维保报告签字 · XX产业园',d:'8月月报 · 待客户签',time:'2天',acts:[['发起签']]},
   {lamp:'y',t:'内部审核签 · 检测报告',d:'待总工签发',time:'1天',acts:[['发起签']]},
   {tag:'用印',tc:'b',t:'交付确认单 · XX政务中心',d:'待合同章',time:'待用印'}]}]},
 bottom:{title:'归档审核列表',headers:['资料名称','所属项目','提交人','审核节点','状态','时间'],rows:[
  ['隐蔽验收记录 · 3F 管网','XX产业园','李敏',tg('b','工程审核'),tg('y','待审'),'09-16 10:20'],
  ['消防检测报告（草稿）','XX大厦','郑洁',tg('b','技术审核'),tg('y','待审'),'09-16 09:05'],
  ['材料合格证 · 防火卷帘','XX物流园','周凯',tg('b','工程审核'),tg('g','已通过'),'09-15'],
  ['8月维保报告','XX医院','赵磊',tg('o','客户签章'),tg('y','待客户签'),'09-14'],
  ['竣工图（电子版）','XX政务中心','何军',tg('b','档案审核'),tg('g','已归档'),'09-12']]},
 entries:[['arch','资料目录'],['cam','智能归档'],['file','报告模板'],['file','消防报告'],['check','电子签'],['box','交付包']]},

edu:{title:'学习 · 考试 · 证书台',banner:'',quicks:[['book','进入考试'],['book','学习课程'],['file','检索知识'],['check','更新证书']],
 metrics:[
  {k:'我的待学课程',v:'4',u:'门',sub:'本周应完成 2'},
  {k:'待考试',v:'2',u:'场',sub:'9月统考 09-20',st:'y'},
  {k:'证书到期',v:'1',u:'本',sub:'电工证 09-30 到期',st:'y'},
  {k:'题库条目',v:'3,208',u:'题',tr:'↑ 126 本月新增',tc:'up'},
  {k:'我的通过率',v:'88.9',u:'%',sub:'近 12 个月',st:'g'}],
 main:{type:'cards',title:'学习 / 考试任务',cards:[
  {t:'消防设施操作员（中级）· 理论精讲',sub:'第 8 章 · 气体灭火系统控制逻辑',pct:72,btn:'继续学习',foot:'剩余 6 课时'},
  {t:'火灾自动报警系统实操',sub:'模块 3 · 主机编程与联动逻辑',pct:45,btn:'继续学习',foot:'剩余 11 课时'},
  {t:'9月月度统考 · 维保操作规程',sub:'开考 09-20 14:00 · 时长 60 分钟 · 题量 50',pct:null,btn:'进入考试',foot:'准考证已生成'},
  {t:'应急预案演练考核',sub:'2026-08 场次 · 已通过',pct:100,btn:'查看证书',foot:'成绩 92 分'}]},
 side:{title:'证书与上岗资格',tabs:[
  {id:'zs',name:'证书资格',items:[
   {tag:'有效',tc:'g',t:'注册消防工程师',d:'有效期至 2027-03 · ✓ 可任项目负责人',time:'有效'},
   {tag:'临期',tc:'o',t:'电工证（低压）',d:'09-30 到期 · 请及时换证',time:'14天',acts:[['换证提醒']]},
   {tag:'有效',tc:'g',t:'消防设施操作员证（中级）',d:'有效期至 2028-01 · ✓ 可值班',time:'有效'},
   {tag:'校验',tc:'b',t:'值班资格校验',d:'全部通过 · 可排所有班次',time:'今日'}]},
  {id:'tj',name:'推荐课程',items:[
   {tag:'课程',tc:'b',t:'气体灭火系统维护要点',d:'32 分钟 · 已 486 人学习',time:'推荐'},
   {tag:'规范',tc:'gray',t:'2026 版《消防设施通用规范》解读',d:'58 分钟 · 新规必学',time:'推荐'},
   {tag:'案例',tc:'o',t:'典型误报案例复盘（10例）',d:'45 分钟 · 维保岗必修',time:'推荐'}]}]},
 bottom:{title:'考试记录',headers:['考试名称','日期','成绩','结果','证书'],rows:[
  ['应急预案演练考核（8月）','2026-08-28','92',tg('g','通过'),tg('b','查看')],
  ['水系统实操认证','2026-07-16','88',tg('g','通过'),tg('b','查看')],
  ['7月月度统考 · 巡检规程','2026-07-20','76',tg('g','通过'),tg('gray','—')],
  ['电气火灾监测专项','2026-06-11','58',tg('r','未通过'),tg('gray','—')]]},
 entries:[['book','知识库'],['box','题库'],['check','在线考试'],['cal','培训计划'],['arch','证书管理'],['book','规范图集']]},

oa:{title:'待办 · 公告与行政办公台',banner:'',quicks:[['check','发起审批'],['file','发布公告'],['cal','新增日程'],['money','发起报销']],
 metrics:[
  {k:'待我审批',v:'6',u:'项',sub:'最久滞留 2 天',st:'y'},
  {k:'待我阅读',v:'4',u:'份',sub:'制度 2 · 通知 2'},
  {k:'未读公告',v:'3',u:'条',sub:'含红头 1 条',st:'y'},
  {k:'待报销',v:'2',u:'笔',sub:'合计 ¥3,860'},
  {k:'今日日程',v:'5',u:'项',sub:'1 项进行中'}],
 main:{type:'table',title:'流程待办',sub:'按类型分组处理',headers:['类型','事项','提交人','到达时间','操作'],rows:[
  [tg('b','合同'),'合同会签 · XX政务中心结算补充协议','刘畅','09-16 09:12',OKNO],
  [tg('o','付款'),'付款审批 · XX产业园第3期 ¥86万','李敏','09-16 08:47',OKNO],
  [tg('gray','报销'),'差旅报销 · 苏州出差 ¥0.86万','周凯','09-15 17:30',OKNO],
  [tg('o','用印'),'项目章使用 · XX医院检测委托函','赵磊','09-15 15:00',OKNO],
  [tg('b','人事'),'转正申请 · 技术员 陈晨','人事部','09-14 11:00',OKNO]]},
 side:{title:'公告 / 制度 / 日程',tabs:[
  {id:'gg',name:'公告制度',items:[
   {tag:'红头',tc:'r',t:'国庆节值班安排通知',d:'请各部门 09-20 前反馈值班表',time:'09-16'},
   {tag:'制度',tc:'b',t:'差旅费管理办法（2026 修订）',d:'09-01 起执行 · 请学习确认',time:'09-12'},
   {tag:'公告',tc:'gray',t:'消防行业展会参访报名',d:'10-14 · 名额 8 人',time:'09-10'},
   {tag:'新闻',tc:'g',t:'公司中标 XX政务中心项目',d:'合同额 ¥1,560万',time:'09-08'}]},
  {id:'rc',name:'今日日程',items:[
   {tag:'09:30',tc:'b',t:'项目周会（视频）',d:'组织者：王志明',time:'已结束'},
   {tag:'11:00',tc:'g',t:'XX医院现场验收',d:'地点：门诊楼 3F',time:'进行中'},
   {tag:'14:00',tc:'gray',t:'供应商比价评审会',d:'会议室 A · 防火卷帘采购',time:'待开始'},
   {tag:'16:00',tc:'gray',t:'新员工转正面谈',d:'技术部 陈晨',time:'待开始'},
   {tag:'17:30',tc:'gray',t:'撰写本周工作周报',d:'系统自动提醒',time:'待开始'}]}]},
 bottom:{title:'待报销与收发文',headers:['事项','类型','金额/编号','状态','时间'],rows:[
  ['差旅报销 · 苏州出差',tg('gray','报销'),'¥0.86万',tg('y','审批中'),'09-15'],
  ['办公耗材采购报销',tg('gray','报销'),'¥3,000',tg('y','审批中'),'09-14'],
  [tg('b','收文'),'《市消防救援支队秋冬季检查通知》','ZW-2609-08',tg('g','已阅办'),'09-16'],
  [tg('o','发文'),'关于 9 月安全巡查计划的通知','FW-2609-12',tg('g','已下发'),'09-15']]},
 entries:[['money','报销'],['file','收发文'],['check','用印'],['clip','用车'],['arch','证件'],['users','人事'],['cal','日程'],['file','公文'],['chart','AI助手']]},

owner:{title:'业主项目服务台',banner:'业主视角：成本、利润、内部审批等敏感信息已隐藏，仅显示授权范围内（贵司名下）的项目进度、报告、报修与验收数据。',
 quicks:[['clip','查看进度'],['dl','下载报告'],['check','确认验收'],['file','发起报修']],
 metrics:[
  {k:'我的项目',v:'3',u:'个',sub:'工程 2 · 维保 1'},
  {k:'进行中项目',v:'2',u:'个',sub:'均按计划推进',st:'g'},
  {k:'待确认验收',v:'1',u:'项',sub:'3F 防火分隔整改',st:'y'},
  {k:'可下载报告',v:'8',u:'份',sub:'检测 2 · 月报 6'},
  {k:'待评价服务',v:'1',u:'项',sub:'工单 BX-2609-012'}],
 main:{type:'cards',title:'项目进度报告',sub:'最近更新 · 含现场照片',cards:[
  {t:'XX大厦消防改造工程',sub:'当前阶段：隐蔽工程施工 · 本周完成 3F 报警管线敷设',pct:72,btn:'查看详情',foot:'09-15 更新 · 现场照片 3 张',photo:3},
  {t:'XX产业园消控室升级',sub:'当前阶段：设备进场 · 主机已到货待安装',pct:48,btn:'查看详情',foot:'09-14 更新 · 现场照片 5 张',photo:5},
  {t:'XX厂房消防维保（2026）',sub:'当前阶段：8月月度保养已完成 · 报告可下载',pct:86,btn:'查看报告',foot:'09-02 更新 · 下次保养 09-28',photo:2}]},
 side:{title:'验收 · 整改 · 报告',tabs:[
  {id:'ys',name:'验收与整改',items:[
   {lamp:'y',t:'待确认 · 消防验收资料核对清单',d:'12 项资料待贵司核对确认',time:'09-15',acts:[['去确认']]},
   {tag:'整改',tc:'o',t:'整改通知 · 3F 防火门闭门器',d:'服务单位已派单 · 处理中',time:'09-15'},
   {tag:'闭环',tc:'g',t:'8月整改项（5 项）',d:'全部闭环 · 复查照片已归档',time:'08-30'}]},
  {id:'bg',name:'报告下载',items:[
   {tag:'检测',tc:'b',t:'消防设施检测报告 · XX大厦',d:'2026-09-10 出具 · PDF 12MB',time:'09-10',acts:[['下载']]},
   {tag:'月报',tc:'b',t:'维保月报 · 8月',d:'XX厂房 · 已出票',time:'09-02',acts:[['下载']]},
   {tag:'巡检',tc:'gray',t:'季度巡检记录',d:'2026 Q3 · 38 个点位',time:'08-28',acts:[['下载']]}]}]},
 bottom:{title:'我的报修工单',headers:['工单号','报修内容','状态','处理工程师','预约 / 完成时间'],rows:[
  ['BX-2609-012','手报按钮误响',tg('g','已完成')+' · 待评价','张伟','09-15 16:30'],
  ['BX-2609-018','防火门闭门器损坏',tg('b','处理中'),'王芳','预约 09-17 09:00'],
  ['BX-2609-003','喷淋头渗水',tg('g','已完成'),'李强','09-08 14:20']]},
 entries:[['clip','我的项目'],['chart','进度查看'],['dl','报告下载'],['check','验收确认'],['file','在线报修'],['book','满意度评价']]},

sys:{title:'租户 · 权限 · 模块 · 计费管理台',banner:'',quicks:[['users','新增用户'],['gear','角色配置'],['box','模块市场'],['file','安全日志']],
 metrics:[
  {k:'企业用户',v:'286',u:'人',tr:'↑ 12 本月新增',tc:'up'},
  {k:'7日活跃',v:'174',u:'人',sub:'活跃率 60.8%',st:'g'},
  {k:'角色数',v:'12',u:'个',sub:'权限组 38 个'},
  {k:'已开通模块',v:'9/13',u:'',sub:'试用中 2 · 可开通 2'},
  {k:'版本 / 计费',v:'专业版',u:'',sub:'2026-12-31 到期 · 50 席位',st:'g'}],
 main:{type:'table',title:'组织 / 用户管理',sub:'数据按「项目部」维度隔离',headers:['组织部门','负责人','人数','子部门','状态','操作'],rows:[
  ['华东一区 · 工程交付部','王志明','46','3',tg('g','正常'),tg('b','管理')],
  ['华东一区 · 维保服务中心','赵磊','32','2',tg('g','正常'),tg('b','管理')],
  ['商务与投标部','刘畅','18','1',tg('g','正常'),tg('b','管理')],
  ['采购与仓储部','陈晨','12','0',tg('g','正常'),tg('b','管理')],
  ['智慧消防事业部','吴斌','21','2',tg('y','整编中'),tg('b','管理')]]},
 side:{title:'权限 / 模块市场',tabs:[
  {id:'mk',name:'模块市场',items:[
   {tag:'已开通',tc:'g',t:'经营决策',d:'50 席位 · 至 2026-12-31',time:'正式'},
   {tag:'已开通',tc:'g',t:'项目现场',d:'50 席位 · 至 2026-12-31',time:'正式'},
   {tag:'已开通',tc:'g',t:'数字孪生与 IoT',d:'12 场景 · 至 2026-12-31',time:'正式'},
   {tag:'试用',tc:'o',t:'外部协作',d:'试用剩 14 天',time:'试用',acts:[['开通正式版']]},
   {tag:'未开通',tc:'gray',t:'智慧园区模块',d:'含停车 / 能耗 / 门禁',time:'了解',acts:[['申请试用']]}]},
  {id:'qx',name:'权限概览',items:[
   {tag:'数据',tc:'b',t:'数据权限 · 按项目部隔离',d:'已配置 8 条隔离规则',time:'生效'},
   {tag:'字段',tc:'b',t:'字段权限 · 业主视角',d:'隐藏成本 / 利润 / 内部审批 5 组字段',time:'生效'},
   {tag:'审批',tc:'o',t:'审批流 · 变更管控',d:'变更超合同 5% 需总经理审批',time:'生效'},
   {tag:'安全',tc:'g',t:'登录安全',d:'双因子认证已开启 · 异地登录提醒',time:'生效'}]}]},
 bottom:{title:'操作日志（今日）',headers:['时间','操作人','模块','操作内容','IP'],rows:[
  ['13:42','系统管理员','角色权限','修改「项目经理」数据权限范围','10.8.22.14'],
  ['11:26','刘畅','市场投标','导出商机列表（120 条）','10.8.21.7'],
  ['10:15','王志明','项目现场','审批通过 · 进度申报 XX产业园','10.8.20.3'],
  ['09:55','赵磊','维保值班','派工 · XX医院主机离线工单','10.8.23.9'],
  ['08:30','系统','报表中心','自动生成 9 月经营月报','内部任务']]},
 entries:[['users','组织人员'],['gear','角色权限'],['lock','数据权限'],['box','模块市场'],['money','租户计费'],['plug','API集成']]},

ext:{title:'外部询价 · 订单 · 对账台',banner:'外部协作视角：仅显示与贵司相关的询价、订单与对账数据；企业内部成本、利润、其他供应商报价与付款审批流不可见。',
 quicks:[['file','在线报价'],['check','确认订单'],['cam','送货确认'],['dl','下载对账单']],
 metrics:[
  {k:'待报价询价',v:'3',u:'单',sub:'最近截止 09-17 18:00',st:'y'},
  {k:'待确认订单',v:'2',u:'单',sub:'金额合计 ¥68.5万'},
  {k:'待送货',v:'1',u:'单',sub:'预约 09-19 上午'},
  {k:'待对账结算',v:'2',u:'期',sub:'8月账单待确认',st:'y'}],
 main:{type:'table',title:'我的询价 / 订单',headers:['单号','类型','物料 / 事项','数量','金额(元)','截止 / 状态','操作'],rows:[
  ['XJ-2609-05',tg('o','询价'),'镀锌钢管 DN100','3,000m','—',tg('r','09-17 18:00 截止'),tg('b','去报价')],
  ['XJ-2609-03',tg('o','询价'),'灭火器 MFZ/ABC4','800具','—',tg('y','09-18 18:00 截止'),tg('b','去报价')],
  ['PO-2608-21',tg('b','订单'),'报警设备（点型）','486点','¥389,000',tg('y','待确认'),tg('b','确认订单')],
  ['PO-2608-18',tg('b','订单'),'桥架 200×100','3,200m','¥296,000',tg('o','待送货'),tg('b','送货确认')]]},
 side:{title:'履约提醒 / 结算',tabs:[
  {id:'jx',name:'履约提醒',items:[
   {lamp:'r',t:'报价截止 · 镀锌钢管',d:'剩余 2 天，逾期视为放弃',time:'09-17',acts:[['去报价']]},
   {lamp:'y',t:'送货预约 · 桥架 3,200m',d:'09-19 上午 · XX医院项目',time:'09-19',acts:[['送货确认']]},
   {lamp:'y',t:'对账截止 · 8月账单',d:'09-25 前完成双方确认',time:'09-25'},
   {tag:'新询价',tc:'b',t:'灭火器 800 具询价',d:'已推送至贵司 · 报价期 3 天',time:'今日'}]},
  {id:'js',name:'结算信息',items:[
   {tag:'已付',tc:'g',t:'7月货款 ¥128,600',d:'09-05 已支付 · 电子回单可下载',time:'09-05',acts:[['下载回单']]},
   {tag:'待确认',tc:'o',t:'8月对账单 ¥486,200',d:'6 张订单 · 待贵司确认',time:'进行中',acts:[['去对账']]},
   {tag:'更新',tc:'gray',t:'开票信息已更新',d:'请核实税号与开户行',time:'09-10'}]}]},
 bottom:{title:'对账结算',headers:['账期','订单数','金额(元)','状态','操作'],rows:[
  ['2026-08','6','¥486,200',tg('y','待双方确认'),tg('b','下载对账单')],
  ['2026-07','4','¥128,600',tg('g','已结清'),tg('b','下载回单')],
  ['2026-06','5','¥212,400',tg('g','已结清'),tg('b','下载回单')]]},
 entries:[['file','我的询价'],['clip','我的订单'],['cam','送货收货'],['money','对账结算'],['users','联系采购'],['dl','资料下载']]}
};

/* ============ 合同台账统一数据（C1/C5：数据驱动） ============ */
var CONTRACTS=[
 {id:'HT-2609-18',name:'XX产业园喷淋系统主合同',proj:'XX产业园喷淋系统工程',party:'XX产业园开发有限公司',dir:'销售',type:'主合同',bus:'工程类',amt:386.00,pct:'71.5%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'HT-2609-12',name:'XX国际大厦消防改造合同',proj:'XX国际大厦消防改造',party:'XX置业有限公司',dir:'销售',type:'主合同',bus:'工程类',amt:521.00,pct:'0%',st:'审批中',mode:'自营',ptype:'改造 / 维修'},
 {id:'HT-2608-31',name:'XX医院门诊楼报警系统合同',proj:'XX医院门诊楼报警系统',party:'XX市卫健委机关事务中心',dir:'销售',type:'主合同',bus:'工程类',amt:298.50,pct:'89.4%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'HT-2608-22',name:'XX商业广场防排烟工程合同',proj:'XX商业广场防排烟工程',party:'XX商业运营管理有限公司',dir:'销售',type:'主合同',bus:'工程类',amt:187.60,pct:'96.2%',st:'已结算',mode:'自营',ptype:'新建'},
 {id:'HT-2607-09',name:'XX学校宿舍喷淋改造合同',proj:'XX学校宿舍喷淋改造',party:'XX区教育局',dir:'销售',type:'主合同',bus:'工程类',amt:96.80,pct:'0%',st:'已归档',mode:'自营',ptype:'改造 / 维修'},
 {id:'HT-2606-15',name:'XX商业广场消防增补合同',proj:'XX商业广场防排烟工程',party:'XX商业运营管理有限公司',dir:'销售',type:'补充协议',bus:'内控管理类',amt:42.50,pct:'98.4%',st:'已结算',mode:'自营',ptype:'改造 / 维修'},
 {id:'HT-2605-20',name:'XX产业园二期喷淋合同',proj:'XX产业园喷淋系统工程',party:'XX产业园开发有限公司',dir:'销售',type:'主合同',bus:'工程类',amt:158.00,pct:'85.4%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'HT-2604-11',name:'XX学校宿舍喷淋补充合同',proj:'XX学校宿舍喷淋改造',party:'XX区教育局',dir:'销售',type:'补充协议',bus:'内控管理类',amt:18.60,pct:'0%',st:'已归档',mode:'自营',ptype:'改造 / 维修'},
 {id:'ZC-2609-11',name:'风管安装分包合同',proj:'XX国际大厦消防改造',party:'XX机电安装工程处',dir:'采购',type:'分包',bus:'工程类',amt:45.00,pct:'30.0%',st:'履约中',mode:'自营',ptype:'改造 / 维修'},
 {id:'ZC-2609-08',name:'喷淋主材采购合同',proj:'XX产业园喷淋系统工程',party:'华信管业',dir:'采购',type:'材料',bus:'工程类',amt:96.40,pct:'50.0%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'ZC-2608-19',name:'报警设备供货合同',proj:'XX医院门诊楼报警系统',party:'安泰电子',dir:'采购',type:'材料',bus:'软件平台类',amt:68.90,pct:'104.6%',st:'超结算付款',mode:'自营',ptype:'新建'},
 {id:'ZC-2608-01',name:'水系统劳务合同',proj:'XX医院门诊楼报警系统',party:'XX劳务有限公司',dir:'采购',type:'劳务',bus:'工程类',amt:38.50,pct:'96.6%',st:'已结算',mode:'自营',ptype:'新建'},
 {id:'ZC-2607-18',name:'风机设备采购合同',proj:'XX商业广场防排烟工程',party:'昆明防火',dir:'采购',type:'材料',bus:'工程类',amt:28.40,pct:'42.3%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'ZC-2608-06',name:'劳务清工合同（水系统）',proj:'XX商业广场防排烟工程',party:'XX劳务有限公司',dir:'采购',type:'劳务',bus:'工程类',amt:52.00,pct:'95.8%',st:'已结算',mode:'自营',ptype:'新建'},
 {id:'ZC-2607-09',name:'线缆采购合同',proj:'XX产业园喷淋系统工程',party:'华信管业',dir:'采购',type:'材料',bus:'工程类',amt:22.60,pct:'97.8%',st:'已结算',mode:'自营',ptype:'新建'},
 {id:'ZC-2606-25',name:'桥架采购合同',proj:'XX国际大厦消防改造',party:'金桥物资',dir:'采购',type:'材料',bus:'工程类',amt:18.20,pct:'100%',st:'已归档',mode:'自营',ptype:'改造 / 维修'},
 {id:'ZC-2606-12',name:'机械租赁合同',proj:'XX商业广场防排烟工程',party:'XX机械租赁',dir:'采购',type:'机械',bus:'工程类',amt:15.80,pct:'41.1%',st:'履约中',mode:'自营',ptype:'新建'},
 {id:'ZC-2605-30',name:'智慧消防平台软件合同',proj:'XX产业园喷淋系统工程',party:'诺盾物联',dir:'采购',type:'软硬件',bus:'软件平台类',amt:36.00,pct:'98.3%',st:'已结算',mode:'自营',ptype:'新建'},
 {id:'WK-2609-01',name:'消防报警设备框架合同',proj:'XX产业园 / 多项目',party:'海湾代理',dir:'框架',type:'框架',bus:'平台配置类',amt:0,pct:'—',st:'履约中 · 已下单 3 次',mode:'自营',ptype:'框架'},
 {id:'WB-2609-02',name:'XX商城年度消防维保合同',proj:'XX商城维保',party:'XX商城物业',dir:'维保',type:'维保',bus:'维保类',amt:36.00,pct:'—',st:'保内 · 昆明组',mode:'自营',ptype:'维保'},
 {id:'WB-2609-01',name:'XX医院维保+检测服务合同',proj:'XX医院维保',party:'XX市卫健委',dir:'维保',type:'维保 / 检测',bus:'维保 / 检测',amt:58.00,pct:'—',st:'保内 · 昆明组',mode:'自营',ptype:'维保'},
 {id:'WB-2608-09',name:'XX酒店消防维保（保外）',proj:'XX酒店消防维保',party:'XX酒店物业',dir:'维保',type:'维保',bus:'维保类',amt:22.00,pct:'—',st:'保外 · 文山组',mode:'自营',ptype:'维保'},
 {id:'WB-2608-11',name:'XX学校消防维保（平台配置）',proj:'XX学校维保',party:'XX区教育局',dir:'维保',type:'维保',bus:'平台配置类',amt:30.00,pct:'—',st:'保内 · 楚雄组',mode:'自营',ptype:'维保'},
 {id:'LH-2608-01',name:'XX物流园联营合同（走款）',proj:'XX物流园消防工程',party:'XX建筑劳务公司',dir:'联营',type:'联营',bus:'工程类',amt:200.00,pct:'—',st:'联营 · 资金监管',mode:'联营',ptype:'新建'},
 {id:'LH-2608-02',name:'XX酒店改造联营合同',proj:'XX酒店消防改造',party:'XX安装工程公司',dir:'联营',type:'联营',bus:'工程类',amt:150.00,pct:'—',st:'联营 · 资金监管',mode:'联营',ptype:'改造 / 维修'}
];

/* ============ 结算与核算数据（合同看板 / 结算页共享） ============ */
var SETTLE_XS=[['XS-2609-18','XX产业园喷淋系统','386.00','198.40','154.40','88.50','44.00','9.3%（5%）'],['XS-2609-15','XX医院二期消防','1,205.60','640.20','428.60','320.00','211.60','—'],['XS-2609-11','XX国际大厦','1,860.00','1,102.80','980.20','760.00','122.60','已到期待退']];

/* ============ 列表页基础数据 ============ */
var PP=['XX国际大厦消防改造','XX产业园喷淋系统工程','XX医院门诊楼报警系统','XX学校宿舍喷淋改造','XX商业广场防排烟工程','XX数据中心气体灭火','XX物流园消防工程','XX政务中心消防工程'];
var PL=['王强','李敏','赵磊','刘洋','孙倩','吴斌','郑洁','何军'];
var PC=['XX医院','XX产业园','XX商业广场','XX学校','XX物流园','XX政务中心','XX酒店','XX数据中心'];
var PM=['镀锌钢管 DN100','喷淋头 ZSTX15','点型烟感 JTY-GD','桥架 200×100','防火卷帘(双轨)','水带 80型','灭火器 MFZ/ABC4','电缆 NH-RVS'];
var PD=[['YG-2F-012','烟感探测器','2F 东走廊','3.2 %obs/m','r','火警'],['ZJ-B2-01','消防主机','2F 消控室','运行正常','g','在线'],['XSF-B1-01','水压变送器','B1 泵房','0.08 MPa','r','低限'],['DQ-3F-03','温度传感器','3F 配电房','68 ℃','y','注意'],['QT-3F-01','气灭控制器','3F 机房','备电正常','g','在线'],['SP-3F-08','网络摄像头','3F 西北角','—','gray','离线'],['YJ-2F-01','应急照明箱','2F 走廊','电池 92%','g','在线'],['SH-1F-02','消火栓','1F 东侧','0.32 MPa','g','在线']];
var DTS=['09-16 13:42','09-16 11:26','09-16 10:15','09-15 17:30','09-15 15:00','09-14 16:20','09-14 09:05','09-13 14:11'];
function pick(a,i){return a[i%a.length]}
var F_TIME=['时间',['全部','今天','本周','本月','本季度']];
var F_OWN=['负责人',['全部','王强','李敏','赵磊','刘洋','孙倩','吴斌']];
var PAGES={
'cost.合同看板 / 风险中心':{custom:'contractdash',pills:[],filters:[]},
'cost.销售合同 / 收入合同':{detail:'contract',pills:[['全部',8],['我发起的',3],['待我审批',1],['履约中',5],['即将到期 / 质保金',1],['风险合同',1],['已归档',1]],filters:[['项目',['全部','XX产业园喷淋系统工程','XX国际大厦消防改造','XX医院门诊楼报警系统']],['合同类型',['全部','销售合同','材料合同','劳务合同','分包合同','机械合同','软硬件合同']],['是否超付',['全部','是','否']],['发票异常',['全部','有','无']],F_TIME],
 cols:['合同编号','合同名称','所属项目','对方单位','合同金额(万)','累计结算(万)','累计付款(万)','付款比例','风险标签','状态','操作'],
 rows:[
 ['HT-2609-18','XX产业园喷淋系统主合同','XX产业园喷淋系统工程','XX产业园开发有限公司','386.00','120.60','86.20','71.5%',tg('y','付款接近节点'),tg('b','履约中'),HTOPS],
 ['HT-2609-12','XX国际大厦消防改造合同','XX国际大厦消防改造','XX置业有限公司','521.00','—','—','0%',tg('gray','无'),tg('o','审批中 · 可催办/撤回'),HTOPS],
 ['HT-2608-31','XX医院门诊楼报警系统合同','XX医院门诊楼报警系统','XX市卫健委机关事务中心','298.50','221.30','198.00','89.4%',tg('r','超付预警'),tg('b','履约中'),HTOPS],
 ['HT-2608-22','XX商业广场防排烟工程合同','XX商业广场防排烟工程','XX商业运营管理有限公司','187.60','187.60','180.50','96.2%',tg('r','缺票 ¥18.2万'),tg('g','已结算'),HTOPS],
 ['HT-2607-09','XX学校宿舍喷淋改造合同','XX学校宿舍喷淋改造','XX区教育局','96.80','—','—','0%',tg('gray','无'),tg('gray','已归档 · 只读'),HTOPS],  ['HT-2606-15','XX商业广场消防增补合同','XX商业广场防排烟工程','XX商业运营管理有限公司','42.50','42.50','41.80','98.4%',tg('gray','无'),tg('g','已结算'),HTOPS],  ['HT-2605-20','XX产业园二期喷淋合同','XX产业园喷淋系统工程','XX产业园开发有限公司','158.00','96.40','82.30','85.4%',tg('y','付款接近节点'),tg('b','履约中'),HTOPS],  ['HT-2604-11','XX学校宿舍喷淋补充合同','XX学校宿舍喷淋改造','XX区教育局','18.60','—','—','0%',tg('gray','无'),tg('gray','已归档 · 只读'),HTOPS]]},
'cost.采购合同 / 支出合同':{detail:'contract',pills:[['全部',10],['待我审批',2],['履约中',4],['风险合同',1],['已结算',2],['已归档',1]],filters:[['项目',['全部','XX产业园喷淋系统工程','XX医院门诊楼报警系统']],['支出类型',['全部','材料合同','劳务合同','分包合同','机械合同','软硬件合同']],['超结算付款',['全部','是','否']],F_TIME],
 cols:['合同编号','合同名称','所属项目','分包 / 供应商','合同金额(万)','累计结算(万)','累计付款(万)','付款比例','风险标签','状态','操作'],
 rows:[
 ['ZC-2609-11','风管安装分包合同','XX国际大厦消防改造','XX机电安装工程处','45.00','18.60','13.50','30.0%',tg('gray','无'),tg('b','履约中'),HTOPS],
 ['ZC-2609-08','喷淋主材采购合同','XX产业园喷淋系统工程','华信管业','96.40','52.80','48.20','50.0%',tg('gray','无'),tg('b','履约中'),HTOPS],
 ['ZC-2608-19','报警设备供货合同','XX医院门诊楼报警系统','安泰电子','68.90','68.90','72.10','104.6%',tg('r','超结算付款'),tg('o','待处理'),HTOPS],
 ['ZC-2608-06','劳务清工合同（水系统）','XX商业广场防排烟工程','XX劳务有限公司','52.00','52.00','49.80','95.8%',tg('y','班组扣款待确认'),tg('g','已结算'),HTOPS],  ['ZC-2608-01','水系统劳务合同','XX医院门诊楼报警系统','XX劳务有限公司','38.50','38.50','37.20','96.6%',tg('gray','无'),tg('g','已结算'),HTOPS],  ['ZC-2607-18','风机设备采购合同','XX商业广场防排烟工程','昆明防火','28.40','15.60','12.00','42.3%',tg('gray','无'),tg('b','履约中'),HTOPS],  ['ZC-2607-09','线缆采购合同','XX产业园喷淋系统工程','华信管业','22.60','22.60','22.10','97.8%',tg('gray','无'),tg('g','已结算'),HTOPS],  ['ZC-2606-25','桥架采购合同','XX国际大厦消防改造','金桥物资','18.20','18.20','18.20','100%',tg('gray','无'),tg('gray','已归档 · 只读'),HTOPS],  ['ZC-2606-12','机械租赁合同','XX商业广场防排烟工程','XX机械租赁','15.80','8.40','6.50','41.1%',tg('gray','无'),tg('b','履约中'),HTOPS],  ['ZC-2605-30','智慧消防平台软件合同','XX产业园喷淋系统工程','诺盾物联','36.00','36.00','35.40','98.3%',tg('gray','无'),tg('g','已结算'),HTOPS]]},
'cost.框架合同与子订单':{custom:'framecontract',pills:[],filters:[]},
'bid.报价单列表':{custom:'quotelist',detail:'quote',pills:[],filters:[],filters:[['客户 / 项目',['全部','XX医院二期','XX数据中心','XX体育馆']],['报价类型',['全部','新建项目报价','改造 / 维修报价','维保报价','智慧消防 / 数字孪生']],['毛利率区间',['全部','≥20%','10%~20%','<12%（低于预警线）']],F_TIME],
 cols:['报价单号','客户 / 项目 / 商机','报价类型','板块','报价金额(万)','成本测算(万)','毛利 / 毛利率','参考价版本','状态','版本','更新时间','操作'],
 rows:[
 ['BJ-2609-05','XX医院二期消防工程','新建项目报价','消防水 / 电系统','1,205.60','938.40',tg('g','22.0%'),'V2026.09',tg('b','待审批'),'<span class="link-btn" data-cver="1">V3</span>','09-16',QOPS],
 ['BJ-2609-04','XX数据中心消防系统','智慧消防 / 数字孪生','硬件 + 平台软件 + 数字孪生','2,318.00','1,762.00',tg('g','24.0%'),'V2026.09',tg('b','待审批'),'<span class="link-btn" data-cver="1">V2</span>','09-15',QOPS],
 ['BJ-2609-02','XX厂房改造维修','改造 / 维修报价','报警系统','86.40','70.10',tg('g','18.9%'),'V2026.08',tg('g','已通过'),'<span class="link-btn" data-cver="1">V1</span>','09-12',QOPS],
 ['BJ-2608-21','XX体育馆消防专项','新建项目报价','防排烟系统','982.00','815.30',tg('y','17.0%'),'V2026.08',tg('o','未中标 · 原因已归档'),'<span class="link-btn" data-cver="1">V4</span>','08-28',QOPS],
 ['BJ-2608-15','XX政务中心消防工程','新建项目报价','全专业','1,560.00','1,201.80',tg('g','23.0%'),'V2026.08',tg('g','已中标 · 已转合同'),'<span class="link-btn" data-cver="1">V2</span>','08-20',QOPS]]},
'bid.报价工作台':{custom:'workbench',pills:[],filters:[]},
'bid.报价分析看板':{custom:'quotedash',pills:[],filters:[]},
'bid.报价版本 / 多版对比':{custom:'quotever',pills:[],filters:[]},
'bid.勘察单 / 改造报价':{pills:[['全部',12],['待勘察',2],['勘察完成',8],['已生成报价',7]],filters:[['勘察系统',['全部','消防电系统','消防水系统','防排烟系统','照明 / 应急']],F_OWN,F_TIME],
 cols:['勘察单号','项目 / 客户','勘察系统','现场问题摘要','照片','勘察人','勘察日期','状态','操作'],
 rows:[
 ['KC-2609-06','XX厂房改造','消防电系统','3F 主机老化、12 只烟感失联、线路老化','照片 8 张','张伟','09-15',tg('b','待报价'),tg('b','生成报价')],
 ['KC-2609-05','XX厂房改造','消防水系统','管网锈蚀渗漏 2 处、末端试水压力不足','照片 6 张','张伟','09-15',tg('b','待报价'),tg('b','生成报价')],
 ['KC-2609-03','XX酒店改造','防排烟系统','2 台排烟风机故障、防火阀卡滞 5 处','照片 5 张','李强','09-12',tg('g','已生成报价'),tg('gray','查看')],
 ['KC-2609-01','XX学校宿舍','照明 / 应急','应急灯损坏 23 套、疏散指示缺失 6 处','照片 4 张','王芳','09-10',tg('g','已生成报价'),tg('gray','查看')]]},
'bid.企业资质证书':{detail:'cert',pills:[['全部',36],['有效',28],['60 / 90 天内到期',5],['已过期 / 30 天内',2],['借出中',3]],filters:[['证书分类',['全部','消防资质','安全生产许可','营业执照','体系认证']],['责任部门',['全部','商务部','工程交付部','维保服务中心','技术部']],['有效期区间',['全部','30 天内','90 天内','180 天内','1 年内']]],
 cols:['证书名称','证书编号','发证机关','有效期至','状态倒计时','存放位置','责任人','更新时间','操作'],
 rows:[
 ['消防设施维护保养检测资质（一级）','XFXW-1-2609-088','省消防救援总队','2026-12-12',dt('y')+' 87 天','总部档案室 A2','刘畅','09-15',CERTOPS],
 ['安全生产许可证','（鲁）JZ 安许 2023-018','省住建厅','2026-10-05',dt('r')+' 19 天','总部档案室 A1','王志明','09-14',CERTOPS],
 ['质量 / 环境 / 职业健康三体系认证','TX-3C-2024-2210','中鉴认证','2027-06-30',dt('g')+' 287 天','电子档案','何军','09-10',CERTOPS],
 ['营业执照（统一社会信用）','91370XXX','市市场监督管理局','2029-01-01',dt('g')+' 长期','电子档案','刘畅','09-01',CERTOPS]]},
'bid.人员证书':{detail:'cert',pills:[['全部',142],['有效',121],['60 / 90 天内到期',14],['已过期 / 30 天内',3],['借出中',6]],filters:[['资格类型',['全部','建造师','消防工程师','造价师','安全员','消防设施操作员','特种作业证']],['是否可投标',['全部','可用','占用中','不可用']],['有效期区间',['全部','30 天内','90 天内','180 天内','1 年内']]],
 cols:['证书名称','持证人','证书编号','发证机关','有效期至','状态倒计时','投标占用','责任人','操作'],
 rows:[
 ['机电建造师（二级）','张伟','建造师 2609 8877','省住建厅','2026-09-30',dt('r')+' 14 天',tg('gray','空闲'),'工程交付部',CERTOPS],
 ['注册消防工程师','吴斌','XFGC 2019 1108','应急管理部','2027-03-18',dt('g')+' 183 天',tg('b','XX体育馆投标占用'),'技术部',CERTOPS],
 ['消防设施操作员（中级）','李敏','XFCZ 2024 0512','消防行业职业技能鉴定中心','2026-12-01',dt('y')+' 76 天',tg('gray','空闲'),'工程交付部',CERTOPS],
 ['低压电工特种作业证','周凯','T6201 2608 3312','应急管理局','2026-08-30',dt('r')+' 已过期 17 天',tg('r','不可用 · 已停岗'),'维保服务中心',CERTOPS]]},
'bid.证书借还与归还':{pills:[['全部',18],['借出中',6],['已归还',11],['逾期未还',1]],filters:[['借出类型',['全部','投标使用','客户报验','银行 / 资质审查']],F_OWN],
 cols:['证书','借出人','用途','借出日期','约定归还','归还日期','状态','操作'],
 rows:[
 ['注册消防工程师（吴斌）','刘畅','XX体育馆投标','09-14','09-25','—',tg('b','借出中'),tg('b','催还')],
 ['安许证（原件）','孙倩','客户资质报验','09-10','09-16','—',tg('b','借出中'),tg('b','催还')],
 ['营业执照（副本）','周凯','银行保函办理','08-28','09-05','09-04',tg('g','已归还'),tg('gray','查看')],
 ['建造师证 B 证（张伟）','王悦','XX医院投标','09-02','09-12','—',tg('r','逾期 4 天'),tg('o','紧急催还')]]},
'bid.到期提醒与预警':{custom:'certdash',pills:[],filters:[]},
'bid.投标资质库 / 证书包':{custom:'certpack',pills:[],filters:[]},
'doc.电子签':{custom:'esig',pills:[],filters:[]},
'buy.材料库 / 材料主数据':{custom:'cattable',pills:[],filters:[]},
'buy.材料申请 / 提料':{custom:'reqcart',pills:[],filters:[]},
'buy.询比价 / 二维码询价':{custom:'qrinquiry',pills:[],filters:[]},
'buy.入库 / AI 拍照入库':{custom:'ocrin',pills:[],filters:[]},
'buy.采购入库':{custom:'inbound',pills:[],filters:[]},
'buy.出库 / 领用 / 归还':{pills:[['全部',86],['领用出库',42],['归还',18],['报废',3],['调拨',12],['盘点调整',11]],filters:[['仓库',['全部','公司主仓 A','主仓 B','项目现场仓','维保备件库']],['事务类型',['全部','采购入库','领用出库','归还','报废','调拨','盘点调整']],['关联项目',['全部','XX产业园','XX医院','XX大厦维保']],F_TIME],
 cols:['事务单号','类型','仓库','材料 / 批次','数量','关联项目 / 班组 / 工单','经手人','时间','状态'],
 rows:[
 ['CK-2609-31',tg('b','领用出库'),'主仓 A','灭火器 MFZ/ABC4（PC-2609-02）','40 具','XX大厦维保 · 2 班组','李仓管','09-16 13:05',tg('g','已完成')],
 ['CK-2609-29',tg('b','领用出库'),'项目现场仓','水带 80型（PC-2609-01）','24 盘','XX医院巡检 · 工单 WX-2609-091','李仓管','09-16 10:22',tg('g','已完成')],
 ['CK-2609-27',tg('g','归还'),'主仓 A','手动报警按钮（PC-2608-18）','6 只','XX学校 · 竣工余料归还','王仓管','09-15 16:40',tg('g','已完成')],
 ['CK-2609-24',tg('o','调拨'),'主仓 B → 现场仓','电缆 NH-RVS 800m','800 m','XX产业园','赵仓管','09-15 09:10',tg('g','已完成')],
 ['CK-2609-21',tg('r','报废'),'主仓 A','水带 80型 4 盘（老化）','4 盘','报废审批中 · 扣款建议 ¥552','王仓管','09-14 15:00',tg('o','审批中')]]},
'buy.量价双控与成本对比':{custom:'liangjia',pills:[],filters:[]},
'buy.未关联数据 / 先发生后关联':{pills:[['全部',6],['超期未关联',2],['本月新增',3],['已销项',15]],filters:[['单据类型',['全部','采购入库','付款单','发票']],['超期天数',['全部','≤7 天','8~30 天','>30 天']],F_TIME],
 cols:['单据类型','单号','供应商','金额(万)','发生日期','超期天数','状态','操作'],
 rows:[
 [tg('g','采购入库'),'RK-2608-11','华信管业','12.60','08-24','23',tg('r','超期未关联'),tg('b','关联到成本项')],
 [tg('o','付款单'),'FK-2608-19','金桥物资','8.20','08-18','29',tg('r','超期未关联'),tg('b','关联到成本项')],
 [tg('g','采购入库'),'RK-2609-14','安泰电子','5.80','09-08','8',tg('y','待关联'),tg('b','关联到成本项')],
 [tg('o','发票'),'FP-2609-22','XX劳务公司','3.40','09-12','4',tg('y','待关联'),tg('b','关联到成本项')]]},
'cost.价格库':{pills:[['全部',1268],['本月更新',32],['待审核',6],['已停用',24]],filters:[['类别',['全部','管材','线缆','设备','辅材','人工']],['价格来源',['全部','历史采购','询比价','信息价','合同沉淀','入库沉淀']],F_TIME],
 cols:['编码','物料名称','规格型号','单位','参考价(元)','成本价','市场价 / 上次成交','来源','更新时间'],rows:[
 ['WL-0101','镀锌钢管','DN100','m','168.0','162.0','176.0 / 165.0',tg('g','历史采购'),'09-15'],
 ['WL-0232','喷淋头','ZSTX15 68℃','只','30.0','28.0','33.0 / 29.5',tg('b','询比价'),'09-12'],
 ['WL-0455','点型烟感','JTY-GD-3000','只','86.0','82.0','95.0 / 88.0',tg('b','询比价'),'09-10'],
 ['WL-0512','电缆桥架','200×100 热镀锌','m','90.0','86.0','98.0 / 91.0',tg('g','历史采购'),'09-08'],
 ['WL-0688','防火卷帘','双轨双帘 4㎡','㎡','620.0','598.0','660.0 / 612.0',tg('o','信息价'),'09-05'],
 ['WL-0721','消防水带','80型 25m','盘','138.0','132.0','145.0 / 136.0',tg('g','历史采购'),'09-02'],
 ['WL-0803','灭火器','MFZ/ABC4','具','38.0','36.0','42.0 / 37.5',tg('b','询比价'),'08-28'],
 ['WL-0917','耐火电缆','NH-RVS 2×1.5','m','3.2','3.0','3.6 / 3.3',tg('g','历史采购'),'08-25']]},
'wm.调度工单':{pills:[['全部',42],['待派工',8],['处理中',15],['待审核',5],['今日完成',14]],filters:[['紧急度',['全部','紧急','高','普通']],['工单类型',['全部','告警工单','报修工单','巡检计划']],F_TIME],
 cols:['工单号','标题','项目','类型','紧急度','工程师','预约时间','状态','操作'],rows:[
 ['GD-2609-118','消防主机离线处置','XX医院',tg('r','告警'),dt('r')+' 紧急','张伟','今日 11:00',tg('b','处理中'),tg('b','详情')],
 ['GD-2609-121','防火门闭门器更换','XX商城',tg('b','报修'),dt('y')+' 高','王芳','今日 18:00 前',tg('y','待派工'),tg('b','派工')],
 ['GD-2609-116','月度巡检 · A座','XX产业园',tg('g','巡检'),dt('g')+' 普通','李强','今日 16:00',tg('b','处理中'),tg('b','详情')],
 ['GD-2609-109','手报误响确认','XX大厦',tg('b','报修'),dt('g')+' 普通','待指派','今日 20:00 前',tg('y','待派工'),tg('b','派工')],
 ['GD-2609-104','排烟阀维修','XX产业园',tg('b','报修'),dt('y')+' 高','张伟','09-15',tg('o','待审核'),tg('b','审核')],
 ['GD-2609-097','应急灯更换 12 只','XX学校',tg('b','报修'),dt('g')+' 普通','王芳','09-17',tg('b','处理中'),tg('b','详情')],
 ['GD-2609-091','主机复位','XX政务中心',tg('r','告警'),dt('r')+' 紧急','张伟','09-16 09:00',tg('g','已完成'),tg('b','详情')],
 ['GD-2609-088','季度保养','XX大厦',tg('g','巡检'),dt('g')+' 普通','赵磊','09-15',tg('o','待审核'),tg('b','审核')]]},
'iot.设备台账':{pills:[['全部',1316],['在线',1286],['告警',7],['离线',23]],filters:[['设备类型',['全部','火灾探测器','消防主机','水压/喷淋','电气火灾','视频','应急照明']],['位置',['全部','F1','F2','F3','B1']],['状态',['全部','在线','告警','离线']]],
 cols:['设备编码','设备名称','类型','位置','实时值','通讯','状态','操作'],rows:PD.map(function(d){return [d[0],d[1],tg('b','感知设备'),d[2],d[3],d[4]==='gray'?'离线 2 天':'正常',tg(d[4],d[5]),tg('b','详情')]})},
'buy.库存':{pills:[['全部',86],['正常',72],['低于安全库存',9],['零库存',5]],filters:[['类别',['全部','灭火器材','管件','探测器','警示器材']],['仓库',['全部','公司主仓 A','主仓 B','项目现场仓','维保备件库']]],
 cols:['物料编码','物料名称','规格','单位','当前库存','安全库存','可用状态','仓库','建议'],rows:[
 ['WL-0803','灭火器','MFZ/ABC4','具','120','300',tg('r','低于安全'),tg('b','主仓 A'),tg('b','生成采购申请')],
 ['WL-0455','点型烟感','JTY-GD-3000','只','420','300',tg('g','正常'),tg('b','主仓 A'),'—'],
 ['WL-0721','消防水带','80型 25m','盘','96','150',tg('y','接近下限'),tg('b','主仓 A'),tg('b','调拨建议')],
 ['WL-0933','手动报警按钮','J-SAP-M','只','45','100',tg('r','低于安全'),tg('b','主仓 B'),tg('b','生成采购申请')],
 ['WL-0512','电缆桥架','200×100','m','1,860','800',tg('g','正常'),tg('b','主仓 B'),'—'],
 ['WL-0101','镀锌钢管','DN100','m','3,240','1,000',tg('g','正常'),tg('b','主仓 B'),'—'],
 ['WL-1024','应急照明灯','双头应急','套','210','300',tg('y','接近下限'),tg('b','主仓 A'),tg('b','生成采购申请')],
 ['WL-1156','风阀执行器','24V','台','18','30',tg('r','低于安全'),tg('b','主仓 B'),tg('b','生成采购申请')]]},
'sys.组织人员':{pills:[['全部',286],['在职',271],['待入职',6],['已停用',9]],filters:[['部门',['全部','工程交付部','维保服务中心','商务部','采购部','职能线']],['角色',['全部','管理员','项目经理','工程师','仓管']],['状态',['全部','正常','停用']]],
 cols:['姓名','账号','部门','角色','手机号','最近登录','状态','操作'],rows:[
 ['王志明','wangzm','工程交付部',tg('b','管理员'),'138****2211','09-16 08:30',tg('g','正常'),tg('b','编辑')],
 ['赵磊','zhaolei','维保服务中心',tg('b','项目经理'),'139****3322','09-16 09:12',tg('g','正常'),tg('b','编辑')],
 ['刘畅','liuchang','商务部',tg('gray','商务'),'137****4455','09-16 11:26',tg('g','正常'),tg('b','编辑')],
 ['陈晨','chenchen','采购部',tg('gray','采购员'),'136****6677','09-15 17:40',tg('g','正常'),tg('b','编辑')],
 ['张伟','zhangwei','维保服务中心',tg('gray','工程师'),'135****8899','09-16 07:55',tg('g','正常'),tg('b','编辑')],
 ['李强','liqiang','维保服务中心',tg('gray','工程师'),'134****1122','09-16 08:10',tg('g','正常'),tg('b','编辑')],
 ['孙倩','sunqian','工程交付部',tg('b','项目经理'),'133****3344','09-12 15:22',tg('y','7天未登录'),tg('b','编辑')],
 ['周凯','zhoukai','工程交付部',tg('gray','施工员'),'132****5566','—',tg('gray','已停用'),tg('b','编辑')]]},
'oa.待办中心':{pills:[['全部',18],['待我审批',6],['待我阅读',4],['我发起的',5],['已办结',3]],filters:[['类型',['全部','合同','付款','报销','用印','人事']],['发起人',['全部','刘畅','李敏','周凯','赵磊']],F_TIME],
 cols:['事项','类型','提交人','当前节点','到达时间','超时','操作'],rows:[
 ['付款审批 · XX产业园第3期 ¥86万',tg('o','付款'),'李敏','财务复核','09-16 08:47','—',OKNO],
 ['合同会签 · XX政务中心补充协议',tg('b','合同'),'刘畅','会签 2/3','09-16 09:12','—',OKNO],
 ['差旅报销 · 苏州出差 ¥0.86万',tg('gray','报销'),'周凯','部门审批','09-15 17:30','—',OKNO],
 ['用章申请 · 检测委托函',tg('o','用印'),'赵磊','印章管理','09-15 15:00',tg('r','超时 4h'),OKNO],
 ['转正申请 · 陈晨',tg('b','人事'),'人事部','HR审批','09-14 11:00','—',OKNO],
 ['付款 · 分包风管 ¥45万',tg('o','付款'),'孙倩','总经理审批','09-15 10:20','—',tg('gray','等待上级')],
 ['制度学习 · 差旅办法 2026',tg('gray','阅读'),'行政部','待阅读','09-12 09:00','—',tg('b','去阅读')],
 ['进度申报 · XX产业园 48%',tg('g','进度'),'李敏','我发起 · 审批中','09-15 14:00','—',tg('gray','审批中')]]},
'wm.报修工单':{pills:[['全部',26],['待受理',4],['处理中',6],['待评价',2],['已完成',14]],filters:[['来源',['全部','业主报修','巡检发现','IoT告警']],['项目',['全部','XX医院','XX商城','XX大厦','XX学校']],F_TIME],
 cols:['工单号','报修内容','来源','项目','工程师','预约/完成','状态'],rows:[
 ['BX-2609-018','防火门闭门器损坏','业主报修','XX商城','王芳','预约 09-17 09:00',tg('b','处理中')],
 ['BX-2609-012','手报按钮误响','IoT联动','XX大厦','张伟','09-15 16:30',tg('g','已完成')],
 ['BX-2609-015','卫生间渗水至消防管井','业主报修','XX学校','待指派','待预约',tg('y','待受理')],
 ['BX-2609-003','喷淋头渗水','巡检发现','XX产业园','李强','09-08 14:20',tg('g','已完成')],
 ['BX-2609-009','声光报警器不响','巡检发现','XX医院','王芳','09-12 10:00',tg('g','已完成')],
 ['BX-2609-021','卷帘门异响','业主报修','XX商城','待指派','待预约',tg('y','待受理')],
 ['BX-2609-016','末端试水压力不足','IoT告警','XX大厦','张伟','09-14 15:00',tg('b','处理中')],
 ['BX-2609-005','应急灯故障','巡检发现','XX学校','李强','09-10 11:30',tg('g','已完成')]]}
};
PAGES['bid.价格库 / 参考价']=PAGES['cost.价格库'];
PAGES['buy.价格库']={custom:'pricelib',pills:[],filters:[]};
PAGES['buy.库存台账与预警']=PAGES['buy.库存'];
/* 菜单重构后新增菜单名 → 复用现有页面 */
PAGES['bid.现场勘察记录']=PAGES['bid.勘察单 / 改造报价'];
PAGES['bid.报价编制工作台']=PAGES['bid.报价工作台'];
PAGES['bid.报价单列表 / 打印']={custom:'quotelist',pills:[],filters:[]};
PAGES['bid.价格库 / 内部定额']=PAGES['bid.价格库 / 参考价'];
PAGES['bid.投标材料包 / 业绩库']=PAGES['bid.投标资质库 / 证书包'];
PAGES['bid.证书到期提醒']=PAGES['bid.到期提醒与预警'];
PAGES['wm.保内项目']={custom:'wmproj',pills:[],filters:[]};
PAGES['wm.保外项目']={custom:'wmproj',pills:[],filters:[]};
PAGES['wm.区域 / 线路分组']={custom:'wmroute',pills:[],filters:[]};
PAGES['wm.续签商机']={custom:'wmrenew',pills:[],filters:[]};
PAGES['wm.维保计划']={custom:'wmplan',pills:[],filters:[]};
PAGES['wm.巡检线路计划']={custom:'wmrouteplan',pills:[],filters:[]};
PAGES['wm.排班值班']={custom:'wmshift',pills:[],filters:[]};
PAGES['wm.值班日志']={custom:'wmlog',pills:[],filters:[]};
PAGES['wm.工单池']={custom:'wmpool',pills:[],filters:[]};
PAGES['wm.派工单']={custom:'wmdispatch',pills:[],filters:[]};
PAGES['wm.报修工单闭环']={custom:'wmflow',pills:[],filters:[]};
PAGES['wm.IoT 告警转工单']={custom:'wmio',pills:[],filters:[]};
PAGES['wm.维修订单 / 费用确收']={custom:'wmrepair',pills:[],filters:[]};
PAGES['wm.联动开票收款']={custom:'wminvoice',pills:[],filters:[]};
PAGES['wm.业主满意度二维码']={custom:'wmsat',pills:[],filters:[]};
PAGES['wm.维保领用 / 归还']={custom:'wmparts',pills:[],filters:[]};
PAGES['wm.备件库存']={custom:'wmstock',pills:[],filters:[]};
PAGES['buy.供应商档案']={custom:'suparch',pills:[],filters:[]};
PAGES['buy.供应商评级']={custom:'suplevel',pills:[],filters:[]};
PAGES['buy.黑名单']={custom:'supblack',pills:[],filters:[]};
PAGES['cost.主合同（对上）']=PAGES['cost.销售合同 / 收入合同']; /* 历史菜单名兼容别名（PRD V1.1 起统一为销售 / 采购） */
PAGES['cost.支出合同（对下）']=PAGES['cost.采购合同 / 支出合同'];
PAGES['cost.框架合同 / 子订单']=PAGES['cost.框架合同与子订单'];
PAGES['cost.履约与发货签收']={custom:'fhsign',pills:[],filters:[]};
PAGES['cost.合同结算与核算']={custom:'settlecalc',pills:[],filters:[]};
PAGES['cost.先发生后关联 / 未关联数据']=PAGES['buy.未关联数据 / 先发生后关联'];
PAGES['buy.材料主数据列表']=PAGES['buy.材料库 / 材料主数据'];
PAGES['buy.询价单 / 二维码']=PAGES['buy.询比价 / 二维码询价'];
PAGES['buy.AI 拍照入库']=PAGES['buy.入库 / AI 拍照入库'];
PAGES['buy.出库 / 领用']=PAGES['buy.出库 / 领用 / 归还'];
PAGES['buy.归还 / 报废']=PAGES['buy.出库 / 领用 / 归还'];
PAGES['buy.库存台账']=PAGES['buy.库存台账与预警'];
PAGES['buy.库存预警']=PAGES['buy.库存台账与预警'];
PAGES['buy.量价双控六行对比']=PAGES['buy.量价双控与成本对比'];
PAGES['edu.人员证书（联动）']=PAGES['bid.人员证书'];
PAGES['edu.价格库']=PAGES['cost.价格库'];
/* 售前全链路定制页面 */
PAGES['bid.客户档案']={custom:'client',pills:[],filters:[]};
PAGES['bid.联系人 / 区域']={custom:'contact',pills:[],filters:[]};
PAGES['bid.跟进记录 / 拜访总结']={custom:'follow',pills:[],filters:[]};
PAGES['bid.商机 / 销售漏斗']={custom:'funnel',pills:[],filters:[]};
PAGES['bid.商机阶段推进']={custom:'oppstage',pills:[],filters:[]};
PAGES['bid.销售指标']={custom:'sale',pills:[],filters:[]};
PAGES['bid.投标登记']={custom:'bidreg',pills:[],filters:[]};
PAGES['bid.报名 / 保证金 / 节点看板']={custom:'bidnode',pills:[],filters:[]};
PAGES['bid.标书协作']={custom:'bidcollab',pills:[],filters:[]};
PAGES['bid.中标 / 未中标']={custom:'bidresult',pills:[],filters:[]};
PAGES['bid.未中标原因分析']={custom:'bidloss',pills:[],filters:[]};
PAGES['bid.现场勘察记录']={custom:'survey',pills:[],filters:[]};
PAGES['bid.价格库 / 内部定额']={custom:'priceview',pills:[],filters:[]};
PAGES['buy.分类树']={custom:'cattree',pills:[],filters:[]};
PAGES['buy.供应商报价记录']={custom:'supquote',pills:[],filters:[]};
PAGES['buy.资质文件']={custom:'matcert',pills:[],filters:[]};
PAGES['buy.询比价汇总 / 竞价排名']={custom:'inqsum',pills:[],filters:[]};
PAGES['buy.询比价汇总 / 竞价排名（含供应商报价记录）']=PAGES['buy.询比价汇总 / 竞价排名'];
PAGES['cost.清单导入']={custom:'costimp',pills:[],filters:[]};
PAGES['cost.目标成本']={custom:'targetcost',pills:[],filters:[]};
PAGES['cost.量价双控设置']={custom:'ljset',pills:[],filters:[]};
PAGES['cost.合同台账']={custom:'contractledger',pills:[],filters:[]};
PAGES['cost.维保合同专项']={custom:'wmcontract',pills:[],filters:[]};
PAGES['cost.新建与 AI/OCR 录入']={custom:'cnewwiz',pills:[],filters:[]};
PAGES['cost.合同审批']={custom:'contractapprove',pills:[],filters:[]};
PAGES['cost.风险中心与业务助手']={custom:'contractrisk',pills:[],filters:[]};
PAGES['site.资料看板']={custom:'dashboard'};
PAGES['wm.设备看板']={custom:'devboard'};
PAGES['oa.学习看板']={custom:'eduboard'};
PAGES['site.项目列表 / 立项']={custom:'projlist',pills:[],filters:[]};
PAGES['site.项目 360']={custom:'proj360',pills:[],filters:[]};
PAGES['site.项目类型']={custom:'ptype',pills:[],filters:[]};
PAGES['site.经营方式']=PAGES['site.项目类型'];
PAGES['site.项目看板 / 组合']={custom:'projboard',pills:[],filters:[]};
PAGES['site.WBS 分解']={custom:'projwbs',pills:[],filters:[]};
PAGES['site.进度计划 / 横道图']={custom:'projgantt',pills:[],filters:[]};
PAGES['site.成本预算 / 目标成本']=PAGES['cost.目标成本'];
PAGES['site.工序汇报']=PAGES['site.进度计划 / 横道图'];
PAGES['site.施工日志']=PAGES['site.进度计划 / 横道图'];
PAGES['site.劳务管理']={custom:'projlabor',pills:[],filters:[]};
PAGES['site.质量安全']={custom:'projqa',pills:[],filters:[]};
PAGES['site.现场收货 / 领用']=PAGES['buy.材料申请 / 提料'];
PAGES['site.进度监控 / 滞后预警']=PAGES['site.进度计划 / 横道图'];
PAGES['site.成本监控 / 六行量价']={custom:'projmonitor',pills:[],filters:[]};
PAGES['site.风险与问题']={custom:'projrisk',pills:[],filters:[]};
PAGES['site.竣工验收 / 资料归档']={custom:'projarch',pills:[],filters:[]};
PAGES['site.项目结算与关闭']={custom:'projclose',pills:[],filters:[]};
PAGES['site.项目后评估']=PAGES['site.项目结算与关闭'];
PAGES['site.变更发起']={custom:'projchange',pills:[],filters:[]};
PAGES['site.补充协议']=PAGES['site.变更发起'];
PAGES['site.签证资料回传']=PAGES['site.变更发起'];
PAGES['site.工期倒计时 / 逾期预警']=PAGES['site.风险与问题'];
/* ============ 售前全链路数据（客户→商机→投标→勘察→材料/价格→报价→中标） ============ */
var CLIENTS=[
 {id:'CL-001',name:'XX产业园开发有限公司',industry:'园区开发',region:'昆明',contact:'张伟',phone:'138****2210',tier:'A',opp:2,last:'09-16'},
 {id:'CL-002',name:'XX医院',industry:'医疗',region:'昆明',contact:'李雪',phone:'139****8102',tier:'A',opp:3,last:'09-15'},
 {id:'CL-003',name:'XX商业运营管理有限公司',industry:'商业',region:'昆明',contact:'陈晨',phone:'137****4521',tier:'B',opp:1,last:'09-12'},
 {id:'CL-004',name:'XX置业有限公司',industry:'地产',region:'曲靖',contact:'王芳',phone:'136****9087',tier:'B',opp:1,last:'09-10'},
 {id:'CL-005',name:'XX区教育局',industry:'教育',region:'文山',contact:'刘涛',phone:'135****3310',tier:'C',opp:1,last:'09-08'},
 {id:'CL-006',name:'XX物流园运营有限公司',industry:'物流',region:'楚雄',contact:'赵敏',phone:'152****7745',tier:'B',opp:2,last:'09-05'}];
var OPP=[
 {id:'OPP-001',cid:'CL-001',name:'XX产业园一期喷淋系统',stage:'中标/签约',amt:386,owner:'李敏',next:'签约 / 收款',updated:'09-13',days:0},
 {id:'OPP-002',cid:'CL-002',name:'XX医院二期消防改造',stage:'勘察/方案',amt:1560,owner:'王强',next:'09-18 现场勘察',updated:'09-15',days:3},
 {id:'OPP-003',cid:'CL-003',name:'XX商业广场智慧消防',stage:'初步接触',amt:480,owner:'周凯',next:'09-22 需求确认',updated:'09-12',days:5},
 {id:'OPP-004',cid:'CL-006',name:'XX物流园消防维保续签',stage:'报价',amt:96,owner:'郑洁',next:'09-25 报价提交',updated:'09-14',days:1},
 {id:'OPP-005',cid:'CL-005',name:'XX学校宿舍喷淋改造',stage:'投标',amt:98,owner:'孙倩',next:'09-28 开标',updated:'09-13',days:2},
 {id:'OPP-006',cid:'CL-004',name:'XX国际大厦消防改造',stage:'需求确认',amt:521,owner:'王强',next:'09-19 二次沟通',updated:'09-11',days:6}];
var OPP_STAGES=['初步接触','需求确认','勘察/方案','报价','投标','中标/签约'];
var BIDS=[
 {id:'BD-001',oid:'OPP-005',name:'XX学校宿舍喷淋改造',node:'已投标',bond:3,deadline:'09-28 开标',score:null,result:'待开标'},
 {id:'BD-002',oid:'OPP-002',name:'XX医院二期消防改造',node:'做标书',bond:5,deadline:'10-08 开标',score:null,result:'做标书中'},
 {id:'BD-003',oid:'OPP-001',name:'XX产业园一期喷淋系统',node:'已中标',bond:0,deadline:'09-12 开标',score:92.5,result:'已中标'},
 {id:'BD-004',oid:'OPP-006',name:'XX国际大厦消防改造',node:'未中标',bond:5,deadline:'09-05 开标',score:87.0,result:'未中标',lose_reason:'报价偏高'},
 {id:'BD-005',oid:'OPP-003',name:'XX商业广场智慧消防',node:'报名',bond:0,deadline:'09-30 报名截止',score:null,result:'报名中'}];
var CERTS=[
 {id:'CERT-001',name:'一级注册消防工程师',holder:'王工',type:'人员',valid:'2026-12-31',issueDate:'2025-12-31',validFrom:'2025-12-31',validTo:'2026-12-31',days:104,occ:'空闲'},
 {id:'CERT-002',name:'消防设施操作员（中级）',holder:'钱工',type:'人员',valid:'2026-10-20',issueDate:'2025-10-20',validFrom:'2025-10-20',validTo:'2026-10-20',days:32,occ:'空闲'},
 {id:'CERT-003',name:'特种作业操作证（电工）',holder:'杨帆',type:'人员',valid:'2026-09-30',issueDate:'2025-09-30',validFrom:'2025-09-30',validTo:'2026-09-30',days:12,occ:'空闲'},
 {id:'CERT-004',name:'建造师 B 证',holder:'张伟',type:'人员',valid:'2026-09-20',issueDate:'2025-09-20',validFrom:'2025-09-20',validTo:'2026-09-20',days:2,occ:'空闲'},
 {id:'CERT-005',name:'消防维保检测资质（一级）',holder:'企业',type:'企业',valid:'2026-12-12',issueDate:'2025-12-12',validFrom:'2025-12-12',validTo:'2026-12-12',days:85,occ:'预占用',occNote:'XX体育馆投标包'},
 {id:'CERT-006',name:'安全生产许可证',holder:'企业',type:'企业',valid:'2026-10-05',issueDate:'2025-10-05',validFrom:'2025-10-05',validTo:'2026-10-05',days:17,occ:'空闲'},
 {id:'CERT-007',name:'营业执照',holder:'企业',type:'企业',valid:'2031-03-15',issueDate:'2021-03-15',validFrom:'2021-03-15',validTo:'2031-03-15',days:1000,occ:'占用中',occNote:'BD-003 已中标项目'},
 {id:'CERT-008',name:'注册消防工程师（吴斌）',holder:'吴斌',type:'人员',valid:'2026-08-30',issueDate:'2025-08-30',validFrom:'2025-08-30',validTo:'2026-08-30',days:-18,occ:'空闲'}];
var BIDLOSS=[['报价偏高',2,40,'BD-004 XX国际大厦'],['客户关系不足',1,20,'—'],['资质不符',1,20,'—'],['响应不及时',1,20,'—']];
var BIDLOSS_F={reason:'',kw:'',page:1,per:6};
var SURVEYS=[
 {id:'KC-2609-01',oid:'OPP-002',proj:'XX医院二期消防改造',type:'改造',sys:'消防电系统/消防水系统/防排烟',items:12,photos:8,status:'已勘察·待报价',owner:'王强',date:'09-15',points:'3F主机老化、12只烟感失联；管网锈蚀渗漏2处',quote:'BJ-2609-05'},
 {id:'KC-2609-02',oid:'OPP-005',proj:'XX学校宿舍喷淋改造',type:'改造',sys:'消防水系统/应急照明',items:7,photos:5,status:'勘察中',owner:'孙倩',date:'09-17',points:'宿舍区喷淋支管老化；应急照明 3 层缺失',quote:null},
 {id:'KC-2608-12',oid:'OPP-006',proj:'XX国际大厦消防改造',type:'智慧消防',sys:'报警系统/数字孪生',items:15,photos:12,status:'已出报价·未中标',owner:'王强',date:'08-28',points:'主机点位 486 点；需接入平台',quote:'BJ-2608-18'}];
var MATERIALS=[
 {id:'MAT-0101',code:'WL-0101',name:'镀锌钢管',cat:'消防水系统/管材/管件',brand:'华信管业',spec:'DN100',unit:'m',ctrl:'量价双控',price:162,type:'材料供货',aux:'主材',st:'启用',stock:4100,safe:1000,transit:600,ref:168.0,lastIn:163.2,tax:'13%',moq:100,lead:3,sup:'华信管业',origin:'天津',upd:'09-16',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0158',code:'WL-0158',name:'沟槽管件',cat:'消防水系统/管材/管件',brand:'建支机械',spec:'DN100',unit:'件',ctrl:'仅控价',price:118,type:'材料供货',aux:'辅材',st:'启用',stock:940,safe:500,transit:0,ref:120.0,lastIn:118.5,tax:'13%',moq:100,lead:3,sup:'华信管业',upd:'09-14',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0232',code:'WL-0232',name:'喷淋头',cat:'消防水系统/喷淋',brand:'正泰消防',spec:'ZSTX15 68℃',unit:'只',ctrl:'量价双控',price:28,type:'材料供货',aux:'主材',st:'启用',stock:8420,safe:2000,transit:1200,ref:32.4,lastIn:30.8,tax:'13%',moq:500,lead:5,sup:'正泰消防',upd:'09-15',proj:'新建 / 改造'},
 {id:'MAT-0245',code:'WL-0245',name:'室内消火栓',cat:'消防水系统/消火栓/阀门',brand:'天广消防',spec:'SN65',unit:'套',ctrl:'量价双控',price:279,type:'材料供货',aux:'主材',st:'启用',stock:380,safe:150,transit:60,ref:285.0,lastIn:279.0,tax:'13%',moq:20,lead:5,sup:'天广消防',upd:'09-11',proj:'新建 / 改造'},
 {id:'MAT-0311',code:'WL-0311',name:'闸阀',cat:'消防水系统/消火栓/阀门',brand:'埃美柯',spec:'Z45X-16 DN100',unit:'个',ctrl:'仅控价',price:430,type:'材料供货',aux:'辅材',st:'启用',stock:520,safe:200,transit:0,ref:436.0,lastIn:430.0,tax:'13%',moq:50,lead:4,sup:'华信管业',upd:'09-02',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0366',code:'WL-0366',name:'湿式报警阀组',cat:'消防水系统/消火栓/阀门',brand:'泰科',spec:'ZSFZ 150',unit:'套',ctrl:'量价双控',price:18200,type:'设备成套包',aux:'主材',st:'启用',stock:26,safe:10,transit:4,ref:18600,lastIn:18200,tax:'13%',moq:2,lead:15,sup:'安泰电子',upd:'08-28',proj:'新建'},
 {id:'MAT-0803',code:'WL-0803',name:'灭火器',cat:'消防水系统/灭火器材',brand:'正泰消防',spec:'MFZ/ABC4',unit:'具',ctrl:'量价双控',price:63,type:'材料供货',aux:'主材',st:'启用',stock:120,safe:300,transit:0,ref:65.0,lastIn:63.5,tax:'13%',moq:100,lead:4,sup:'正泰消防',upd:'09-10',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0455',code:'WL-0455',name:'点型烟感',cat:'消防电系统/火灾报警',brand:'安泰电子',spec:'JTY-GD-3000',unit:'只',ctrl:'量价双控',price:82,type:'设备成套包',aux:'主材',st:'启用',stock:420,safe:300,transit:100,ref:92.9,lastIn:88.0,tax:'13%',moq:200,lead:7,sup:'安泰电子',origin:'广东深圳',upd:'09-14',proj:'新建 / 改造'},
 {id:'MAT-0478',code:'WL-0478',name:'手动报警按钮',cat:'消防电系统/火灾报警',brand:'海湾',spec:'J-SAP-M-M500K',unit:'只',ctrl:'量价双控',price:76,type:'设备成套包',aux:'主材',st:'启用',stock:610,safe:200,transit:0,ref:78.0,lastIn:76.5,tax:'13%',moq:100,lead:7,sup:'海湾代理',origin:'广东深圳',upd:'09-08',proj:'新建 / 改造'},
 {id:'MAT-0530',code:'WL-0530',name:'声光报警器',cat:'消防电系统/火灾报警',brand:'海湾',spec:'TX3301',unit:'只',ctrl:'不控',price:94,type:'设备成套包',aux:'辅材',st:'启用',stock:890,safe:300,transit:0,ref:96.0,lastIn:94.0,tax:'13%',moq:100,lead:7,sup:'海湾代理',upd:'08-30',proj:'新建 / 改造'},
 {id:'MAT-0301',code:'WL-0301',name:'火灾报警控制器',cat:'消防电系统/消防主机',brand:'海湾',spec:'联动型 2回路',unit:'台',ctrl:'仅控价',price:26400,type:'设备成套包',aux:'主材',st:'启用',stock:12,safe:4,transit:2,ref:26800,lastIn:26400,tax:'13%',moq:2,lead:15,sup:'海湾代理',upd:'09-06',proj:'新建'},
 {id:'MAT-0917',code:'WL-0917',name:'耐火电缆',cat:'消防电系统/线缆/桥架',brand:'XX线缆',spec:'NH-RVS 2×1.5',unit:'m',ctrl:'不控',price:12.5,type:'材料供货',aux:'辅材',st:'启用',stock:9600,safe:2000,transit:1500,ref:12.8,lastIn:12.5,tax:'13%',moq:500,lead:5,sup:'金桥物资',origin:'云南昆明',upd:'09-08',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0955',code:'WL-0955',name:'电缆桥架',cat:'消防电系统/线缆/桥架',brand:'联兴桥架',spec:'200×100',unit:'m',ctrl:'量价双控',price:88,type:'材料供货',aux:'主材',st:'启用',stock:1850,safe:600,transit:300,ref:90.0,lastIn:88.4,tax:'13%',moq:100,lead:6,sup:'金桥物资',upd:'09-01',proj:'新建 / 改造'},
 {id:'MAT-0688',code:'WL-0688',name:'防火卷帘',cat:'防排烟系统/防火分隔',brand:'金桥物资',spec:'双轨双帘 4㎡',unit:'㎡',ctrl:'仅控量',price:598,type:'设备成套包',aux:'主材',st:'启用',stock:26,safe:20,transit:0,ref:598.0,lastIn:615.0,tax:'13%',moq:10,lead:10,sup:'金桥物资',upd:'09-12',proj:'新建 / 改造'},
 {id:'MAT-0701',code:'WL-0701',name:'镀锌钢板风管',cat:'防排烟系统/风管',brand:'昆通通风',spec:'δ1.0 共板法兰',unit:'㎡',ctrl:'量价双控',price:145,type:'材料供货',aux:'主材',st:'启用',stock:760,safe:300,transit:120,ref:148.0,lastIn:145.2,tax:'13%',moq:50,lead:5,sup:'金桥物资',origin:'云南昆明',upd:'08-26',proj:'新建 / 改造'},
 {id:'MAT-0733',code:'WL-0733',name:'防火阀',cat:'防排烟系统/风阀',brand:'昆明防火',spec:'280℃ 500×500',unit:'台',ctrl:'仅控价',price:458,type:'设备成套包',aux:'辅材',st:'启用',stock:340,safe:120,transit:0,ref:465.0,lastIn:458.0,tax:'13%',moq:30,lead:6,sup:'金桥物资',upd:'08-22',proj:'新建 / 改造'},
 {id:'MAT-1156',code:'WL-1156',name:'风阀执行器',cat:'防排烟系统/风阀',brand:'XX自控',spec:'24V',unit:'台',ctrl:'仅控价',price:232,type:'设备成套包',aux:'辅材',st:'启用',stock:18,safe:30,transit:0,ref:236.0,lastIn:232.0,tax:'13%',moq:20,lead:8,sup:'金桥物资',upd:'09-05',proj:'新建 / 改造 / 维保'},
 {id:'MAT-0812',code:'WL-0812',name:'气灭控制器',cat:'气灭与应急/气体灭火',brand:'青鸟消防',spec:'QKP06',unit:'台',ctrl:'仅控价',price:15400,type:'设备成套包',aux:'主材',st:'启用',stock:8,safe:2,transit:1,ref:15600,lastIn:15400,tax:'13%',moq:1,lead:20,sup:'安泰电子',upd:'08-18',proj:'新建'},
 {id:'MAT-0845',code:'WL-0845',name:'应急照明箱',cat:'气灭与应急/应急照明',brand:'正泰电气',spec:'4层集中电源',unit:'台',ctrl:'量价双控',price:3200,type:'设备成套包',aux:'主材',st:'启用',stock:45,safe:20,transit:6,ref:3280,lastIn:3200,tax:'13%',moq:5,lead:12,sup:'诺盾物联',upd:'08-14',proj:'新建 / 改造'},
 {id:'MAT-0777',code:'WL-0777',name:'导轨式三相电能表',cat:'智慧消防/硬件/数据采集',brand:'安科瑞',spec:'3×380V 0.5S级',unit:'台',ctrl:'不控',price:425,type:'设备成套包',aux:'主材',st:'启用',stock:210,safe:50,transit:0,ref:428.0,lastIn:425.0,tax:'13%',moq:10,lead:7,sup:'诺盾物联',upd:'08-30',proj:'新建 / 改造'},
 {id:'MAT-1305',code:'WL-1305',name:'物联传感器',cat:'智慧消防/硬件/数据采集',brand:'诺盾物联',spec:'NB-IoT',unit:'台',ctrl:'量价双控',price:860,type:'设备成套包',aux:'主材',st:'停用·待复核',stock:0,safe:50,transit:0,ref:860,lastIn:null,tax:'13%',moq:50,lead:10,sup:'诺盾物联',upd:'08-30',proj:'新建 / 改造'},
 {id:'MAT-1332',code:'WL-1332',name:'电气火灾监控器',cat:'智慧消防/硬件/监测设备',brand:'诺盾物联',spec:'EF-08',unit:'台',ctrl:'仅控价',price:5320,type:'设备成套包',aux:'主材',st:'启用',stock:22,safe:10,transit:4,ref:5400,lastIn:5320,tax:'13%',moq:5,lead:10,sup:'诺盾物联',upd:'08-10',proj:'新建 / 改造'},
 {id:'MAT-9901',code:'WL-9901',name:'定制支架件（待归类）',cat:'未分类',brand:'XX机加工',spec:'定制',unit:'项',ctrl:'不控',price:82,type:'复合项',aux:'辅材',st:'启用',stock:64,safe:0,transit:0,ref:85.0,lastIn:82.0,tax:'13%',moq:50,lead:9,sup:'金桥物资',upd:'08-05',proj:'新建 / 改造'},
  {id:'MAT-KIT-001',code:'KIT-XT-001',name:'xxx 消防系统（智慧消防成套）',cat:'智慧消防 / 硬件',brand:'诺盾物联',spec:'硬件 + 软件组合',unit:'套',ctrl:'量价双控',price:12800,type:'设备成套包',aux:'主材',st:'启用',stock:5,safe:2,transit:0,ref:12600,lastIn:12800,tax:'13%',moq:1,lead:20,sup:'诺盾物联',upd:'09-10',proj:'新建 / 改造',kit:1,kitQty:5,bom:[{n:'消防主机硬件（硬件A）',q:1},{n:'消防软件授权（软件B）',q:2},{n:'配件C',q:3}]},
  {id:'MAT-KIT-002',code:'KIT-PZ-001',name:'喷头 + 支架 + 管件组合包',cat:'消防水系统',brand:'正泰消防',spec:'组合包',unit:'套',ctrl:'量价双控',price:96,type:'复合项',aux:'辅材',st:'启用',stock:120,safe:30,transit:0,ref:92,lastIn:96,tax:'13%',moq:10,lead:5,sup:'金桥物资',upd:'09-08',proj:'改造 / 维保',kit:1,kitQty:120,bom:[{n:'喷淋头 ZSTX15',q:1},{n:'支架（定制）',q:1},{n:'沟槽管件 DN25',q:2}]}];
var PRICES=[
 {mid:'MAT-0101',src:'内部定额',v:150.0,who:'系统',date:'2026-09',region:'全国',note:'参考价/内部定额'},
 {mid:'MAT-0101',src:'询价价',v:162.0,who:'安泰电子',date:'09-15',region:'昆明',note:'二维码询价 XJ-2609-05'},
 {mid:'MAT-0101',src:'合同价',v:158.0,who:'XX钢贸',date:'08-20',region:'昆明',note:'采购合同 PO-2608-12'},
 {mid:'MAT-0101',src:'入库价',v:161.5,who:'AI 拍照入库',date:'09-02',region:'昆明',note:'入库单 RK-2609-08'},
 {mid:'MAT-0232',src:'内部定额',v:27.0,who:'系统',date:'2026-09',region:'全国',note:'参考价/内部定额'},
 {mid:'MAT-0232',src:'询价价',v:30.0,who:'天广消防',date:'09-14',region:'昆明',note:'二维码询价 XJ-2609-03'},
 {mid:'MAT-0232',src:'入库价',v:28.8,who:'正泰消防',date:'09-13',region:'昆明',note:'入库单 RK-2609-15'},
 {mid:'MAT-0455',src:'内部定额',v:80.0,who:'系统',date:'2026-09',region:'全国',note:'参考价/内部定额'},
 {mid:'MAT-0455',src:'合同价',v:86.0,who:'海湾代理',date:'08-10',region:'昆明',note:'采购合同 PO-2608-05'},
 {mid:'MAT-0455',src:'询价价',v:84.0,who:'安泰电子',date:'09-10',region:'昆明',note:'询价单 XJ-2609-06'},
 {mid:'MAT-0688',src:'市场价',v:620.0,who:'市场',date:'09-01',region:'云南省',note:'上次成交 安泰电子 ¥620'},
 {mid:'MAT-0688',src:'入库价',v:615.0,who:'安泰电子',date:'09-12',region:'昆明',note:'入库单 RK-2609-18'},
 {mid:'MAT-0301',src:'内部定额',v:25500,who:'系统',date:'2026-09',region:'全国',note:'参考价/内部定额'},
 {mid:'MAT-0301',src:'合同价',v:26400,who:'海湾代理',date:'09-06',region:'昆明',note:'采购合同 CG-2609-03'},
 {mid:'MAT-0101',src:'订单价',v:160.0,who:'XX钢贸',date:'09-10',region:'昆明',note:'框架订单 PO-2609-11（继承框架价）'},
 {mid:'MAT-0232',src:'结算价',v:29.0,who:'天广消防',date:'09-16',region:'昆明',note:'结算单 JS-2609-02'}];
var INQ=[
 {id:'XJ-2609-05',mid:'MAT-0101',name:'镀锌钢管 DN100',qty:3000,unit:'m',bids:[['安泰电子',162,1],['鑫源钢贸',165,2],['顺达金属',158,3]],status:'已汇总'},
 {id:'XJ-2609-03',mid:'MAT-0232',name:'喷淋头 ZSTX15',qty:8600,unit:'只',bids:[['天广消防',30,1],['华安消防',32,2]],status:'报价中'},
 {id:'XJ-2609-08',mid:'MAT-0688',name:'防火卷帘 双轨双帘',qty:420,unit:'㎡',bids:[['安泰电子',620,1],['明泰卷帘',615,2],['宏安消防',630,3]],status:'已汇总'}];
var LINK_QUOTES=[
 {id:'BJ-2609-05',oid:'OPP-002',cid:'CL-002',name:'XX医院二期消防工程',type:'含价',amt:156.35,raw:120.18,gm:'23.0%',status:'待审批',ver:'V3',updated:'09-16',bid:'BD-002'},
 {id:'BJ-2609-10',oid:'OPP-008',cid:'CL-005',name:'XX数据中心气体灭火',type:'含价',amt:2318.00,raw:1762.0,gm:'24.0%',status:'待审批',ver:'V2',updated:'09-15',bid:null},
 {id:'BJ-2609-06',oid:'OPP-001',cid:'CL-001',name:'XX产业园一期喷淋系统',type:'含价',amt:386.00,raw:301.6,gm:'21.9%',status:'已中标',ver:'V2',updated:'09-12',bid:'BD-003'},
 {id:'BJ-2608-15',oid:'OPP-005',cid:'CL-003',name:'XX政务中心消防工程',type:'含价',amt:1560.00,raw:1201.8,gm:'23.0%',status:'已中标',ver:'V2',updated:'08-20',bid:null},
 {id:'BJ-2609-02',oid:'OPP-007',cid:'CL-007',name:'XX厂房改造维修',type:'含价',amt:86.40,raw:70.1,gm:'18.9%',status:'已通过',ver:'V1',updated:'09-12',bid:null},
 {id:'BJ-2608-30',oid:'OPP-009',cid:'CL-001',name:'XX产业园二期（规划）',type:'含价',amt:1580.00,raw:1223.6,gm:'22.6%',status:'已通过',ver:'V1',updated:'08-25',bid:null},
 {id:'BJ-2609-08',oid:'OPP-004',cid:'CL-006',name:'XX物流园智慧消防硬件清单',type:'仅清单',amt:null,raw:null,gm:'—',status:'待客户确认',ver:'V1',updated:'09-14',bid:null},
 {id:'BJ-2609-03',oid:'OPP-010',cid:'CL-008',name:'XX商城年度维保报价',type:'含价',amt:36.00,raw:28.5,gm:'20.8%',status:'待客户确认',ver:'V1',updated:'09-08',bid:null},
 {id:'BJ-2608-18',oid:'OPP-006',cid:'CL-004',name:'XX国际大厦消防改造',type:'含价',amt:521.00,raw:415.8,gm:'20.2%',status:'未中标',ver:'V4',updated:'09-05',bid:'BD-004'},
 {id:'BJ-2608-21',oid:'OPP-011',cid:'CL-009',name:'XX体育馆消防专项',type:'含价',amt:982.00,raw:815.3,gm:'17.0%',status:'未中标',ver:'V4',updated:'08-28',bid:null},
 {id:'BJ-2608-26',oid:'OPP-012',cid:'CL-010',name:'XX酒店消防改造',type:'含价',amt:265.00,raw:218.4,gm:'17.6%',status:'已作废',ver:'V3',updated:'08-18',bid:null},
 {id:'BJ-2609-07',oid:'OPP-013',cid:'CL-007',name:'XX学校宿舍喷淋改造',type:'仅清单',amt:null,raw:null,gm:'—',status:'草稿',ver:'V1',updated:'09-10',bid:null}];
/* ============ 售前链路渲染：勘察 / 采购支撑 / 中标后衔接 ============ */
var SURVEY_ITEMS={
 'KC-2609-01':[
  ['一、消防电系统','3F 报警主机','主机老化、回路板故障','1','台','需更换主机或维修','2'],
  ['一、消防电系统','点型烟感','12 只烟感失联','12','只','确认失联原因后更换','4'],
  ['二、消防水系统','管网','锈蚀渗漏 2 处','2','处','DN100 弯头及法兰','3'],
  ['二、消防水系统','喷淋头','部分喷淋头老化','8','只','建议整体更换','2'],
  ['三、防排烟系统','排烟阀','开闭不灵活','1','套','需检修','1'],
  ['四、应急照明','疏散指示灯','3F 缺失','6','只','按规范补齐','1']],
 'KC-2609-02':[
  ['一、消防水系统','喷淋支管','宿舍区老化渗水','—','—','需现场复核工程量','3'],
  ['二、应急照明','应急灯','3 层缺失','6','只','按规范补齐','2'],
  ['三、消防电系统','报警回路','2F 回路故障','1','回路','需排查','1']]};
var PROJS=[
 {id:'PJ-2609-01',name:'XX医院二期消防改造',type:'改造',mode:'自营',stage:'施工准备',budget:1201.8,owner:'王强',from:'OPP-002 · 中标',progress:'15%',customer:'XX医院',region:'昆明',address:'昆明市五华区龙泉路 88 号',cont:1380,actual:186.4,gm:22.1,status:'在建',planS:'2026-10-01',planE:'2027-06-30',industry:'医院',risk:1},
 {id:'PJ-2609-02',name:'XX产业园一期喷淋系统',type:'新建',mode:'自营',stage:'施工中',budget:1510,owner:'李敏',from:'OPP-001 · 中标',progress:'48%',customer:'XX产业园管委会',region:'昆明',address:'昆明市经开区信息产业园',cont:1720,actual:708.6,gm:24.6,status:'在建',planS:'2026-05-15',planE:'2027-03-31',industry:'产业园'},
 {id:'PJ-2608-11',name:'XX商业广场综合体',type:'新建',mode:'联营',stage:'调试验收',budget:5210,owner:'王强',from:'OPP-003 · 中标',progress:'78%',customer:'XX商业集团',region:'文山',address:'文山市开化中路',cont:5960,actual:4021.5,gm:18.3,status:'收尾中',planS:'2026-02-01',planE:'2026-12-31',industry:'商业综合体'},
 {id:'PJ-2609-04',name:'XX万象城消防改造',type:'改造',mode:'自营',stage:'施工中',budget:690,owner:'李敏',from:'—',progress:'40%',customer:'XX商业集团',region:'广西',address:'南宁市青秀区民族大道',cont:920,actual:312.0,gm:18.2,status:'在建',planS:'2026-08-01',planE:'2027-01-31',industry:'商业综合体'},
 {id:'PJ-2608-21',name:'XX湾住宅小区消防工程',type:'新建',mode:'自营',stage:'施工中',budget:860,owner:'孙倩',from:'—',progress:'55%',customer:'XX置业',region:'地州',address:'大理市海东新区',cont:980,actual:420.0,gm:17.6,status:'在建',planS:'2026-04-01',planE:'2026-12-31',industry:'住宅'},
 {id:'PJ-2609-07',name:'XX春城里商业街消防',type:'改造',mode:'自营',stage:'待启动',budget:210,owner:'王强',from:'—',progress:'0%',customer:'XX文旅',region:'楚雄',address:'楚雄市古镇街区',cont:240,actual:0,gm:0,status:'待启动',planS:'2026-11-01',planE:'2027-05-31',industry:'文旅'},
 {id:'PJ-2608-28',name:'XX古镇游客中心消防',type:'新建',mode:'自营',stage:'施工中',budget:330,owner:'李敏',from:'—',progress:'62%',customer:'XX文旅',region:'广西',address:'桂林市阳朔县',cont:420,actual:168.0,gm:24.5,status:'在建',planS:'2026-06-01',planE:'2026-11-30',industry:'文旅'},
 {id:'PJ-2607-15',name:'XX中心广场消防维保改造',type:'维保',mode:'自营',stage:'已竣工',budget:180,owner:'孙倩',from:'—',progress:'100%',customer:'XX商业集团',region:'昆明',address:'昆明市官渡区彩云北路',cont:260,actual:190.0,gm:16.8,status:'已竣工',planS:'2025-12-01',planE:'2026-06-30',industry:'商业综合体'}];
/* ============ 详情页数据 ============ */
var DET={
 contract:{
  sid:'cost',crumb0:'合同成本',crumb1:'合同管理',short:'HT-2609-18',title:'HT-2609-18 · XX产业园喷淋系统主合同',primaryAct:'发起付款',
  head:[
   {sec:'基本信息',kvs:[['合同编号 / 名称','HT-2609-18 · XX产业园喷淋系统主合同'],['合同类型',tg('b','销售合同 / 收入合同')],['我方主体','诺盾博达消防工程有限公司'],['对方单位','XX产业园开发有限公司（业主）'],['联系人','张总 · 138****2201'],['合同金额 / 税率','¥386.00 万 · 9%'],['签订 / 生效','2026-09-10 / 2026-09-10'],['当前状态 / 版本',tg('g','履约中')+' · V3（签订版）'],['来源','投标中标（BJ-2609-06 反向生成 · BD-003）'],['用印 / 电子签','CFCA 企业章 · 已签署']]},
   {sec:'关键日期与质保',kvs:[['工期','120 天（2026-09-10 ~ 2027-01-08）'],['质保期','24 个月'],['质保金比例 / 金额','5% · ¥19.30 万'],['质保金到期','2028-09-10']]},
   {sec:'里程碑付款计划',kvs:[['预付款 30%','¥115.80 万 · 已收（2026-09-12）'],['进度款 40%','¥154.40 万 · 第 3 期节点（09-22）'],['竣工款 25%','¥96.50 万 · 待竣工结算'],['质保金 5%','¥19.30 万 · 2028-09 到期']]},
   {sec:'经营数据',kvs:[['累计产值 / 收款','¥198.4 / 154.4 万'],['累计结算 / 付款','¥120.6 / 86.2 万'],['累计收票 / 开票','¥96.0 / 88.5 万'],['现金流 / 付款比例',tg('g','+¥68.2 万')+' / 71.5%']]}
  ],
  risk:['分包付款比例 71.5%，接近节点上限（75%），建议本次付款前完成第 3 期产值上报','两笔进项发票待收（合计 ¥18.2 万），付款后存在缺票风险'],
  tabs:[
   {id:'proj',name:'关联项目',type:'tbl',headers:['项目编号','项目名称','项目类型','项目经理','关联合同','状态','跳转'],rows:[
    ['PJ-2609-02','XX产业园一期喷淋系统','新建','李敏','HT-2609-18',tg('g','施工中'),'<button class="mini-btn mini-ok" data-proj="PJ-2609-02">查看项目</button>'],
   ]},
   {id:'items',name:'清单 / 成本目标',type:'items'},
   {id:'fh',name:'履约 / 发货与签收',type:'tbl',headers:['单据','类型','货物 / 交付内容','数量验收','质量验收','验收结果','关联单据','状态'],rows:[
    ['FH-2609-08','供应商送货单','镀锌钢管 DN100 · 2,000m','2,000m ✓','外观 / 3C 合格','合格',tg('b','AI 入库 RK-2609-31'),tg('g','已入库')],
    ['FH-2609-07','供应商送货单','喷淋头 ZSTX15 · 1,200 只','1,200 只 ✓','检验报告齐全','合格',tg('b','AI 入库 RK-2609-30'),tg('g','已入库')],
    ['FH-2609-04','供应商送货单','点型烟感 · 1,000 只','800 只（缺 200）','2 箱破损','让步接收',tg('o','待补货 200 只'),tg('y','待补货')],
    ['QS-2609-10','我方交付清单','XX医院二期消防设备','1 批 ✓','到货清单一致','业主验收通过',tg('b','交付节点已确认'),tg('g','已签收')]
   ]},
   {id:'sub',name:'子合同 / 子订单',type:'tbl',headers:['子订单编号','范围','金额(万)','交付 / 服务日期','回款计划','状态'],rows:[
    ['ZX-2609-01','管网材料采购（框架衍生）','168.30','09-10 起','按到货 80% / 结算 15% / 质保 5%',tg('g','履约中')],
    ['ZX-2609-02','喷淋头采购（框架衍生）','27.90','09-12 起','按到货 80% / 结算 15% / 质保 5%',tg('g','履约中')],
    ['ZX-2609-03','报警设备（框架衍生）','11.50','09-16 起','按到货 80% / 结算 15% / 质保 5%',tg('b','已下达')]
   ]},
   {id:'var',name:'变更 / 签证 / 版本',type:'tbl',headers:['编号','内容','金额增减(万)','发起人','附件 / 版本','状态'],rows:[
    ['BG-02','管网增加 DN100 分支（3# 楼）','-1.20','李敏','图纸 + 签证单',tg('g','已闭环 · 已同步预算')],
    ['BQ-03','3F 增加手动报警按钮 6 只','+0.80','赵磊','照片 + 确认单',tg('b','待确认')],
    ['BC-01','补充协议 · 工期顺延 15 天','0.00','李敏','协议扫描件 · V3→V4 对比 3 处',tg('o','客户签署中')],
    ['VER-3','版本历史：V1 初稿 → V2 数量变更 → V3 签订版','—','系统','高亮差异 · 支持恢复',tg('gray','已留痕')]
   ]},
   {id:'rel',name:'关联合同',type:'tbl',headers:['合同','方向','对方','金额(万)','服务 / 范围','穿透'],rows:[
    ['ZX-2609-01','采购 / 支出','金桥物资（管网材料）','168.30','本销售合同下的材料采购',tg('b','穿透采购合同')],
    ['ZX-2609-02','采购 / 支出','天广消防（喷淋材料）','27.90','本销售合同下的材料采购',tg('b','穿透采购合同')],
    ['ZX-2609-03','采购 / 支出','安泰电子（报警设备）','11.50','本销售合同下的设备采购',tg('b','穿透采购合同')],
    ['LW-2609-02','采购 / 支出','风管班组（劳务）','12.80','本销售合同下的劳务分包',tg('b','穿透劳务合同')]
   ]},
   {id:'amt',name:'金额汇总',type:'kv',groups:[
    {sec:'自动汇总（主合同 + 变更 + 子合同）',kvs:[['原合同金额','¥386.00 万'],['变更累计（BG-02 -1.2 / BQ-03 +0.8 / BC-01 顺延）','-¥0.40 万'],['子合同累计（ZX-01 / 02 / 03）','+¥207.70 万'],['生效合同总额',tg('b','¥593.30 万')]]},
    {sec:'构成明细',kvs:[['主合同 · HT-2609-18','¥386.00 万'],['补充协议 · BQ-03 手动报警按钮','+¥0.80 万'],['补充协议 · BG-02 管网分支','-¥1.20 万'],['子合同 · ZX-2609-01 管网材料','¥168.30 万'],['子合同 · ZX-2609-02 喷淋头','¥27.90 万'],['子合同 · ZX-2609-03 报警设备','¥11.50 万']]},
    {sec:'聚合口径',kvs:[['计算方式','主合同金额 + 变更签证 + 框架子合同自动汇总，替代人工算'],['与结算对照','「结算与核算」Tab 按各合同分别结算，总额与生效合同总额一致'],['留痕','每次变更 / 新增子合同后自动重算，历史金额保留在版本']]}
   ]},
   {id:'rp',name:'回款计划',type:'tbl',headers:['节点','比例','金额(万)','触发条件','计划 / 实际日期','状态'],rows:[
    ['预付款','30%','115.80','合同签订后 5 个工作日内','09-12 已到账',tg('g','已回款')],
    ['进度款 · 第 1 期','10%','38.60','第 1 期产值确认','09-15 已到账',tg('g','已回款')],
    ['进度款 · 第 2 期','10%','38.60','第 2 期产值确认','10-10 计划',tg('y','待回款')],
    ['进度款 · 第 3 期','20%','77.20','第 3 期产值上报 · 09-22 节点','09-22 计划',tg('y','待回款 · 接近节点')],
    ['竣工款','25%','96.50','竣工验收合格','待竣工',tg('gray','未到节点')],
    ['质保金','5%','19.30','质保期 24 个月满','2028-09-10',tg('gray','2028-09 到期')]
   ]},
   {id:'att',name:'附件',type:'files',groups:[
    {name:'商务函件',files:[
     {n:'中标通知书 BJ-2609-06.pdf',t:'PDF',c:'#ff7875',size:'860 KB',by:'商务',date:'09-12 11:30',st:['g','已归档']},
     {n:'补充协议 · 工期顺延（客户签署中）.pdf',t:'PDF',c:'#ff7875',size:'920 KB',by:'李敏',date:'09-16 09:30',st:['o','签署中']},
     {n:'履约保函 · 农行高新支行.pdf',t:'PDF',c:'#ff7875',size:'640 KB',by:'财务',date:'09-12 10:00',st:['o','审核中']}]},
    {name:'合同正文',files:[
     {n:'合同正本（盖章扫描件）.pdf',t:'PDF',c:'#ff7875',size:'2.8 MB',by:'李敏',date:'09-10 14:20',st:['g','已归档']}]},
    {name:'审批过程',files:[
     {n:'合同审批单.pdf',t:'PDF',c:'#ff7875',size:'1.1 MB',by:'孙倩',date:'09-10 14:05',st:['g','已归档']}]},
    {name:'安全协议',files:[
     {n:'安全协议 · 进场交底.docx',t:'DOC',c:'#69b1ff',size:'380 KB',by:'赵磊',date:'09-11 16:40',st:['g','已归档']}]}
   ]},
   {id:'sl',name:'结算与核算',type:'tbl',headers:['核算单','期间 / 节点','原合同金额','变更金额','累计结算','本期应结','已付累计','尾款 / 质保金','状态'],rows:[
    ['HS-2609-06','第 6 期','386.00','-0.40','82.40','82.40','154.40','19.30',tg('g','已审定')],
    ['CZ-2609-06','产值上报 · 第 6 周','—','—','—','86.00','—','—',tg('g','已审定')],
    ['JS-2609-02','结算单 · 第 2 期','—','—','42.60','42.60','—','—',tg('g','已结算')],
    ['HS-2609-07','竣工结算（计划）','386.00','—','—','待报','—','19.30',tg('gray','未开始')]
   ]},
   {id:'pay',name:'收票 / 付款',type:'tbl',headers:['类型','单号','金额(万)','发票情况','智能业务洞察','状态'],rows:[
    ['收款','SK-2609-12','115.80','已开票 ¥115.8 万',tg('g','✓ 预付款 30% 符合条款'),tg('g','已完成')],
    ['收款','SK-2609-15','38.60','已开票 ¥38.6 万',tg('g','✓ 进度款第 1 期 10%'),tg('g','已完成')],
    ['收款','SK-2609-18','38.60','待开票',tg('b','进度款第 2 期 · 计划 10-10'),tg('gray','待回款')],
    ['付款','FK-2609-15','86.20','进项 ¥49.6 万',tg('y','付款比例 71.5%，接近 75% 上限'),tg('b','审批中')],
    ['付款','FK-2609-18','68.30','进项待收 ¥18.2 万',tg('r','付款后缺票，可「知情后特批」'),tg('gray','待提交')],
    ['自动开票','KP-2609-09','57.90','开票任务待确认','财务确认后开票',tg('b','待确认')]
   ]},
   {id:'risk',name:'风险与业务助手',type:'ver',versions:[
    ['V1 · 2026-08-28','初稿（王悦起草）'],
    ['V2 · 2026-09-05','管网数量变更 -1.2 万（李敏）'],
    ['V3 · 2026-09-10','签订版（双方盖章，当前）']
    ],ai:[
    ['回款条件','✓ 按节点付款 · 预付 30% 符合公司制度'],
    ['工期条款','⚠ 120 天，较同类项目均值偏紧 15%'],
    ['税率','✓ 9% 专用发票'],
    ['质量安全条款','✓ 符合 2026 新版合同范本'],
    ['版本对比','AI 已高亮 V2→V3 差异 3 处（付款比例 / 违约上限 / 质保期）'],
    ['风险结论',tg('y','中风险：缺票 + 付款接近节点上限')]
   ]},
   {id:'arch',name:'资料与智能归档',type:'tbl',headers:['资料','里程碑目录','状态','智能归档来源','审计'],rows:[
    ['合同正本（盖章扫描件）','① 合同阶段',tg('g','已归档'),'审批流自动归类','查看 3 次 · 下载 1 次'],
    ['合同审批单','① 合同阶段',tg('g','已归档'),'AI/OCR 录入自动归类','—'],
    ['履约保函','① 合同阶段',tg('o','审核中'),'人工上传','—'],
    ['验收资料 / 消防报告','③ 竣工阶段',tg('r','缺失'),'待智能归档','—']
   ]},
   {id:'logs',name:'操作日志',type:'logs',logs:[
    ['2026-09-16 09:30',false,'<b>李敏</b> 发起合同变更：工期 105 → 120 天（补充协议 · 客户签署中），金额 -¥0.40 万'],
    ['2026-09-12 11:30',false,'<b>商务</b> 上传附件「中标通知书 BJ-2609-06.pdf」'],
    ['2026-09-10 14:32',false,'<b>孙倩</b> 上传「合同审批单.pdf」，审批通过 · 合同状态变更为 <span class="tag green" style="padding:1px 8px;font-size:11px"><i></i>履约中 · V3 签订版</span>'],
    ['2026-09-10 09:00',true,'预付款 <b>¥115.80 万</b> 到账，回款进度 30%'],
    ['2026-09-05 16:20',false,'<b>李敏</b> 创建合同 <b>HT-2609-18</b>（主合同），签约金额 ¥386.00 万']]},
   {id:'links',name:'循环穿透',type:'links',links:['项目 360°','客户档案','采购合同（关联）','发货 / 送货单','签收 / 验收单','入库单','发票台账','付款单','质保金计划']}
  ]
 },
 wmservice:{
  sid:'cost',crumb0:'合同成本',crumb1:'合同档案',short:'WB-2609-02',title:'WB-2609-02 · XX商城年度消防维保合同',primaryAct:'发起续签商机',
  head:[
   {sec:'项目 / 服务',kvs:[['合同编号','WB-2609-02'],['合同类型',tg('b','维保合同 · 保内')],['服务对象','XX商城物业'],['服务类型','年度维保'],['适用标准',tg('b','GB25201《建筑消防设施的维护管理》')]]},
   {sec:'片区 / 计划',kvs:[['片区 / 线路','昆明组 · 商城线路'],['巡检计划','每周 1 次 · 月度报告'],['合同起止','2026-10-01 ~ 2027-09-30'],['续签商机',tg('y','1 个 · 预计 ¥36 万')]]},
   {sec:'消防设施范围',kvs:[['设施种类 / 型号','报警控制器 JB-QB · 烟感 JTY-GD · 喷淋 ZSTX15'],['规格 / 数量','主机 2 台 · 烟感 860 只 · 喷淋 1,240 只'],['部件信息','水系统 + 电系统 + 防排烟'],['建筑范围 / 设施范围','A / B 座 · 全部消防设施']]},
   {sec:'人员与合规',kvs:[['项目负责人',tg('g','王海 · 一级注册消防工程师 XF-0001')],['技术负责人','陈军 · 一级注册消防工程师 XF-0002'],['消防设施操作员','李强 · 操作员资格证书 JF-8801'],['联网用户线上授权',tg('g','已授权 · 2026-09-01')]]}
  ],
  risk:['操作员证书李强 2027-03 到期，建议提前 60 天安排年审','保外维修 3 个订单待确收，联动开票收款防止“干完活没单子”'],
  tabs:[
   {id:'info',name:'服务明细',type:'kv',groups:[
    {sec:'维护保养内容',kvs:[['巡检 / 测试','每月：设备巡检 + 联动测试 + 压力测试'],['季度保养','泵房 / 主机 / 末端试水'],['年度检测','配合第三方检测（GB/T 44481—2024）'],['报告','月度维保报告 + 年度检测报告']]},
    {sec:'保内 / 保外',kvs:[['保内服务','按合同免费（含配件 ¥2 万/年额度）'],['保外 / 人为损坏','必须生成维修订单 · 联动开票收款'],['响应时效','报修 2 小时响应 · 24 小时到场']]}
   ]},
   {id:'order',name:'维修订单 / 确收',type:'tbl',headers:['订单号','内容','金额(万)','来源','状态'],rows:[
    ['WO-2609-11','B 座 3F 喷淋头更换 12 只','1.20','报修工单 WD-0916',tg('g','已确收 · 已开票')],
    ['WO-2609-08','主机回路板维修','0.86','报修工单 WD-0912',tg('b','待确收')],
    ['WO-2608-21','防排烟风机保养（保外）','2.40','巡检发现',tg('y','已开票待收款')]
   ]},
   {id:'pay',name:'收款 / 续签',type:'tbl',headers:['类型','金额(万)','计划日期','状态','说明'],rows:[
    ['年度维保费','36.00','2026-10-01',tg('g','已开票'),'首期'],
    ['续签商机','36.00','2027-09',tg('y','跟进中'),'续签 1 年'],
    ['满意度','—','—',tg('g','4.8 分 / 5'),'业主评价 32 条']
   ]},
   {id:'links',name:'穿透视图',type:'links',links:['项目 360°','巡检线路计划','派工单 / 报修工单','维修订单','业主满意度','续签商机']}
  ]
 },
 cert:{
  sid:'bid',crumb0:'市场投标',crumb1:'证书证件管理',short:'企业资质证书',title:'消防设施维护保养检测资质（一级）',primaryAct:'续期申请',scan:true,
  head:[
   {sec:'证书信息',kvs:[['证书编号','XFXW-1-2609-088'],['发证机关','省消防救援总队'],['发证日期','2021-12-12'],['有效期至','2026-12-12']]},
   {sec:'状态',kvs:[['当前状态',tg('y','有效 · 黄色预警')],['倒计时','87 天（60 天预警已触发）'],['存放位置','总部档案室 A2'],['电子扫描件','PDF · 2.4MB']]},
   {sec:'责任',kvs:[['责任部门','商务部'],['责任人','刘畅'],['提醒设置','提前 90 / 60 / 30 天'],['年检记录','2025-12 已年检 ✓']]},
   {sec:'投标占用',kvs:[['关联投标','XX体育馆消防专项'],['是否入业绩资质包',tg('b','已加入 2 个证书包')],['借出状态',tg('gray','未借出')],['审计','本周被查看 3 次']]}
  ],
  risk:['距到期 87 天：延续申请需在到期前 60 天提交，请立即启动'],
  tabs:[
   {id:'remind',name:'倒计时提醒',type:'kv',groups:[
    {sec:'预警配置（多级）',kvs:[['提前 90 天','已触发（87 天）· 推送责任人 刘畅'],['提前 60 天','到期前 60 天延续申请截止 → 建议立即启动'],['提前 30 天','未触发'],['续期 / 复训任务','延续申请 · 责任人 刘畅 · 待提交']]},
    {sec:'当前倒计时',kvs:[['剩余天数','87 天（2026-12-12 到期）'],['状态',tg('y','黄色预警')],['处置时限','须在 2026-10-13 前提交延续申请'],['应急备用','无（建议加急）']]}
   ]},
   {id:'edu',name:'年检 / 继续教育',type:'tbl',headers:['类型','日期','结果','下次到期'],rows:[
    ['年度检验 / 年审','2025-12-20',tg('g','合格'),'2026-12-20'],
    ['继续教育（24 学时）','2026-06-15',tg('g','已完成'),'2027-06-15'],
    ['延续注册 / 复训','2026-09-14',tg('y','已报名 · 待考试'),'—']
   ]},
   {id:'renew',name:'延期 / 变更记录',type:'tbl',headers:['类型','日期','变更前','变更后','操作人'],rows:[
    ['地址变更备案','2023-12-18','昆明市 A 区','昆明市 B 区','系统导入'],
    ['法人变更同步','2024-05-10','—','王志明','商务部'],
    ['证书延续（上次）','2021-12-12','—','有效期至 2026-12-12','省消防救援总队']
   ]},
   {id:'info',name:'基本信息',type:'kv',groups:[
    {sec:'延续 / 变更记录',kvs:[['2026-09-14','发起延续申请（待提交）'],['2025-12-20','年度检验合格'],['2023-12-18','地址变更备案']]},
    {sec:'使用建议',kvs:[['可投标类型','维保 / 检测 / 评估'],['有效期要求','开标日在有效期内'],['备用证书','无（建议加急）']]}
   ]},
   {id:'borrow',name:'借还记录',type:'tbl',headers:['借出人','用途','借出日期','约定归还','归还日期','状态'],rows:[
    ['刘畅','XX体育馆投标','09-14','09-25','—',tg('b','借出中')],
    ['孙倩','客户资质报验','08-10','08-20','08-19',tg('g','已归还')],
    ['周凯','银行保函','07-02','07-12','07-11',tg('g','已归还')]
   ]},
   {id:'bid',name:'关联投标 / 项目',type:'tbl',headers:['关联对象','类型','使用日期','是否入资质包','结果'],rows:[
    ['XX体育馆消防专项','投标','09-14',tg('b','已入包'),tg('o','评标中')],
    ['XX医院门诊楼改造','投标','09-05',tg('b','已入包'),tg('g','已中标')],
    ['XX厂房维保（2026）','合同履约备查','08-01',tg('gray','未入包'),tg('gray','履约中')]
   ]},
   {id:'audit',name:'审计轨迹',type:'tbl',headers:['时间','操作人','操作','IP'],rows:[
    ['09-16 10:32','王悦','查看扫描件（带水印）','10.8.21.7'],
    ['09-15 14:05','刘畅','发起借出','10.8.20.3'],
    ['09-14 09:20','系统','到期提醒推送（90 天）','内部任务']
   ]}
  ]
 },
 material:{
  sid:'buy',crumb0:'采购仓储',crumb1:'材料主数据',short:'WL-0101',title:'WL-0101 · 镀锌钢管 DN100',primaryAct:'维护价格',
  head:[
   {sec:'基本信息',kvs:[['材料编码','WL-0101（自动生成 · 不可编辑）'],['名称 / 品牌 / 型号','镀锌钢管 · 华信管业 · DN100'],['材质 / 规格','热镀锌钢管 · 6m/根'],['分类路径','消防水系统 / 管材 / 管件'],['类型',tg('b','材料')],['状态',tg('g','启用')]]},
   {sec:'单位与控制',kvs:[['主单位 / 采购单位','m / m（1m = 1m）'],['库存 / 计价单位','m / m'],['主材 / 辅材',tg('b','主材')],['控制方式',tg('b','量价双控')],['关联成本科目','cost_item 01-01（消防水系统 / 管材）']]}
  ],
  risk:['灭火器 / 风阀执行器库存低于安全线，建议一键生成采购申请或询价','量价双控：预算量 12,000 m，已申请 8,400 m，剩余 3,600 m'],
  tabs:[
   {id:'info',name:'基本信息',type:'kv',groups:[
    {sec:'核心技术参数（首屏）',kvs:[['公称直径','DN100'],['压力等级','≤1.6 MPa'],['材质','热镀锌钢管'],['执行标准','GB/T 3091']]},
    {sec:'单位与换算',kvs:[['主单位','m（默认）'],['采购单位 / 换算','m（1m = 1m）'],['库存单位 / 换算','m'],['计价单位 / 换算','m']]},
    {sec:'其他',kvs:[['适用项目类型','新建 / 改造'],['等级 / 备注','一级消防 · 通用'],['创建人 / 时间','李敏 · 2026-08-12'],['替代料','WL-0102 衬塑钢管']]}
   ]},
   {id:'purch',name:'采购与供应商',type:'sub',
    groups:[
     {sec:'采购参数',kvs:[['默认供应商',tg('g','华信管业 · 供应商编码 HS-011')],['最小起订量 MOQ','100 m'],['采购提前期 Lead Time','3 天'],['税率','13%'],['需询价','是（>¥2 万自动发起询比价）']]},
     {sec:'供应商列表',kvs:[['华信管业','A级 · 月结 30 天 · 12 单 ¥486 万'],['金桥物资','B级 · 货到付款 · 3 单 ¥52 万'],['正泰消防','B级 · 月结 60 天 · 2 单 ¥31 万']]}
    ],
    headers:['供应商','评级','账期','历史合同','最近订单'],rows:[
     ['华信管业',tg('g','A级'),'月结 30 天','12 单 · ¥486 万','09-08 ¥96.4 万'],
     ['金桥物资',tg('y','B级'),'货到付款','3 单 · ¥52 万','07-22 ¥18.6 万'],
     ['正泰消防',tg('y','B级'),'月结 60 天','2 单 · ¥31 万','06-30 ¥12.4 万']]},
   {id:'cost',name:'价格与成本',type:'sub',
    groups:[
     {sec:'价格库权威视图（自动沉淀）',kvs:[['说明','本页为价格权威视图：询价 / 合同 / 入库 / 结算价自动沉淀，来源单据可穿透'],['当前生效版本',tg('b','V2 · 2026-09-12（历史 V1 可对比 / 恢复）')]]},
     {sec:'控制与成本',kvs:[['控制方式',tg('b','量价双控')],['关联成本科目','cost_item 01-01（预算量 12,000 m · 预算价 168.0）'],['版本差异','V1→V2：入库价 163.2 沉淀（差异 +0.8）'],['执行价预警','偏离参考价 >5% 标红 · 低于成本价阻断']]},
     {sec:'价格版本',kvs:[['V1 · 2026-08-12','参考价 166.0（初始）'],['V2 · 2026-09-12','当前：参考价 168.0 · 询价 166.0 · 合同 164.0 · 入库 163.2 · 结算 163.8']]}
    ],
    headers:['日期','价格类型','价格(元/m)','供应商 / 来源','区域','来源穿透'],rows:[
     ['09-15','入库价','163.2','华信管业','昆明',tg('b','入库单 RK-2609-21')],
     ['09-12','询价价','166.0','金桥物资（询比价）','昆明',tg('b','询价单 XJ-2609-05')],
     ['09-08','合同价','164.0','华信管业','昆明',tg('b','合同 CG-2609-08')],
     ['08-28','结算价','163.8','华信管业','昆明',tg('b','结算单')],
     ['08-15','市场价','176.0','信息价（2026-08）','云南省',tg('gray','信息价')]]},
   {id:'inv',name:'库存与批次',type:'sub',
    groups:[
     {sec:'库存概览',kvs:[['安全库存','1,000 m'],['在途量','600 m（PO-2609-31）'],['可用量','4,100 m（现有 3,240 + 在途 600 - 安全 1,000 + 现场 860）'],['库存预警','灭火器 / 风阀执行器 低于安全线']]}
    ],
    headers:['批次号','仓库','入库日期','数量','批次二维码','来源'],rows:[
     ['PC-2609-02','公司主仓 A','09-15','1,200 m',tg('b','查看 / 打印'),'RK-2609-21'],
     ['PC-2608-18','公司主仓 A','08-28','2,040 m',tg('b','查看 / 打印'),'RK-2608-11'],
     ['PC-2607-06','项目现场仓','07-12','860 m',tg('b','查看 / 打印'),'调拨自主仓 A']]},
   {id:'cert',name:'资质与附件',type:'kv',groups:[
    {sec:'资质文件（到期预警）',kvs:[['产品合格证','PDF · 已归档 · 有效期 2027-06'],['检测 / 检验报告',tg('y','PDF · 2027-03 到期（90 天预警）')],['3C 认证','3C-XXXXX · 已核验'],['产品图片','4 张 · 可加水印']]},
    {sec:'说明',kvs:[['进场要求','消防产品进场需 3C 认证及型式检验报告'],['缺失影响','资料缺失会影响验收与收款']]}
   ]},
   {id:'trace',name:'使用追溯与日志',type:'sub',
    groups:[
     {sec:'Used in（引用统计）',kvs:[['项目','2 个（XX产业园 · 3 单 / XX医院 · 1 单）'],['报价单','2 份（BJ-2609-05 含价 · BJ-2609-08 仅清单）'],['合同 / 订单 / 入库','合同 1 · 订单 1 · 入库 1'],['领用','1 笔（WM-2609-02 维保班组）']]},
     {sec:'引用明细（同一材料可被 N 个项目 / N 个报价单 / N 个合同 / N 个订单 / N 个入库单引用，逐条独立并可穿透）',kvs:[
      ['项目','XX产业园 · 施工合同 HT-2609-06 · 3 单 · <span class="link-btn" data-toast="演示：穿透到项目 XX产业园（3 单）">穿透</span><br>XX医院 · 施工合同 HT-2609-02 · 1 单 · <span class="link-btn" data-toast="演示：穿透到项目 XX医院（1 单）">穿透</span>'],
      ['报价单','BJ-2609-05（含价）· <span class="link-btn" data-toast="演示：穿透到报价单 BJ-2609-05">穿透</span><br>BJ-2609-08（仅清单）· <span class="link-btn" data-toast="演示：穿透到报价单 BJ-2609-08">穿透</span>'],
      ['合同 / 订单 / 入库','CG-2609-08（材料采购合同）· <span class="link-btn" data-toast="演示：穿透到合同 CG-2609-08">穿透</span><br>PO-2609-31（框架子订单）· <span class="link-btn" data-toast="演示：穿透到订单 PO-2609-31">穿透</span><br>RK-2609-21（AI 拍照入库 1,200 m）· <span class="link-btn" data-toast="演示：穿透到入库单 RK-2609-21">穿透</span>'],
      ['领用','WM-2609-02（维保班组 · 已出库）· <span class="link-btn" data-toast="演示：穿透到领用单 WM-2609-02">穿透</span>']]},
     {sec:'变更记录（留痕）',kvs:[['单价修改','22.0 → 20.0（李敏 · 09-11）'],['删除项','删除自动扣减大项金额（已同步预算）']]},
     {sec:'循环穿透',kvs:[['可跳转','供应商 → 合同 → 订单 → 入库 → 发票 → 付款 → 项目（反向跳转回材料）']]}
    ],
    headers:['时间','操作人','动作','说明'],rows:[
     ['09-15 14:20','李敏','入库确认','RK-2609-21 · AI 拍照入库 1,200 m'],
     ['09-12 10:05','孙倩','价格沉淀','询价 XJ-2609-05 → 价格库 V2'],
     ['09-08 09:30','王强','打印二维码','现场批次 PC-2608-18 出库扫码'],
     ['08-12 11:00','李敏','创建','新建材料主数据 WL-0101']]}
  ]
 }
};
var QUOTE_SHEET={co:'诺盾博达科技有限公司',slogan:'专业消防 · 智慧守护',status:tg('g','审批通过 · 正式报价单'),
 meta:[['客户 / 商机','XX医院基建处 · 二期'],['报价单号','BJ-2609-05'],['报价日期','2026-09-16'],['有效期','30 天（至 10-16）']],
 groups:[
  {name:'一、消防水系统',rows:[
   ['1','镀锌钢管（管网安装）','DN100 · 含辅材','m','3,200','181.40','580,480'],
   ['2','喷淋头','ZSTX15 68℃','只','8,600','32.40','278,640'],
   ['3','湿式报警阀组','DN150 · 含附件','套','4','18,600','74,400']]},
  {name:'二、消防电 / 报警系统',rows:[
   ['4','点型光电感烟探测器','JTY-GD-3000','只','1,240','92.90','115,196'],
   ['5','火灾报警控制器','联动型 · 2 回路','台','2','26,800','53,600'],
   ['6','报警系统调试','全系统联动','项','1','86,000','86,000']]},
  {name:'三、防排烟系统',rows:[
   ['7','防火卷帘','双轨双帘 4㎡（策略价）','㎡','420','586.00','246,120']]}],
 totals:[['合计（未税）','¥1,434,436'],['税率 9%','¥129,099'],['含税总价','¥1,563,535'],['成本测算','¥1,201,800'],['毛利率',tg('g','23.0%')]],
 terms:[['付款方式','合同签订 30% · 货到 40% · 验收 25% · 质保金 5%'],['质保期','24 个月'],['交付周期','合同生效后 60 天'],['报价说明','本报价含运输、安装、调试；不含土建配合费']],
 primaryAct:'生成正式 PDF'};
var QUOTE_SHEET_2={
 id:'BJ-2609-08',projName:'XX物流园智慧消防硬件清单',co:'诺盾博达科技有限公司',slogan:'让每一次消防改造都有据可依',status:tg('b','待客户确认 · 仅清单报价'),
 meta:[['报价单号','BJ-2609-08'],['客户','XX物流园运营有限公司'],['项目','XX物流园智慧消防硬件清单'],['报价类型','仅清单（总价以合同约定为准）']],
 groups:[
  {name:'一、B102 办公楼 · 硬件设备需求',headers:['序号','设备或材料名称','技术参数','单位','数量'],rows:[
   ['1','导轨式三相多功能电能表','参比电压：3×380V；等级：0.5S级；输入电流：3×1(6)A互感器外置；通讯接口：RS-485;通讯协议：Modbus RTU。','台','1'],
   ['2','开口式电流互感器','等级：0.5级，400/5。','只','3'],
   ['3','三相导轨式多功能电能表','参比电压：3×380V；等级：0.5S级，通讯接口:RS-485;通讯协议：Modbus RTU;供电：DC9-36V。','只','1'],
   ['4','电流互感器','电流变比：80mA/400A','只','3'],
   ['5','机架式工业以太网交换机','16路百兆光口和8路百兆电口；支持端口流量控制、双电源掉电告警；IP40防护，-40°C~+75°C','台','1'],
   ['6','火灾报警采集网关','通过CAN接口采集火灾自动报警主机数据，解析存储后经光缆传输至管理平台，支持远程诊断与反向控制（消音/复位/屏蔽等）','个','1'],
   ['7','吊顶石膏板','规格：600×600×6mm，颜色：白色','块','15'],
   ['8','机架式工业以太网交换机（核心）','千兆三层全管理增强型，24个千兆电口，4个千兆光口，19英寸1U标准机架，金属外壳','台','1']]},
  {name:'二、平台软件与数字孪生（部署项）',headers:['序号','部署项名称','说明','单位','数量'],rows:[
   ['9','智慧消防管理平台（标准版）','含设备接入、告警中心、报告生成；不含深度数据对接','套','1'],
   ['10','数字孪生楼层模型（B102）','含楼层平面图与设备点位绑定','栋','1'],
   ['11','系统联调与培训','含现场联调、操作培训、验收资料','项','1']]}],
 totals:[['报价方式','仅清单 · 总价以合同约定为准'],['合同约定总价','¥ 1,860,000（本清单不体现单价，具体以双方合同约定为准）']],
 terms:[['清单用途','本合同约定总价的供货范围 / 设备材料清单附件'],['交付周期','合同生效后 60 天'],['说明','本清单仅列设备与材料需求，不含单价；结算按合同约定总价执行']],
 primaryAct:'转合同'};

/* ============ 渲染引擎 ============ */
/* ---- 全局搜索 ---- */
var GDATA=[
 {cat:'项目',icon:'clip',items:[
  {t:'XX国际大厦消防改造',d:'工程项目 · 进行中 72% · 王强'},
  {t:'XX产业园喷淋系统工程',d:'工程项目 · 进行中 48% · 李敏'},
  {t:'XX医院门诊楼报警系统',d:'工程项目 · 待消防检测 · 赵磊'},
  {t:'XX物流园消防工程',d:'工程项目 · 延期风险 · 周凯'}]},
 {cat:'合同',icon:'file',items:[
  {t:'HT-2609-18 主合同 · XX产业园',d:'金额 ¥386万 · 履约中'},
  {t:'ZC-2608-19 支出合同 · 报警设备',d:'金额 ¥68.9万 · 超结算付款预警'}]},
 {cat:'设备',icon:'radio',items:[
  {t:'YG-2F-012 烟感探测器',d:'2F 东走廊 · 火警'},
  {t:'ZJ-B2-01 消防主机',d:'2F 消控室 · 在线'},
  {t:'XSF-B1-01 水压变送器',d:'B1 泵房 · 低于阈值'}]},
 {cat:'工单',icon:'tool',items:[
  {t:'GD-2609-118 主机离线处置',d:'紧急 · 处理中 · 张伟'},
  {t:'BX-2609-018 防火门闭门器损坏',d:'处理中 · 王芳 · 预约 09-17'}]},
 {cat:'人员',icon:'users',items:[
  {t:'王志明 · 项目经理',d:'华东一区 · 工程交付部'},
  {t:'张伟 · 维保工程师',d:'维保服务中心 · 今日值班'}]}
];
var GRECENT=['XX大厦消防改造','主机离线','防火卷帘'];
var ROOMS=[[2,8,40,36,'办公区'],[46,8,26,36,'机房'],[76,8,22,36,'设备间'],[2,52,96,42,'走廊']];
/* ===== 剩余模块按序落地映射（追加在文件末尾，确保最后执行覆盖旧 config/别名） ===== */
PAGES['cost.树状成本科目']={custom:'costtree'};
PAGES['cost.变更签证']={custom:'costchange'};
PAGES['cost.销项管理']={custom:'costwriteoff'};
PAGES['cost.付款申请']={custom:'payreq'};
PAGES['cost.智能业务洞察']={custom:'payinsight'};
PAGES['cost.自动开票任务']={custom:'autoinvoice'};
PAGES['cost.自动收票挂接']={custom:'autorecv'};
PAGES['cost.发票台账']={custom:'invoicelib'};
PAGES['cost.同项目多供应商付款决策']={custom:'suppay'};
PAGES['buy.采购合同 / 订单']={custom:'poorder'};
PAGES['buy.出库 / 领用']={custom:'outbound'};
PAGES['buy.归还 / 报废']={custom:'returnscrap'};
PAGES['buy.批次 / 二维码']={custom:'batchqr'};
PAGES['buy.盘点']={custom:'stocktake'};
PAGES['buy.超量超价预警']={custom:'overwarn'};
PAGES['doc.里程碑资料目录']={custom:'doctree'};
PAGES['doc.缺失提醒']={custom:'docmiss'};
PAGES['doc.智能归档']={custom:'docarch'};
PAGES['doc.工程 / 财务审核']={custom:'docaudit'};
PAGES['doc.报告模板']={custom:'reptpl'};
PAGES['doc.报告生成']={custom:'repgen'};
PAGES['doc.报告下载']={custom:'repdown'};
PAGES['doc.验收资料']={custom:'acceptdoc'};
PAGES['doc.标准验收单']={custom:'acceptstd'};
PAGES['doc.交付物料包']={custom:'deliverpack'};
PAGES['oa.费用报销']={custom:'oaexp'};
PAGES['oa.公告']={custom:'oanotice'};
PAGES['oa.收发文']={custom:'oadoc'};
PAGES['oa.用印 / 证件']={custom:'oaseal'};
PAGES['oa.人事档案']={custom:'oahr'};
PAGES['oa.用车']={custom:'oacar'};
PAGES['oa.日程']={custom:'oacal'};
PAGES['oa.已办 / 我发起']={custom:'oadone'};
PAGES['oa.消息通知']={custom:'oamsg'};
PAGES['biz.项目 360 组合看板']={custom:'bizboard'};
PAGES['biz.老板驾驶舱']={custom:'bizboss'};
PAGES['biz.项目经营报表']={custom:'bizreport'};
PAGES['biz.回款节点提醒']={custom:'bizmoney'};
PAGES['biz.应收 / 已开票未回款']={custom:'bizmoney'};
PAGES['biz.质保金到期提醒']={custom:'bizmoney'};
PAGES['biz.现金流报表']={custom:'bizmoney'};
PAGES['biz.风险总览']={custom:'bizrisk'};
PAGES['biz.资金风险']={custom:'bizrisk'};
PAGES['biz.合同风险']={custom:'bizrisk'};
PAGES['biz.税务风险']={custom:'bizrisk'};
PAGES['biz.采购风险']={custom:'bizrisk'};
PAGES['biz.安全风险']={custom:'bizrisk'};
PAGES['biz.成本风险']={custom:'bizrisk'};
PAGES['biz.供应商 / 客户风险项']={custom:'bizrisk'};
PAGES['biz.待我审批']={custom:'bizappr'};
PAGES['biz.智能业务洞察记录']={custom:'bizinsight'};
PAGES['sys.组织人员']={custom:'sysorg'};
PAGES['sys.角色权限']={custom:'sysrole'};
PAGES['sys.租户管理']={custom:'systemant'};
PAGES['sys.模块市场']={custom:'sysmarket'};
PAGES['sys.租户计费 / 版本']={custom:'sysbill'};
PAGES['sys.API 集成']={custom:'sysapi'};
PAGES['sys.PaaS 低代码配置']={custom:'syspaas'};
PAGES['sys.安全日志']={custom:'syslog'};
PAGES['sys.数据备份']={custom:'sysbackup'};
PAGES['owner.项目列表']={custom:'ownproj'};
PAGES['owner.进度查看']={custom:'ownproj'};
PAGES['owner.现场照片']={custom:'ownproj'};
PAGES['owner.消防报告下载']={custom:'ownrep'};
PAGES['owner.验收确认']={custom:'ownrep'};
PAGES['owner.整改通知查看']={custom:'ownrep'};
PAGES['owner.在线报修']={custom:'ownrepair'};
PAGES['owner.我的报修工单进度']={custom:'ownrepair'};
PAGES['owner.满意度评价']={custom:'ownrepair'};
PAGES['owner.账单 / 回款对账']={custom:'ownbill'};
PAGES['ext.待报价询价']={custom:'extinq'};
PAGES['ext.已报价 / 历史报价']={custom:'extinq'};
PAGES['ext.采购订单']={custom:'extorder'};
PAGES['ext.送货 / 收货确认']={custom:'extorder'};
PAGES['ext.对账单']={custom:'extsettle'};
PAGES['ext.结算单']={custom:'extsettle'};
PAGES['ext.收票 / 发票确认']={custom:'extsettle'};
PAGES['edu.企业 / 行业知识']={custom:'eduknow'};
PAGES['edu.故障库']={custom:'edufault'};
PAGES['edu.规范案例']={custom:'eduknow'};
PAGES['iot.设备台账']={custom:'iotasset'};
PAGES['iot.IoT 点位']={custom:'iotasset'};
PAGES['iot.孪生对象绑定']={custom:'iotasset'};
PAGES['iot.项目 / 维保关联']={custom:'iotasset'};
PAGES['iot.3D / BIM 可视化']={custom:'iotscene'};
PAGES['iot.楼层平面图']={custom:'iotscene'};
PAGES['iot.设备点位状态']={custom:'iotscene'};
PAGES['iot.实时监测']={custom:'iotmon'};
PAGES['iot.告警中心']={custom:'iotmon'};
PAGES['iot.预测性维护']={custom:'iotmon'};
PAGES['iot.告警转调度工单']={custom:'iotmon'};
PAGES['iot.设备历史工单']={custom:'iotreport'};
PAGES['iot.维修记录']={custom:'iotreport'};
PAGES['iot.巡检报告']={custom:'iotreport'};
PAGES['site.施工日志']={custom:'sitelog'};
PAGES['site.现场收货 / 领用']={custom:'siterecv'};
PAGES['site.项目后评估']={custom:'siterv'};
PAGES['site.补充协议']={custom:'sitesupp'};
PAGES['site.签证资料回传']={custom:'sitevisa'};
PAGES['site.工期倒计时 / 逾期预警']={custom:'sitecount'};
PAGES['bid.企业资质证书']={custom:'bidcert'};
PAGES['bid.人员证书']={custom:'bidcert'};
PAGES['bid.证书借还与归还']={custom:'bidcert'};

/* ===== 2026-09-17 新增页面修正：菜单语义对齐 ===== */
PAGES['cost.先发生后关联 / 未关联数据']={custom:'costwriteoff'};
PAGES['edu.价格库']={custom:'eduknow'};

/* ============ 菜单合并 V2（2026-09-18）：新菜单名 → 页面 ============ */
PAGES['biz.经营看板']={custom:'bizboardt',pills:[],filters:[]};
PAGES['biz.回款与资金']={custom:'bizmoney',pills:[],filters:[]};
PAGES['biz.风险中心']={custom:'bizrisk',pills:[],filters:[]};
PAGES['biz.审批与洞察']={custom:'bizapprt',pills:[],filters:[]};
PAGES['bid.商机与漏斗']={custom:'oppfunnelt',pills:[],filters:[]};
PAGES['bid.证书台账']={custom:'certledgert',pills:[],filters:[]};
PAGES['bid.节点看板']=PAGES['bid.报名 / 保证金 / 节点看板'];
PAGES['bid.丢标分析']=PAGES['bid.未中标原因分析'];
PAGES['bid.报价单']=PAGES['bid.报价单列表 / 打印'];
PAGES['bid.价格库引用']=PAGES['bid.价格库 / 内部定额'];
PAGES['cost.合同录入（AI/OCR）']=PAGES['cost.新建与 AI/OCR 录入'];
PAGES['cost.合同模板']={pills:[['全部',6],['销售合同',2],['采购合同',2],['维保合同',2]],filters:[['适用方向',['全部','销售 / 收入','采购 / 支出']],['类型',['全部','工程合同','材料 / 劳务','框架合同','维保合同']],F_OWN],
 cols:['模板名称','适用方向','类型','版本','使用次数','更新时间','操作'],
 rows:[
 ['销售合同标准模板（2026）','销售 / 收入','工程合同','V5','38','09-10',tg('b','使用')],
 ['采购合同标准模板（2026）','采购 / 支出','材料 / 劳务','V4','26','09-08',tg('b','使用')],
 ['维保合同模板（年度）','销售 / 收入','维保合同','V3','19','09-05',tg('b','使用')],
 ['框架合同 + 子订单模板','采购 / 支出','框架合同','V2','8','08-28',tg('b','使用')],
 ['分包合同模板（含扣款条款）','采购 / 支出','劳务分包','V2','12','08-20',tg('b','使用')]]};
PAGES['cost.合同变更 / 版本']={pills:[['全部',14],['待审批',3],['已生效',7],['已作废',4]],filters:[['变更类型',['全部','补充协议','签证','价格调整','工期顺延']],F_OWN,F_TIME],
 cols:['变更单','合同','变更类型','金额增减(万)','原因','版本','状态','操作'],
 rows:[
 ['BC-01','HT-2609-18 · XX产业园喷淋系统','补充协议','0.00','工期顺延 15 天','V3→V4',tg('o','客户签署中'),tg('b','查看对比')],
 ['BG-02','HT-2609-18 · XX产业园喷淋系统','签证','-1.20','管网分支设计变更（22 改 20 留痕）','V2',tg('g','已生效'),tg('b','查看留痕')],
 ['BQ-03','HT-2609-18 · XX产业园喷淋系统','签证','+0.80','3F 增加手动报警按钮 6 只','V2',tg('g','已生效'),tg('b','查看留痕')],
 ['BC-02','ZC-2609-08 · 喷淋主材采购','价格调整','-0.30','市场价回落，量价双控重算','V2',tg('y','待审批'),tg('b','查看对比')]]};
PAGES['cost.循环穿透']={pills:[['全部',3],['销售链路',1],['采购链路',2]],filters:[['链路类型',['全部','合同 → 项目 → 供应商 → 订单 → 入库 → 发票 → 付款 → 项目']]],
 cols:['链路','起点','途经单据','终点','穿透说明','操作'],
 rows:[
 ['销售合同链路','HT-2609-18 销售合同','项目 PJ-2609-02 → 客户 XX产业园','回项目 360°',tg('g','可逆穿透'),tg('b','演示穿透')],
 ['采购合同链路','ZC-2609-08 采购合同','供应商华信管业 → 订单 PO-2609-31 → 入库 RK-2609-31 → 发票 → 付款','回合同台账',tg('g','可逆穿透'),tg('b','演示穿透')],
 ['维保工单链路','WD-0916 报修工单','维修订单 WO-2609-11 → 开票 → 收款 → 满意度','回维保项目',tg('g','可逆穿透'),tg('b','演示穿透')]]};
PAGES['cost.变更签证']={custom:'costchange',pills:[],filters:[]};
PAGES['cost.销项管理']={custom:'costwriteoff',pills:[],filters:[]};
PAGES['cost.付款申请']={custom:'payreq',pills:[],filters:[]};
PAGES['cost.智能业务洞察']={custom:'payinsight',pills:[],filters:[]};
PAGES['cost.自动票税']={custom:'autotaxt',pills:[],filters:[]};
PAGES['cost.发票台账']={custom:'invoicelib',pills:[],filters:[]};
PAGES['cost.同项目多供应商付款决策']={custom:'suppay',pills:[],filters:[]};
PAGES['buy.采购合同 / 订单']={custom:'poorder',pills:[],filters:[]};
PAGES['buy.出库与领用归还']={custom:'outboundt',pills:[],filters:[]};
PAGES['buy.盘点']={custom:'stocktake',pills:[],filters:[]};
PAGES['buy.超量超价预警']={custom:'overwarn',pills:[],filters:[]};
PAGES['site.竣工验收']=PAGES['site.竣工验收 / 资料归档'];
PAGES['site.项目后评估']={pills:[['全部',4],['已评估',2],['待评估',2]],filters:[['项目类型',['全部','新建','改造','维保']],F_TIME],
 cols:['项目','类型','评估维度（进度/成本/质量/回款）','综合评分','经验沉淀','评估日期','状态'],
 rows:[
 ['PJ-2608-11 XX商业广场综合体','新建','4 维','86',tg('b','已沉淀 3 条'),'08-30',tg('g','已评估')],
 ['PJ-2609-02 XX产业园一期喷淋系统','新建','4 维','—','待复盘','—',tg('y','待评估')],
 ['PJ-2609-01 XX医院二期消防改造','改造','4 维','—','待复盘','—',tg('y','待评估')]]};
PAGES['site.资料归档']={custom:'docarcht',pills:[],filters:[]};
PAGES['site.消防报告']={custom:'docrept',pills:[],filters:[]};
PAGES['site.验收交付']={custom:'docacct',pills:[],filters:[]};
PAGES['wm.设备资产']={custom:'iotasset',pills:[],filters:[]};
PAGES['wm.孪生场景']={custom:'iotscene',pills:[],filters:[]};
PAGES['wm.IoT 监测与告警']={custom:'iotmon',pills:[],filters:[]};
PAGES['wm.设备报告']={custom:'iotreport',pills:[],filters:[]};
PAGES['oa.公告与收发文']={custom:'oadoct',pills:[],filters:[]};
PAGES['oa.用车与日程']={custom:'oacart',pills:[],filters:[]};
PAGES['oa.待办与消息中心']={custom:'oamsgt',pills:[],filters:[]};
PAGES['oa.知识库']={custom:'eduknowt',pills:[],filters:[]};
PAGES['oa.考试与培训']={pills:[['全部',12],['进行中',3],['未开始',5],['已结束',4]],filters:[['类型',['全部','岗前培训','年度复训','新规宣贯']],F_OWN,F_TIME],
 cols:['考试 / 培训','类型','对象','时间','通过率','关联证书','状态'],
 rows:[
 ['消防设施操作员岗前考试（9 月）','岗前考试','操作员 12 人','09-20',tg('g','92%'),'操作员证','进行中'],
 ['维保工程师年度复训','年度复训','工程师 8 人','09-25','—','维保资质','未开始'],
 ['GB25201-2026 新规宣贯','新规宣贯','全员','10-10','—','—','未开始'],
 ['低压电工特种作业复审','复审考试','电工 3 人','08-30',tg('g','100%'),'特种作业证','已结束']]};
PAGES['oa.岗位资格']={pills:[['全部',28],['持证上岗',24],['待复核',3],['资格不符',1]],filters:[['岗位',['全部','维保项目负责人','消防设施操作员','电工','检测评估人员']],['证书状态',['全部','有效','临期','过期']]],
 cols:['岗位','人员','要求证书','证书状态','上岗资格','到期复核','操作'],
 rows:[
 ['维保项目负责人','王海','一级注册消防工程师','有效 · 183 天',tg('g','可上岗'),'2027-03-18',tg('b','查看')],
 ['维保项目负责人','陈军','一级注册消防工程师','有效 · 96 天',tg('g','可上岗'),'2026-12-22',tg('b','查看')],
 ['消防设施操作员','李强','操作员中级','临期 · 32 天',tg('y','待复核'),'2026-10-20',tg('b','安排复训')],
 ['电工','周凯','低压电工特种作业证','已过期 17 天',tg('r','不可上岗'),'—',tg('b','停岗处理')]]};
PAGES['sys.组织与权限']={custom:'sysorgt',pills:[],filters:[]};
PAGES['sys.模块与计费']={custom:'sysmarkett',pills:[],filters:[]};
PAGES['sys.集成与运维']={custom:'sysapit',pills:[],filters:[]};
/* 业主 / 外部门户（原键名保持不变，显式确认） */
PAGES['owner.项目列表']={custom:'ownproj',pills:[],filters:[]};
PAGES['owner.进度查看']={custom:'ownproj',pills:[],filters:[]};
PAGES['owner.现场照片']={custom:'ownproj',pills:[],filters:[]};
PAGES['owner.消防报告下载']={custom:'ownrep',pills:[],filters:[]};
PAGES['owner.验收确认']={custom:'ownrep',pills:[],filters:[]};
PAGES['owner.整改通知查看']={custom:'ownrep',pills:[],filters:[]};
PAGES['owner.在线报修']={custom:'ownrepair',pills:[],filters:[]};
PAGES['owner.我的报修工单进度']={custom:'ownrepair',pills:[],filters:[]};
PAGES['owner.满意度评价']={custom:'ownrepair',pills:[],filters:[]};
PAGES['owner.账单 / 回款对账']={custom:'ownbill',pills:[],filters:[]};
PAGES['ext.待报价询价']={custom:'extinq',pills:[],filters:[]};
PAGES['ext.已报价 / 历史报价']={custom:'extinq',pills:[],filters:[]};
PAGES['ext.采购订单']={custom:'extorder',pills:[],filters:[]};
PAGES['ext.送货 / 收货确认']={custom:'extorder',pills:[],filters:[]};
PAGES['ext.对账单']={custom:'extsettle',pills:[],filters:[]};
PAGES['ext.结算单']={custom:'extsettle',pills:[],filters:[]};
PAGES['ext.收票 / 发票确认']={custom:'extsettle',pills:[],filters:[]};

/* ---- 2026-09-18 评审修复：菜单映射断链（site.目标成本 / cost.风险与业务助手） ---- */
PAGES['site.目标成本']=PAGES['cost.目标成本'];
PAGES['cost.风险与业务助手']=PAGES['cost.风险中心与业务助手'];

/* ---- 2026-09-18 菜单合并 V3（合同成本 + 采购仓储）：新菜单名 → Tab 合并页；旧菜单 key 全部保留作兼容 ---- */
PAGES['cost.框架与专项合同']={custom:'costfw',pills:[],filters:[]};
PAGES['cost.合同录入与模板']={custom:'costin',pills:[],filters:[]};
PAGES['cost.合同审批与变更']={custom:'costap',pills:[],filters:[]};
PAGES['cost.履约结算与穿透']={custom:'costfu',pills:[],filters:[]};
PAGES['cost.目标成本与清单']={custom:'costtc',pills:[],filters:[]};
PAGES['cost.销项与未关联']={custom:'costwriteoff',pills:[],filters:[]};
PAGES['cost.付款与智能洞察']={custom:'costpay',pills:[],filters:[]};
PAGES['cost.票税与发票']={custom:'costinv',pills:[],filters:[]};
PAGES['buy.供应商库']={custom:'buysup',pills:[],filters:[]};
PAGES['buy.量价双控与超量超价预警']={custom:'buycmp',pills:[],filters:[]};
`,ma=`// 消安云平台 · 页面分片骨架（原 app-pages.js 拆分后）
// 本文件仅保留：全局状态（var）+ customHTML 分派入口；
// 各业务页面渲染函数已拆至 pages/<函数名>.js，由 index.tsx 拼接加载。

var wbMode='price';

var cnStep=0,cnEdit=false;

var CN_STEPS=['选择项目与类型','基本信息（AI/OCR 回填）','清单与付款计划','审批流','确认提交'];

var CITEMS=null,CITEMLOG=null;

function customHTML(n){
 if(n==='certdash')return certDashHTML();
 if(n==='esig')return esigHTML();
 if(n==='workbench')return workbenchHTML();
 if(n==='cattable')return catTableHTML();
 if(n==='reqcart')return reqCartHTML();
 if(n==='qrinquiry')return qrHTML();
 if(n==='ocrin')return ocrHTML();
 if(n==='inbound')return inboundHTML();
 if(n==='liangjia')return ljHTML();
 if(n==='contractdash')return contractDashHTML();
 if(n==='framecontract')return frameHTML();
 if(n==='fhsign')return fhSignHTML();
 if(n==='settlecalc')return settleCalcHTML();
 if(n==='quotedash')return quoteDashHTML();
 if(n==='quotever')return quoteVerHTML();
 if(n==='quotelist')return quoteListHTML();
 if(n==='certpack')return certPackHTML();
 if(n==='client')return clientHTML();
 if(n==='contact')return contactHTML();
 if(n==='follow')return followHTML();
 if(n==='funnel')return funnelHTML();
 if(n==='oppstage')return oppstageHTML();
 if(n==='sale')return saleHTML();
 if(n==='bidreg')return bidregHTML();
 if(n==='bidcollab')return bidcollabHTML();
 if(n==='bidnode')return bidnodeHTML();
 if(n==='bidresult')return bidresultHTML();
 if(n==='bidloss')return bidlossHTML();
 if(n==='survey')return surveyHTML();
 if(n==='priceview')return priceViewHTML();
 if(n==='pricelib')return priceLibHTML();
 if(n==='cattree')return catTreeHTML();
 if(n==='supquote')return supQuoteHTML();
 if(n==='matcert')return matCertHTML();
 if(n==='inqsum')return inqSumHTML();
 if(n==='costimp')return costImpHTML();
 if(n==='contractledger')return contractLedgerHTML();
 if(n==='wmcontract')return wmContractHTML();
 if(n==='cnewwiz')return contractWizHTML();
 if(n==='contractapprove')return contractApproveHTML();
 if(n==='contractrisk')return contractRiskHTML();
 if(n==='targetcost')return targetCostHTML();
 if(n==='ljset')return ljSetHTML();
 if(n==='projlist')return projListHTML();
 if(n==='proj360')return proj360HTML();
 if(n==='projboard')return projBoardHTML();
 if(n==='projwbs')return projWbsHTML();
 if(n==='projgantt')return projGanttHTML();
 if(n==='projlabor')return projLaborHTML();
 if(n==='projqa')return projQaHTML();
 if(n==='projmonitor')return projMonitorHTML();
 if(n==='projrisk')return projRiskHTML();
 if(n==='projarch')return projArchHTML();
 if(n==='projclose')return projCloseHTML();
 if(n==='projchange')return projChangeHTML();
 if(n==='ptype')return ptypeHTML();
 if(n==='wmproj')return wmProjHTML();
 if(n==='wmroute')return wmRouteHTML();
 if(n==='wmrenew')return wmRenewHTML();
 if(n==='wmplan')return wmPlanHTML();
 if(n==='wmrouteplan')return wmRoutePlanHTML();
 if(n==='wmshift')return wmShiftHTML();
 if(n==='wmlog')return wmLogHTML();
 if(n==='wmpool')return wmPoolHTML();
 if(n==='wmdispatch')return wmDispatchHTML();
 if(n==='wmflow')return wmFlowHTML();
 if(n==='wmio')return wmIoHTML();
 if(n==='wmrepair')return wmRepairHTML();
 if(n==='wminvoice')return wmInvoiceHTML();
 if(n==='wmsat')return wmSatHTML();
 if(n==='wmparts')return wmPartsHTML();
 if(n==='wmstock')return wmStockHTML();
 if(n==='suparch')return supArchHTML();
 if(n==='suplevel')return supLevelHTML();
 if(n==='supblack')return supBlackHTML();
 if(n==='costtree')return costTreeHTML();
 if(n==='costchange')return costChangeHTML();
 if(n==='costwriteoff')return costWriteoffHTML();
 if(n==='payreq')return payReqHTML();
 if(n==='payinsight')return payInsightHTML();
 if(n==='autoinvoice')return autoInvHTML();
 if(n==='autorecv')return autoRecvHTML();
 if(n==='invoicelib')return invLibHTML();
 if(n==='suppay')return supPayHTML();
 if(n==='poorder')return poOrderHTML();
 if(n==='outbound')return outboundHTML();
 if(n==='returnscrap')return returnScrapHTML();
 if(n==='batchqr')return batchQrHTML();
 if(n==='stocktake')return stockTakeHTML();
 if(n==='overwarn')return overWarnHTML();
 if(n==='doctree')return docTreeHTML();
 if(n==='docmiss')return docMissHTML();
 if(n==='docarch')return docArchHTML();
 if(n==='docaudit')return docAuditHTML();
 if(n==='reptpl')return repTplHTML();
 if(n==='repgen')return repGenHTML();
 if(n==='repdown')return repDownHTML();
 if(n==='acceptdoc')return acceptDocHTML();
 if(n==='acceptstd')return acceptStdHTML();
 if(n==='deliverpack')return deliverPackHTML();
 if(n==='oaexp')return oaExpHTML();
 if(n==='oanotice')return oaNoticeHTML();
 if(n==='oadoc')return oaDocHTML();
 if(n==='oaseal')return oaSealHTML();
 if(n==='oahr')return oaHrHTML();
 if(n==='oacar')return oaCarHTML();
 if(n==='oacal')return oaCalHTML();
 if(n==='oadone')return oaDoneHTML();
 if(n==='oamsg')return oaMsgHTML();
 if(n==='bizboard')return bizBoardHTML();
 if(n==='bizboss')return bizBossHTML();
 if(n==='bizreport')return bizReportHTML();
 if(n==='bizmoney')return bizMoneyHTML();
 if(n==='bizrisk')return bizRiskHTML();
 if(n==='bizappr')return bizApprHTML();
 if(n==='bizinsight')return bizInsightHTML();
 if(n==='sysorg')return sysOrgHTML();
 if(n==='sysrole')return sysRoleHTML();
 if(n==='systemant')return sysTenantHTML();
 if(n==='sysmarket')return sysMarketHTML();
 if(n==='sysbill')return sysBillHTML();
 if(n==='sysapi')return sysApiHTML();
 if(n==='syspaas')return sysPaasHTML();
 if(n==='syslog')return sysLogHTML();
 if(n==='sysbackup')return sysBackupHTML();
 if(n==='ownproj')return ownProjHTML();
 if(n==='ownrep')return ownRepHTML();
 if(n==='ownrepair')return ownRepairHTML();
 if(n==='ownbill')return ownBillHTML();
 if(n==='extinq')return extInqHTML();
 if(n==='extorder')return extOrderHTML();
 if(n==='extsettle')return extSettleHTML();
 if(n==='eduknow')return eduKnowHTML();
 if(n==='edufault')return eduFaultHTML();
 if(n==='iotasset')return iotAssetHTML();
 if(n==='iotscene')return iotSceneHTML();
 if(n==='iotmon')return iotMonHTML();
 if(n==='iotreport')return iotReportHTML();
 if(n==='sitelog')return siteLogHTML();
 if(n==='siterecv')return siteRecvHTML();
 if(n==='siterv')return siteRvHTML();
 if(n==='sitesupp')return siteSuppHTML();
 if(n==='sitevisa')return siteVisaHTML();
 if(n==='sitecount')return siteCountHTML();
 if(n==='bidcert')return bidCertHTML();
 if(n==='dashboard')return dashBoardHTML();
 if(n==='devboard')return devBoardHTML();
 if(n==='eduboard')return eduBoardHTML();
 if(n==='bizboardt')return bizboardt();
 if(n==='bizapprt')return bizapprt();
 if(n==='oppfunnelt')return oppfunnelt();
 if(n==='certledgert')return certledgert();
 if(n==='autotaxt')return autotaxt();
 if(n==='outboundt')return outboundt();
 if(n==='docarcht')return docarcht();
 if(n==='docrept')return docrept();
 if(n==='docacct')return docacct();
 if(n==='oadoct')return oadoct();
 if(n==='oacart')return oacart();
 if(n==='oamsgt')return oamsgt();
 if(n==='eduknowt')return eduknowt();
 if(n==='sysorgt')return sysorgt();
 if(n==='sysmarkett')return sysmarkett();
 if(n==='sysapit')return sysapit();
 if(n==='costfw')return costfw();
 if(n==='costin')return costin();
 if(n==='costap')return costap();
 if(n==='costfu')return costfu();
 if(n==='costtc')return costtc();
 if(n==='costpay')return costpay();
 if(n==='costinv')return costinv();
 if(n==='buysup')return buysup();
 if(n==='buycmp')return buycmp();
 return '';
}
`,fa=`function repPage(){
 var d=[['04月',286],['05月',312],['06月',458],['07月',392],['08月',486],['09月',521]];
 return {pills:[['本年',1],['本季',1],['本月',1]],filters:[['统计维度',['按项目','按部门','按月份']],F_TIME],chart:{title:'近 6 月趋势（示例）',data:d},
 cols:['统计维度','数量 / 金额(万)','环比','占比','趋势'],rows:PP.slice(0,8).map(function(p,i){return [p,String(386-i*36),tg(i%3===0?'g':(i%3===1?'gray':'r'),(i%3===0?'↑':(i%3===1?'→':'↓'))),String(i*3+2)+'%',tg('b','↑')]})};
}
function kbdPage(){return {pills:[],filters:[F_OWN,F_TIME],kanban:[
 ['待处理',[['XX产业园 · 隐蔽验收准备',tg('b','节点'),dt('g')+' 正常','李敏 · 09-18'],['XX学校 · 中间检查',tg('gray','常规'),dt('g')+' 正常','刘洋 · 09-20']]],
 ['进行中',[['XX国际大厦 · 3F 管网安装',tg('b','施工'),dt('y')+' 关注','王强 · 72%'],['XX产业园 · 喷淋主管安装',tg('b','施工'),dt('g')+' 正常','李敏 · 48%']]],
 ['待审核',[['XX大厦 · 季度保养报告',tg('g','报告'),dt('g'),'赵磊'],['XX产业园 · 排烟阀维修',tg('b','维修'),dt('y'),'张伟']]],
 ['已完成',[['XX政务中心 · 主机复位',tg('r','告警'),dt('g'),'张伟 · 09-16'],['XX医院 · 喷淋头更换',tg('b','报修'),dt('g'),'王芳 · 09-16']]]]}}
function warnPage(){return {pills:[['全部',7],['紧急',2],['一般',4],['已处理',1]],filters:[['级别',['全部','紧急','高','一般']],F_TIME],
 cols:['预警项','关联对象','级别','说明','触发时间','状态'],rows:[
 ['主机离线','XX医院门诊楼',tg('r','紧急'),'已离线 2 小时','09-16 08:47',tg('o','处理中')],
 ['超结算付款','ZC-2608-19 安泰电子',tg('r','紧急'),'付款比例 104.6%，需追回或补充结算','09-16 08:47',tg('o','处理中')],
 ['证书过期','周凯 · 低压电工证',tg('r','紧急'),'已过期 17 天，已停岗','09-16 07:30',tg('o','处理中')],
 ['进度延期','XX物流园工程',tg('r','紧急'),'剩 3 天 · 完成率 61%','09-16 07:30',tg('o','处理中')],
 ['水压低','XX商城 B2',tg('y','高'),'0.08MPa 低于阈值','09-16 09:12',tg('o','处理中')],
 ['成本超支','XX医院维保',tg('y','高'),'预算使用 103%','09-15 18:00',tg('y','待处理')],
 ['质保金到期','XX大厦',tg('y','一般'),'10-08 到期 ¥32万','09-15 09:00',tg('y','待处理')]]}}
function logPage(){return {pills:[['全部',128],['今日',12],['本周',46]],filters:[['操作人',['全部','张伟','李强','王芳','赵磊']],F_TIME],
 cols:['时间','内容摘要','操作人','关联对象','结果'],rows:DTS.map(function(t,i){return [t,['3F 管网隐蔽部位自检合格','完成 A 座 5 层探测器功能测试','更换 2F 走廊应急灯 1 套','湿式报警阀组放水试验','主机自检并复位 1 条火警','卷帘门手动/自动调试合格','末端试水 0.15MPa 合格','配电机房温度复测 65℃'][i],pick(PL,i),pick(PP,i),tg(i===7?'y':'g',i===7?'待复核':'合格')]})}}
function apprPage(){return {pills:[['全部',9],['待审批',5],['已通过',3],['已驳回',1]],filters:[['类型',['全部','采购','付款','变更','进度','劳务','报价']],F_TIME],
 cols:['事项','类型','提交人','金额/内容','到达时间','操作'],rows:[
 ['报价单审批 · BJ-2609-05 XX医院二期',tg('b','报价'),'王悦','¥1,205.60万 · 毛利率 22.0%','09-16 10:20',OKNO],
 ['材料采购 · 防火卷帘 6樘',tg('b','采购'),'周凯','¥62.4万','09-16 10:20',OKNO],
 ['进度款 · XX产业园第3期',tg('o','付款'),'李敏','¥86万','09-16 09:00',OKNO],
 ['设计变更 · 增加声光报警',tg('y','变更'),'赵磊','+¥3.2万','09-15 16:40',OKNO],
 ['进度申报 · 第6周 48%',tg('g','进度'),'李敏','申报 48%','09-15 14:00',OKNO],
 ['劳务班组进场 · 风管 8 人',tg('gray','劳务'),'孙倩','8 人','09-15 09:30',OKNO],
 ['材料申请 · 镀锌钢管 1,200m',tg('b','采购'),'刘洋','预算内','09-15 09:00',tg('g','已通过')],
 ['变更 · 工期顺延 30 天',tg('y','变更'),'孙倩','XX广场','09-13 11:00',tg('r','已驳回')]]}}
function confPage(){return {pills:[['全部',38],['已启用',33],['已停用',5]],filters:[['类型',['全部','流程','字段','权限','模板','集成']],F_TIME],
 cols:['配置项','类型','说明','状态','更新人','更新时间'],rows:[
 ['变更审批流（超合同5%）','流程','两级审批 · 总经理终审',tg('g','启用'),'系统管理员','09-12'],
 ['业主视角字段组','字段','隐藏成本/利润/内部审批',tg('g','启用'),'系统管理员','09-10'],
 ['项目部数据隔离规则','权限','8 条隔离规则',tg('g','启用'),'系统管理员','09-08'],
 ['消防检测报告模板 v3','模板','2026 新规版',tg('g','启用'),'郑洁','09-05'],
 ['报价单打印模板（对外）','模板','含 Logo / 盖章位 / 条款',tg('g','启用'),'王悦','09-03'],
 ['维保月报模板','模板','含点位覆盖率',tg('g','启用'),'赵磊','09-01'],
 ['钉钉消息推送','集成','审批/告警通知',tg('g','启用'),'系统管理员','08-28'],
 ['旧版开票字段','字段','已废弃',tg('gray','停用'),'系统管理员','08-20']]}}
function planPage(){return {pills:[['全部',24],['今日',3],['本周',9],['已完成',12]],filters:[['周期',['全部','日','周','月','季度']],F_OWN,F_TIME],
 cols:['计划/班次','对象','周期','负责人','时间','进度','状态'],rows:[
 ['A座巡检线 · 9月','XX产业园','月度','李强','09-18','3/5 楼层',tg('b','进行中')],
 ['门诊楼周巡检','XX医院','周巡','张伟','09-17（今日）','0/6 点位',tg('o','今日执行')],
 ['消防设施季度保养','XX大厦','季度','赵磊','09-22','0/8 项',tg('gray','待开始')],
 ['防火分区月检','XX商城','月度','王芳','09-25','0/9 分区',tg('gray','待开始')],
 ['白班 · 消控室值班','XX医院','日','张伟/李强','08:00-20:00','—',tg('g','值班中')],
 ['夜班 · 消控室值班','XX医院','日','王芳','20:00-08:00','—',tg('gray','未开始')],
 ['月度统考 · 维保规程','全员','月','HR','09-20 14:00','—',tg('b','报名中')],
 ['灭火器年检计划','全项目','年','陈晨','10 月','0/486 具',tg('gray','待启动')]]}}
function masterPage(){return {pills:[['全部',1268],['启用',1244],['停用',24]],filters:[['类别',['全部','管材','设备','辅材','知识','规范']],F_TIME],
 cols:['编码','名称','类别','规格 / 单位','条目/版本','状态','更新时间'],rows:[
 ['KN-0201','气体灭火系统维护要点','知识','视频 · 32 分钟','v2.1',tg('g','启用'),'09-15'],
 ['KN-0188','2026 版通用规范解读','规范','文档 · 58 分钟','v1.0',tg('g','启用'),'09-12'],
 ['KN-0156','典型误报案例复盘','知识','案例 · 10 例','v3.0',tg('g','启用'),'09-08'],
 ['TK-0032','维保操作规程题组','题库','50 题','2026 版',tg('g','启用'),'09-05'],
 ['GL-0121','隐蔽验收记录模板','模板','word','v2.3',tg('g','启用'),'09-01'],
 ['GL-0098','材料合格证归档规范','规范','文档','v1.2',tg('g','启用'),'08-26'],
 ['KN-0134','水系统常见故障 30 例','知识','图文','v1.8',tg('gray','停用'),'08-20'],
 ['TK-0027','电气火灾监测题组','题库','30 题','2025 版',tg('gray','停用'),'08-12']]}}
function listCols(sid){
 var C={biz:['项目名称','类型','年度产值(万)','回款率','毛利率','健康度','负责人'],
 bid:['商机/项目','客户','金额(万)','阶段','赢率','负责人','更新时间','状态'],
 cost:['单据编号','单据类型','关联项目','金额(万)','执行率','状态','提交人','日期'],
 buy:['单号','物料/事项','数量','供应商','金额(万)','状态','经手人','日期'],
 site:['事项','关联项目','类别','负责人','计划日期','进度','状态'],
 wm:['工单号','事项','项目','级别','工程师','日期','状态'],
 doc:['资料/报告','所属项目','格式','大小','提交人','归档状态','日期'],
 edu:['课程/考试','类型','讲师/来源','时长','学习进度','状态'],
 owner:['项目名称','类型','当前阶段','进度','健康度','更新时间','操作'],
 sys:['操作事项','类型','操作人','影响范围','状态','时间','操作'],
 ext:['单号','类型','物料/事项','数量','金额','状态','操作']};
 return C[sid]||['名称','类型','负责人','日期','状态','操作'];
}
function listRowsFor(sid){
 var R=[],i,p,o,d;
 for(i=0;i<8;i++){p=pick(PP,i);o=pick(PL,i);d=DTS[i];
  if(sid==='biz')R.push([p,pick(['工程','维保','智消'],i),String(3860-i*320),'82%',(19.2-i)+'%',dt(i%3===0?'g':(i%3===1?'y':'r'))+' '+(i%3===0?'正常':(i%3===1?'关注':'风险')),o]);
  else if(sid==='bid')R.push([pick(PC,i)+'·消防工程'+(i+1),pick(PC,i),String(1200-i*90),tg('b',pick(['线索','商机','投标中','中标'],i)),(60-i*5)+'%',o,'09-1'+(6-i%7)]);
  else if(sid==='cost')R.push(['HT-2609-0'+(18-i),pick(['主合同','支出合同','变更签证','结算单'],i)+' · '+p,p,(386-i*32)+'.0万',(72-i*6)+'%',tg(i%3===0?'g':(i%3===1?'y':'r'),['执行中','待确认','已结算','超控'][i%4]),o,d]);
  else if(sid==='buy')R.push(['CG-2609-0'+(21-i),pick(PM,i),(3000-i*280)+pick(['m','只','套','盘'],i),pick(['安泰电子','金桥物资','华信管业','正泰消防'],i),(86-i*8)+'.0万',tg(['g','b','y','o','gray'][i%5],['已入库','在途','询价中','待收货','已关闭'][i%5]),pick(['陈晨','李仓管','王仓管','赵仓管'],i),d]);
  else if(sid==='site')R.push([pick(['隐蔽验收','工序报验','材料进场','班组交底','中间检查','样板块施工'],i),p,tg('b',['质量','安全','进度','材料'][i%4]),o,'09-1'+(6-i%7),(48+i*6)+'%',tg(i%3===0?'g':(i%3===1?'y':'r'),['已完成','进行中','待验收'][i%3])]);
  else if(sid==='wm')R.push(['WX-2609-0'+(30-i),pick(['月度保养','季度巡检','设备维修','末端试水'],i),p,tg(i%3===0?'r':'b',i%3===0?'高':'普通'),o,d,tg(['g','b','o'][i%3],['已完成','进行中','待派工'][i%3])]);
  else if(sid==='doc')R.push([pick(['隐蔽验收记录','材料合格证','检测报告','维保月报','竣工图'],i)+' · '+p,p,tg('b',['PDF','CAD','DOC'][i%3]),(12-i)+'MB',o,tg(['g','y','r','o'][i%4],['已归档','待审核','缺失','审核中'][i%4]),d]);
  else if(sid==='edu')R.push([pick(['气体灭火维护要点','主机编程实操','规范解读 2026','误报案例复盘'],i)+'（第'+(i+1)+'期）',tg('b',['课程','考试','直播','题库'][i%4]),pick(['内部讲师','外聘专家'],i%2),(32+i*6)+' 分钟',(20+i*10)+'%',tg(['g','b','o'][i%3],['已完成','进行中','未开始'][i%3])]);
  else if(sid==='owner')R.push([p,tg('b',['工程','维保'][i%2]),pick(['隐蔽工程','设备安装','调试验收','月度保养'],i),(48+i*7)+'%',tg(i%3===0?'g':'y',i%3===0?'正常':'关注'),d,tg('b','详情')]);
  else if(sid==='sys')R.push([pick(['角色权限调整','模块开通','审批流修改','数据规则变更'],i)+' #'+(2609-i),tg('b',['权限','模块','流程','安全'][i%4]),'系统管理员',pick(['项目经理','财务','维保中心'],i),tg('g','生效'),d,tg('b','详情')]);
  else if(sid==='ext')R.push(['XJ-2609-0'+(50-i),tg('o','询价'),pick(PM,i),(3000-i*300)+pick(['m','只','套'],i),'—',tg(i%2?'y':'r',['报价中','已截止'][i%2]),tg('b','去报价')]);
  else R.push([p,'—','—',tg('g','正常'),o,d,tg('b','详情')]);
 }
 return R;
}
function getPageCfg(sid,grp,menu){
 var key=sid+'.'+menu;
 if(PAGES[key]&&PAGES[key]!=='ALIAS'&&PAGES[key]!=='ALIAS2')return PAGES[key];
 if(/报表|统计|分析|汇总|趋势|监测$|曲线/.test(menu))return repPage();
 if(/看板|大屏|概览|总览|驾驶舱/.test(menu))return kbdPage();
 if(/预警|提醒|超期|缺失|异常|到期|临期|风险/.test(menu))return warnPage();
 if(/日志|记录|流水|打卡|轨迹/.test(menu))return logPage();
 if(/审批$|申请$|会签/.test(menu))return apprPage();
 if(/权限|配置|模板|规则|字段|参数|设置|集成|计费|市场/.test(menu))return confPage();
 if(/计划|排班|巡检|培训/.test(menu))return planPage();
 if(/台账|库$|档案|证书$/.test(menu))return masterPage();
 return {pills:[['全部',46],['进行中',18],['已完成',24],['已关闭',4]],filters:[['状态',['全部','进行中','待处理','已完成','已关闭']],F_OWN,F_TIME],cols:listCols(sid),rows:listRowsFor(sid)};
}

/* ============ 四模块自定义页面 ============ */
function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
var toastTimer;
function toast(m,type){
 var box=$('#toast');if(!box)return;
 /* 同文案去重：栈中已有相同提示则不再重复弹出（详情切 Tab / 反复进入造成的重复堆积） */
 var _tds=box.querySelectorAll('.toast-item .td');
 for(var _i=0;_i<_tds.length;_i++){if(_tds[_i].innerHTML===m)return}
 /* 超期强制清理：避免个别条目残留不消失 */
 var _now=Date.now();
 box.querySelectorAll('.toast-item').forEach(function(x){if(_now-(x.dataset.ts||0)>12000)toastClose(x)});
 var it=document.createElement('div');it.className='toast-item '+(type||'info');it.dataset.ts=_now;
 it.innerHTML='<span class="toast-ic">'+(type==='risk'?ICON.warn:type==='ok'?ICON.check:ICON.info)+'</span><span class="td">'+m+'</span><span class="tx">✕</span>';
 box.appendChild(it);
 var list=box.querySelectorAll('.toast-item');if(list.length>4){for(var _j=4;_j<list.length;_j++)toastClose(list[_j])}
 setTimeout(function(){toastClose(it)},type==='risk'?8000:2600);
 function toastClose(x){if(!x||x.classList.contains('out'))return;x.classList.add('out');setTimeout(function(){x.remove();if(!box.querySelector('.toast-item'))box.classList.remove('show')},240)}
 it.querySelector('.tx').onclick=function(){toastClose(it)};
}
var role=ROLES[0],cur='biz',curMenuKey=null,menuKw='',CURCFG=null,grpOpenState={};
var curDetailKind=null,curDetailTab=null,lastPage=null,curPriceId=null,curPriceTab=null;
var curMatId='MAT-0101';
var MAT_FS={cat:'',ctrl:'',aux:'',st:'',kw:'',page:1,per:10};
var MAT_TRACE=[]; /* 各材料硬编码留痕数据按 id 存放，无则用默认 */
function nfmt(n){return n==null?'—':(typeof n==='number'?n.toLocaleString('zh-CN'):n)}
function ctrlTg(c){return c==='量价双控'?tg('b',c):c==='仅控量'||c==='仅控价'?tg('o',c):tg('gray',c)}
function stTg(s){return /停用/.test(s)?tg('y',s):/待复核/.test(s)?tg('y',s):tg('g',s)}

function hl(t){return menuKw?t.split(menuKw).join('<mark>'+menuKw+'</mark>'):t}

function renderTabs(){
 $('#tabStrip').innerHTML=role.st.map(function(id){var st=S.find(function(x){return x.id===id});
  return '<div class="tab1 '+(id===cur?'active':'')+'" data-go="'+id+'">'+st.n+'</div>'}).join('');
 var act=$('#tabStrip .tab1.active');if(act)act.scrollIntoView({inline:'center',block:'nearest'});
 setTimeout(checkTabsOverflow,50);
}
function checkTabsOverflow(){var w=$('#tabsWrap'),s=$('#tabStrip');if(w&&s)w.classList.toggle('fade-r',s.scrollWidth>s.clientWidth+8)}

function renderSide(){
 var box=$('#sideMenu'),meta=$('#searchMeta');
 if(menuKw){
  var res=[];
  role.st.forEach(function(sid){SUB[sid].forEach(function(g){
   g.items.forEach(function(it){if(it.indexOf(menuKw)>-1||g.g.indexOf(menuKw)>-1)res.push({sid:sid,g:g.g,it:it})});
  })});
  box.innerHTML=res.length?res.map(function(r){
   var st=S.find(function(x){return x.id===r.sid}),act=(r.sid===cur&&curMenuKey===r.sid+'.'+r.it);
   return '<div class="mi sr '+(act?'active':'')+'" data-sid="'+r.sid+'" data-g="'+r.g+'" data-n="'+r.it+'">'+hl(r.it)+'<span class="path">'+st.n+' · '+r.g+'</span></div>'}).join('')
   :'<div class="tree-empty">未找到与「'+menuKw+'」相关的菜单<br/><b id="goG">全局搜索业务数据 →</b></div>';
  meta.classList.add('show');
  meta.textContent=res.length?('找到 '+res.length+' 个菜单 · 回车打开第一个'):'';
  var g=$('#goG');if(g)g.onclick=function(){openGS()};
 }else{
  box.innerHTML='<div class="grp-hd home '+(curMenuKey===null?'active':'')+'" data-home="1" title="返回 '+S.find(function(x){return x.id===cur}).n+' 首页">'+
   '<span class="gic">'+ICON.home+'</span><span class="gtx">首页</span></div>'+
  SUB[cur].map(function(g,idx){
   var open=grpOpenState.hasOwnProperty(g.g)?grpOpenState[g.g]:false;
   return '<div class="grp'+(open?'':' closed')+'" data-g="'+g.g+'">'+
    '<div class="grp-hd" data-gtoggle="'+g.g+'" title="'+g.g+'">'+
    '<span class="gic">'+ICON[g.ic]+'</span><span class="gtx">'+g.g+'</span>'+CHEV+'</div>'+
    '<div class="grp-items">'+g.items.map(function(it){
     return '<div class="mi '+(curMenuKey===cur+'.'+it?'active':'')+'" data-sid="'+cur+'" data-g="'+g.g+'" data-n="'+it+'">'+it+'</div>';
    }).join('')+'</div></div>';
  }).join('');
  meta.classList.remove('show');
 }
 $('#sideSearch').classList.toggle('has',!!menuKw);
}
$('#menuSearch').addEventListener('input',function(e){menuKw=e.target.value.trim();renderSide()});
$('#menuSearch').addEventListener('keydown',function(e){
 if(e.key==='Enter'){var f=$('#sideMenu .mi');if(f)f.click()}
 if(e.key==='Escape'){menuKw='';e.target.value='';renderSide();e.target.blur()}
});
$('#siClr').onclick=function(){menuKw='';$('#menuSearch').value='';renderSide();$('#menuSearch').focus()};

var gsActive=-1;
function ghl(t,kw){return kw?t.split(kw).join('<mark>'+kw+'</mark>'):t}
function openGS(){closeDD();$('#gsMask').classList.add('show');$('#gsInput').value='';gsRender('');setTimeout(function(){$('#gsInput').focus()},60)}
function closeGS(){$('#gsMask').classList.remove('show')}
function gsItemHTML(r){
 return '<div class="gs-item" data-type="'+r.type+'"'+(r.type==='menu'?(' data-sid="'+r.sid+'" data-g="'+r.g+'" data-n="'+r.n+'"'):(' data-toast="演示：打开「'+r.tt+'」详情（示意数据）"'))+'>'+
  '<div class="gi">'+ICON[r.icon]+'</div>'+
  '<div style="min-width:0"><div class="gt">'+r.title+'</div><div class="gd">'+r.desc+'</div></div>'+
  '<span class="gcat tag gray">'+r.cat+'</span></div>';
}
function gsRender(kw){
 var body=$('#gsBody');gsActive=-1;kw=kw.trim();
 if(!kw){
  var quicks=[
   {cat:'菜单',type:'menu',sid:'cost',g:'合同管理',n:'销售合同 / 收入合同',icon:'file',title:'合同管理 · 销售合同',desc:'合同成本'},
   {cat:'菜单',type:'menu',sid:'biz',g:'风险中心',n:'风险总览',icon:'warn',title:'经营风险中心',desc:'经营决策'},
   {cat:'菜单',type:'menu',sid:'bid',g:'报价与勘察',n:'报价编制工作台',icon:'money',title:'报价工作台',desc:'市场投标'},
   {cat:'菜单',type:'menu',sid:'buy',g:'成本对比',n:'量价双控六行对比',icon:'warn',title:'量价双控',desc:'采购仓储'}];
  body.innerHTML='<div class="gs-sec">最近搜索</div><div style="padding:2px 6px 8px">'+
   GRECENT.map(function(r){return '<span class="gs-chip" data-gkw="'+r+'">'+ICON.clock.replace('class="ic"','class="ic" style="width:13px;height:13px"')+r+'</span>'}).join('')+
   '</div><div class="gs-sec">快捷入口</div>'+quicks.map(gsItemHTML).join('')+
   '<div class="gs-sec">试试搜索</div><div style="padding:2px 6px 8px;color:var(--t3);font-size:13px">合同 · 报价 · 证书 · 量价双控 · 烟感</div>';
  return;
 }
 var res=[];
 role.st.forEach(function(sid){SUB[sid].forEach(function(g){
  g.items.forEach(function(it){
   if(it.indexOf(kw)>-1||g.g.indexOf(kw)>-1){
    var st=S.find(function(x){return x.id===sid});
    res.push({cat:'菜单',type:'menu',sid:sid,g:g.g,n:it,icon:MICON[sid],title:ghl(it,kw),desc:st.n+' · '+g.g});
   }
  });
 })});
 GDATA.forEach(function(sec){
  sec.items.forEach(function(o){
   if(o.t.indexOf(kw)>-1||o.d.indexOf(kw)>-1){
    res.push({cat:sec.cat,type:'data',icon:sec.icon,title:ghl(o.t,kw),desc:ghl(o.d,kw),tt:o.t});
   }
  });
 });
 if(!res.length){body.innerHTML='<div class="gs-empty">未找到与「'+kw+'」相关的内容<br/>可尝试：合同 / 报价 / 证书 / 烟感</div>';return}
 var order=[],map={};
 res.forEach(function(r){if(!map[r.cat]){map[r.cat]=[];order.push(r.cat)}map[r.cat].push(r)});
 body.innerHTML=order.map(function(cat){
  return '<div class="gs-sec">'+cat+' · '+map[cat].length+'</div>'+map[cat].map(gsItemHTML).join('');
 }).join('');
}
function gsMove(dir){
 var items=$$('#gsBody .gs-item');if(!items.length)return;
 if(gsActive>=0&&items[gsActive])items[gsActive].classList.remove('act');
 gsActive+=dir;
 if(gsActive<0)gsActive=items.length-1;
 if(gsActive>=items.length)gsActive=0;
 items[gsActive].classList.add('act');
 items[gsActive].scrollIntoView({block:'nearest'});
}
$('#btnSearch').onclick=openGS;
$('#gsMask').addEventListener('click',function(e){if(e.target===this)closeGS()});
$('#gsInput').addEventListener('input',function(e){gsRender(e.target.value)});
$('#gsInput').addEventListener('keydown',function(e){
 if(e.key==='ArrowDown'){e.preventDefault();gsMove(1)}
 else if(e.key==='ArrowUp'){e.preventDefault();gsMove(-1)}
 else if(e.key==='Enter'){
  var items=$$('#gsBody .gs-item');
  var el=(gsActive>=0&&items[gsActive])?items[gsActive]:items[0];
  if(el)el.click();
 }
 else if(e.key==='Escape')closeGS();
});
$('#gsBody').addEventListener('click',function(e){
 var chip=e.target.closest('.gs-chip');
 if(chip){var kw=chip.dataset.gkw;$('#gsInput').value=kw;gsRender(kw);return}
 var it=e.target.closest('.gs-item');
 if(!it)return;
 closeGS();
 if(it.dataset.type==='menu'){
  menuKw='';$('#menuSearch').value='';
  renderPage(it.dataset.sid,it.dataset.g,it.dataset.n);
  window.scrollTo(0,0);
 }
});

/* ---- Dashboard ---- */
function metricHTML(m){
 var arrow=m.tc==='up'?'<span class="m-trend up">↑</span>':(m.tc==='down'?'<span class="m-trend down">↓</span>':'');
 return '<div class="metric"'+(m.jump?' data-jump="'+m.jump+'"':'')+'>'+
  '<div class="m-label">'+m.k+(m.st?dt(m.st):'')+'</div>'+
  '<div class="m-value">'+m.v+'<span class="m-unit">'+(m.u||'')+'</span></div>'+
  '<div class="m-sub">'+arrow+' '+(m.sub||'')+'</div>'+
  (m.bars?'<div class="spark">'+m.bars.map(function(b){return '<i style="height:'+b+'%"></i>'}).join('')+'</div>':'')+'</div>';
}
function kanbanHTML(m){
 return '<div class="kb-filter">'+
  '<span class="kb-f on" data-kb-f="all">全部 <b>'+m.cols.reduce(function(a,c){return a+c.cards.length},0)+'</b></span>'+
  m.cols.map(function(c){return '<span class="kb-f" data-kb-f="'+c.name+'">'+c.name+' <b>'+c.cards.length+'</b></span>'}).join('')+
  '</div><div class="kb">'+m.cols.map(function(c){
  return '<div class="kb-col" data-kbcol="'+c.name+'"><div class="kb-col-hd"><span class="kb-dot '+(c.name==='健康项目'?'g':c.name==='风险项目'?'r':'y')+'"></span>'+c.name+'<span class="kb-count">'+c.cards.length+'</span></div>'+
  c.cards.map(function(cd){
   return '<div class="kb-card" data-kbproj="'+cd.t+'">'+
   '<div class="kb-title">'+cd.t+'</div>'+
   ((cd.tag||cd.lamp)?'<div class="kb-chips">'+(cd.tag?tg(cd.tc||'b',cd.tag):'')+(cd.lamp?'<span class="kb-lamp '+cd.lamp+'"></span>':'')+'</div>':'')+
   (cd.pct!=null?'<div class="kb-pg"><span class="pbar"><i style="width:'+cd.pct+'%;background:linear-gradient(90deg,#2f6bff,#6c8dff)"></i></span><span class="kb-pct">'+cd.pct+'%</span></div>':'')+
   (cd.lines?'<div class="kb-lines">'+cd.lines.map(function(l){return '<div class="kl"><span>'+l[0]+'</span><b>'+l[1]+'</b></div>'}).join('')+'</div>':'')+
   '</div>'}).join('')+'</div>'}).join('')+'</div>';
}
function tblHTML(headers,rows,minw,detail,rowAttr){
 var trAt=detail?(' data-detail="'+detail+'"'):' data-toast="演示：打开该行明细"';
 var body=typeof rows==='string'?rows
  :(!rows||!rows.length?'<tr><td colspan="'+headers.length+'" style="text-align:center;color:var(--t3);padding:36px 16px;font-size:13px">暂无数据，可调整筛选条件</td></tr>'
  :(rows.length&&typeof rows[0]==='string'?rows.join('')
  :rows.map(function(r){return '<tr'+trAt+(rowAttr?rowAttr(r):'')+'>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')));
 return '<div class="tbl-wrap"><table class="tbl"'+(minw?' style="min-width:'+minw+'px"':'')+'><thead><tr>'+headers.map(function(h){return '<th>'+h+'</th>'}).join('')+'</tr></thead>'+
 '<tbody>'+body+'</tbody></table></div>';
}
function treeHTML(m){
 return '<div class="card-bd">'+m.groups.map(function(g){
  return '<div class="tree-g"><div class="tree-gt"><span>'+g.n+'</span><span style="color:'+(g.miss?'var(--red)':'var(--green)')+';font-size:12px">'+(g.miss?('缺失 '+g.miss+' 份'):'资料齐备')+'</span></div>'+
  g.items.map(function(it){return '<div class="tree-i" data-toast="演示：打开资料「'+it.n+'」"><span>'+it.n+'</span>'+tg(it.c,it.t)+'</div>'}).join('')+'</div>'}).join('')+'</div>';
}
function cardsHTML(m){
 return '<div class="card-bd"><div class="xgrid">'+m.cards.map(function(c){
  return '<div class="xcard" data-toast="演示：打开「'+c.t+'」">'+
  (c.photo?'<div class="photo-strip">'+ICON.cam+'<span>现场照片 · '+c.photo+' 张</span></div>':'')+
  '<div class="xc-t">'+c.t+'</div><div class="xc-s">'+c.sub+'</div>'+
  (c.pct!=null?'<div class="pbar"><i style="width:'+c.pct+'%"></i></div><div class="kb-pct">完成 '+c.pct+'%</div>':'')+
  '<div class="xc-ft"><span>'+(c.foot||'')+'</span><button class="mini-btn mini-ok" data-act="'+c.btn+'">'+c.btn+'</button></div></div>'}).join('')+'</div></div>';
}
function twinHTML(m){
 return '<div class="card-bd"><div class="twin">'+
  '<div class="twin-cats">'+m.cats.map(function(c){return '<div class="tcat" data-toast="演示：筛选「'+c[0]+'」点位"><span class="tc-dot" style="background:'+c[1]+'"></span>'+c[0]+'<b>'+c[2]+'</b></div>'}).join('')+'</div>'+
  '<div class="twin-map">'+m.floors.map(function(f){
   return '<div class="fl"><div class="fl-tag">'+f+'</div><div class="fl-body">'+
   ROOMS.map(function(r){return '<div class="room" style="left:'+r[0]+'%;top:'+r[1]+'%;width:'+r[2]+'%;height:'+r[3]+'%">'+r[4]+'</div>'}).join('')+
   m.pts.map(function(p,i){return p.f===f?'<button class="pt '+p.st+'" data-pid="'+i+'" title="'+p.n+'" style="left:'+p.x+'%;top:'+p.y+'%"></button>':''}).join('')+
   '</div></div>'}).join('')+'</div></div>'+
  '<div class="twin-tip">提示：点击设备点位查看实时数据 · <span class="dot g"></span> 正常　<span class="dot r"></span> 告警　<span class="dot y"></span> 注意　<span class="dot" style="background:#bfbfbf"></span> 离线</div></div>';
}
function mainHTML(m){
 var head='<div class="card-hd"><h3>'+m.title+'</h3>'+(m.sub?'<span class="sub">'+m.sub+'</span>':'')+'<div class="right"><span class="link-btn" data-toast="演示：进入完整页面">更多 ›</span></div></div>';
 var body='';
 if(m.type==='kanban')body=kanbanHTML(m);
 else if(m.type==='table')body='<div style="padding:16px">'+tblHTML(m.headers,m.rows)+'</div>';
 else if(m.type==='tree')body=treeHTML(m);
 else if(m.type==='cards')body=cardsHTML(m);
 else if(m.type==='twin')body=twinHTML(m);
 return '<section class="card">'+head+body+'</section>';
}
function itemHTML(it){
 return '<div class="todo-item"'+(it.t?(' data-toast="演示：打开「'+it.t+'」处理页"'):'')+'>'+
  (it.lamp?'<span class="dot '+it.lamp+'" style="margin-top:5px"></span>':'')+
  '<div class="ti-main"><div class="ti-t">'+(it.tag?tg(it.tc||'gray',it.tag):'')+(it.t||'')+'</div>'+
  (it.d?'<div class="ti-d">'+it.d+'</div>':'')+
  (it.acts?'<div class="ti-acts">'+it.acts.map(function(a,i){return '<button class="mini-btn '+(i===0?'mini-ok':'mini-no')+'" data-act="'+a[0]+'">'+a[0]+'</button>'}).join('')+'</div>':'')+'</div>'+
  (it.time?'<span class="ti-time">'+it.time+'</span>':'')+'</div>';
}
function sideHTML(s){
 return '<section class="card" id="sideCard">'+
  '<div class="card-hd"><h3>'+s.title+'</h3><div class="right"><span class="link-btn" data-toast="演示：打开待办中心">查看全部</span></div></div>'+
  '<div class="tabs">'+s.tabs.map(function(t,i){return '<div class="tab '+(i===0?'active':'')+'" data-sid="'+t.id+'">'+t.name+'<span class="n">'+t.items.length+'</span></div>'}).join('')+'</div>'+
  '<div class="todo-list" id="sideList">'+s.tabs[0].items.map(itemHTML).join('')+'</div></section>';
}
function renderDash(cfg){
 CURCFG=cfg;var st=S.find(function(x){return x.id===cur});
 $('#viewPage').style.display='none';
 var v=$('#viewDash');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg cur-seg">'+st.n+'</span><span>/</span><span style="color:var(--t2)">首页</span></div>'+
 '<div class="page-head"><h1>'+cfg.title+'</h1>'+
  '<div class="page-actions">'+cfg.quicks.map(function(q,i){return '<button class="btn '+(i===0?'btn-primary':'btn-ghost')+'" data-quick="'+q[1]+'">'+ICON[q[0]]+'<span>'+q[1]+'</span></button>'}).join('')+'</div></div>'+
 (cfg.banner?'<div class="banner">'+ICON.info+'<div>'+cfg.banner+'</div></div>':'')+
 '<div class="dash-tools"><span class="dt-lb">全局筛选</span>'+
 '<select data-toast="演示：按时间范围刷新看板指标 / 卡片"><option>时间范围：本年</option><option>时间范围：本季度</option><option>时间范围：本月</option></select>'+
 '<select data-toast="演示：按负责人筛选"><option>负责人：全部</option><option>负责人：李敏</option><option>负责人：王强</option><option>负责人：孙倩</option><option>负责人：赵磊</option><option>负责人：周凯</option><option>负责人：郑洁</option></select>'+
 '<select data-toast="演示：按项目类型筛选"><option>项目类型：全部</option><option>项目类型：工程</option><option>项目类型：维保</option></select>'+
 '<span class="reset query" data-toast="演示：筛选已应用，指标与卡片同步刷新">查询</span><span class="reset" data-toast="演示：已重置">重置</span></div>'+
 '<section class="metrics">'+cfg.metrics.map(metricHTML).join('')+'</section>'+
 '<div class="grid-main">'+mainHTML(cfg.main)+sideHTML(cfg.side)+'</div>'+
 '<div class="grid-main">'+
  '<section class="card"><div class="card-hd"><h3>'+cfg.bottom.title+'</h3><div class="right"><button class="icon-btn" data-toast="演示：导出 Excel">'+ICON.dl+'</button></div></div><div style="padding:16px">'+tblHTML(cfg.bottom.headers,cfg.bottom.rows)+'</div></section>'+
  '<section class="card"><div class="card-hd"><h3>快捷入口</h3><div class="right"><span class="link-btn" data-toast="演示：自定义常用入口">编辑</span></div></div>'+
  '<div class="card-bd"><div class="qgrid">'+cfg.entries.map(function(q){return '<div class="qtile" data-toast="演示：打开「'+q[1]+'」"><div class="qi">'+(ICON[q[0]]||ICON.grid)+'</div><span>'+q[1]+'</span></div>'}).join('')+'</div></div></section>'+
 '</div>';
 applyA11y();
}

function renderPage(sid,grp,menu){
 closeMatDrawer();
 var cfg=getPageCfg(sid,grp,menu);  var __rp=window.__rpPage||(window.__rpPage={});var rpKey=sid+'|'+menu;var pg=__rp[rpKey]||1;
 var st=S.find(function(x){return x.id===sid});
 curMenuKey=sid+'.'+menu;cur=sid;lastPage={sid:sid,grp:grp,menu:menu};
 renderTabs();renderSide();
 $('#viewDash').style.display='none';
 var v=$('#viewPage');v.style.display='';
 var isContractList=(sid==='cost'&&grp==='合同管理'&&/合同$/.test(menu));
 var stName=menu.replace(/ \\/ .*$/,'').replace(/(列表|管理|中心|与归还|与预警|与成本对比|与先发生后关联)$/,'');
 var hideActs=(sid==='buy'&&menu==='材料主数据列表');
 var customBody=cfg.custom?customHTML(cfg.custom):'';
 if(customBody&&customBody.indexOf('<aside class="facets">')>=0){v.innerHTML=customBody;window.scrollTo(0,0);return}
 if(customBody&&/<div class="([^"]*fbar[^"]*)">/.test(customBody)){customBody=customBody.replace(/<div class="([^"]*fbar[^"]*)">([\\s\\S]*?)<\\/div>/,function(w,cls,inner){if(/class="reset"[^>]*>查询<\\/span>/.test(inner))return w;if(/<span class="reset"[^>]*data-mat-reset[^>]*>重置<\\/span>/.test(inner)){inner=inner.replace(/(<span class="reset"[^>]*data-mat-reset[^>]*>重置<\\/span>)/,'<span class="reset" data-toast="演示：按当前条件查询">查询</span>$1');}else if(/<span class="reset"[^>]*>重置<\\/span>/.test(inner)){inner=inner.replace(/(<span class="reset"[^>]*>重置<\\/span>)/,'<span class="reset" data-toast="演示：按当前条件查询">查询</span>$1');}else{inner+='<span class="reset" data-toast="演示：按当前条件查询">查询</span>';}return '<div class="'+cls+'">'+inner+'</div>';});} if(customBody&&customBody.indexOf('<table')>-1&&!/共[\\s\\S]{0,12}条/.test(customBody)){var _m=customBody.match(/<tbody>[\\s\\S]*?<\\/tbody>/);var _cnt=_m?_m[0].split('<tr').length-1:0;if(_cnt>0){var _ft='<div class="tbl-foot">共 '+_cnt+' 条 · 10 条/页 · 第 1/1 页<span style="margin-left:auto;display:flex;gap:4px;align-items:center"><button class="pg-btn" disabled>‹</button><button class="pg-btn cur">1</button><button class="pg-btn" disabled>›</button></span></div>';customBody=customBody.split('</table>').join('</table>'+_ft);}}
 if(cfg.pills&&cfg.pills.length&&cfg.rows&&cfg.rows.length!==cfg.pills[0][1]){var _po=cfg.pills[0][1]||1,_rp_all=cfg.rows.length,_rest=_rp_all,_np=[['全部',_rp_all]];for(var _k=1;_k<cfg.pills.length;_k++){var _v=_k===cfg.pills.length-1?_rest:Math.max(0,Math.round(_rp_all*cfg.pills[_k][1]/_po));_rest-=_v;_np.push([cfg.pills[_k][0],_v]);}cfg.pills=_np;} var maxV=cfg.chart?Math.max.apply(null,cfg.chart.data.map(function(x){return x[1]})):0;
 var chart=cfg.chart?'<div class="chart"><h4>'+cfg.chart.title+'</h4><div class="cb">'+cfg.chart.data.map(function(d){return '<div class="col"><div class="bar '+(d[1]===maxV?'hot':'')+'" style="height:'+Math.round(d[1]/maxV*70)+'%"><i>'+d[1]+'</i></div><span class="xl">'+d[0]+'</span></div>'}).join('')+'</div></div>':'';
 var kb=cfg.kanban?'<div class="card-bd"><div class="kb">'+cfg.kanban.map(function(c){return '<div class="kb-col"><div class="kb-col-hd">'+c[0]+'<span class="kb-count">'+c[1].length+'</span></div>'+c[1].map(function(cd){return '<div class="kb-card" data-toast="演示：打开「'+cd[0]+'」"><div class="kb-title">'+cd[0]+'</div><div class="kb-chips">'+cd[1]+cd[2]+'</div><div class="kl"><span>负责人 / 时间</span><b>'+cd[3]+'</b></div></div>'}).join('')+'</div>'}).join('')+'</div></div>':'';
  v.innerHTML=
  '<div class="crumb"><span class="seg" data-goseg="'+sid+'">'+st.n+'</span><span>/</span><span class="seg" data-goseg="'+sid+'">'+grp+'</span><span>/</span><span class="seg cur-seg">'+menu+'</span></div>'+
  '<div class="page-head"><h1>'+menu+'</h1>'+
   (hideActs?'':'<div class="page-actions">'+
   (isContractList?'<button class="btn btn-primary" data-cnew="1">'+ICON.plus+'<span>新建合同（向导）</span></button>'
    :'<button class="btn btn-primary" data-new="'+stName+'">'+ICON.plus+'<span>新建'+stName+'</span></button>')+
   '<button class="btn btn-ghost" data-toast="演示：AI / OCR 录入 — 上传 Word / PDF / 图片自动回填字段">'+ICON.cam+'<span>AI / OCR 录入</span></button>'+
   '<button class="btn btn-ghost" data-toast="演示：勾选行后可批量导出 / 删除(仅草稿) / 改负责人 / 归档 / 审批 / 关联">'+ICON.grid+'<span>批量</span></button>'+
   '<button class="btn btn-ghost" data-toast="演示：自定义列显示 / 拖动排序 / 保存个人视图 / 表格 ⇄ 卡片视图">'+ICON.gear+'<span>列设置</span></button>'+
   '<button class="btn btn-ghost" data-toast="演示：导出 Excel / PDF（模拟下载）">'+ICON.dl+'<span>导出</span></button>'+
   (cfg.custom?'':'<button class="btn btn-ghost" data-toast="演示：Excel 批量导入（模板下载 → 上传 → 校验）">'+ICON.up+'<span>导入</span></button>')+
   '</div>')+'</div>'+
  '<section class="card">'+
   (cfg.custom?customBody:
   ((cfg.pills.length?'<div class="pills">'+cfg.pills.map(function(p,i){return '<div class="pill '+(i===0?'active':'')+'">'+p[0]+' <b>'+p[1]+'</b></div>'}).join('')+'</div>':'')+
   (cfg.filters.length?'<div class="fbar">'+cfg.filters.map(function(f){return '<select><option>'+f[0]+'：'+f[1][0]+'</option>'+f[1].slice(1).map(function(o){return '<option>'+f[0]+'：'+o+'</option>'}).join('')+'</select>'}).join('')+'<span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-09-01 ~ 09-16</span><input class="fkw" placeholder="关键字搜索…"/><span class="reset" data-toast="演示：按当前条件查询">查询</span><span class="reset" data-toast="演示：筛选条件已重置">重置</span><span class="reset" data-toast="演示：另存为常用筛选视图">另存为常用</span></div>':'')+
   chart+kb+
   (cfg.rows?(function(){var all=cfg.rows||[];var per=10;var pages=Math.max(1,Math.ceil(all.length/per));if(pg>pages)pg=pages;var pRows=all.slice((pg-1)*per,pg*per);var pgBtns='<button class="pg-btn"'+((pg<=1)?' disabled':' data-rp-pg="'+(pg-1)+'"')+'>‹</button>';for(var pi=1;pi<=pages;pi++){pgBtns+='<button class="pg-btn'+(pi===pg?' cur':'')+'"'+((pi===pg)?' aria-current="page"':' data-rp-pg="'+pi+'"')+'>'+pi+'</button>'}pgBtns+='<button class="pg-btn"'+((pg>=pages)?' disabled':' data-rp-pg="'+(pg+1)+'"')+'>›</button>';return tblHTML(cfg.cols,pRows,760,cfg.detail,(cfg.detail==='contract'?(function(r){return ' data-cid="'+r[0]+'"'}):null))+'<div class="tbl-foot">共 '+all.length+' 条 · '+per+' 条/页 · 第 '+pg+'/'+pages+' 页<span style="margin-left:auto;display:flex;gap:4px;align-items:center">'+pgBtns+'</span></div>'}()):'')+
  '</section>'+
  (cfg.custom?'':'<div class="demo-note">演示数据 · 点击行可查看详情（合同 / 证书 / 报价单 / 材料已接通详情页）</div>')));
  window.scrollTo(0,0);
  applyA11y();
}

/* ---- 详情页渲染 ---- */
function renderTabBody(tab){
 var body='';
 if(tab.type==='kv'){body=tab.groups.map(function(g){return '<div class="dv-sec">'+g.sec+'</div><div class="kvg">'+g.kvs.map(function(k){return '<div class="kv-row"><span>'+k[0]+'</span><b>'+k[1]+'</b></div>'}).join('')+'</div>'}).join('')}
 else if(tab.type==='items'){body=renderContractItems()}
 else if(tab.type==='tbl'){body=tblHTML(tab.headers,tab.rows,760)}
 else if(tab.type==='sub'){body=tab.groups.map(function(g){return '<div class="dv-sec">'+g.sec+'</div><div class="kvg">'+g.kvs.map(function(k){return '<div class="kv-row"><span>'+k[0]+'</span><b>'+k[1]+'</b></div>'}).join('')+'</div>'}).join('')+tblHTML(tab.headers,tab.rows,760)}
 else if(tab.type==='ver'){body='<div class="dv-sec">版本历史（点「对比」高亮差异 / 「恢复」生成新版本）</div>'+
  tblHTML(['版本','变更说明','操作'],tab.versions.map(function(v){return [v[0],v[1],'<span class="ti-acts" style="margin:0"><button class="mini-btn mini-no" data-act="版本对比">对比</button><button class="mini-btn mini-no" data-act="恢复该版本">恢复</button></span>']}),640)+
  '<div class="dv-sec">业务助手 · 风险审核（按企业审核项配置）</div><div class="kvg">'+tab.ai.map(function(a){return '<div class="kv-row"><span>'+a[0]+'</span><b>'+a[1]+'</b></div>'}).join('')+'</div>'}
 else if(tab.type==='links'){body='<div class="qgrid">'+tab.links.map(function(l){return '<div class="qtile" data-toast="演示：跳转查看「'+l+'」（支持反向穿透回合同，循环穿透）"><div class="qi">'+ICON.link+'</div><span>'+l+'</span></div>'}).join('')+'</div>'}
 return body;
}
function closeMatDrawer(){
 var r=document.getElementById('matDrawerRoot');
 if(r){r.parentNode.removeChild(r)}
}
function matTabs(M){
 var id=M.id;
 var SUP_CODE={'华信管业':'HS-011','金桥物资':'HS-032','正泰消防':'HS-045','天广消防':'HS-021','安泰电子':'HS-018','海湾代理':'HS-027','诺盾物联':'HS-051'};
 var prices=PRICES.filter(function(p){return p.mid===id});
 var stock=(M.stock||0)+(M.transit||0);
 var low=M.safe>0&&stock<=M.safe;
 var tabs=[
  {id:'info',name:'基本信息',dyn:function(){
   return '<div class="dv-sec">核心技术参数</div><div class="kvg">'+
    kv('品牌 / 型号',M.brand+' · '+M.spec)+kv('规格',M.spec1||M.spec||'—')+kv('材质',M.mat||'—')+kv('执行标准',M.std||'GB/T 3091')+'</div>'+
    '<div class="dv-sec">单位与换算</div><div class="kvg">'+kv('主单位',M.unit+(M.unit==='m'?'（默认）':''))+kv('采购 / 库存 / 计价单位',M.unit+' / '+M.unit+' / '+M.unit)+'</div>'+
    '<div class="dv-sec">其他</div><div class="kvg">'+kv('适用项目类型',M.proj||'新建 / 改造')+kv('主材 / 辅材',tg(M.aux==='主材'?'b':'gray',M.aux))+kv('创建 / 更新','2026-08 / '+M.upd)+kv('替代料','—')+'</div>';}},
  {id:'purch',name:'采购与供应商',dyn:function(){
   var sup=M.sup||'—';
   var supTxt=sup;
   var moq=M.moq?M.moq+(M.unit?' '+M.unit:''):'—';
   var lead=M.lead?M.lead+' 天':'—';
   var his=[[sup,tg('g','A级'),'月结 30 天','12 单 · ¥486 万','09-08 ¥96.4 万'],
    ['金桥物资',tg('y','B级'),'货到付款','3 单 · ¥52 万','07-22 ¥18.6 万'],
    ['正泰消防',tg('y','B级'),'月结 60 天','2 单 · ¥31 万','06-30 ¥12.4 万']].filter(function(r,i){return i===0||r[0]!==sup});
   return '<div class="dv-sec">采购参数</div><div class="kvg">'+kv('默认供应商',tg('g',supTxt))+kv('最小起订量 MOQ',moq)+kv('采购提前期 Lead Time',lead)+kv('税率',M.tax||'13%')+kv('需询价',M.price!=null&&M.price>20000?'是（>¥2 万自动发起询比价）':'否')+'</div>'+
    '<div class="dv-sec">历史供应商</div>'+tblHTML(['供应商','评级','账期','历史合同','最近订单'],his,700);}},
  {id:'cost',name:'价格与成本',dyn:function(){
   return '<div class="dv-sec">控制与成本</div><div class="kvg">'+kv('控制方式',ctrlTg(M.ctrl))+kv('参考价 / 内部定额','¥'+nfmt(M.ref))+'</div>'+
    '<div class="dv-sec">多来源价格历史（价e库）</div>'+
    (prices.length?tblHTML(['日期','价格类型','价格(元)','供应商 / 来源','区域'],[
     (prices[3]?[prices[3].date,prices[3].src,'¥'+prices[3].v,prices[3].who,prices[3].region]:null),
     (prices[2]?[prices[2].date,prices[2].src,'¥'+prices[2].v,prices[2].who,prices[2].region]:null),
     (prices[1]?[prices[1].date,prices[1].src,'¥'+prices[1].v,prices[1].who,prices[1].region]:null),
     (prices[0]?[prices[0].date,prices[0].src,'¥'+prices[0].v,prices[0].who,prices[0].region]:null)
    ].filter(Boolean),700):'<p class="mn-tip">暂无价格记录 — 通过询价 / 采购 / 入库 / 结算沉淀</p>')
    +'<p class="mn-tip">当前生效参考价 ¥'+nfmt(M.ref)+' · 最近入库价 '+ (M.lastIn!=null?'¥'+M.lastIn:'—')+'</p>';}},
  {id:'inv',name:'库存与批次',dyn:function(){
   var avail=stock;
   return '<div class="dv-sec">库存概览</div><div class="kvg">'+kv('当前库存',nfmt(stock))+kv('其中在途',nfmt(M.transit||0))+kv('安全库存',nfmt(M.safe))+kv('可用量',nfmt(avail))+kv('预警',low?'<i style="color:var(--red);font-style:normal">低于安全线</i>':'正常')+'</div>'+
    '<div class="dv-sec">仓库与批次</div>'+tblHTML(['批次号','仓库','入库日期','数量','批次二维码','来源'],[
    ['PC-SAFE-'+M.code.slice(-2),'公司主仓 A',''+M.upd,nfmt(Math.ceil(stock*0.6)),tg('b','查看 / 打印'),'RK-'+M.code.slice(-2)],
    ['PC-PROJ-'+M.code.slice(-2),(M.transit?'在途（采购 PO）':'项目现场仓'),(M.transit?'计划收货':'2026-08'),nfmt(M.transit||Math.ceil(stock*0.4)),tg('b','查看 / 打印'),(M.transit?'PO-2609-31':'调拨')]],700);}},
  {id:'cert',name:'资质与附件',dyn:function(){
   return '<div class="dv-sec">资质文件（到期预警）</div><div class="kvg">'+kv('产品合格证','PDF · 已归档 · 有效期 2027-06')+kv('检测 / 检验报告',tg('y','PDF · 2027-03 到期（90 天预警）'))+kv('3C 认证','3C-XXXXX · 已核验')+kv('产品图片','4 张 · 可加水印')+'</div>'+
    '<div class="dv-sec">说明</div><div class="kvg">'+kv('进场要求','消防产品进场需 3C 认证及型式检验报告')+kv('缺失影响','资料缺失会影响验收与收款')+'</div>';}},
  {id:'trace',name:'使用追溯与日志',dyn:function(){
   var lk=function(txt,doc){return '<span class="lk" data-toast="演示：跳转查看「'+doc+'」相关单据（可反向跳转回材料）">'+txt+'</span>'};
   var all=[
    ['项目',lk('XX产业园喷淋系统工程（3 个引用单据）','XX产业园喷淋系统工程'),'9,600','进行中 72%','09-15'],
    ['项目',lk('XX医院门诊楼报警系统（1 个引用单据）','XX医院门诊楼报警系统'),'600','待消防检测','09-08'],
    ['报价单',lk('BJ-2609-05（含价）','报价单 BJ-2609-05'),'3,200','审批通过 · 正式报价单','09-16'],
    ['报价单',lk('BJ-2609-08（仅清单）','报价单 BJ-2609-08'),'1,200','待客户确认','09-10'],
    ['合同',lk('CG-2609-08（华信管业）','合同 CG-2609-08'),'2,400','履约中','09-08'],
    ['订单',lk('PO-2609-31（华信管业）','订单 PO-2609-31'),'600','在途','09-08'],
    ['入库单',lk('RK-2609-21 · 批次 PC-2609-02','入库单 RK-2609-21'),'1,200','已入库','09-15'],
    ['领用单',lk('WM-2609-02（维保班组）','领用单 WM-2609-02'),'260','已领用','08-28']
   ];
   var hd=['类型','引用单据 / 对象（点击名称跳转）','引用量('+M.unit+')','状态','最近时间'];
   var shown=all.slice(0,4),rest=all.slice(4);
   return '<div class="dv-sec">Used in（引用统计）</div>'+
    '<div class="ref-stats">'+
     '<div class="ref-stat"><b>2</b><span>个项目引用</span></div>'+
     '<div class="ref-stat"><b>2</b><span>份报价单引用</span></div>'+
     '<div class="ref-stat"><b>3</b><span>份合同 / 订单 / 入库</span></div>'+
     '<div class="ref-stat"><b>1</b><span>笔领用</span></div>'+
    '</div>'+
    '<div class="dv-sec">引用明细（同一材料可被 N 个项目 / N 个报价单 / N 个合同 / N 个订单 / N 个入库单引用，点击名称跳转查看）</div>'+
    tblHTML(hd,shown,760)+
    '<div class="ref-more" hidden>'+tblHTML(hd,rest,760)+'</div>'+
    '<div class="tr-more" data-refmore-toggle="1" data-refmore-n="'+all.length+'">查看全部 '+all.length+' 条引用 ▾</div>'+
    '<p class="mn-tip">引用统计与明细逐条列出；引用较多时分页展示（默认前 4 条），点击名称可跳转对应单据，支持反向跳转回材料主数据</p>'+
    '<div class="dv-sec">上下游跳转（点击节点跳转对应单据）</div><div class="pen-chips">'+['供应商','合同','订单','入库','发票','付款','项目'].map(function(n,i){return '<span class="pen-chip" data-toast="演示：跳转到 '+n+' 及其上下游单据">'+n+'</span>'+(i<6?'<span class="pen-arr">→</span>':'')}).join('')+'</div><p class="mn-tip">点击节点可跳转上下游单据；从项目可反向跳转回报价 / 投标 / 商机 / 客户</p>'+
    '<div class="dv-sec">操作日志</div>'+tblHTML(['时间','操作人','动作','说明'],[
    ['09-15 14:20','李敏','入库确认','RK-26xx · AI 拍照入库'],
    ['09-12 10:05','孙倩','价格沉淀','询价 → 价格库 V2'],
    [M.upd+' 09:30','系统','创建 / 更新','材料主数据维护']],700);}}];
 function kv(k,v){return '<div class="kv-row"><span>'+k+'</span><b>'+v+'</b></div>'}
 return {tabs:tabs,kv:kv};
}
function materialTabBody(M,tab){
 var tabs=matTabs(M).tabs;
 var t=null;for(var i=0;i<tabs.length;i++){if(tabs[i].id===tab)tabs[i]}
 t=tabs[0];
 for(var j=0;j<tabs.length;j++){if(tabs[j].id===tab)t=tabs[j]}
 return t.dyn();
}
function renderMatDrawer(){
 var M=matOf(curMatId);if(!M)M=matOf('MAT-0101');
 if(!M)return;
 var stock=(M.stock||0)+(M.transit||0);
 var tabs=matTabs(M).tabs.filter(function(t){return t.id!=='info'});
 if(!curDetailTab||curDetailTab==='info')curDetailTab=tabs[0].id;
 var tab=tabs[0];for(var i=0;i<tabs.length;i++){if(tabs[i].id===curDetailTab)tab=tabs[i]}
 curDetailTab=tab.id;
 var body=materialTabBody(M,curDetailTab);
 closeMatDrawer();
 var root=document.createElement('div');root.id='matDrawerRoot';
 var headKv=[['材料编码',M.code],['名称 / 品牌 / 型号',M.name+' · '+M.brand+' · '+M.spec],['分类路径',M.cat],['类型',tg('b',M.type)],
  ['状态',stTg(M.st)],['规格',M.spec1||M.spec||'—'],['材质',M.mat||'—'],['执行标准',M.std||'GB/T 3091'],
  ['主单位',M.unit+'（默认）'],['采购 / 库存 / 计价单位',M.unit+' / '+M.unit+' / '+M.unit],['主材 / 辅材',tg(M.aux==='主材'?'b':'gray',M.aux)],['控制方式',ctrlTg(M.ctrl)],
  ['适用项目类型',M.proj||'新建 / 改造'],['产地',M.origin||'—'],['创建 / 更新','2026-08 / '+M.upd],['替代料','—']];
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:760px">'+
  '<div class="drawer-hd"><h2>'+M.name+' · '+M.code+'</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="dt-head"><div class="dt-head-t">基本信息</div><div class="dt-head-g">'+headKv.map(function(k){return '<div class="k-pair"><span class="hi">'+k[0]+'</span><span class="hv">'+k[1]+'</span></div>'}).join('')+'</div></div>'+
   '<div class="dtabs">'+tabs.map(function(t){return '<div class="dtab '+(t.id===curDetailTab?'active':'')+'" data-id="'+t.id+'">'+t.name+'</div>'}).join('')+'</div>'+
   '<div class="dt-body">'+body+'</div>'+
  '</div>'+
  '<div class="drawer-ft">'+
   '<button class="btn btn-ghost" data-edit-mat="1">'+ICON.gear+'<span>编辑</span></button>'+
   '<button class="btn btn-ghost" data-dup-mat="1">'+ICON.file+'<span>复制新增</span></button>'+
   '<button class="btn btn-ghost" data-toast="演示：打印 / 导出 PDF">'+ICON.dl+'<span>打印</span></button>'+
   '<button class="btn btn-primary" data-toast="演示：维护价格（打开价格库编辑）">'+ICON.plus+'<span>维护价格</span></button>'+
  '</div></div>';
 document.body.appendChild(root);
 applyA11y();
}
function renderInvLedger(id){
 var M=matOf(id);if(!M)return;
 closeMatDrawer();
 var stock=(M.stock||0)+(M.transit||0);
 var root=document.createElement('div');root.id='matDrawerRoot';
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:560px">'+
  '<div class="drawer-hd"><h2>库存台账 · '+M.name+'</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="drawer-sub">'+M.code+' · 当前库存 <b>'+nfmt(stock)+'</b> · 安全库存 '+nfmt(M.safe)+' · 在途 '+(M.transit||0)+'</div>'+
   tblHTML(['仓库','批次号','数量','入库日期','状态'],M.transit?[
    ['公司主仓 A','PC-'+M.code.slice(-2)+'A',nfmt(Math.ceil(stock*0.6)),M.upd,tg('g','在库')],
    ['项目现场仓','PC-'+M.code.slice(-2)+'B',nfmt(Math.ceil(stock*0.4)),'08-26',tg('g','在库')],
    ['在途（PO-2609-31）','—',nfmt(M.transit),'计划收货',tg('o','在途')]]:[
    ['公司主仓 A','PC-'+M.code.slice(-2)+'A',nfmt(Math.ceil(stock*0.6)),M.upd,tg('g','在库')],
    ['项目现场仓','PC-'+M.code.slice(-2)+'B',nfmt(Math.ceil(stock*0.4)),'08-26',tg('g','在库')]],660)+
   '<div class="mn-tip">左下二维码溯源 / 批次扫码出入库；点击「打印二维码」可批量打印批次标签</div>'+
  '</div></div>';
 document.body.appendChild(root);
 applyA11y();
}
function openCatMgr(){
 closeMatDrawer();
 var root=document.createElement('div');root.id='matDrawerRoot';
 var cats=[['消防水系统',3,'一级'],['　管材 / 管件',1,'二级'],['　　镀锌钢管',1,'三级'],['　　沟槽管件',0,'三级'],['　喷淋',1,'二级'],['　　喷淋头',1,'三级'],['　消火栓 / 阀门',0,'二级'],['　灭火器材',1,'二级'],['消防电系统',2,'一级'],['　火灾报警',1,'二级'],['　　点型感烟探测器',1,'三级'],['　消防主机',0,'二级'],['　布线',1,'二级'],['防排烟系统',2,'一级'],['　风管',0,'二级'],['　防火分隔',1,'二级'],['　风阀',1,'二级'],['报警系统',0,'一级'],['智慧消防 / 硬件',1,'一级'],['未分类',0,'一级']];
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:560px">'+
  '<div class="drawer-hd"><h2>分类管理</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="drawer-sub">维护消防专业分类树：改名 / 删除 / 新增 / 移动顺序（PaaS 可配置）</div>'+
   '<div class="catm-tip">停用类别时材料自动归「未分类」· 删除仅限未被引用分类</div>'+
   '<div class="catm-list">'+cats.map(function(c){return '<div class="catm-row"><span class="ct-arr empty">▸</span><span>'+c[0]+'</span><span class="ct-cnt">'+c[1]+'</span><span class="catm-tag">'+c[2]+'</span><span class="catm-ops">'+
    '<button class="mini-btn mini-no" data-catm="addChild">新增子类</button>'+
    '<button class="mini-btn mini-no" data-catm="rename">改名</button>'+
    '<button class="mini-btn mini-no" data-catm="del">删除</button>'+
    '<button class="mini-btn mini-no" data-catm="up">上移</button>'+
    '<button class="mini-btn mini-no" data-catm="down">下移</button></span></div>'}).join('')+'</div>'+
  '</div>'+
  '<div class="drawer-ft">'+
   '<button class="btn btn-ghost" data-drawer-close>关闭</button>'+
   '<button class="btn btn-primary" data-catm="addTop">'+ICON.plus+'<span>新增一级分类</span></button>'+
  '</div></div>';
 document.body.appendChild(root);
 applyA11y();
}
function matFormValue(k){var el=document.querySelector('[data-mk="'+k+'"]');return el?el.value:''}
function matFormSet(k,v){var el=document.querySelector('[data-mk="'+k+'"]');if(el&&v!=null){el.value=v}}
function todayMMDD(){var d=new Date(),p=function(n){return (n<10?'0':'')+n};return p(d.getMonth()+1)+'-'+p(d.getDate())}
function openMatForm(id){
 closeMatDrawer();
 var M=id?matOf(id):null;
 curMatId=id||null;
 var isNew=!M;
 var root=document.createElement('div');root.id='matDrawerRoot';
 var catOpts=['消防水系统 / 管材 / 管件','消防水系统 / 喷淋','消防水系统 / 消火栓 / 阀门','消防水系统 / 灭火器材','消防电系统 / 火灾报警','消防电系统 / 消防主机','消防电系统 / 布线','消防电系统 / 线缆 / 桥架','防排烟系统 / 风管','防排烟系统 / 防火分隔','防排烟系统 / 风阀','报警系统 / 气体灭火','报警系统 / 应急照明','智慧消防 / 硬件 / 数据采集','智慧消防 / 硬件 / 监测设备','气灭与应急 / 气体灭火','气灭与应急 / 应急照明','未分类'];
 var U=['m','只','套','台','具','㎡','个','件'];
 var mf=function(label,ctrl,req){return '<div class="mf-row"><span class="mf-label">'+label+(req?' <i>*</i>':'')+'</span>'+ctrl+'</div>'};
 var inp=function(k,ph,v){return '<input class="fkw" data-mk="'+k+'" placeholder="'+ph+'" value="'+(v||'')+'"/>'};
 var selk=function(k,opts,def,v){return '<select data-mk="'+k+'">'+opts.map(function(o){return '<option'+(v? (o===v?' selected':''):(o===def?' selected':''))+'>'+o+'</option>'}).join('')+'</select>'};
 var Mk=M?M:{};
 var tabs=[['b1','基本信息'],['b2','采购与供应商'],['b3','价格与成本'],['b4','库存与批次'],['b5','资质与附件']];
 root.innerHTML=
 '<div class="drawer-mask" data-drawer-close></div>'+
 '<div class="mat-drawer" style="width:760px">'+
  '<div class="drawer-hd"><h2>'+(isNew?'新增材料':'编辑材料 · '+M.code)+'</h2><div class="drawer-hd-acts"><button class="drawer-close" data-drawer-close>✕</button></div></div>'+
  '<div class="drawer-bd">'+
   '<div class="drawer-sub">'+(isNew?'新增材料：仅维护基本信息，保存即写入主数据（采购 / 价格 / 库存 / 资质随后续业务沉淀）：':'编辑材料：仅维护基本信息，编码不可改，保存后生成变更留痕；采购 / 价格 / 库存 / 资质请通过详情页对应入口维护：')+'</div>'+
   '<div class="dv-sec">基本信息</div>'+
   '<div class="mf-grid">'+
    mf('材料编码','<span class="mn-readonly">'+(M?M.code:'WL-26XX（自动生成 · 不可编辑）')+'</span>')+
    mf('名称',inp('name','请输入材料名称，如：镀锌钢管',Mk.name),1)+
    mf('品牌',inp('brand','如：华信管业',Mk.brand))+mf('产地',inp('origin','如：江苏南通 / 浙江宁波',Mk.origin))+mf('型号',inp('spec','如：DN100',Mk.spec))+
    mf('规格',inp('spec1','如：6m / 根',Mk.spec1))+mf('分类路径',selk('cat',catOpts,catOpts[0],Mk.cat&&Mk.cat.replace(/\\//g,' / ')),1)+
    mf('材质',inp('mat','如：热镀锌钢管',Mk.mat||''))+mf('执行标准',inp('std','如：GB/T 3091',Mk.std||''))+
    mf('主材 / 辅材',selk('aux',['主材','辅材'],'主材',Mk.aux))+mf('类型',selk('type',['材料供货','设备成套包','复合项'],'材料供货',Mk.type))+
    mf('适用项目类型',selk('proj',['新建','改造','维保','新建 / 改造','新建 / 改造 / 维保'],'新建',Mk.proj))+mf('状态',selk('st',['启用','停用'],'启用',Mk.st&&Mk.st.indexOf('停用')>-1?'停用':'启用'))+
    mf('备注',inp('note','选填：等级 / 用途说明'))+
   '</div>'+
   '<div class="dv-sec">单位与换算</div>'+
   '<div class="mf-grid">'+
    mf('主单位',selk('uBase',U,'m',Mk.unit))+mf('采购单位',selk('uBuy',U,'m',Mk.unit))+
    mf('库存单位',selk('uInv',U,'m',Mk.unit))+mf('计价单位',selk('uPrice',U,'m',Mk.unit))+
   '</div>'+
   '<div class="dv-sec">成本与管控</div>'+
   '<div class="mf-grid">'+
    mf('控制方式',selk('ctrl',['量价双控','仅控量','仅控价','不控'],'量价双控',Mk.ctrl),1)+
    mf('参考价(元)',inp('ref','如：168.0（内部定额）',Mk.ref!=null?Mk.ref:''))+
   '</div>'+
  '</div>'+
  '<div class="drawer-ft">'+
   '<button class="btn btn-ghost" data-toast="演示：AI / OCR 录入 — 上传规格书 / 图片自动回填字段">'+ICON.cam+'<span>AI / OCR 录入</span></button>'+
   (isNew?'':'<button class="btn btn-ghost" data-dup-mat="1">'+ICON.file+'<span>复制新增</span></button>')+
   '<button class="btn btn-primary" data-mat-save="1">'+ICON.check+'<span>保存</span></button>'+
  '</div></div>';
 document.body.appendChild(root);
 applyA11y();
}
function matFormSave(){
 var vname=matFormValue('name');
 if(!vname){toast('演示：请填写材料名称');return}
 var ctrl=matFormValue('ctrl')||'不控';
 if(ctrl==='量价双控'&&!matFormValue('ref')){toast('演示：量价双控须填写参考价 / 内部定额');return}
 var catRaw=(matFormValue('cat')||'未分类').replace(/ {2,}/g,' ').replace(/ \\/ /g,'/');  // 归一化分类路径为 / 分隔
 var fv={name:vname,brand:matFormValue('brand')||'—',origin:matFormValue('origin')||'',spec:matFormValue('spec')||'—',cat:catRaw,unit:matFormValue('uBase')||'m',aux:matFormValue('aux')||'主材',ctrl:ctrl,type:matFormValue('type')||'材料供货',proj:matFormValue('proj'),note:matFormValue('note'),mat:matFormValue('mat')||'',std:matFormValue('std')||''};
 var ref=parseFloat(matFormValue('ref'))||0;
 closeMatDrawer();
 var M=matOf(curMatId);
 if(M){
  var oldName=M.name,oldRef=M.ref;
  M.name=fv.name;M.brand=fv.brand;M.origin=fv.origin;M.spec=fv.spec;M.cat=fv.cat;M.unit=fv.unit;M.aux=fv.aux;M.ctrl=ctrl;M.type=fv.type;M.proj=fv.proj;M.ref=ref;M.mat=fv.mat;M.std=fv.std;
  if(M.safe&&M.stock!=null&&M.stock<=M.safe){/* 安全库存变化不自动改库存，仅提醒 */toast('演示：材料已保存，变更已留痕（'+todayMMDD()+'，操作人：当前用户）')}
  else toast('演示：材料已保存，变更已留痕（'+todayMMDD()+'，操作人：当前用户）');
 }else{
  var maxN=0;MATERIALS.forEach(function(x){var m=(''+x.code).match(/WL-(\\d+)/);if(m)maxN=Math.max(maxN,+m[1])});
  var nid='MAT-'+(10000+maxN+1),ncode='WL-'+(1000+maxN+1);
  MATERIALS.push({id:nid,code:ncode,name:fv.name,cat:fv.cat,brand:fv.brand,origin:fv.origin,spec:fv.spec,unit:fv.unit,ctrl:ctrl,price:ref,type:fv.type,aux:fv.aux,st:matFormValue('st')||'启用',stock:0,safe:0,transit:0,ref:ref,lastIn:null,tax:'13%',moq:'',lead:'',sup:'',upd:todayMMDD(),proj:fv.proj,mat:fv.mat,std:fv.std});
  curMatId=nid;
  toast('演示：材料已保存，生成编码 '+ncode+' 并加入主数据（草稿状态，可编辑）');
 }
 if(lastPage&&lastPage.menu==='材料主数据列表'&&lastPage.sid==='buy')renderPage(lastPage.sid,lastPage.grp,lastPage.menu);
}
function contractData(cid){
 var c=null;for(var i=0;i<CONTRACTS.length;i++){if(CONTRACTS[i].id===cid){c=CONTRACTS[i];break}}
 if(!c)return null;
 var dirTag=c.dir==='销售'?tg('b','销售合同 / 收入合同'):c.dir==='采购'?tg('b','采购合同 / 支出合同'):c.dir==='框架'?tg('b','框架合同'):c.dir==='维保'?tg('b','维保合同'):tg('b','联营合同');
 var amtTxt=c.amt&&c.amt>0?('¥'+c.amt.toFixed(2)+' 万'):'—';
 var pj=projOf(c.proj);
 return {sid:'cost',crumb0:'合同成本',crumb1:'合同管理',short:c.id,title:c.id+' · '+c.name,primaryAct:'发起付款',
  head:[
   {sec:'基本信息',kvs:[['合同编号 / 名称',c.id+' · '+c.name],['合同类型',dirTag],['我方主体','诺盾博达消防工程有限公司'],['对方单位',c.party],['所属项目',c.proj],['合同金额 / 税率',amtTxt+(c.amt>0?' · 9%':'')],['付款 / 回款比例',c.pct],['当前状态',tg('g',c.st)],['经营方式',c.mode+' · '+c.ptype],['台账记录','按 CONTRACTS 实时渲染']]},
   {sec:'合同概要',kvs:[['所属项目',c.proj],['业务类型',c.bus],['合同类型',c.type],['关联项目',pj?pj.name:'—']]}
  ],
  risk:['该合同为台账记录：编号 / 金额 / 状态 / 对方单位按本记录实时渲染；清单 / 履约 / 变更 / 结算 / 票款 / 风险等明细级 Tab 以 HT-2609-18 主合同样张为准（演示范围）'],
  tabs:[
   {id:'proj',name:'关联项目',type:'tbl',headers:['项目编号','项目名称','项目类型','项目经理','关联合同','状态','跳转'],rows:pj?[[pj.id,pj.name,pj.type,pj.owner,c.id,tg('g',pj.stage),'<button class="mini-btn mini-ok" data-proj="'+pj.id+'">查看项目</button>']]:[['—','暂未匹配项目（演示数据）','—','—',c.id,'—','—']]},
   {id:'items',name:'清单 / 成本目标',type:'kv',groups:[{sec:'合同清单概要',kvs:[['合同名称',c.name],['所属项目',c.proj],['合同金额',amtTxt],['合同类型',c.type],['付款 / 回款比例',c.pct]]},{sec:'说明',kvs:[['明细级数据','以 HT-2609-18 主合同样张为准（演示范围）']]}]},
   {id:'amt',name:'金额汇总',type:'kv',groups:[{sec:'自动汇总（按台账记录）',kvs:[['原合同金额',amtTxt],['变更累计','+¥0.00 万'],['子合同累计','+¥0.00 万'],['生效合同总额',tg('b',amtTxt)]]},{sec:'口径说明',kvs:[['计算方式','按合同台账金额实时渲染；变更 / 子合同未维护时记 0'],['与结算对照','「结算与核算」按各合同分别结算']]}]},
   {id:'rp',name:'回款计划',type:'tbl',headers:['节点','比例','金额(万)','触发条件','计划 / 实际日期','状态'],rows:contractRpRows(c)},
   {id:'pay',name:'收票 / 付款',type:'tbl',headers:['类型','单号','金额(万)','发票情况','智能业务洞察','状态'],rows:[[c.dir==='采购'?'付款':'收款',c.id+' · 台账',c.amt?c.amt.toFixed(2):'—','按发票台账联动','明细以 HT-2609-18 样张为准',tg('gray','按台账')]]},
   {id:'risk',name:'风险与业务助手',type:'ver',versions:[[c.st+' · 台账状态','当前记录']],ai:[['风险结论',tg('y','该记录风险明细以主合同样张为准')]]},
   {id:'links',name:'循环穿透 / 操作日志',type:'tbl',headers:['链路节点','单据 / 对象','关联关系','穿透操作'],rows:(function(){
    var r=[];
    if(pj)r.push([tg('b','① 项目'),pj.id+' · '+pj.name,'合同履约主体 · 项目 360° 可反查本合同','<button class="mini-btn mini-ok" data-proj="'+pj.id+'">穿透项目</button>']);
    r.push([tg('b','② 本合同'),c.id+' · '+c.name,'链路起点 / 终点 · 台账 ⇄ 详情','<button class="mini-btn mini-ok" data-toast="演示：已在当前合同详情，可从台账列表重新定位 '+c.id+'">定位台账</button>']);
    r.push([tg('b','③ 发票'),c.dir==='采购'?'进项发票（收票）':'销项发票（开票）','按「收票 / 付款」Tab 票款联动 · 自动挂接','<button class="mini-btn mini-ok" data-toast="演示：穿透到发票台账，已过滤 '+c.id+' 关联发票">穿透发票</button>']);
    r.push([tg('b','④ 付款 / 回款'),c.dir==='采购'?'付款单（FK）':'收款单（SK）','按回款计划 / 付款比例联动 · 洞察留痕','<button class="mini-btn mini-ok" data-toast="演示：穿透到收付款单，已过滤 '+c.id+' 关联单据">穿透票款</button>']);
    return r})()}
  ]
 };
}
function projByName(n){n=(n||'').slice(0,6);for(var i=0;i<PROJS.length;i++){var p=PROJS[i];if(p.name.indexOf(n)>-1||n.indexOf(p.name.slice(0,6))>-1)return p}return null}
function projOf(projName){
 if(!projName)return null;
 for(var i=0;i<PROJS.length;i++){var p=PROJS[i];if(projName.indexOf(p.name.slice(0,4))>-1||p.name.indexOf(projName.slice(0,4))>-1)return p}
 return null;
}
function contractRpRows(c){
 var a=c.amt||0;
 if(c.dir==='销售')return [['预付款','30%',(a*0.3).toFixed(2),'合同签订后 5 个工作日内','—',tg('gray','按合同')],['进度款','40%',(a*0.4).toFixed(2),'按节点产值确认','—',tg('gray','按合同')],['竣工款','25%',(a*0.25).toFixed(2),'竣工验收合格','—',tg('gray','按合同')],['质保金','5%',(a*0.05).toFixed(2),'质保期满','—',tg('gray','按合同')]];
 if(c.dir==='采购')return [['到货付款','80%',(a*0.8).toFixed(2),'货到验收','—',tg('gray','按合同')],['结算款','15%',(a*0.15).toFixed(2),'结算审定','—',tg('gray','按合同')],['质保金','5%',(a*0.05).toFixed(2),'质保期满','—',tg('gray','按合同')]];
 if(c.dir==='维保')return [['年度维保费','100%',a.toFixed(2),'合同年度','—',tg('gray','按合同')]];
 if(c.dir==='框架')return [['按子订单','—',a.toFixed(2),'框架下订单','—',tg('gray','按合同')]];
 if(c.dir==='联营')return [['走款计划','按合同',a.toFixed(2),'联营资金监管','—',tg('gray','按合同')]];
 return [['按合同约定','—',a.toFixed(2),'—','—',tg('gray','按合同')]];
}
function renderDetail(kind,cid){
 var D=DET[kind];
 curDetailKind=kind;
 if(kind==='quote'){renderQuoteSheet();return}
 if(kind==='contract'){renderContractDetail(cid);return}
 if(kind==='material'){renderMatDrawer();return}
 if(kind==='price'){priceDrawer();return}
 if(kind==='contract'&&cid&&cid!=='HT-2609-18'){D=contractData(cid)||DET.contract}
 if(!D)return;
 if(!curDetailTab)curDetailTab=D.tabs[0].id;
 var tab=null;for(var i=0;i<D.tabs.length;i++){if(D.tabs[i].id===curDetailTab)tab=D.tabs[i]}
 if(!tab){tab=D.tabs[0];curDetailTab=tab.id}
 var body=renderTabBody(tab);
 $('#viewDash').style.display='none';
 var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="'+D.sid+'">'+D.crumb0+'</span><span>/</span><span class="seg" data-goseg="'+D.sid+'">'+D.crumb1+'</span><span>/</span><span class="seg cur-seg">'+D.short+'</span></div>'+
 '<div class="page-head"><h1>'+D.title+'</h1><div class="page-actions">'+
  '<button class="btn btn-ghost" data-back="1">'+ICON.up+'<span>返回列表</span></button>'+
  (kind==='contract'?'<button class="btn btn-ghost" data-cedit="1">'+ICON.file+'<span>编辑合同（生成新版本）</span></button>':'')+
  (kind==='material'?'<button class="btn btn-ghost" data-edit-mat="1">'+ICON.gear+'<span>编辑</span></button><button class="btn btn-ghost" data-dup-mat="1">'+ICON.file+'<span>复制新增</span></button>':'')+
  '<button class="btn btn-ghost" data-toast="演示：打印 / 导出 PDF">'+ICON.dl+'<span>打印 / 导出</span></button>'+
  '<button class="btn btn-primary" data-toast="演示：'+D.primaryAct+'">'+ICON.plus+'<span>'+D.primaryAct+'</span></button></div></div>'+
 (D.scan?'<div class="scan-box">📎 证书扫描件 · PDF 2.4MB　<button class="mini-btn mini-ok" data-act="查看">查看</button> <button class="mini-btn mini-no" data-act="下载">下载</button> <button class="mini-btn mini-no" data-act="加可见水印">加可见水印</button></div>':'')+
 ''+
 '<div class="dt-card">'+D.head.map(function(s){return '<div class="dt-sec"><h4>'+s.sec+'</h4><div class="kvg">'+s.kvs.map(function(k){return '<div class="kv-row"><span>'+k[0]+'</span><b>'+k[1]+'</b></div>'}).join('')+'</div></div>'}).join('')+'</div>'+
 '<div class="dtabs">'+D.tabs.map(function(t){return '<div class="dtab '+(t.id===curDetailTab?'active':'')+'" data-id="'+t.id+'">'+t.name+'</div>'}).join('')+'</div>'+
 '<div class="dt-body">'+body+'</div>';
 window.scrollTo(0,0);
 if(D.risk&&D.risk.length)setTimeout(function(){toast(D.risk.map(function(r){return '• '+r}).join('<br>'),'risk')},450);
}
function qNum(v){return typeof v==='number'?v:parseFloat(String(v).replace(/,/g,''))||0}
function qFmt(n){return Math.round(n).toLocaleString('en-US')}
function quoteSheetCost(){var t=null;for(var i=0;i<QUOTE_SHEET.totals.length;i++){if(QUOTE_SHEET.totals[i][0]==='成本测算'){t=QUOTE_SHEET.totals[i][1];break}}var m=t?String(t).match(/[\\d,]+/):null;return m?parseFloat(m[0].replace(/,/g,'')):0}
function qStatusTag(s){return s==='已中标'?tg('g',s):s==='未中标'?tg('r',s):s==='已作废'?tg('gray',s):s==='待审批'?tg('y',s):tg('b',s)}
function quoteNewFromWb(){
 var src=window.WB_SRC||null;
 var nid='BJ-2609-'+(90+LINK_QUOTES.length);
 var o=src&&src.oid?oppOf(src.oid):null;
 LINK_QUOTES.unshift({id:nid,oid:o?o.id:'',cid:o?o.cid:'CL-001',name:src&&src.name?src.name:'未命名报价项目',type:wbMode==='list'?'仅清单':'含价',amt:null,raw:null,gm:'—',status:'草稿',ver:'V1',updated:'09-18',bid:null});
 window.QDATA=window.QDATA||{};delete window.QDATA[nid];
 renderQuoteSheet(nid);
 toast('报价单 '+nid+' 已生成（草稿）· 来源：'+(src?src.type+' · '+src.id:'独立新建')+'，提交审批后可转合同 / 反向生成目标成本');
}
function quoteSheetData(id){
 window.QDATA=window.QDATA||{};
 if(QDATA[id])return QDATA[id];
 var q=null;for(var i=0;i<LINK_QUOTES.length;i++){if(LINK_QUOTES[i].id===id){q=LINK_QUOTES[i];break}}
 var Q;
 if(q&&q.type==='仅清单'){
  Q=JSON.parse(JSON.stringify(QUOTE_SHEET_2));
  Q.listOnly=true;
  Q.status=qStatusTag(q.status);
  Q.projName=q.name;
  Q.meta=[['报价单号',id],['客户',clName(q.cid)],['项目',q.name],['报价类型','仅清单（总价以合同约定为准）']];
  Q.contractTotal=(id==='BJ-2609-08')?'¥ 1,860,000':'待双方约定总价';
 }else{
  Q=JSON.parse(JSON.stringify(QUOTE_SHEET));
  if(q){
   Q.status=qStatusTag(q.status);
   Q.projName=q.name;
   Q.meta=[['客户 / 商机',oppOf(q.oid)?oppOf(q.oid).name:'—'],['报价单号',id],['报价日期','2026-09-16'],['有效期','30 天（至 10-16）']];
   Q.cost=q.raw!=null?q.raw*10000:quoteSheetCost();
   Q.meta.push(['报价来源',q.oid&&oppOf(q.oid)?('商机 · <span class="link-btn" data-opid="'+q.oid+'">'+q.oid+' '+oppOf(q.oid).name+' ▸</span>'):('客户 · <span class="link-btn" data-clid="'+q.cid+'">'+clName(q.cid)+' ▸</span>（独立新建）')]);
   if(q.amt&&q.amt>0){
    var base=0;Q.groups.forEach(function(g){g.rows.forEach(function(r){base+=qNum(r[4])*qNum(r[5])})});
    if(base>0){var k=(q.amt*10000/1.09)/base;Q.groups.forEach(function(g){g.rows.forEach(function(r){r[5]=Math.round(qNum(r[5])*k*100)/100;r[6]=Math.round(qNum(r[5])*qNum(r[4]))})})}
   }
  }else{Q.cost=quoteSheetCost()}
 }
 Q.groups.forEach(function(g){g.rows.forEach(function(r){r[4]=qNum(r[4]);r[5]=qNum(r[5]);r[6]=qNum(r[6])})});
 QDATA[id]=Q;return QDATA[id];
}
function quoteTotalHTML(Q,taxK){
 var sum=0;Q.groups.forEach(function(g){g.rows.forEach(function(r){sum+=qNum(r[4])*qNum(r[5])})});
 var tax=sum*0.09,inc=sum+tax;
 var raw=Q.cost!=null?Q.cost:quoteSheetCost(),gm=(inc-raw)/inc*100;
 return '<span>合计（未税）<b>¥'+qFmt(sum)+'</b></span><span>税率 9% <b>¥'+qFmt(tax)+'</b></span><span>含税总价 <b>¥'+qFmt(inc)+'</b></span><span>成本测算 <b>¥'+qFmt(raw)+'</b></span><span>毛利率 <b style="color:'+(gm<12?'var(--red)':'var(--green)')+'">'+gm.toFixed(1)+'%</b></span>';
}
function wbQuoteAmt(){var s=0;var w=window.WBR||[];w.forEach(function(r){s+=qNum(r[5])*qNum(r[9])});return s/10000*1.09}
function openAdjApprove(){
 var id=window.curQuoteId;
 var lq=null;if(id){for(var i=0;i<LINK_QUOTES.length;i++){if(LINK_QUOTES[i].id===id){lq=LINK_QUOTES[i];break}}}
 var amt=lq?(lq.amt!=null?lq.amt:(id==='BJ-2609-08'?186:null)):window.WBR?wbQuoteAmt():156.35;
 var amtTxt=amt==null?'（待双方约定总价）':'¥'+amt.toFixed(2)+' 万';
 var lv=amt==null?'待双方约定总价后按金额路由':amt>=500?'总经理特批（金额 >500 万）':amt>=100?'成控 + 分管审批（100~500 万）':'商务经理审批（<100 万）';
 openModal('提交审批 · 分级路由');
 $('#modalNew .modal-bd').innerHTML='<div class="banner">'+ICON.info.replace('class="ic"','class="ic" style="width:16px;height:16px;color:var(--blue);margin-top:3px"')+'<div><b>当前报价金额：'+amtTxt+'</b><br/>系统按金额自动路由审批级别，无需人工指定</div></div>'+
  '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">'+
  ['<100 万 · 商务经理审批','100~500 万 · 成控 + 分管审批','>500 万 · 总经理特批'].map(function(s,i){return '<div style="border:1px solid var(--line);border-radius:8px;padding:10px;font-size:12px;'+(lv.indexOf(i===0?'商务':i===1?'成控':'总经理')>-1?'border-color:var(--blue);background:#f0f7ff':'')+'">'+s+'</div>'}).join('')+'</div>'+
  '<div class="demo-note" style="margin-top:12px">分级规则可在系统管理 / PaaS 流程配置中调整；提交后进入审批流（会签 / 加签），与合同审批联动</div>'+
  '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn btn-ghost" data-close-modal="1">取消</button><button class="btn btn-primary" data-qapr-ok="'+lv+'">提交（'+lv.split('（')[0]+'）</button></div>';
 $('#mSubmit').style.display='none';
}
function renderQuoteSheet(qid){
 var id=qid||'BJ-2609-05';
 var Q=quoteSheetData(id);
 var listOnly=!!Q.listOnly;
 var ed=window.QEDT=window.QEDT||{id:id,tax:'exc',edit:false};
 if(ed.id!==id){ed.id=id;ed.edit=false}
 window.curQuoteId=id;
 var taxK=ed.tax==='inc'?1.09:1;
 var editMode=!listOnly&&ed.edit;
 $('#viewDash').style.display='none';
 var v=$('#viewPage');v.style.display='';
 v.innerHTML=
 '<div class="crumb"><span class="seg" data-goseg="bid">市场投标</span><span>/</span><span class="seg" data-goseg="bid">报价与勘察</span><span>/</span><span class="seg cur-seg">'+id+'</span></div>'+
 '<div class="page-head"><h1>报价单 '+id+' · '+Q.projName+'</h1><div class="page-actions">'+
  '<button class="btn btn-ghost" data-back="1">'+ICON.up+'<span>返回列表</span></button>'+
  (!listOnly&&!editMode?'<button class="btn btn-ghost" data-qedit="1">'+ICON.gear+'<span>编辑明细</span></button>':'')+
  (editMode?'<button class="btn btn-ghost" data-qcancel="1"><span>取消</span></button><button class="btn btn-primary" data-qsave="1"><span>保存版本</span></button>':'')+
  (!listOnly?'<button class="btn btn-ghost" data-qapr="1"><span>提交审批</span></button>':'')+
  '<button class="btn btn-primary" data-qto-c="1">'+ICON.check+'<span>转合同 / 销售订单</span></button>'+
  (!listOnly?'<button class="btn btn-ghost" data-qtc="1">'+ICON.box+'<span>反向生成目标成本</span></button>':'')+
  '<button class="btn btn-ghost" data-toast="演示：选择打印模板（Logo / 口号 / 条款 / 盖章位 / 多语言）→ 生成 PDF">'+ICON.dl+'<span>创建 PDF / 打印</span></button></div></div>'+
 '<div class="sheet">'+
  '<div class="sheet-hd"><div><div class="sh-co">'+Q.co+'</div><div class="sh-slogan">'+Q.slogan+'</div></div><div style="text-align:right">'+Q.status+'<div style="font-size:12px;color:var(--t3);margin-top:6px">状态流：草稿 → 审批中 → 已通过 → 已打印 / 交付 → 已中标 / 未中标 → 转目标成本 / 已关闭（未中标记原因进丢标分析）</div></div></div>'+
  '<div class="kvg" style="grid-template-columns:repeat(4,1fr);margin:14px 0">'+Q.meta.map(function(m){return '<div class="kv-row"><span>'+m[0]+'</span><b>'+m[1]+'</b></div>'}).join('')+'</div>'+
  ''+
  (!listOnly?'<div class="q-tools"><span class="link-btn" data-qtax="1">单价口径：'+(ed.tax==='inc'?'含税价（税率 9%）':'未税价')+' ▾</span><span style="font-size:12px;color:var(--t3)">'+(editMode?'编辑模式：单价 / 数量可改，保存后生成新版本并留痕':'点击「编辑明细」可修改单价 / 数量；点「提交审批」按金额分级路由')+'</span>'+(editMode?'<button class="mini-btn mini-ok" data-qadd="1" style="margin-left:auto">＋ 添加明细行</button>':'')+'</div>':'')+
  Q.groups.map(function(g,gi){var hds=listOnly?(g.headers||['序号','名称','规格 / 说明','单位','数量']):(g.headers||['序号','名称','规格 / 说明','单位','数量','单价(元)'+(ed.tax==='inc'?'·含税':'·未税'),'合价(元)']);
   if(!listOnly&&editMode)hds=hds.concat(['操作']);
   return '<div class="dv-sec">'+g.name+'</div>'+tblHTML(hds,g.rows.map(function(r,i){var gi2=gi+'|'+i;
    if(listOnly)return [r[0],r[1],r[2],r[3],r[4]];
    var qty=editMode?'<input class="q-in" data-qq="'+gi2+'" value="'+r[4]+'"/>':qFmt(r[4]);
    var price=editMode?'<input class="q-in" data-qp="'+gi2+'" value="'+r[5]+'"/>':qFmt(r[5]*taxK);
    var row=[r[0],r[1],r[2],r[3],qty,price,'<td data-qamt="'+gi2+'">'+qFmt(r[6]*taxK)+'</td>'];
    if(editMode)row.push('<button class="mini-btn mini-no" data-qdel="'+gi2+'">删除</button>');
    return row}),760)}).join('')+
  (listOnly?'<div class="sheet-total" id="qtotals">'+Q.totals.map(function(t){return '<span>'+t[0]+' <b>'+t[1]+'</b></span>'}).join('')+'</div>':'<div class="sheet-total" id="qtotals">'+quoteTotalHTML(Q,taxK)+'</div>')+
  '<div class="kvg" style="grid-template-columns:repeat(2,1fr);margin-top:12px">'+Q.terms.map(function(t){return '<div class="kv-row"><span>'+t[0]+'</span><b>'+t[1]+'</b></div>'}).join('')+'</div>'+
  '<div style="display:flex;gap:12px;align-items:center;margin-top:12px">'+tg('g','电子签：已签发')+'<span style="font-size:12px;color:var(--t3)">审批记录：王悦提交 → 成控李敏 → 总经理王志明 · 全部通过'+(ed.apr?('（本版已按分级路由提交：'+ed.apr+'）'):'')+'</span></div>'+
  (listOnly?'':'<div class="dv-sec" style="margin-top:14px">同类历史报价参考（按项目类型 / 系统 / 区域匹配 · 供审核价格合理性）</div>'+
   '<div class="table-wrap" style="margin-top:8px">'+tblHTML(['材料 / 设备','历史最低','历史最高','均价','最近成交来源','历史报价单数'],[
    ['镀锌钢管 DN100','¥168.0','¥186.0','¥172.5','安泰电子 · 09-10','3 单'],
    ['喷淋头 ZSTX15','¥30.0','¥34.0','¥31.8','天广消防 · 09-08','5 单'],
    ['点型烟感 JTY-GD-3000','¥86.0','¥96.0','¥90.2','海湾代理 · 09-12','4 单'],
    ['防火卷帘 双轨双帘 4㎡','¥568.0','¥598.0','¥581.0','昆明防火 · 08-26','2 单']],820)+'</div>'+
   '<div class="demo-note">历史参考价来自价格库与历史报价单（区域 / 供应商维度），供审核时对比本报价单价是否在合理区间；点「编辑明细」可参照调整</div>')+
  '<div class="sheet-stamp">盖章位（合同专用章）</div>'+
 '</div>';
 window.scrollTo(0,0);
 if(listOnly)setTimeout(function(){toast('仅清单报价：本报价单不体现单价与合价，供货范围 / 清单作为合同附件，总价以双方合同约定为准（'+(Q.contractTotal||'¥ 1,860,000')+'）','info')},450);
}
function quoteListHTML(){
 var f=window.QUOTE_F=window.QUOTE_F||{tab:'all',type:'',status:'',kw:'',page:1,per:6};
 var L=LINK_QUOTES;
 var cnt=function(k){return k==='含价'?L.filter(function(q){return q.type==='含价'}).length:k==='仅清单'?L.filter(function(q){return q.type==='仅清单'}).length:L.filter(function(q){return q.status===k}).length};
 var tabs=[['all','全部',L.length],['含价','含价报价',cnt('含价')],['仅清单','仅清单',cnt('仅清单')],['待审批','待审批',cnt('待审批')],['已中标','已中标',cnt('已中标')],['未中标','未中标',cnt('未中标')],['已作废','已作废',cnt('已作废')]];
 var list=L.filter(function(q){
  if(f.tab==='含价'&&q.type!=='含价')return false;
  if(f.tab==='仅清单'&&q.type!=='仅清单')return false;
  if(['待审批','已中标','未中标','已作废'].indexOf(f.tab)>-1&&q.status!==f.tab)return false;
  if(f.type&&q.type!==f.type)return false;
  if(f.status&&q.status!==f.status)return false;
  if(f.kw){var kw=f.kw.toLowerCase();if((q.id+q.name).toLowerCase().indexOf(kw)<0)return false}
  return true});
 var total=list.length,pages=Math.max(1,Math.ceil(total/f.per));
 if(f.page>pages)f.page=pages;
 var pageRows=list.slice((f.page-1)*f.per,f.page*f.per);
 var rows=pageRows.map(function(q){var o=oppOf(q.oid);return '<tr data-quote="'+q.id+'" style="cursor:pointer"><td><b>'+q.id+'</b></td><td>'+q.name+'<div style="font-size:12px;color:var(--t3)">'+clName(q.cid)+(o?' · '+o.id:'')+'</div></td><td>'+tagHtml(q.type==='仅清单'?'仅清单':'含价报价',q.type==='仅清单'?'blue':'yellow')+'</td><td>'+(q.type==='仅清单'?'合同约定总价':'¥'+q.amt+' 万')+'</td><td>'+(q.type==='仅清单'?'—':'¥'+q.raw+' 万')+'</td><td>'+(q.type==='仅清单'?'—':q.gm)+'</td><td>'+tagHtml(q.status,q.status==='已中标'?'green':q.status==='未中标'?'red':q.status==='待审批'?'yellow':q.status==='已作废'?'gray':'blue')+'</td><td><span class="link-btn" data-cver="1">'+q.ver+'</span></td><td>'+q.updated+'</td><td><span class="ti-acts"><button class="mini-btn mini-ok" data-quote="'+q.id+'">查看</button><button class="mini-btn mini-no" data-toast="演示：打印 / 生成 PDF">打印</button></span></td></tr>'}).join('');
 var tabHTML=tabs.map(function(t){return '<span class="ctab'+(f.tab===t[0]?' on':'')+'" data-qf-tab="'+t[0]+'">'+t[1]+' <b>'+t[2]+'</b></span>'}).join('');
 var pager='<button class="pg-btn"'+(f.page<=1?' disabled':' data-qf-pg="'+(f.page-1)+'"')+'>‹</button>'+(function(){var s='';for(var i=1;i<=pages;i++){s+='<button class="pg-btn'+(i===f.page?' cur':'')+'" data-qf-pg="'+i+'">'+i+'</button>'}return s})()+'<button class="pg-btn"'+(f.page>=pages?' disabled':' data-qf-pg="'+(f.page+1)+'"')+'>›</button>';
 return '<div class="pills"><div class="pill active">全部 <b>'+L.length+'</b></div><div class="pill" data-toast="演示：我负责的报价单">我负责 <b>9</b></div><button class="btn btn-primary" data-qnew="1" style="margin-left:auto;height:30px;padding:0 14px;font-size:13px">＋ 新建报价单（商机 / 勘察 / 独立均可）</button></div>'+
  '<div class="ctabbar">'+tabHTML+'</div>'+
  '<div class="fbar"><select data-qf-f="type"><option value="">报价类型：全部</option><option value="含价"'+(f.type==='含价'?' selected':'')+'>报价类型：含价报价</option><option value="仅清单"'+(f.type==='仅清单'?' selected':'')+'>报价类型：仅清单</option></select><select data-qf-f="status"><option value="">状态：全部</option>'+['草稿','待审批','已通过','已中标','未中标','待客户确认','已作废'].map(function(s){return '<option value="'+s+'"'+(f.status===s?' selected':'')+'>状态：'+s+'</option>'}).join('')+'</select><span class="fdate">'+ICON.cal.replace('class="ic"','class="ic" style="width:14px;height:14px"')+' 2026-08 ~ 09</span><input class="fkw" data-qf-kw placeholder="关键字搜索…" value="'+(f.kw||'')+'"/><span class="reset" data-qf-reset>重置</span><span class="reset" data-toast="演示：另存为常用筛选视图">另存为常用</span></div>'+
  '<div class="table-wrap">'+tblHTML(['报价单号','客户 / 项目','类型','报价金额','成本测算','毛利率','状态','版本','更新','操作'],rows,1120)+'<div class="tbl-foot">共 '+total+' 条 · '+f.per+' 条/页 · 第 '+f.page+'/'+pages+' 页<span style="margin-left:auto;display:flex;gap:4px;align-items:center">'+pager+'</span></div></div>'+
  '<div class="demo-note">报价单可打印并对外使用（企业 Logo / 口号）；两种类型：含价报价（三档价 / 毛利测算）与仅清单报价（合同约定总价，只报清单）；Tab / 筛选 / 分页按数据实时生效</div>';
}

function showStation(sid,keepGrp){
 closeMatDrawer();
 cur=sid;curMenuKey=null;if(!keepGrp)grpOpenState={};curDetailTab=null;cnEdit=false;
 renderTabs();renderSide();renderMTabs();
 renderDash(DASH[sid]);
 $('#sidebar').classList.remove('open');$('#overlay').classList.remove('show');
 window.scrollTo(0,0);
}
function setRole(r){
 role=r;
 $('#btnAvatar').textContent=r.av;$('#avatarBig').textContent=r.av;
 $('#avatarRole').textContent='当前视角：'+r.n;
 var items=$$('#roleList .rl-item');
 for(var i=0;i<items.length;i++){items[i].classList.toggle('cur',ROLES[+items[i].dataset.r]===r)}
 $('#adminBox').style.display=r.admin?'':'none';$('#adminSep').style.display=r.admin?'':'none';
 if(role.st.indexOf(cur)<0)showStation(role.home);else showStation(cur);
 toast(r.n.indexOf('全视角')>-1?'已切换为演示全视角，显示全部 13 项导航':'已切换为「'+r.n+'」· 默认进入「'+(S.find(function(x){return x.id===role.home}).n)+'」'+((r.n.indexOf('业主')>-1||r.n.indexOf('供应商')>-1)?'（敏感信息已隐藏）':''));
}
function renderRoleList(){
 $('#roleList').innerHTML=ROLES.map(function(r,i){return '<div class="rl-item '+(r===role?'cur':'')+'" data-r="'+i+'">'+
  '<span class="rav">'+r.av+'</span><span class="rl-n">'+r.n+'<div class="rl-d">'+r.d+'</div></span>'+
  '<svg class="ic ck" style="width:15px;height:15px" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>'}).join('');
 applyA11y();
}
function renderMTabs(){
 $('#mtabs').innerHTML=role.st.slice(0,4).map(function(id){var st=S.find(function(x){return x.id===id});
  return '<div class="mtab '+(id===cur?'active':'')+'"'+(id===cur?' aria-current="page"':'')+' data-go="'+id+'">'+ICON[MICON[id]]+'<span>'+st.n.slice(0,4)+'</span></div>'}).join('')+
  '<div class="mtab" id="mtabMore">'+ICON.plus+'<span>更多</span></div>';
 applyA11y();
}
function applyA11y(){
 var sels='[data-act],[data-toast],[data-detail],[data-rp-pg],[data-cl-pg],[data-goseg],[data-sid],[data-quick],[data-new],[data-cnew],[data-home],[data-r],[data-catm],[data-drawer-close],.tab1,.mi,.grp-hd,.mtab,.pill,.qtile,.kb-card,.tree-i,.tree-leaf,.xcard,.tree-branch,.ct,.ct-node,.tcat,.rl-item,.noti-item,.dd-item,.chip,.link-btn,.hbtn,.icon-btn,.pg-btn:not(:disabled),.cn-step,.wb-mode,.mini-btn,.tr-more,.seg,.tab,.dtab';
 $$(sels).forEach(function(el){if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0')});
 $$('.modal,.drawer,.mat-drawer').forEach(function(el){if(!el.getAttribute('role')){el.setAttribute('role','dialog');el.setAttribute('aria-modal','true')}});
}

/* ============ 事件 ============ */
document.addEventListener('click',function(e){var rpg=e.target.closest('[data-rp-pg]');if(rpg){var L=lastPage||{};var n=+rpg.getAttribute('data-rp-pg');var c=getPageCfg(L.sid,L.grp,L.menu);var ps=Math.max(1,Math.ceil((c.rows||[]).length/10));window.__rpPage=window.__rpPage||{};window.__rpPage[L.sid+'|'+L.menu]=Math.max(1,Math.min(n,ps));renderPage(L.sid,L.grp,L.menu);return} var hm=e.target.closest('[data-home]');
 if(hm){showStation(cur,true);return}
 var gh=e.target.closest('.grp-hd');
 if(gh){
  var sb=$('#sidebar');
  if(sb.classList.contains('mini')){
   sb.classList.remove('mini');document.body.classList.remove('side-mini');
   $('#btnCollapse').title='收起菜单栏';
   grpOpenState={};grpOpenState[gh.dataset.gtoggle]=true;renderSide();
   return;
  }
  var stn=gh.parentElement;stn.classList.toggle('closed');
  grpOpenState[gh.dataset.gtoggle]=!stn.classList.contains('closed');
  return;
 }
 /* 合同清单树：删除/添加/保存（必须先于 mini-btn 通用拦截） */
 var cdel=e.target.closest('[data-cdel]');
 if(cdel){e.stopPropagation();if(!CITEMS)initCItems();var ci=+cdel.dataset.cdel,nm=CITEMS[ci]?CITEMS[ci].name:'';
  CITEMS.splice(ci,1);CITEMLOG.push(['V4','删除明细「'+nm.replace('├ ','')+'」','刚刚']);
  renderDetail('contract');toast('已删除并重算大项金额 · 留痕已记录');return}
 var cadd=e.target.closest('[data-cadd]');
 if(cadd){e.stopPropagation();if(!CITEMS)initCItems();
  CITEMS.push({id:'01-0'+(CITEMS.length+1),name:'├ 新增明细项（待命名）',spec:'—',unit:'项',qty:1,price:0,ctrl:'量价双控'});
  renderDetail('contract');return}
 var csave=e.target.closest('[data-csave]');
 if(csave){e.stopPropagation();if(!CITEMLOG)initCItems();
  CITEMLOG.push(['V4','清单修改保存 · 变更已同步项目预算','刚刚']);
  renderDetail('contract');toast('演示：清单已保存，生成 V4 版本，预算已同步 ✅');return}
 /* 售前链路穿透（先于通用按钮，避免 mini-btn 拦截） */
 var lk=e.target.closest('[data-link]');
 if(lk){var lid=lk.dataset.lid;
  if(lk.dataset.link==='商机'){renderPage('bid','客户与商机','商机 / 销售漏斗');toast('客户 '+clName(lid)+' → 商机已打开')}
  else if(lk.dataset.link==='投标'){renderPage('bid','投标管理','报名 / 保证金 / 节点看板');toast('投标 '+lid+' → 节点看板已打开')}
  return}
 var cli=e.target.closest('[data-clid]');
 if(cli){renderClient360(cli.dataset.clid);return}
var opi=e.target.closest('[data-opid]');
 if(opi){renderOpp360(opi.dataset.opid);return}
  var oq=e.target.closest('[data-opp-quote]');
  if(oq){var OO=oppOf(oq.dataset.oppQuote);window.WB_SRC=OO?{type:'商机',id:OO.id,name:OO.name,oid:OO.id}:{type:'独立新建',id:'—',name:'未命名报价项目'};wbMode='price';renderPage('bid','报价与勘察','报价编制工作台');toast('已从商机 '+(OO?OO.name:OO)+' 下推报价：客户 / 项目信息带入报价工作台（来源：商机）');return}
  var qn=e.target.closest('[data-qnew]');
  if(qn){window.WB_SRC=null;wbMode='price';renderPage('bid','报价与勘察','报价编制工作台');toast('独立新建报价单 · 可不关联商机，手动选择客户 / 项目；来源：独立新建');return}
  var qtc=e.target.closest('[data-qtc]');
  if(qtc){renderPage('cost','成本预算','目标成本与清单');toast('已从报价单 '+(window.curQuoteId||'')+' 反向生成目标成本（清单已导入目标成本 · 待确认生效）');return}
 var opp=e.target.closest('[data-opp]');
 if(opp){
  var oi=oppOf(opp.dataset.opp);var act=opp.getAttribute('data-act')||'';
  if(act==='阶段推进'){
   var si=OPP_STAGES.indexOf(oi.stage);
   if(si>-1&&si<OPP_STAGES.length-1){
    oi.stage=OPP_STAGES[si+1];oi.updated='09-18';oi.days=0;
    var NXT={'报价':'报价提交','投标':'开标 / 交保证金','中标/签约':'签约 / 收款'};
    oi.next=NXT[oi.stage]||(oi.stage+'推进');
    var lg=oppLog();lg.unshift(['09-18',oi.id,oi.stage,'王强','推进到「'+oi.stage+'」']);
    toast('已推进：'+oi.id+' '+oi.name+' → '+oi.stage+' ✅');
    if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);
   }else{toast(oi.id+' 已到终态（'+oi.stage+'），请走「分支结果」')}
  }else if(act==='分支结果'){
   window.__oppRes=oi.id;
   openModal('商机分支结果 · '+oi.name);
   setTimeout(function(){var bd=document.querySelector('#modalNew .modal-bd');
    if(bd)bd.innerHTML='<div class="dv-sec">选择结果后自动回流销售漏斗（影响赢单率 / 转化率统计）</div><div class="kvg" style="grid-template-columns:1fr">'+
    ['赢单','输单','暂缓'].map(function(r,i){return '<label class="kv-row kv-chk" style="cursor:pointer"><span><input type="radio" name="oppRes" value="'+r+'"'+(i===0?' checked':'')+' style="margin-right:8px"/>'+r+'</span><b></b></label>'}).join('')+
    '</div><div class="wb-total" style="margin-top:10px"><span>赢单→阶段「中标/签约」；输单 / 暂缓→标记结果并保留阶段</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-opp-result="1">提交</button></span></div>'},60);
  }else{toast('演示：'+oi.name)}
  return}
 var oppr=e.target.closest('[data-opp-result]');
 if(oppr){var rv=document.querySelector('input[name=oppRes]:checked');if(!rv){toast('请选择分支结果');return}
  var ob=oppOf(window.__oppRes);
  if(ob){ob.result=rv.value;if(rv.value==='赢单'){ob.stage='中标/签约';ob.next='签约 / 收款'}
   var lg2=oppLog();lg2.unshift(['09-18',ob.id,rv.value,'王强','分支结果：'+rv.value]);
   toast(ob.id+' 已记录分支结果：'+rv.value+' ✅');closeModal();if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);}
  return}
 var sv=e.target.closest('[data-survey]');
 if(sv){renderSurvey(sv.dataset.survey);return}
 var qsv=e.target.closest('[data-quote-survey]');
 if(qsv){window.WB_SRC={type:'勘察',id:qsv.dataset.quoteSurvey,name:'XX医院二期消防工程（改造）'};renderPage('bid','报价与勘察','报价编制工作台');toast('勘察单 '+qsv.dataset.quoteSurvey+' 明细已带入报价编制工作台（来源：现场勘察）');return}
 var wbm=e.target.closest('[data-wbmode]');
 if(wbm){wbMode=wbm.dataset.wbmode;renderPage('bid','报价与勘察','报价编制工作台');toast('已切换为「'+(wbMode==='list'?'仅清单报价（合同约定总价，只报清单）':'含价报价（三档价 / 毛利测算）')+'」模式');return}
 var pm=e.target.closest('[data-param]');
 if(pm){openParam();return}
 var pc=e.target.closest('[data-param-calc]');
 if(pc){closeModal();toast('演示：已按 '+$('#paramArea').value+'㎡ / '+$('#paramPoint').value+' 点位 / '+$('#paramSys').value+' 系统测算，生成智慧消防板块报价 ¥186 万并加入明细（硬件+数据采集+平台软件+数字孪生）✅');return}
 var pj=e.target.closest('[data-proj]');
 if(pj){renderProj360(pj.dataset.proj);return}
 var clr=e.target.closest('[data-cl-reset]');
 if(clr){window.CLED={tab:'all',st:'',ptype:'',mode:'',bus:'',kw:'',page:1,per:10};if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);toast('演示：筛选条件已重置');return}
 var clp=e.target.closest('[data-cl-pg]');
 if(clp){window.CLED=window.CLED||{tab:'all',page:1,per:10};CLED.page=+clp.dataset.clPg||1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var clt=e.target.closest('[data-cl-tab]');
 if(clt){window.CLED=window.CLED||{tab:'all',page:1,per:10};CLED.tab=clt.dataset.clTab;CLED.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var ctab=e.target.closest('[data-ctab]');
 if(ctab){var ct=$$('.ctab');for(var i=0;i<ct.length;i++)ct[i].classList.remove('on');ctab.classList.add('on');toast('演示：台账已切换为「'+ctab.textContent.trim()+'」视图') ;return}
 var dclose=e.target.closest('[data-drawer-close]');
 if(dclose){closeMatDrawer();return}
 var mnw=e.target.closest('[data-mat-new]');
 if(mnw){openMatForm(null);return}
 var msave=e.target.closest('[data-mat-save]');
 if(msave){matFormSave();return}
 var mreset=e.target.closest('[data-mat-reset]');
 if(mreset){MAT_FS={cat:'',ctrl:'',aux:'',st:'',kw:'',page:1,per:MAT_FS.per};if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);toast('演示：筛选条件已重置');return}
 var mpg=e.target.closest('[data-mat-pg]');
 if(mpg){MAT_FS.page=+mpg.dataset.matPg||1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var ibnew=e.target.closest('[data-inb-new]');
 if(ibnew){renderPage('buy','库存与出入库','AI 拍照入库');toast('演示：调起相机拍摄手写送货单，AI+OCR 自动识别后入库');return}
 var ibac=e.target.closest('[data-inb-accept]');
 if(ibac){inbAcceptDrawer(ibac.dataset.inbAccept||'RK-2609-31');return}
 var ibok=e.target.closest('[data-inb-ok]');
 if(ibok){closeMatDrawer();toast('演示：验收通过 — 库存已增加、生成批次二维码、入库量价写入成本清单项并沉淀价格库');return}
 var pid=e.target.closest('[data-pid]');
 if(pid){curPriceId=pid.dataset.pid;curPriceTab=null;try{renderDetail('price')}catch(err){toast('ERR: '+err.message)};return}
 var ptb=e.target.closest('[data-price-tab]');
 if(ptb){window.PRICE_F=window.PRICE_F||{};window.PRICE_F.tab=ptb.dataset.priceTab;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pop=e.target.closest('[data-price-op]');
 if(pop){closeMatDrawer();toast('演示：'+pop.dataset.priceOp+'（'+pop.dataset.priceOp+'流程）');return}
 var esg=e.target.closest('[data-esg-op]');
 if(esg){toast('演示：'+esg.dataset.esgOp+' — '+esg.dataset.esgOp+'流程已触达（电子签 / CA 生命周期管理）');return}
 var apk=e.target.closest('[data-ap-ok]');
 if(apk){var ai=+apk.dataset.apOk;
  if(window.CAPPR&&CAPPR[ai]&&/审批/.test(CAPPR[ai].st)){
   var ap9=CAPPR[ai];ap9.st='已生效';
   var cid9=ap9.id,exC9=null;
   for(var ci9=0;ci9<CONTRACTS.length;ci9++){if(CONTRACTS[ci9].id===cid9){exC9=CONTRACTS[ci9];break}}
   if(exC9){if(exC9.st==='审批中')exC9.st='履约中';toast('已通过：'+cid9+' → 已生效，合同台账状态同步为「'+exC9.st+'」')}
   else if(cid9.indexOf('HT-')===0){
    var amt9=parseFloat(String(ap9.amt||'').replace(/[^\\d.]/g,''))||0;
    var nm9=String(ap9.obj||'').replace(/（[^）]*）/g,'');
    CONTRACTS.unshift({id:cid9,name:nm9,proj:(nm9.replace(/合同$/,'')||'—'),party:ap9.party||'—',dir:'销售',type:'主合同',bus:'工程类',amt:amt9,pct:'0%',st:'履约中',mode:'自营',ptype:'新建'});
    toast('已通过：'+cid9+' → 已生效，已写入合同台账（¥'+amt9.toFixed(2)+' 万）')}
   else{toast('已通过：'+cid9+' → 已生效')}
  }
  if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var apn=e.target.closest('[data-ap-no]');
 if(apn){var aj=+apn.dataset.apNo;if(window.CAPPR&&CAPPR[aj]){CAPPR[aj].st='已驳回';toast('已驳回：'+CAPPR[aj].id+' → 已驳回并通知发起人')}if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var invd=e.target.closest('[data-inv-down]');
 if(invd){renderInvLedger(invd.dataset.invDown);return}
 var mntab=e.target.closest('[data-mtab-new]');
 if(mntab){var mt=mntab.dataset.mtabNew;
  document.querySelectorAll('[data-mtab-new]').forEach(function(t){t.classList.toggle('active',t===mntab)});
  document.querySelectorAll('.mn-pane').forEach(function(p){p.style.display=p.id==='mn-'+mt?'':'none'});
  return}
 var tmg=e.target.closest('[data-tree-mgr]');
 if(tmg){openCatMgr();return}
 var carr=e.target.closest('[data-arr]');
 if(carr){e.stopPropagation();
  var kids=document.querySelector('[data-parent="'+carr.dataset.arr+'"]');
  if(kids){var hide=kids.style.display==='none';kids.style.display=hide?'':'none';carr.classList.toggle('open',hide);carr.textContent=hide?'▾':'▸'}
  return}
 var cm=e.target.closest('[data-catm]');
 if(cm){e.stopPropagation();var cmA=cm.dataset.catm,row=cm.closest('.catm-row'),list=row?row.parentElement:null;
  if(cmA==='addTop'){toast('演示：新增一级分类 — 打开命名框，填写分类名称 / 编码 / 默认单位')}
  else if(cmA==='addChild'){toast('演示：新增子分类 — 在该分类下创建子节点（1 / 1.1 / 1.1.1 树状编码）')}
  else if(cmA==='rename'){toast('演示：改名 — 输入新名称后保存，树与材料自动同步')}
  else if(cmA==='del'){if(row)row.style.display='none';toast('演示：已删除该分类 — 仅未被引用分类可删；停用类别时材料自动归「未分类」')}
  else if(cmA==='up'){if(row&&row.previousElementSibling)list.insertBefore(row,row.previousElementSibling)}
  else if(cmA==='down'){if(row&&row.nextElementSibling)list.insertBefore(row.nextElementSibling,row)}
  return}
 var ap=e.target.closest('[data-ap]');
 if(ap){var apTr=ap.closest('tr');if(apTr)apTr.style.opacity=.55;toast('演示：已'+(ap.dataset.ap==='1'?'通过':'驳回')+'，进入下一审批节点（会签 / 加签可继续）') ;return}
 var aicmp=e.target.closest('[data-ai-cmp]');
 if(aicmp){toast('演示：AI 已对比原合同与供应商修改模板，高亮 3 处修改点（付款比例 / 违约上限 / 质保期）及法律风险提示') ;return}
 var ma=e.target.closest('[data-mat-act]');
 if(ma){var maA=ma.dataset.matAct;var mM=matOf(curMatId);var mLabel=(mM?mM.code+' '+mM.name:'材料');
  if(maA==='提料 / 材料申请'){renderPage('buy','采购与询比价','材料申请 / 提料');toast('已预填 '+mLabel+' 并关联成本科目，只填数量即可生成申请单')}
  else if(maA==='生成询价二维码'){renderPage('buy','采购与询比价','询价单 / 二维码');toast('已为 '+mLabel+' 生成询价二维码，供应商扫码报价后回写价格库')}
  else if(maA==='AI 拍照入库'){renderPage('buy','库存与出入库','AI 拍照入库');toast('已预填 '+mLabel+'，OCR 识别数量 / 单价 / 金额后入库')}
  else if(maA==='先发生后关联 / 销项'){renderPage('cost','成本预算','销项与未关联');toast('已预填 '+mLabel+'，关联成本科目后销项')}
  else if(maA==='加入报价单'){renderPage('bid','报价与勘察','报价编制工作台');toast('已在报价工作台引用 '+mLabel+' 及参考价，可综合单价上浮')}
  return}
 var treeC=e.target.closest('[data-tree-cat]');
 if(treeC){var cats=treeC.dataset.treeCat;if(MAT_FS.cat===cats)cats='';MAT_FS.cat=cats;MAT_FS.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);toast('已按分类「'+(cats||'全部材料')+'」筛选');return}
 var mop=e.target.closest('[data-mat-op]');
 if(mop){var opT=mop.dataset.matOp;if(mop.dataset.mid)curMatId=mop.dataset.mid;
  if(opT==='详情'){renderDetail('material');return}
  if(opT==='编辑'){openMatForm(curMatId);return}
  if(opT==='停用 / 启用'){toast('演示：已停用该材料 — 停用后不在新业务（提料 / 询价 / 报价）中可选，历史交易与库存保留；已被引用材料禁止删除');return}
  if(opT==='二维码'){toast('演示：打印材料二维码 — 仓库 / 现场扫码出入库、溯源');return}
  if(opT==='更多'){toast('演示：更多操作 — 复制新增 / 关联成本项 / 打印 / 删除（已被引用禁删）');return}
  return}
 var editMat=e.target.closest('[data-edit-mat]');
 if(editMat){openMatForm(curMatId);return}
 var dupMat=e.target.closest('[data-dup-mat]');
 if(dupMat){closeMatDrawer();MAT_FS.page=1;toast('演示：已复制 '+curMatId+' 生成草稿，修改差异字段后保存') ;openMatForm(null);return}
 var qadd=e.target.closest('[data-qadd]');
 if(qadd){var qid=window.curQuoteId||'BJ-2609-05',Q=quoteSheetData(qid),g=Q.groups[0],n=g.rows.length;g.rows.push([String(n+1),'新明细项','待补充规格','项',1,0,0]);toast('已添加明细行，请填写单价 / 数量');renderQuoteSheet(qid);return}
 var qdel=e.target.closest('[data-qdel]');
 if(qdel){var gi2=qdel.dataset.qdel.split('|'),qid2=window.curQuoteId||'BJ-2609-05',Q2=quoteSheetData(qid2);Q2.groups[+gi2[0]].rows.splice(+gi2[1],1);Q2.groups.forEach(function(g,i){g.rows.forEach(function(r,j){r[0]=String(j+1)})});toast('明细行已删除');renderQuoteSheet(qid2);return}
 var cv1=e.target.closest('[data-cver]');
 if(cv1){renderPage('bid','报价与勘察','报价版本 / 多版对比');return}
 var tq=e.target.closest('[data-quote]');
 if(tq){renderQuoteSheet(tq.dataset.quote);return}
 var qedit=e.target.closest('[data-qedit]');
 if(qedit){window.QEDT=window.QEDT||{id:window.curQuoteId||'BJ-2609-05',tax:'exc',edit:false};QEDT.edit=true;renderQuoteSheet(QEDT.id||window.curQuoteId);return}
 var qcancel=e.target.closest('[data-qcancel]');
 if(qcancel){window.QEDT=window.QEDT||{};QEDT.edit=false;renderQuoteSheet(QEDT.id||window.curQuoteId);return}
 var qsave=e.target.closest('[data-qsave]');
 if(qsave){window.QEDT=window.QEDT||{};
  var qid6=QEDT.id||window.curQuoteId,Q6=quoteSheetData(qid6),bad6=[];
  if(Q6&&!Q6.listOnly){Q6.groups.forEach(function(g){g.rows.forEach(function(r){if(!(qNum(r[4])>0)||!(qNum(r[5])>0))bad6.push(r[1])})})}
  if(bad6.length){toast('保存失败：还有 '+bad6.length+' 行数量 / 单价为空或非法（'+bad6.slice(0,3).join('、')+(bad6.length>3?' 等':'')+'），请补全或删除后再保存');return}
  QEDT.edit=false;QEDT.ver=(QEDT.ver||3)+1;toast('版本已保存：V'+QEDT.ver+' — 单价 / 数量变更已留痕，可在「报价版本 / 多版对比」查看');renderQuoteSheet(qid6);return}
 var qtax=e.target.closest('[data-qtax]');
 if(qtax){window.QEDT=window.QEDT||{id:window.curQuoteId||'BJ-2609-05',edit:false};QEDT.tax=QEDT.tax==='inc'?'exc':'inc';renderQuoteSheet(QEDT.id||window.curQuoteId);return}
 var qapr=e.target.closest('[data-qapr]');
 if(qapr){openAdjApprove();return}
 var qao=e.target.closest('[data-qapr-ok]');
 if(qao){window.QEDT=window.QEDT||{};QEDT.apr=qao.dataset.qaprOk;closeModal();toast('已提交审批：'+qao.dataset.qaprOk+'（按金额分级路由，审批留痕）');return}
 var cmod2=e.target.closest('[data-close-modal]');
 if(cmod2){closeModal();return}
 var qto=e.target.closest('[data-qto-c]');
 if(qto){var qid3=window.curQuoteId||'BJ-2609-05';toast('已带入合同向导：报价单 '+qid3+' 清单反向生成目标成本，进入「新建 / AI·OCR 录入」四路径之一');renderPage('cost','合同管理','合同录入与模板');return}
 var qft=e.target.closest('[data-qf-tab]');
 if(qft){window.QUOTE_F=window.QUOTE_F||{tab:'all',type:'',status:'',kw:'',page:1,per:6};QUOTE_F.tab=qft.dataset.qfTab;QUOTE_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var qfp=e.target.closest('[data-qf-pg]');
 if(qfp){window.QUOTE_F=window.QUOTE_F||{tab:'all',type:'',status:'',kw:'',page:1,per:6};QUOTE_F.page=+qfp.dataset.qfPg||1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var qfr=e.target.closest('[data-qf-reset]');
 if(qfr){window.QUOTE_F={tab:'all',type:'',status:'',kw:'',page:1,per:6};if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);toast('筛选条件已重置');return}
 /* ==== 投标模块 B1-B6 ==== */
 var cpk=e.target.closest('[data-cpk-add]');
 if(cpk){var cid8=cpk.dataset.cpkAdd,c8=CERTS.find(function(x){return x.id===cid8});
  if(c8.days<0){toast('证书已过期 '+(0-c8.days)+' 天，禁止加入投标包（防废标）');return}
  if(c8.occ==='占用中'){toast('证书已被占用：'+(c8.occNote||'')+'，不可重复使用');return}
  window.CPK=window.CPK||{sel:['CERT-001','CERT-006','CERT-007','CERT-002','CERT-003']};
  if(CPK.sel.indexOf(cid8)<0)CPK.sel.push(cid8);
  toast('已加入投标材料包：'+c8.name+'（打包时自动校验有效期与占用）');renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var cpko=e.target.closest('[data-cpk-ok]');
 if(cpko){window.CPK=window.CPK||{sel:[]};
  var sel=CPK.sel.filter(function(id){var c=CERTS.find(function(x){return x.id===id});return c&&c.days>=0&&c.occ!=='占用中'});
  if(!sel.length){toast('请先勾选可用证书（过期 / 占用证书已禁用）');return}
  var nm='投标资质包 '+(window.__pkn=(window.__pkn||3)+1);
  sel.forEach(function(id){var c=CERTS.find(function(x){return x.id===id});c.occ='预占用';c.occNote='待开标投标包 '+(nm.split(' ')[1])});
  window.CPKPACKS=window.CPKPACKS||[];CPKPACKS.unshift([nm,'通用',sel.length+' 本（自动校验）','类似业绩 3 项','系统','刚刚',tg('b','下载 / 打印')]);
  CPK.sel=[];toast('资质包生成成功，证书状态 → 预占用（开标中标 → 实际占用，未中标 → 释放）✅');renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var cpkp=e.target.closest('[data-cpk-pdf]');
 if(cpkp){toast('证书包 PDF 已生成（含证书扫描件 / 有效期与占用校验页）');return}
 var bpr=e.target.closest('[data-bid-proj]');
 if(bpr){var b9=BIDS.find(function(x){return x.id===bpr.dataset.bidProj}),o9=oppOf(b9.oid);
  var ym9=String(new Date().getFullYear()).slice(-2)+String(new Date().getMonth()+1).padStart(2,'0'),seq9=0;
  PROJS.forEach(function(x){var m9=String(x.id).match(/^PJ-(\\d{4})-(\\d{2})$/);if(m9&&m9[1]===ym9)seq9=Math.max(seq9,+m9[2])});
  var nid='';do{seq9++;nid='PJ-'+ym9+'-'+String(seq9).padStart(2,'0')}while(PROJS.some(function(x){return x.id===nid}));
  var bgt9=Math.round((b9.bond||5)*20),ct9=Math.round(bgt9*1.3);
  PROJS.unshift({id:nid,name:b9.name,type:'新建',mode:'自营',stage:'施工准备',budget:bgt9,owner:'李敏',from:b9.id+' · 中标',progress:'0%',customer:o9?clName(o9.cid):'—',region:(o9&&o9.region)||'昆明',address:'—',cont:ct9,actual:0,gm:Math.round((ct9-bgt9)/ct9*100),status:'在建',planS:'2026-10-01',planE:'2027-06-30',industry:'其他'});
  CERTS.forEach(function(c){if(c.occ==='预占用'&&/投标包/.test(c.occNote||'')){c.occ='占用中';c.occNote=b9.id+' 已中标项目'}});
  toast('立项成功：'+b9.name+'（'+nid+'）· 已写入项目主数据（编号防重）· 目标成本由中标报价清单反向生成，预占用证书转实际占用');renderPage('site','项目主数据','项目列表/立项');return}
 var bls=e.target.closest('[data-bid-loss]');
 if(bls){window.__lossBid=bls.dataset.bidLoss;
  openModal('记录未中标原因');
  setTimeout(function(){var bd=document.querySelector('#modalNew .modal-bd');
   if(bd)bd.innerHTML='<div class="dv-sec">'+bls.dataset.bidLoss+' 未中标原因</div><div class="kvg" style="grid-template-columns:1fr">'+
   ['报价偏高','客户关系不足','资质不符','响应不及时','其他'].map(function(r){return '<label class="kv-row kv-chk" style="cursor:pointer"><span><input type="radio" name="lossR" value="'+r+'" style="margin-right:8px"/>'+r+'</span><b></b></label>'}).join('')+
   '</div><div class="wb-total" style="margin-top:10px"><span>记录后进入丢标原因分析（按季度 / 半年）</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-bid-loss-ok="1">提交</button></span></div>'},60);return}
 var blo=e.target.closest('[data-bid-loss-ok]');
 if(blo){var r7=document.querySelector('input[name=lossR]:checked');
  if(!r7){toast('请选择未中标原因');return}
  var b7=BIDS.find(function(x){return x.id===window.__lossBid});
  if(b7)b7.lose_reason=r7.value;
  var ex=BIDLOSS.find(function(x){return x[0]===r7.value});
  if(ex)ex[1]++;else BIDLOSS.push([r7.value,1,1,'—']);
  var tot=BIDLOSS.reduce(function(a,x){return a+x[1]},0);
  BIDLOSS.forEach(function(x){x[2]=Math.round(x[1]/tot*100)});
  toast('已记录：'+window.__lossBid+' 未中标原因 →「'+r7.value+'」✅');closeModal();renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brn=e.target.closest('[data-bidreg-new]');
 if(brn){openModal('登记投标');
  setTimeout(function(){var bd=document.querySelector('#modalNew .modal-bd');
   if(bd)bd.innerHTML='<div class="dv-sec">登记投标（自动进入节点看板 · 报名）</div><div class="kvg" style="grid-template-columns:1fr">'+
   '<label class="kv-row"><span>投标项目名称</span><input style="flex:1" id="brProj" value="XX新建消防工程"/></label>'+
   '<label class="kv-row"><span>客户</span><select id="brCust" style="flex:1"><option>XX产业园开发有限公司</option><option>XX医院基建处</option><option>XX商业运营管理有限公司</option></select></label>'+
   '<label class="kv-row"><span>保证金（万）</span><input style="flex:1" id="brBond" value="5"/></label>'+
   '<label class="kv-row"><span>截止 / 开标</span><input style="flex:1" id="brDeadline" value="10-15 开标"/></label></div>'+
   '<div class="wb-total" style="margin-top:10px"><span>登记后进入投标节点看板流转</span><span style="margin-left:auto"><button class="mini-btn mini-ok" data-bidreg-ok="1">提交登记</button></span></div>'},60);return}
 var bro=e.target.closest('[data-bidreg-ok]');
 if(bro){var nm2=(document.querySelector('#brProj')||{}).value||'XX新建消防工程';
  var bid={id:'BD-0'+Math.floor(Math.random()*900+100),oid:'OPP-001',name:nm2,node:'报名',bond:+((document.querySelector('#brBond')||{value:5}).value||0),deadline:(document.querySelector('#brDeadline')||{value:'10-15 开标'}).value||'10-15 开标',score:null,result:'报名中'};
  BIDS.unshift(bid);toast('登记成功：'+bid.id+' '+nm2+' 已进入节点看板 · 报名');
  closeModal();renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var bnxt=e.target.closest('[data-bid-next]');
 if(bnxt){var b6=BIDS.find(function(x){return x.id===bnxt.dataset.bidNext}),seq=['报名','招标中','做标书','交保证金','已投标','开标','中标'];
  if(b6){var i6=seq.indexOf(b6.node);
   if(i6>-1&&i6<6){b6.node=seq[i6+1];if(b6.node==='中标'){b6.result='已中标';b6.score=90+Math.floor(Math.random()*9)}
    toast('已推进：'+b6.id+' → '+b6.node);renderPage(lastPage.sid,lastPage.grp,lastPage.menu)}
   else toast('该投标已到终态');}
  return}
 var prf=e.target.closest('[data-perf-reset]');
 if(prf){window.PERF_F={ind:'',type:'',amt:''};renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brf=e.target.closest('[data-bidr-reset]');
 if(brf){window.BIDR_F={res:'',kw:''};renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brg=e.target.closest('[data-bidreg-reset]');
 if(brg){window.BIDREG_F={node:'',kw:''};renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjf=e.target.closest('[data-pjf-tab]');
 if(pjf){window.PROJ_F=window.PROJ_F||{};PROJ_F.tab=pjf.dataset.pjfTab||'all';PROJ_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjsel=e.target.closest('[data-pjf-sel]');
 if(pjsel){window.PROJ_F=window.PROJ_F||{};PROJ_F[pjsel.dataset.pjfSel]=pjsel.value;PROJ_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjkw=e.target.closest('[data-pjf-kw]');
 if(pjkw&&pjkw.type==='input'){window.PROJ_F=window.PROJ_F||{};PROJ_F.kw=pjkw.value;PROJ_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjfr=e.target.closest('[data-pjf-reset]');
 if(pjfr){window.PROJ_F={tab:'all',type:'',mode:'',kw:'',page:1,per:5};if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjfp=e.target.closest('[data-pjf-pg]');
 if(pjfp){window.PROJ_F=window.PROJ_F||{};PROJ_F.page=+pjfp.dataset.pjfPg||1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pfg=e.target.closest('[data-pf-grp]');
 if(pfg){var grp=document.querySelector('.fgroup[data-dim="'+pfg.dataset.pfGrp+'"]');if(grp)grp.classList.toggle('open');return}
 var pff=e.target.closest('[data-pf-fac]');
 if(pff){window.PROJF=window.PROJF||{};var kv=pff.dataset.pfFac.split('|');if(PROJF[kv[0]]&&PROJF[kv[0]][kv[1]]){delete PROJF[kv[0]][kv[1]]}else{PROJF[kv[0]]=PROJF[kv[0]]||{};PROJF[kv[0]][kv[1]]=1}PROJF.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pfs=e.target.closest('[data-pf-st]');
 if(pfs){window.PROJF=window.PROJF||{};PROJF.status=pfs.dataset.pfSt;PROJF.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pfc=e.target.closest('[data-pf-chip]');
 if(pfc){window.PROJF=window.PROJF||{};var kv2=pfc.dataset.pfChip.split('|');if(PROJF[kv2[0]])delete PROJF[kv2[0]][kv2[1]];PROJF.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pfl=e.target.closest('[data-pf-clear]');
 if(pfl){window.PROJF={regions:{},inds:{},owners:{},status:'all',kw:'',page:1,per:8};if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pffc=e.target.closest('[data-pf-fclear]');
 if(pffc){window.PROJF=window.PROJF||{};PROJF.regions={};PROJF.inds={};PROJF.owners={};PROJF.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pfgp=e.target.closest('[data-pf-pg]');
 if(pfgp){window.PROJF=window.PROJF||{};PROJF.page=+pfgp.dataset.pfPg||1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var mtb=e.target.closest('[data-mtab]');
 if(mtb){window.__MTAB=window.__MTAB||{};__MTAB[mtb.dataset.mtab]=+mtb.dataset.mi||0;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var mb=e.target.closest('.mini-btn');
 if(mb){
  e.stopPropagation();
  if(mb.textContent==='批量调价'||mb.textContent==='调价'){openAdj();return}
    if(mb.dataset.act==='转合同 / 销售订单'){cnEdit=false;cnStep=0;renderContractNew();toast('已从报价单转入合同向导 · 报价清单将反向生成目标成本');return}
  if(mb.dataset.act==='生成报价单'){quoteNewFromWb();return}
  if(mb.dataset.act==='生成维修订单'){renderPage('wm','维修确收','维修订单 / 费用确收');toast('保外维修订单已生成 · 费用确收后联动开票收款（活干了单必须签）');return}
  var item=mb.closest('.todo-item');
  if(item&&mb.textContent==='通过'){item.classList.add('ok');setTimeout(function(){item.classList.remove('ok')},600)}
  if(item&&mb.textContent==='驳回'){item.classList.add('no');setTimeout(function(){item.classList.remove('no')},600)}
  toast('演示：'+mb.textContent+' ✅（实际系统将进入业务流程）');return}
 var rmt=e.target.closest('[data-refmore-toggle]');
 if(rmt){var dm=rmt.closest('.mat-drawer');var box=dm?dm.querySelector('.ref-more'):null;if(box){box.hidden=!box.hidden;rmt.textContent=box.hidden?('查看全部 '+(rmt.dataset.refmoreN||'')+' 条引用 ▾'):'收起引用明细 ▴'}return}
 var ptb=e.target.closest('[data-ptab]');
 if(ptb){if(ptb.dataset.ptab==='__contract'){window.__ctab=ptb.dataset.ctab||'proj';if(window.__curCid){renderContractDetail(window.__curCid)}else{renderDetail('contract')}}else{window.__projTab=window.__projTab||{};window.__projTab[window.__projId]=ptb.dataset.ptab;renderProj360(window.__projId)};return}
 var dtb=e.target.closest('.dtab');
 var ctab=e.target.closest('[data-ctab]');
 if(ctab){window.__ctab=ctab.dataset.ctab;if(window.__curCid){renderContractDetail(window.__curCid)}else{renderDetail('contract')};return}
 if(dtb){if(curDetailKind==='price'){curPriceTab=dtb.dataset.id}else{curDetailTab=dtb.dataset.id}renderDetail(curDetailKind);return}
 var bk=e.target.closest('[data-back]');
 if(bk){cnEdit=false;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var hd=e.target.closest('.tab1');
 if(hd){showStation(hd.dataset.go);return}
 var mi=e.target.closest('.mi');
 if(mi){menuKw='';$('#menuSearch').value='';
  if(mi.dataset.home){showStation(cur)}else{renderPage(mi.dataset.sid,mi.dataset.g,mi.dataset.n)}
  $('#sidebar').classList.remove('open');$('#overlay').classList.remove('show');window.scrollTo(0,0);return}
 var pfb=e.target.closest('[data-pf-board]');
 if(pfb){renderPage('site','项目主数据','项目看板 / 组合');return}
 var seg=e.target.closest('[data-goseg]');
 if(seg){showStation(seg.dataset.goseg);return}
 var trd=e.target.closest('tbody tr');
 if(trd&&trd.dataset.mid){curMatId=trd.dataset.mid;curDetailTab=null;renderDetail('material');return}
 if(trd&&trd.dataset.detail){renderDetail(trd.dataset.detail,trd.dataset.cid||null);return}
 var cv=e.target.closest('[data-cver]');
 if(cv){renderPage('bid','报价与勘察','报价版本 / 多版对比');return}
 /* 合同向导导航 */
 var cns=e.target.closest('[data-cns]');
 if(cns){cnStep=+cns.dataset.cns;renderContractNew();return}
 var cnp=e.target.closest('[data-cnprev]');
 if(cnp){cnStep=Math.max(0,cnStep-1);renderContractNew();return}
 var cnn=e.target.closest('[data-cnnext]');
 if(cnn){cnStep=Math.min(4,cnStep+1);renderContractNew();return}
 var cnsu=e.target.closest('[data-cnsubmit]');
 if(cnsu){toast(cnEdit?'演示：变更已提交审批（部门经理→成控→总经理），通过后生成 V4 ✅':'演示：合同已提交审批 → 部门经理王强（钉钉已推送）✅');return}
 var cnew=e.target.closest('[data-cnew]');
 if(cnew){cnEdit=false;cnStep=0;renderContractNew();return}
 var ced=e.target.closest('[data-cedit]');
 if(ced){cnEdit=true;cnStep=1;renderContractNew();return}
 var cex=e.target.closest('[data-cexit]');
 if(cex){cnEdit=false;renderDetail('contract');return}
 var tb=e.target.closest('.tab[data-sid]');
 if(tb&&CURCFG){var t=null;for(var i=0;i<CURCFG.side.tabs.length;i++){if(CURCFG.side.tabs[i].id===tb.dataset.sid)t=CURCFG.side.tabs[i]}
  if(t){var tabs=$$('.tab[data-sid]');for(var j=0;j<tabs.length;j++)tabs[j].classList.remove('active');tb.classList.add('active');$('#sideList').innerHTML=t.items.map(itemHTML).join('')}return}
 var j=e.target.closest('[data-jump]');
 if(j&&CURCFG){var id=j.dataset.jump,tab2=null;
  for(var k=0;k<CURCFG.side.tabs.length;k++){if(CURCFG.side.tabs[k].id===id)tab2=CURCFG.side.tabs[k]}
  if(tab2){var tabs2=$$('.tab[data-sid]');for(var m=0;m<tabs2.length;m++)tabs2[m].classList.toggle('active',tabs2[m].dataset.sid===id);
   $('#sideList').innerHTML=tab2.items.map(itemHTML).join('');
   var sc=$('#sideCard');sc.scrollIntoView({behavior:'smooth',block:'center'});sc.classList.remove('flash');void sc.offsetWidth;sc.classList.add('flash')}
  else toast('演示：下钻查看该指标统计');return}
 var pt=e.target.closest('.pt');
 if(pt){openDev(DASH.iot.main.pts[+pt.dataset.pid]);return}
 var kbf=e.target.closest('[data-kb-f]');
 if(kbf){var f=kbf.dataset.kbF;
  document.querySelectorAll('[data-kb-f]').forEach(function(x){x.classList.toggle('on',x.dataset.kbF===f)});
  document.querySelectorAll('#viewDash [data-kbcol]').forEach(function(c){c.style.display=(f==='all'||c.dataset.kbcol===f)?'':'none'});
  return}
 var nq=e.target.closest('[data-new]');
 if(nq){openModal('新建'+nq.dataset.new);return}
 var qk=e.target.closest('[data-quick]');
 var cs=e.target.closest('[data-csrc]');
if(cs){var cst=cs.dataset.csrc;cnStep=1;renderContractNew();
  if(cst==='tpl')toast('已套用销售合同标准模板（2026 V5）· 风险条款与模板变量已预填，可继续修改');
  else if(cst==='etpl')toast('已套用企业模板（客户专属条款）· 待确认客户条款变量');
  else if(cst==='copy')toast('已复制历史合同 HT-2608-22 全部字段与清单 · 与本项目差异处已高亮');
  else if(cst==='opp'){var OQ=null;for(var qi2=0;qi2<LINK_QUOTES.length;qi2++){if(LINK_QUOTES[qi2].status==='已中标'||LINK_QUOTES[qi2].status==='已通过'){OQ=LINK_QUOTES[qi2];break}}
   toast(OQ?('已从报价单 '+OQ.id+'（'+OQ.name+'）转入合同：客户 / 项目 / 清单已反填，报价清单将反向生成目标成本'):'暂无已通过 / 已中标报价单 · 可先在商机 360 下推报价');}
  else toast('上传合同文件后 AI/OCR 识别回填，并自动与主数据做要素匹配（对方单位工商核验 / 项目关联 / 材料编码匹配）');
  return}
var kp=e.target.closest('[data-kbproj]');
if(kp){var pp2=projByName(kp.dataset.kbproj);
  if(pp2){renderProj360(pp2.id);toast('已从看板穿透项目 360°：'+pp2.id+' '+pp2.name)}
  else{renderPage('site','项目主数据','项目列表 / 立项');toast('「'+kp.dataset.kbproj+'」未匹配到项目主数据（演示数据范围），已打开项目列表')}
  return}
if(qk){var label=qk.dataset.quick;
  var QMAP={'项目360':['site','项目主数据','项目列表 / 立项'],'经营月报':['biz','经营驾驶舱','经营看板'],'风险中心':['biz','风险中心','风险中心'],'审批中心':['biz','审批与洞察','审批与洞察'],'生成报价单':['bid','报价与勘察','报价编制工作台'],'维护价格库':['buy','材料主数据','价格库'],'查看进度':['owner','我的项目','项目列表'],'下载报告':['owner','服务报告','消防报告下载'],'在线报价':['ext','我的询价','待报价询价']};
  if(QMAP[label]){renderPage(QMAP[label][0],QMAP[label][1],QMAP[label][2]);return}
  if(/新建合同/.test(label)){cnEdit=false;cnStep=0;renderContractNew();return}
  if(/新建|发起|上报|提交|登记|生成报价/.test(label)){openModal(label)}else toast('演示：'+label+'（原型演示操作）');return}
 var pg=e.target.closest('.pg');if(pg){e.stopPropagation();var pgs=$$('.pg');for(var n=0;n<pgs.length;n++)pgs[n].classList.remove('cur');pg.classList.add('cur');return}
 var pill=e.target.closest('.pill');if(pill){e.stopPropagation();var pls=$$('.pill');for(var q=0;q<pls.length;q++)pls[q].classList.remove('active');pill.classList.add('active');return}
 var t2=e.target.closest('[data-toast]');
 if(t2)toast(t2.dataset.toast);
});
document.addEventListener('change',function(e){
 var ip=e.target.closest('[data-cip]');
 if(ip){var i2=+ip.dataset.cip,v=parseFloat(ip.value);
  if(!isNaN(v)&&CITEMS[i2]){var old=CITEMS[i2].price;
   if(old!==v){CITEMS[i2].price=v;CITEMLOG.push(['V4',CITEMS[i2].name.replace('├ ','')+'单价 '+old.toFixed(1)+' → '+v.toFixed(1),'刚刚'])}
   renderDetail('contract')}
  return}
 var mfch=e.target.closest('[data-mat-f]');
 if(mfch){var k=mfch.dataset.matF;MAT_FS[k]=mfch.value;MAT_FS.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var mkw=e.target.closest('[data-mat-kw]');
 if(mkw){MAT_FS.kw=mkw.value;MAT_FS.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);toast('演示：已按关键字「'+(mkw.value||'')+'」筛选');return}
 if(e.target.closest('.fbar')&&!e.target.closest('[data-perf-f],[data-bidr-f],[data-bidreg-f],[data-cpk-chk]'))toast('演示：筛选已应用（'+e.target.value+'）');
});
document.addEventListener('change',function(e){
 var pfkw=e.target.closest('[data-pf-kw]');
 if(pfkw){window.PROJF=window.PROJF||{};PROJF.kw=pfkw.value;PROJF.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjf2=e.target.closest('[data-pjf-sel]');
 if(pjf2){window.PROJ_F=window.PROJ_F||{};PROJ_F[pjf2.dataset.pjfSel]=pjf2.value;PROJ_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pjkw2=e.target.closest('[data-pjf-kw]');
 if(pjkw2){window.PROJ_F=window.PROJ_F||{};PROJ_F.kw=pjkw2.value;PROJ_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var clif=e.target.closest('[data-cli-f]');
 if(clif){window.CLI_F=window.CLI_F||{region:'',industry:'',kw:''};CLI_F[clif.dataset.cliF]=clif.value;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var clikw=e.target.closest('[data-cli-kw]');
 if(clikw){window.CLI_F=window.CLI_F||{region:'',industry:'',kw:''};CLI_F.kw=clikw.value;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var clir=e.target.closest('[data-cli-reset]');
 if(clir){window.CLI_F={region:'',industry:'',kw:''};var s1=document.querySelector('[data-cli-f]');if(s1)s1.value='';if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var pk=e.target.closest('[data-cpk-chk]');
 if(pk){window.CPK=window.CPK||{sel:['CERT-001','CERT-006','CERT-007','CERT-002','CERT-003']};var id5=pk.dataset.cpkChk,ix=CPK.sel.indexOf(id5);
  if(pk.checked){if(ix<0)CPK.sel.push(id5)}else{if(ix>-1)CPK.sel.splice(ix,1)}
  var n=CPK.sel.filter(function(id){var c=CERTS.find(function(x){return x.id===id});return c&&c.days>=0&&c.occ!=='占用中'}).length;
  var cnt=document.querySelector('#cpkCount');if(cnt)cnt.textContent=n;return}
 var pf2=e.target.closest('[data-perf-f]');
 if(pf2){window.PERF_F=window.PERF_F||{ind:'',type:'',amt:''};PERF_F[pf2.dataset.perfF]=pf2.value;renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brf2=e.target.closest('[data-bidr-f]');
 if(brf2){window.BIDR_F=window.BIDR_F||{res:'',kw:''};BIDR_F[brf2.dataset.bidrF]=brf2.value;renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brg2=e.target.closest('[data-bidreg-f]');
 if(brg2){window.BIDREG_F=window.BIDREG_F||{node:'',kw:''};BIDREG_F[brg2.dataset.bidregF]=brg2.value;renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brkw=e.target.closest('[data-bidr-kw]');
 if(brkw){window.BIDR_F=window.BIDR_F||{res:'',kw:''};BIDR_F.kw=brkw.value;renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var brgkw=e.target.closest('[data-bidreg-kw]');
 if(brgkw){window.BIDREG_F=window.BIDREG_F||{node:'',kw:''};BIDREG_F.kw=brgkw.value;renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
  var cf=e.target.closest('[data-cl-f]');
 if(cf){window.CLED=window.CLED||{tab:'all',page:1,per:10};CLED[cf.dataset.clF]=cf.value;CLED.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var ck=e.target.closest('[data-cl-kw]');
 if(ck){window.CLED=window.CLED||{tab:'all',page:1,per:10};CLED.kw=ck.value;CLED.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var qf=e.target.closest('[data-qf-f]');
 if(qf){window.QUOTE_F=window.QUOTE_F||{tab:'all',type:'',status:'',kw:'',page:1,per:6};QUOTE_F[qf.dataset.qfF]=qf.value;QUOTE_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var qfkw=e.target.closest('[data-qf-kw]');
 if(qfkw){window.QUOTE_F=window.QUOTE_F||{tab:'all',type:'',status:'',kw:'',page:1,per:6};QUOTE_F.kw=qfkw.value;QUOTE_F.page=1;if(lastPage)renderPage(lastPage.sid,lastPage.grp,lastPage.menu);return}
 var qp=e.target.closest('[data-qp]');
 if(qp){var gi3=qp.dataset.qp.split('|'),qid4=window.curQuoteId,Q3=quoteSheetData(qid4),rr=Q3.groups[+gi3[0]].rows[+gi3[1]];rr[5]=Math.max(0,qNum(qp.value));rr[6]=Math.round(qNum(rr[5])*qNum(rr[4]));var tr=qp.closest('tr'),amtCell=tr?tr.querySelector('[data-qamt]'):null;if(amtCell)amtCell.textContent=qFmt(rr[6]*((window.QEDT&&QEDT.tax==='inc')?1.09:1));var qt=document.querySelector('#qtotals');if(qt)qt.innerHTML=quoteTotalHTML(Q3,(window.QEDT&&QEDT.tax==='inc')?1.09:1);return}
 var qq=e.target.closest('[data-qq]');
 if(qq){var gi4=qq.dataset.qq.split('|'),qid5=window.curQuoteId,Q4=quoteSheetData(qid5),r2=Q4.groups[+gi4[0]].rows[+gi4[1]];r2[4]=Math.max(0,qNum(qq.value));r2[6]=Math.round(qNum(r2[5])*qNum(r2[4]));var tr2=qq.closest('tr'),amtCell2=tr2?tr2.querySelector('[data-qamt]'):null;if(amtCell2)amtCell2.textContent=qFmt(r2[6]*((window.QEDT&&QEDT.tax==='inc')?1.09:1));var qt2=document.querySelector('#qtotals');if(qt2)qt2.innerHTML=quoteTotalHTML(Q4,(window.QEDT&&QEDT.tax==='inc')?1.09:1);return}
});

function openDev(p){
 var stMap={g:['在线','g'],r:['告警','r'],y:['注意','y'],o:['离线','gray']};
 $('#devTitle').innerHTML=ICON[(p.ty.indexOf('视频')>-1)?'cam':(p.ty.indexOf('主机')>-1?'gear':'radio')]+' '+p.n;
 var bars=[],i;for(i=0;i<24;i++)bars.push({v:20+Math.round(Math.random()*50),hot:false});
 if(p.st==='y')bars[20]={v:88,hot:true};
 if(p.st==='r'){bars[21]={v:96,hot:true};bars[22]={v:90,hot:true}}
 $('#devBody').innerHTML=
  '<div style="display:flex;gap:8px;align-items:center">'+tg(stMap[p.st][1],stMap[p.st][0])+'<span style="font-size:12px;color:var(--t3)">位置：'+p.f+' · '+p.code+'</span></div>'+
  '<div class="dv-sec">实时数据</div>'+
  '<div class="kv"><div class="kv-row"><span>当前读数</span><b>'+p.val+'</b></div><div class="kv-row"><span>通讯状态</span><b>'+(p.st==='o'?'离线（网络异常）':'正常 · 4G/NB')+'</b></div><div class="kv-row"><span>最后通讯</span><b>'+(p.st==='o'?'2026-09-14 16:20':'10 分钟前')+'</b></div></div>'+
  '<div class="dv-sec">24h 监测曲线</div>'+
  '<div class="mbars">'+bars.map(function(b){return '<i class="'+(b.hot?'hot':'')+'" style="height:'+b.v+'%"></i>'}).join('')+'</div>'+
  '<div class="dv-sec">设备台账</div>'+
  '<div class="kv"><div class="kv-row"><span>设备编码</span><b>'+p.code+'</b></div><div class="kv-row"><span>设备类型</span><b>'+p.ty+'</b></div><div class="kv-row"><span>安装日期</span><b>2024-06-12</b></div><div class="kv-row"><span>维保单位</span><b>诺盾博达（自营）</b></div><div class="kv-row"><span>上次保养</span><b>2026-08-28</b></div></div>'+
  '<div class="dv-sec">近期关联工单</div>'+
  '<div class="kv"><div class="kv-row"><span>WX-2608-113 · 例行保养</span><b>'+tg('g','已完成')+'</b></div><div class="kv-row"><span>WX-2606-077 · 探测器清洗</span><b>'+tg('g','已完成')+'</b></div></div>';
 $('#aiDrawer').classList.remove('open');
 $('#devDrawer').classList.add('open');$('#overlay').classList.add('show');
}
$('#devClose').onclick=function(){$('#devDrawer').classList.remove('open');$('#overlay').classList.remove('show')};
$('#devDisp').onclick=function(){toast('演示：已创建调度工单并派单至值班工程师 ✅')};
$('#devCurve').onclick=function(){toast('演示：打开 30 天历史曲线报表页')};

function openModal(title){$('#modalTitle').textContent=title;$('#modalNew').classList.add('show');$('#overlay').classList.add('show')}
function closeModal(){$('#modalNew').classList.remove('show');$('#overlay').classList.remove('show');var ms=$('#mSubmit');if(ms)ms.style.display=''}
$('#mClose').onclick=closeModal;$('#mCancel').onclick=closeModal;
$('#mSubmit').onclick=function(){closeModal();toast('演示：已提交，进入审批流转 ✅')};

/* ---- 批量调价弹窗 ---- */
function adjBase(){
 var id=window.curQuoteId;
 if(id&&window.QDATA&&QDATA[id]&&!QDATA[id].listOnly){
  var s=0;QDATA[id].groups.forEach(function(g){g.rows.forEach(function(r){s+=qNum(r[4])*qNum(r[5])})});
  return {old:s*1.09/10000,cost:(QDATA[id].cost!=null?QDATA[id].cost:quoteSheetCost())/10000};
 }
 if(window.WBR){var s2=0,c2=0;WBR.forEach(function(r){s2+=qNum(r[5])*qNum(r[9]);c2+=qNum(r[5])*qNum(r[6])});return {old:s2*1.09/10000,cost:c2/10000}}
 return {old:156.35,cost:quoteSheetCost()/10000};
}
function adjPreview(){
 var dir=$('#adjDir').value,p=parseFloat($('#adjPct').value)||0;
 var reg=parseFloat($('#adjReg')?$('#adjReg').value:1)||1;
 var k=(dir==='上浮'?1+p/100:1-p/100)*reg;
 var b=adjBase(),old=b.old,cost=b.cost,omg=old>0?((old-cost)/old*100):0;
 var nv=old*k,mg=nv>0?((nv-cost)/nv*100):0;
 $('#adjPrev').innerHTML='区域系数 ×'+reg.toFixed(2)+' · '+dir+' '+p+'%（综合系数 ×'+k.toFixed(3)+'）<br/>报价总价：¥'+old.toFixed(2)+' 万 → <b>¥'+nv.toFixed(2)+' 万</b><br/>毛利率：'+omg.toFixed(1)+'% → <b style="color:'+(mg<12?'var(--red)':'var(--green)')+'">'+mg.toFixed(1)+'%</b>'+(mg<12?'　⚠ 低于 12% 预警线，提交后需总经理特批':'　✓ 高于预警线');
}
function openAdj(){$('#modalAdj').classList.add('show');$('#overlay').classList.add('show');adjPreview()}
$('#adjClose').onclick=$('#adjCancel').onclick=function(){$('#modalAdj').classList.remove('show');$('#overlay').classList.remove('show')};
$('#adjDir').onchange=$('#adjPct').oninput=adjPreview;
if($('#adjReg'))$('#adjReg').onchange=adjPreview;
$('#adjOk').onclick=function(){
 var dir=$('#adjDir').value,p=parseFloat($('#adjPct').value)||0,reg=parseFloat($('#adjReg')?$('#adjReg').value:1)||1;
 var k=(dir==='上浮'?1+p/100:1-p/100)*reg;
 var id=window.curQuoteId||'BJ-2609-05';
 if(lastPage&&lastPage.menu==='报价编制工作台'&&window.WBR){
  WBR.forEach(function(r){var pr=parseFloat(String(r[9]).replace(/,/g,''));r[9]=(Math.round(pr*k*100)/100).toFixed(1);var raw=parseFloat(String(r[6]).replace(/,/g,''));r[10]='+'+(raw>0?((parseFloat(r[9])-raw)/raw*100).toFixed(1):'0')+'%';var qty=parseFloat(String(r[5]).replace(/,/g,''));r[11]=((parseFloat(r[9])*qty)/10000).toFixed(2)+' 万'});
  window.WBRK=k;
  toast('批量调价已应用：'+dir+' '+p+'% × 区域 ×'+reg.toFixed(2)+'（综合 ×'+k.toFixed(3)+'）— 工作台明细单价 / 合价 / 毛利率已实时更新');
  renderPage(lastPage.sid,lastPage.grp,lastPage.menu);
  return;
 }
 if(window.QDATA&&QDATA[id]&&!QDATA[id].listOnly){
  QDATA[id].groups.forEach(function(g){g.rows.forEach(function(r){r[5]=Math.round(qNum(r[5])*k*100)/100;r[6]=Math.round(qNum(r[5])*qNum(r[4]))})});
  toast('批量调价已应用：'+dir+' '+p+'% × 区域 ×'+reg.toFixed(2)+'（综合 ×'+k.toFixed(3)+'）— 明细单价与合价已更新，价格库参考版本不变');
 } else toast('批量调价已应用（报价工作台视角）— 明细单价与合价已更新');
 $('#modalAdj').classList.remove('show');$('#overlay').classList.remove('show');
 if(window.curQuoteId&&QDATA&&QDATA[window.curQuoteId]&&lastPage&&lastPage.menu==='报价单列表')renderQuoteSheet(window.curQuoteId);
};

/* ---- 参数化报价（智慧消防：建筑面积 / 点位 / 接入系统数） ---- */
function openParam(){
 openModal('参数化报价（智慧消防）');
 $('#modalNew .modal-bd').innerHTML='<div class="fld full"><label>建筑面积（㎡）<b>*</b></label><input id="paramArea" value="46000"/></div><div class="fld full"><label>点位数量（个）<b>*</b></label><input id="paramPoint" value="8600"/></div><div class="fld full"><label>接入系统数（水 / 电 / 防排烟 / 报警…）<b>*</b></label><input id="paramSys" value="6"/></div><div class="fld full"><div class="banner">'+ICON.info.replace('class="ic"','class="ic" style="width:16px;height:16px;color:var(--blue);margin-top:3px"')+'<div><b>测算口径（演示）</b><br/>硬件按点位单价 · 数据采集按系统数 · 平台软件按建筑面积 · 数字孪生按板块组合；测算结果生成「智慧消防 / 数字孪生」板块报价明细并入工作台</div></div></div><div class="fld full"><button class="btn btn-primary" data-param-calc="1">测算并入明细</button></div>';
}

function closeDD(){var dds=$$('.dd');for(var i=0;i<dds.length;i++)dds[i].classList.remove('show')}
$('#btnAvatar').addEventListener('click',function(e){e.stopPropagation();var d=$('#ddAvatar'),open=d.classList.contains('show');closeDD();
 if(!open){var r=$('#btnAvatar').getBoundingClientRect();d.style.top=(r.bottom+8)+'px';d.style.right=Math.max(8,innerWidth-r.right)+'px';d.style.left='auto';d.classList.add('show')}});
$('#ddAvatar').addEventListener('click',function(e){
 var rl=e.target.closest('.rl-item');
 if(rl){closeDD();setRole(ROLES[+rl.dataset.r]);return}
 var it=e.target.closest('.dd-item');if(!it)return;
 closeDD();toast('演示：'+it.dataset.act)});
$('#btnBell').addEventListener('click',function(e){e.stopPropagation();var d=$('#ddBell'),open=d.classList.contains('show');closeDD();
 if(!open){var r=$('#btnBell').getBoundingClientRect();d.style.top=(r.bottom+8)+'px';d.style.right=Math.max(8,innerWidth-r.right)+'px';d.style.left='auto';d.classList.add('show')}});
$('#readAll').onclick=function(e){e.stopPropagation();$('#bellBadge').style.display='none';closeDD();toast('已全部标记为已读（演示）')};
document.addEventListener('keydown',function(e){
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openGS()}
 if(e.key==='Escape'){closeDD();closeModal();closeMatDrawer();closeGS();$('#modalAdj').classList.remove('show');$('#aiDrawer').classList.remove('open');$('#devDrawer').classList.remove('open');$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show')}});
$('#btnCollapse').onclick=function(){
 var sb=$('#sidebar'),btn=$('#btnCollapse'),mini=sb.classList.toggle('mini');
 document.body.classList.toggle('side-mini',mini);
 btn.title=mini?'展开菜单栏':'收起菜单栏';
 if(mini)toast('已收起菜单栏 · 点底部图标或任一分组图标可展开');
};
$('#hamburger').onclick=function(){$('#sidebar').classList.add('open');$('#overlay').classList.add('show')};
$('#overlay').onclick=function(){$('#sidebar').classList.remove('open');closeModal();$('#modalAdj').classList.remove('show');$('#aiDrawer').classList.remove('open');$('#devDrawer').classList.remove('open');$('#overlay').classList.remove('show')};
$('#mtabs').addEventListener('click',function(e){var t=e.target.closest('.mtab');if(!t)return;
 if(t.id==='mtabMore'){$('#sidebar').classList.add('open');$('#overlay').classList.add('show');return}
 var ms=$$('.mtab');for(var i=0;i<ms.length;i++)ms[i].classList.remove('active');t.classList.add('active');showStation(t.dataset.go)});`,wa=`window.addEventListener('resize',checkTabsOverflow);

$('#btnAI').onclick=function(){$('#devDrawer').classList.remove('open');$('#aiDrawer').classList.add('open');$('#overlay').classList.add('show')};
$('#aiClose').onclick=function(){$('#aiDrawer').classList.remove('open');$('#overlay').classList.remove('show')};
function aiSend(t){if(!t.trim())return;var b=$('#aiBody');
 b.insertAdjacentHTML('beforeend','<div class="chatai me">'+t+'</div>');$('#aiInput').value='';b.scrollTop=b.scrollHeight;
 var tp=document.createElement('div');tp.className='chatai bot typing';tp.innerHTML='<i></i><i></i><i></i>';b.appendChild(tp);b.scrollTop=b.scrollHeight;
 setTimeout(function(){tp.remove();b.insertAdjacentHTML('beforeend','<div class="chatai bot">（演示回复）基于您当前视角（'+role.n+'）：建议优先处理「待办与预警」面板中的红色条目。接入真实数据后可基于项目、工单、告警库给出精确分析。</div>');b.scrollTop=b.scrollHeight},900)}
$('#aiSend').onclick=function(){aiSend($('#aiInput').value)};
$('#aiInput').addEventListener('keydown',function(e){if(e.key==='Enter')aiSend(e.target.value)});
var chips=$$('.chip');for(var ci=0;ci<chips.length;ci++){(function(c){c.onclick=function(){aiSend(c.dataset.q)}})(chips[ci])}

/* 键盘可达性：Enter / Space 触发可聚焦的模拟交互元素（原生控件由浏览器处理，避免重复触发） */
document.addEventListener('keydown',function(e){
 if((e.key!=='Enter'&&e.key!==' ')||e.target.tagName==='BUTTON'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
 var el=e.target;
 if(!el.matches('[data-act],[data-toast],[data-detail],[data-rp-pg],[data-cl-pg],[data-goseg],[data-sid],[data-quick],[data-new],[data-cnew],[data-home],[data-r],[data-catm],[data-drawer-close],[data-go],[data-back],.tab1,.mi,.grp-hd,.mtab,.pill,.qtile,.kb-card,.tree-i,.xcard,.tcat,.rl-item,.noti-item,.dd-item,.chip,.link-btn,.hbtn,.icon-btn,.pg-btn,.cn-step,.wb-mode,.mini-btn,.seg,.tab,.dtab'))return;
 e.preventDefault();
 el.click();
});

/* 启动 */
renderRoleList();setRole(ROLES[0]);`;const r=Object.assign({"./pages/acceptDocHTML.js":e,"./pages/acceptStdHTML.js":u,"./pages/autoInvHTML.js":b,"./pages/autoRecvHTML.js":g,"./pages/batchQrHTML.js":m,"./pages/bidCertHTML.js":f,"./pages/bidcollabHTML.js":w,"./pages/bidlossHTML.js":h,"./pages/bidnodeHTML.js":y,"./pages/bidregHTML.js":T,"./pages/bidresultHTML.js":k,"./pages/bizApprHTML.js":M,"./pages/bizBoardHTML.js":X,"./pages/bizBossHTML.js":x,"./pages/bizInsightHTML.js":O,"./pages/bizMoneyHTML.js":L,"./pages/bizReportHTML.js":P,"./pages/bizRiskHTML.js":j,"./pages/boardHTML.js":S,"./pages/calcParent.js":_,"./pages/catTableHTML.js":H,"./pages/catTreeHTML.js":C,"./pages/certDashHTML.js":A,"./pages/certPackHTML.js":E,"./pages/clName.js":N,"./pages/clOf.js":F,"./pages/clientHTML.js":I,"./pages/cnStepsHTML.js":B,"./pages/contactHTML.js":D,"./pages/contractApproveHTML.js":q,"./pages/contractDashHTML.js":R,"./pages/contractLedgerHTML.js":K,"./pages/contractRiskHTML.js":G,"./pages/contractWizHTML.js":W,"./pages/costChangeHTML.js":J,"./pages/costImpHTML.js":Q,"./pages/costTreeHTML.js":V,"./pages/costWriteoffHTML.js":z,"./pages/deliverPackHTML.js":$,"./pages/docArchHTML.js":Z,"./pages/docAuditHTML.js":U,"./pages/docMissHTML.js":Y,"./pages/docTreeHTML.js":tt,"./pages/eduFaultHTML.js":nt,"./pages/eduKnowHTML.js":at,"./pages/esigHTML.js":st,"./pages/extInqHTML.js":it,"./pages/extOrderHTML.js":et,"./pages/extSettleHTML.js":dt,"./pages/fhSignHTML.js":rt,"./pages/followHTML.js":ot,"./pages/frameHTML.js":lt,"./pages/funnelHTML.js":ct,"./pages/inbAcceptDrawer.js":pt,"./pages/inboundHTML.js":vt,"./pages/initCItems.js":ut,"./pages/inqSumHTML.js":bt,"./pages/invLibHTML.js":gt,"./pages/iotAssetHTML.js":mt,"./pages/iotMonHTML.js":ft,"./pages/iotReportHTML.js":wt,"./pages/iotSceneHTML.js":ht,"./pages/ljHTML.js":yt,"./pages/ljSetHTML.js":Tt,"./pages/matCertHTML.js":kt,"./pages/matOf.js":Mt,"./pages/mergeHTML.js":Xt,"./pages/oaCalHTML.js":xt,"./pages/oaCarHTML.js":Ot,"./pages/oaDocHTML.js":Lt,"./pages/oaDoneHTML.js":Pt,"./pages/oaExpHTML.js":jt,"./pages/oaHrHTML.js":St,"./pages/oaMsgHTML.js":_t,"./pages/oaNoticeHTML.js":Ht,"./pages/oaSealHTML.js":Ct,"./pages/ocrHTML.js":At,"./pages/oppOf.js":Et,"./pages/oppstageHTML.js":Nt,"./pages/outboundHTML.js":Ft,"./pages/overWarnHTML.js":It,"./pages/ownBillHTML.js":Bt,"./pages/ownProjHTML.js":Dt,"./pages/ownRepHTML.js":qt,"./pages/ownRepairHTML.js":Rt,"./pages/payInsightHTML.js":Kt,"./pages/payReqHTML.js":Gt,"./pages/poOrderHTML.js":Wt,"./pages/priceDrawer.js":Jt,"./pages/priceLibHTML.js":Qt,"./pages/priceViewHTML.js":Vt,"./pages/proj360HTML.js":zt,"./pages/projArchHTML.js":$t,"./pages/projBoardHTML.js":Zt,"./pages/projChangeHTML.js":Ut,"./pages/projCloseHTML.js":Yt,"./pages/projGanttHTML.js":tn,"./pages/projLaborHTML.js":nn,"./pages/projListHTML.js":an,"./pages/projMonitorHTML.js":sn,"./pages/projQaHTML.js":en,"./pages/projRiskHTML.js":dn,"./pages/projWbsHTML.js":rn,"./pages/ptypeHTML.js":on,"./pages/qrHTML.js":ln,"./pages/quoteDashHTML.js":cn,"./pages/quoteVerHTML.js":pn,"./pages/renderClient360.js":vn,"./pages/renderContractDetail.js":un,"./pages/renderContractItems.js":bn,"./pages/renderContractNew.js":gn,"./pages/renderOpp360.js":mn,"./pages/renderProj360.js":fn,"./pages/renderSurvey.js":wn,"./pages/repDownHTML.js":hn,"./pages/repGenHTML.js":yn,"./pages/repTplHTML.js":Tn,"./pages/reqCartHTML.js":kn,"./pages/returnScrapHTML.js":Mn,"./pages/saleHTML.js":Xn,"./pages/settleCalcHTML.js":xn,"./pages/siteCountHTML.js":On,"./pages/siteLogHTML.js":Ln,"./pages/siteRecvHTML.js":Pn,"./pages/siteRvHTML.js":jn,"./pages/siteSuppHTML.js":Sn,"./pages/siteVisaHTML.js":_n,"./pages/stockTakeHTML.js":Hn,"./pages/supArchHTML.js":Cn,"./pages/supBlackHTML.js":An,"./pages/supLevelHTML.js":En,"./pages/supPayHTML.js":Nn,"./pages/supQuoteHTML.js":Fn,"./pages/surveyHTML.js":In,"./pages/sysApiHTML.js":Bn,"./pages/sysBackupHTML.js":Dn,"./pages/sysBillHTML.js":qn,"./pages/sysLogHTML.js":Rn,"./pages/sysMarketHTML.js":Kn,"./pages/sysOrgHTML.js":Gn,"./pages/sysPaasHTML.js":Wn,"./pages/sysRoleHTML.js":Jn,"./pages/sysTenantHTML.js":Qn,"./pages/tagHtml.js":Vn,"./pages/targetCostHTML.js":zn,"./pages/wmContractHTML.js":$n,"./pages/wmDispatchHTML.js":Zn,"./pages/wmFlowHTML.js":Un,"./pages/wmInvoiceHTML.js":Yn,"./pages/wmIoHTML.js":ta,"./pages/wmLogHTML.js":na,"./pages/wmPartsHTML.js":aa,"./pages/wmPlanHTML.js":sa,"./pages/wmPoolHTML.js":ia,"./pages/wmProjHTML.js":ea,"./pages/wmRenewHTML.js":da,"./pages/wmRepairHTML.js":ra,"./pages/wmRouteHTML.js":oa,"./pages/wmRoutePlanHTML.js":la,"./pages/wmSatHTML.js":ca,"./pages/wmShiftHTML.js":pa,"./pages/wmStockHTML.js":va,"./pages/workbenchHTML.js":ua}),ha=Object.keys(r).sort().map(i=>r[i]),ya=ga+`
`+ma+`
`+ha.join(`
`)+`
`+fa+`
`+wa;function Ta(){const i=s.useRef(null);return s.useEffect(()=>{const d=i.current;if(!d)return;d.innerHTML=ba;const o=[],l=[],c=document.addEventListener.bind(document),p=window.addEventListener.bind(window),ka=document.removeEventListener.bind(document),Ma=window.removeEventListener.bind(window);document.addEventListener=(t,n,a)=>{o.push([t,n,a]),c(t,n,a)},window.addEventListener=(t,n,a)=>{l.push([t,n,a]),p(t,n,a)};try{new Function(ya).call(window)}finally{document.addEventListener=c,window.addEventListener=p}return()=>{for(const[t,n,a]of o)ka(t,n,a);for(const[t,n,a]of l)Ma(t,n,a);d.innerHTML=""}},[]),s.createElement("div",{ref:i})}return v(Ta,"XiaoyanCloud"),Ta}(React);
