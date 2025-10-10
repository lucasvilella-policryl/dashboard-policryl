// ---------------- CONFIG ----------------
// Planilha principal (ABA: PEDIDOS GERAL) publicada na web:
const PUB = {
  // Esse é o ID "d/e/..." da URL publicada
  PUB_ID: '2PACX-1vQKstKflONSWvQ6xfVkMdM53mveopLXVGNv9CyQT0kRbjdI7IGIVzvvMPLSXNyQ-xZTQEvDmKr1jI_I',
  GID_PEDIDOS: '1297882001',   // gid da aba PEDIDOS GERAL (do link que você enviou)
  // (Opcional) Se você publicar também a aba de metas, preencha aqui:
  GID_METAS: ''               // ex.: '123456789'
};

// Caso queira manter também o acesso por ID da planilha (não-publicada), deixe aqui:
const CONFIG = {
  SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
  SHEET_NAME: 'PEDIDOS GERAL',
  RANGE: 'A:AO'
};

// Índices do NOVO CABEÇALHO (A..AO => 0..40)
const COLS = {
  ANO:0, MES:1, NUM_OMIE:2, NUM_LVIRT:3, LINHA:4, MATRIZ_FRANQ:5, ATENDIMENTO:6, CNPJ_CPF:7, ESTADO:8,
  REGIAO_BR:9, FORMA_PGTO:10, VALOR_PEDIDO:11, ENXOVAL_REPOS:12, DATA_INCLUSAO:13, ENTRADA_PROD:14,
  EMBALADO_EM:15, ENTRADA_FAT:16, NUM_NF:17, FATURADO_EM:18, ENTRADA_EXP:19, EXPEDIDO_EM:20, TRANSPORTADORA:21,
  DEADLINE:22, STATUS_PED:23, DURACAO:24, SITUACAO_PED:25, SITUACAO_CONC:26, MES_PEDIDO:27, SEMANA_PEDIDO:28,
  MES_DEADLINE:29, SEMANA_DEADLINE:30, MES_FAT:31, SEMANA_FAT:32, MES_EXP:33, SEMANA_EXP:34, COMPRA:35,
  ORIGEM_CONTATO:36, DATA_ORC:37, VALOR_ORC:38, ENXOVAL_REP2:39, QTDE_ITENS:40
};

let allData = [];
let HEADERS = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// ---------- Utils ----------
const PT3_TO_MM = {'JAN':'01','FEV':'02','MAR':'03','ABR':'04','MAI':'05','JUN':'06','JUL':'07','AGO':'08','SET':'09','OUT':'10','NOV':'11','DEZ':'12'};
function normMesToken(x){ if(!x) return null; const s=String(x).trim().toUpperCase(); if(PT3_TO_MM[s]) return PT3_TO_MM[s]; const n=parseInt(s,10); if(!isNaN(n)&&n>=1&&n<=12) return String(n).padStart(2,'0'); return null; }
function formatCurrency(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0); }
function formatNumber(v){ return new Intl.NumberFormat('pt-BR').format(v||0); }
function parseValue(v){ if(v==null||v==='')return 0; if(typeof v==='number') return v; return parseFloat(String(v).replace(/[R$\s.]/g,'').replace(',', '.'))||0; }
function csvToArray(text){
  // Simples parser de CSV (planilha publicada output=csv)
  const lines = text.split(/\r?\n/).filter(l=>l.length>0);
  return lines.map(line => {
    const cells = [];
    let cur='', inside=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='\"'){
        if(inside && line[i+1]==='\"'){ cur+='\"'; i++; }
        else inside = !inside;
      } else if(ch===',' && !inside){ cells.push(cur); cur=''; }
      else cur+=ch;
    }
    cells.push(cur);
    return cells;
  });
}

// ---------- Fetch principal (preferir publicação CSV; fallback gviz) ----------
async function fetchSheetData(){
  // 1) Tentar CSV publicado
  try{
    const urlCSV = `https://docs.google.com/spreadsheets/d/e/${PUB.PUB_ID}/pub?gid=${PUB.GID_PEDIDOS}&single=true&output=csv`;
    const res = await fetch(urlCSV, {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status+' CSV principal');
    const txt = await res.text();
    const rows = csvToArray(txt);
    HEADERS = rows[0] || [];
    allData = rows.slice(1);
    console.log('Dados carregados via CSV publicado', HEADERS.length, allData.length);
    return allData;
  }catch(e){
    console.warn('CSV publicado falhou, tentando GVIZ...', e);
  }
  // 2) Fallback GVIZ (requer planilha com acesso "Qualquer um com o link")
  const id = CONFIG.SHEET_ID;
  const sheet = encodeURIComponent(CONFIG.SHEET_NAME);
  const range = CONFIG.RANGE || 'A:AO';
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${sheet}&range=${range}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('HTTP ' + res.status + ' ao buscar dados principais GVIZ');
  const txt = await res.text();
  const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}')+1));
  HEADERS = (json.table.cols || []).map(c => (c && c.label) ? c.label : '');
  const cols = json.table.cols.length;
  const jrows = json.table.rows || [];
  allData = jrows.map(r => {
    const arr = new Array(cols).fill('');
    (r.c || []).forEach((cell, i) => { arr[i] = cell ? (cell.v ?? '') : ''; });
    return arr;
  });
  return allData;
}

// ---------- Metas (preferir publicação CSV se GID_METAS fornecido; fallback GVIZ) ----------
let METAS_CACHE = [];
async function fetchMetas(){
  // 1) CSV publicado (se você publicar a aba de metas e preencher PUB.GID_METAS)
  if (PUB.GID_METAS){
    try{
      const urlCSV = `https://docs.google.com/spreadsheets/d/e/${PUB.PUB_ID}/pub?gid=${PUB.GID_METAS}&single=true&output=csv`;
      const res = await fetch(urlCSV, {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status+' CSV metas');
      const txt = await res.text();
      const rows = csvToArray(txt);
      const idx = {Ano:0, Mes:1, Linha:2, Meta_Mes:3, Meta_Diaria:4}; // cabeçalho esperado
      METAS_CACHE = rows.slice(1).map(r => ({
        ano: String(r[idx.Ano] ?? '').trim(),
        mes: normMesToken(r[idx.Mes]),
        linha: String(r[idx.Linha] ?? '').trim(),
        metaMes: parseValue(r[idx.Meta_Mes]),
        metaDia: parseValue(r[idx.Meta_Diaria])
      })).filter(m => m.ano && m.mes);
      console.log('Metas via CSV publicado', METAS_CACHE.length);
      return METAS_CACHE;
    }catch(e){
      console.warn('CSV metas falhou, tentando GVIZ...', e);
    }
  }
  // 2) GVIZ fallback (requer visibilidade "Qualquer um com o link")
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('BDADOS METAS')}&range=A:E`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Erro METAS: HTTP ' + res.status);
  const txt = await res.text();
  const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}')+1));
  const cols = json.table.cols.length;
  const rows = json.table.rows || [];
  METAS_CACHE = rows.map(r => {
    const arr = new Array(cols).fill('');
    (r.c || []).forEach((cell, i) => { arr[i] = cell ? (cell.v ?? '') : ''; });
    return arr;
  }).map(r => ({
    ano: String(r[0] ?? '').trim(),
    mes: normMesToken(r[1]),
    linha: String(r[2] ?? '').trim(),
    metaMes: parseValue(r[3]),
    metaDia: parseValue(r[4]),
  })).filter(m => m.ano && m.mes);
  console.log('Metas via GVIZ', METAS_CACHE.length);
  return METAS_CACHE;
}

function resolveMetasFor(filters){
  const mm = filters.mes;
  const yy = String(filters.ano);
  const linha = (filters.linha && filters.linha !== 'todas') ? filters.linha : null;
  const isSameMonth = (m) => (m.ano === yy && m.mes === mm);

  if (!linha){
    const metasMes = METAS_CACHE.filter(isSameMonth);
    const metaMensal = metasMes.reduce((s,m) => s + (m.metaMes||0), 0);
    const metaDiaria = metasMes.reduce((s,m) => s + (m.metaDia||0), 0);
    return { metaMes: metaMensal, metaDia: metaDiaria };
  } else {
    const m = METAS_CACHE.find(m => isSameMonth(m) && m.linha === linha);
    return { metaMes: m ? (m.metaMes||0) : 0, metaDia: m ? (m.metaDia||0) : 0 };
  }
}

// ---------- Filtros ----------
function getCurrentFilters(){
  const ano = document.getElementById('filterAno').value;
  const mes = document.getElementById('filterMes').value;
  const linhaSel = document.getElementById('filterLinha').value;
  const mesNomes=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return { ano, mes, linha: linhaSel, mesNome: mesNomes[parseInt(mes,10)-1] };
}

function filterData(data, filters){
  return data.filter(r => {
    if (String(r[COLS.ANO]) !== String(filters.ano)) return false;
    if (normMesToken(r[COLS.MES]) !== filters.mes) return false;
    if (filters.linha !== 'todas' && String(r[COLS.LINHA]).trim() !== filters.linha) return false;
    return true;
  });
}

// ---------- KPIs ----------
function calculateKPIs(data, filters){
  const f = filterData(data, filters);
  const metas = resolveMetasFor(filters);

  const valorVendas   = f.reduce((s,r)=> s + (r[COLS.EXPEDIDO_EM] ? parseValue(r[COLS.VALOR_PEDIDO]) : 0), 0);
  const pedidosAtraso = f.filter(r=> r[COLS.DEADLINE] && !r[COLS.EXPEDIDO_EM]).length;
  const pedidosLiberar= f.filter(r=> ((r[COLS.STATUS_PED]||'')+'').match(/Aguardando|Liberar/i)).length;
  const pedidosExped  = f.filter(r=> r[COLS.EXPEDIDO_EM]).length;

  return { metaMes: metas.metaMes, metaDia: metas.metaDia, valorVendas, pedidosAtraso, pedidosLiberar, pedidosExpedidos: pedidosExped };
}
function updateKPIs(k, f){
  document.getElementById('metaMes').textContent = formatCurrency(k.metaMes);
  document.getElementById('metaDia').textContent = formatCurrency(k.metaDia);
  document.getElementById('valorVendas').textContent = formatCurrency(k.valorVendas);
  document.getElementById('pedidosAtraso').textContent = formatNumber(k.pedidosAtraso);
  document.getElementById('pedidosLiberar').textContent = formatNumber(k.pedidosLiberar);
  document.getElementById('pedidosExpedidos').textContent = formatNumber(k.pedidosExpedidos);
  document.getElementById('mesRef').textContent = `${f.mesNome}/${f.ano}`;
}

// ---------- Histórico (Ano) ----------
function calculateHistoricoAnual(data, ano){
  const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return meses.map((mesNome, i) => {
    const mm = String(i+1).padStart(2,'0');
    const rows = data.filter(r => String(r[COLS.ANO])===String(ano) && normMesToken(r[COLS.MES])===mm);
    const orcamentos = rows.reduce((s,r)=> s + parseValue(r[COLS.VALOR_ORC]), 0);
    const vendas = rows.reduce((s,r)=> s + (r[COLS.EXPEDIDO_EM] ? parseValue(r[COLS.VALOR_PEDIDO]) : 0), 0);
    const metasMes = METAS_CACHE.filter(m => m.ano===String(ano) && m.mes===mm);
    const meta = metasMes.reduce((s,m)=> s + (m.metaMes||0), 0);
    return { mes: mesNome, orcamentos, vendas, meta };
  });
}
function createHistoricoChart(data, ano){
  const ctx=document.getElementById('historicoChart').getContext('2d');
  const hist=calculateHistoricoAnual(data, ano);
  if(historicoChart) historicoChart.destroy();
  historicoChart = new Chart(ctx, {
    type:'line',
    data:{labels:hist.map(d=>d.mes), datasets:[
      {label:'Orçamentos', data:hist.map(d=>d.orcamentos), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.1)', borderWidth:3, fill:true, tension:.35},
      {label:'Vendas', data:hist.map(d=>d.vendas), borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.08)', borderWidth:3, fill:true, tension:.35},
      {label:'Meta', data:hist.map(d=>d.meta), borderColor:'#ef4444', borderWidth:2, borderDash:[6,6], fill:false, tension:.35}
    ]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e2e8f0'}}}, scales:{x:{ticks:{color:'#94a3b8'}, grid:{display:false}}, y:{beginAtZero:true, ticks:{color:'#94a3b8'}, grid:{color:'rgba(148,163,184,.1)'}}}}
  });
}

// ---------- Charts auxiliares ----------
function createPagamentoChart(data, filters){
  const ctx = document.getElementById('pagamentoChart').getContext('2d');
  const f = filterData(data, filters);
  const by = {};
  f.forEach(r => {
    const k = (r[COLS.FORMA_PGTO] || 'Não inf.').toString().trim();
    by[k] = (by[k] || 0) + parseValue(r[COLS.VALOR_PEDIDO]);
  });
  const labels = Object.keys(by);
  const values = labels.map(k => by[k]);
  if(pagamentoChart) pagamentoChart.destroy();
  pagamentoChart = new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Valor (R$)', data:values, borderWidth:2, borderColor:'#1e293b', backgroundColor:['#8b5cf6','#3b82f6','#22c55e','#f59e0b','#ef4444'], borderRadius:8}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(c)=>' '+formatCurrency(c.parsed.y)}}}, scales:{x:{ticks:{color:'#94a3b8'}, grid:{display:false}}, y:{beginAtZero:true, ticks:{color:'#94a3b8'}, grid:{color:'rgba(148,163,184,.1)'}}}
  });
}

function createRegiaoChart(data, filters){
  const ctx = document.getElementById('regiaoChart').getContext('2d');
  const f = filterData(data, filters);
  const by = {};
  f.forEach(r => { const k = (r[COLS.REGIAO_BR] || 'Não inf.').toString().trim(); by[k]=(by[k]||0)+1; });
  const labels = Object.keys(by);
  const values = labels.map(k=>by[k]);
  if(regiaoChart) regiaoChart.destroy();
  regiaoChart = new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Pedidos', data:values, borderWidth:2, borderColor:'#1e293b', backgroundColor:['rgba(139,92,246,.85)','rgba(59,130,246,.85)','rgba(34,197,94,.85)','rgba(245,158,11,.85)','rgba(239,68,68,.85)'], borderRadius:8}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#94a3b8'}, grid:{display:false}}, y:{beginAtZero:true, ticks:{color:'#94a3b8'}, grid:{color:'rgba(148,163,184,.1)'}}}
  });
}

function createCompraChart(data, filters){
  const ctx = document.getElementById('compraChart').getContext('2d');
  const f = filterData(data, filters);
  const counts = {'Primeira compra':0,'Recompra':0,'Outros':0};
  f.forEach(r => {
    const v = (r[COLS.COMPRA]||'').toString().toLowerCase();
    if(v.includes('primeira')) counts['Primeira compra']++;
    else if(v.includes('recompra')) counts['Recompra']++;
    else counts['Outros']++;
  });
  if(compraChart) compraChart.destroy();
  compraChart = new Chart(ctx, {
    type:'pie',
    data:{labels:Object.keys(counts), datasets:[{data:Object.values(counts), borderColor:'#1e293b', borderWidth:2, backgroundColor:['#22c55e','#3b82f6','#8b5cf6']} ]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:'#e2e8f0'}}, tooltip:{callbacks:{label:(c)=>` ${c.label}: ${formatNumber(c.parsed)} pedidos`}}}}
  });
}

// ---------- Init ----------
function populateYearOptions(){
  const sel = document.getElementById('filterAno');
  const now = new Date().getFullYear();
  const years = [now-1, now, now+1];
  sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  sel.value = String(now);
}
function setCurrentMonth(){
  const now = new Date();
  document.getElementById('filterMes').value = String(now.getMonth()+1).padStart(2,'0');
}

async function updateDashboard(){
  const loading = document.getElementById('loading'); loading.style.display='flex';
  try{
    if(allData.length===0) await fetchSheetData();
    if(METAS_CACHE.length===0) await fetchMetas();

    const f = getCurrentFilters();
    updateKPIs(calculateKPIs(allData, f), f);
    createHistoricoChart(allData, f.ano);
    createPagamentoChart(allData, f);
    createRegiaoChart(allData, f);
    createCompraChart(allData, f);
  }catch(e){
    console.error(e);
    alert('Erro ao carregar dados. Veja o console para detalhes.');
  }finally{
    setTimeout(()=> loading.style.display='none', 300);
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  populateYearOptions();
  setCurrentMonth();
  updateDashboard();
  setInterval(()=>{ allData=[]; updateDashboard(); }, 300000);
});
