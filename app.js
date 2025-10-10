// DASHBOARD POLICRYL - BDADOS DASH via CSV Publicado (fix auto-refresh + histórico)

// === CONFIG CSV PUBLICADO ===
const PUB = {
  // do seu link CSV publicado:
  // https://docs.google.com/spreadsheets/d/e/<PUB_ID>/pub?gid=<GID_DASH>&single=true&output=csv
  PUB_ID: '2PACX-1vQKstKflONSWvQ6xfVkMdM53mveopLXVGNv9CyQT0kRbjdI7IGIVzvvMPLSXNyQ-xZTQEvDmKr1jI_I',
  GID_DASH: '1199309873'
};

// (mantido apenas como fallback eventual; não é mais usado)
const CONFIG = {
  SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
  API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
  SHEET_NAME: 'BDADOS DASH',
  RANGE: 'A:AR'
};

// ==== MAPEAMENTO DAS COLUNAS (igual ao seu arquivo) ====
const COLS = {
  ANO:0, MES:1, LINHA:2,
  META_MES:3, META_DIARIA:4, PORCENTAGEM_META:5,
  QTDE_ORCAMENTOS:6, VALOR_ORCAMENTOS:7, TICKET_MEDIO_ORCAMENTOS:8, QTDE_ITENS_ORCAMENTOS:9,
  QTDE_SIMPLES_REMESSA:10, VALOR_SIMPLES_REMESSA:11, QTDE_ITENS_SIMPLES_REMESSA:12,
  QTDE_PEDIDOS:13, VALOR_PEDIDOS:14, TICKET_MEDIO_PEDIDOS:15, QTDE_ITENS_PEDIDOS:16, TAXA_CONVERSAO_PEDIDOS:17, TAXA_CONVERSAO_VALORES:18,
  PEDIDOS_PIX:19, VALORES_PIX:20, PEDIDOS_CARTAO_CREDITO:21, VALORES_CARTAO_CREDITO:22, PEDIDOS_BOLETO:23, VALORES_BOLETO:24,
  PEDIDOS_ATRASADOS:25, PEDIDOS_A_LIBERAR:26, PEDIDOS_FATURADOS_MES:27, PEDIDOS_EXPEDIDOS_MES:28, PEDIDOS_ENVIO_ATRASO:29, PEDIDOS_ENVIO_PRAZO:30,
  PRIMEIRA_COMPRA:31, RECOMPRA:32, TEMPO_MEDIO_TOTAL:33,
  REGIAO_CENTRO_OESTE:34, REGIAO_NORDESTE:35, REGIAO_NORTE:36, REGIAO_SUDESTE:37, REGIAO_SUL:38,
  PEDIDOS_FRANQUIAS:39, PEDIDOS_MATRIZ:40
};

const MESES = {'JAN':'01','FEV':'02','MAR':'03','ABR':'04','MAI':'05','JUN':'06','JUL':'07','AGO':'08','SET':'09','OUT':'10','NOV':'11','DEZ':'12'};
const MESES_NOME = {'01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun','07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez'};

let allData = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// ==== utils ====
function formatCurrency(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);}
function formatNumber(v){return new Intl.NumberFormat('pt-BR').format(v||0);}
function formatPercent(v){return (v||0).toFixed(1)+'%';}
function parseValue(v){
  if (!v && v!==0) return 0;
  if (typeof v==='number') return v;
  if (typeof v==='string' && v.includes('R$')) {
    const cleaned=v.replace(/[R$\s.]/g,'').replace(',','.');
    return parseFloat(cleaned)||0;
  }
  const cleaned=String(v).replace(/[^\d,.-]/g,'').replace(',','.');
  return parseFloat(cleaned)||0;
}
function normalizarMes(m){
  const s=String(m||'').trim().toUpperCase();
  if (MESES[s]) return MESES[s];
  const n=parseInt(s,10);
  if(!isNaN(n)&&n>=1&&n<=12) return String(n).padStart(2,'0');
  return '01';
}
function getCurrentFilters(){
  const ano=document.getElementById('filterAno').value;
  const mes=document.getElementById('filterMes').value;
  const linha=document.getElementById('filterLinha').value;
  return { ano, mes, linha, mesAno:`${MESES_NOME[mes]||'Out'}/${ano}` };
}

// ==== CSV parser simples (suporta campos com aspas e vírgulas) ====
function csvToArray(text){
  const lines = text.split(/\r?\n/).filter(l => l.length>0);
  return lines.map(line => {
    const out=[]; let cur='', q=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch === '"'){ if (q && line[i+1] === '"'){ cur+='"'; i++; } else { q=!q; } }
      else if (ch === ',' && !q){ out.push(cur); cur=''; }
      else { cur += ch; }
    }
    out.push(cur);
    return out;
  });
}

// ==== CARREGAR BDADOS DASH via CSV publicado ====
async function fetchSheetData(){
  const urlCSV = `https://docs.google.com/spreadsheets/d/e/${PUB.PUB_ID}/pub?gid=${PUB.GID_DASH}&single=true&output=csv&cb=${Date.now()}`;
  const res = await fetch(urlCSV, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP '+res.status+' ao buscar CSV BDADOS DASH');
  const txt = await res.text();
  const rows = csvToArray(txt);
  allData = rows.slice(1); // remove cabeçalho
  console.log('✅ BDADOS DASH via CSV publicado:', allData.length, 'linhas');
  return true;
}

// ==== buscar dados por filtro (igual ao seu) ====
function findDataForFilters(filters){
  const dados = allData.filter(row=>{
    const rowAno = String(row[COLS.ANO]||'').trim();
    const rowMes = normalizarMes(row[COLS.MES]);
    const rowLinha = String(row[COLS.LINHA]||'').trim();
    return rowAno===filters.ano && rowMes===filters.mes && (filters.linha==='todas' || rowLinha===filters.linha);
  });

  if (dados.length===0) return null;
  if (dados.length===1) return dados[0];

  const cons = new Array(Object.keys(COLS).length).fill(0);
  dados.forEach(row=>{
    Object.values(COLS).forEach(idx=>{
      if (row[idx]!==undefined && row[idx]!==''){
        cons[idx] += parseValue(row[idx]);
      }
    });
  });
  return cons;
}

// ==== Histórico: usa ANO do filtro (não 2025 fixo) ====
function createHistoricoChart(){
  const canvas = document.getElementById('historicoChart'); if (!canvas) return;
  if (historicoChart) historicoChart.destroy();

  const { ano } = getCurrentFilters();
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const pontos = meses.map((mNome, i)=>{
    const mm = String(i+1).padStart(2,'0');
    const linhas = allData.filter(row=>{
      const a = String(row[COLS.ANO]||'').trim();
      const m = normalizarMes(row[COLS.MES]);
      return a===ano && m===mm;
    });
    const meta  = linhas.reduce((s,r)=> s+parseValue(r[COLS.META_MES]), 0);
    const orc   = linhas.reduce((s,r)=> s+parseValue(r[COLS.VALOR_ORCAMENTOS]), 0);
    const vend  = linhas.reduce((s,r)=> s+parseValue(r[COLS.VALOR_PEDIDOS]), 0);
    return { mes:mNome, orcamentos:orc, vendas:vend, meta };
  });

  historicoChart = new Chart(canvas.getContext('2d'), {
    type:'line',
    data:{
      labels: meses,
      datasets:[
        {label:'Orçamentos', data:pontos.map(d=>d.orcamentos), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.1)', borderWidth:3, fill:true, tension:.4, pointRadius:4},
        {label:'Vendas',     data:pontos.map(d=>d.vendas),    borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.1)', borderWidth:3, fill:true, tension:.4, pointRadius:4},
        {label:'Meta',       data:pontos.map(d=>d.meta),      borderColor:'#ef4444', borderWidth:2, borderDash:[6,6], fill:false, tension:.4, pointRadius:3}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top', labels:{color:'#e2e8f0'}},
        tooltip:{ callbacks:{ label:(ctx)=> `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
      scales:{ x:{ grid:{display:false}, ticks:{color:'#94a3b8'} },
               y:{ beginAtZero:true, grid:{color:'rgba(148,163,184,.1)'}, ticks:{color:'#94a3b8'} } }
    }
  });
}

// ==== Gráficos auxiliares (inalterados, só leem do dataset filtrado) ====
function createPagamentoChart(){
  const c = document.getElementById('pagamentoChart'); if(!c) return;
  if (pagamentoChart) pagamentoChart.destroy();
  const f = getCurrentFilters(); const row = findDataForFilters(f);
  const data = {
    labels:['PIX','Cartão Crédito','Boleto'],
    datasets:[{ data:[
      row?parseValue(row[COLS.VALORES_PIX]):0,
      row?parseValue(row[COLS.VALORES_CARTAO_CREDITO]):0,
      row?parseValue(row[COLS.VALORES_BOLETO]):0
    ], backgroundColor:['#22c55e','#3b82f6','#8b5cf6'], borderColor:'#1e293b', borderWidth:2 }]
  };
  pagamentoChart = new Chart(c.getContext('2d'), { type:'doughnut', data,
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom', labels:{color:'#e2e8f0'}},
        tooltip:{ callbacks:{ label:(ctx)=> `${ctx.label}: ${formatCurrency(ctx.parsed)}` } } },
      cutout:'65%' }
  });
}

function createRegiaoChart(){
  const c = document.getElementById('regiaoChart'); if(!c) return;
  if (regiaoChart) regiaoChart.destroy();
  const f = getCurrentFilters(); const row = findDataForFilters(f);
  const labels=['Centro-Oeste','Nordeste','Norte','Sudeste','Sul'];
  const vals = [
    row?parseValue(row[COLS.REGIAO_CENTRO_OESTE]):0,
    row?parseValue(row[COLS.REGIAO_NORDESTE]):0,
    row?parseValue(row[COLS.REGIAO_NORTE]):0,
    row?parseValue(row[COLS.REGIAO_SUDESTE]):0,
    row?parseValue(row[COLS.REGIAO_SUL]):0
  ];
  regiaoChart = new Chart(c.getContext('2d'), { type:'bar',
    data:{ labels, datasets:[{ label:'Pedidos', data:vals, backgroundColor:'rgba(139,92,246,.8)', borderColor:'#8b5cf6', borderWidth:2, borderRadius:8 }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(ctx)=> `Pedidos: ${formatNumber(ctx.parsed.y)}` } } },
      scales:{ x:{ grid:{display:false}, ticks:{color:'#94a3b8'} },
               y:{ beginAtZero:true, grid:{color:'rgba(148,163,184,.1)'}, ticks:{color:'#94a3b8'} } } }
  });
}

function createCompraChart(){
  const c = document.getElementById('compraChart'); if(!c) return;
  if (compraChart) compraChart.destroy();
  const f = getCurrentFilters(); const row = findDataForFilters(f);
  const data={ labels:['Primeira Compra','Recompra'], datasets:[{ 
    data:[ row?parseValue(row[COLS.PRIMEIRA_COMPRA]):0, row?parseValue(row[COLS.RECOMPRA]):0 ],
    backgroundColor:['#22c55e','#3b82f6'], borderColor:'#1e293b', borderWidth:2 }] };
  compraChart = new Chart(c.getContext('2d'), { type:'pie', data,
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'bottom', labels:{color:'#e2e8f0'}},
      tooltip:{ callbacks:{ label:(ctx)=> `${ctx.label}: ${formatNumber(ctx.parsed)} pedidos` } } } }
  });
}

// ==== UPDATE com fallback de snapshot (não zera em caso de falha) ====
async function updateDashboard(opts = {}){
  const { forceReload = false } = opts;
  const loading = document.getElementById('loading');
  if (loading) loading.style.display='flex';

  const prev = allData && allData.length ? allData.slice() : [];

  try{
    if (forceReload || allData.length===0) await fetchSheetData();

    const filters = getCurrentFilters();
    const row = findDataForFilters(filters);

    const kpis = {
      metaMes: row ? parseValue(row[COLS.META_MES]) : 0,
      metaDia: row ? parseValue(row[COLS.META_DIARIA]) : 0,
      valorVendas: row ? parseValue(row[COLS.VALOR_PEDIDOS]) : 0,
      pedidosAtraso: row ? parseValue(row[COLS.PEDIDOS_ATRASADOS]) : 0,
      pedidosLiberar: row ? parseValue(row[COLS.PEDIDOS_A_LIBERAR]) : 0,
      pedidosExpedidos: row ? parseValue(row[COLS.PEDIDOS_EXPEDIDOS_MES]) : 0
    };

    document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
    document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
    document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
    document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
    document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
    document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
    document.getElementById('mesRef').textContent = filters.mesAno;

    const franquias = [
      { codigo:'cs',  nome:'FRA - Cacau Show' },
      { codigo:'kp',  nome:'FRA - Kopenhagen' },
      { codigo:'bc',  nome:'FRA - Brasil Cacau' },
      { codigo:'pb',  nome:'PLB - PolyBee' },
      { codigo:'id',  nome:'IND - Industries' },
      { codigo:'skd', nome:'SKD - Skullderia' }
    ];
    franquias.forEach(franq=>{
      const frows = allData.filter(r =>
        String(r[COLS.ANO]).trim()===filters.ano &&
        normalizarMes(r[COLS.MES])===filters.mes &&
        String(r[COLS.LINHA]).trim()===franq.nome
      );
      if (frows.length){
        const r=frows[0];
        const qtdOrc=parseValue(r[COLS.QTDE_ORCAMENTOS]);
        const valOrc=parseValue(r[COLS.VALOR_ORCAMENTOS]);
        const qtdPed=parseValue(r[COLS.QTDE_PEDIDOS]);
        const valPed=parseValue(r[COLS.VALOR_PEDIDOS]);
        const ticket=qtdPed>0 ? valPed/qtdPed : 0;
        const conv =qtdOrc>0 ? (qtdPed/qtdOrc)*100 : 0;
        document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(qtdOrc);
        document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(valOrc);
        document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
        document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(valPed);
        document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(ticket);
        document.getElementById(`${franq.codigo}-conversao`).textContent = formatPercent(conv);
        document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(conv,100)+'%';
      } else {
        document.getElementById(`${franq.codigo}-qtd-orc`).textContent = '0';
        document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(0);
        document.getElementById(`${franq.codigo}-qtd-ped`).textContent = '0';
        document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(0);
        document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(0);
        document.getElementById(`${franq.codigo}-conversao`).textContent = '0%';
        document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '0%';
      }
    });

    createHistoricoChart();
    createPagamentoChart();
    createRegiaoChart();
    createCompraChart();
  }catch(e){
    console.error('❌ Erro updateDashboard:', e);
    if (prev.length){
      allData = prev;        // fallback: mantém o snapshot, não zera
      createHistoricoChart();
      createPagamentoChart();
      createRegiaoChart();
      createCompraChart();
    }else{
      alert('Erro ao carregar dados. Veja o console (F12).');
    }
  }finally{
    const loading = document.getElementById('loading');
    if (loading) setTimeout(()=> loading.style.display='none', 300);
  }
}

// ==== Auto-refresh (2 min) sem zerar dataset ====
function startAutoRefresh(){
  console.log('🔄 Auto-refresh a cada 2 minutos…');
  setInterval(()=> updateDashboard({ forceReload:true }), 2*60*1000);
}

// ==== Init: usa data atual como padrão ====
function init(){
  const now=new Date();
  document.getElementById('filterAno').value = String(now.getFullYear());
  document.getElementById('filterMes').value = String(now.getMonth()+1).padStart(2,'0');

  ['filterAno','filterMes','filterLinha'].forEach(id=>{
    document.getElementById(id).addEventListener('change', ()=> updateDashboard());
  });

  setTimeout(async ()=>{
    try{ await fetchSheetData(); }catch(e){ console.warn('Primeira carga falhou, tentando novamente…', e); }
    updateDashboard();
    startAutoRefresh();
  }, 300);
}
document.addEventListener('DOMContentLoaded', init);
