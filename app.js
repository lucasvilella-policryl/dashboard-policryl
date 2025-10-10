// === [INJECTED] Utils & Metas (GVIZ) =========================================
const PT3_TO_MM = {
  'JAN':'01','FEV':'02','MAR':'03','ABR':'04','MAI':'05','JUN':'06',
  'JUL':'07','AGO':'08','SET':'09','OUT':'10','NOV':'11','DEZ':'12'
};

function normMesToken(x){
  if (!x) return null;
  const s = String(x).trim().toUpperCase();
  if (PT3_TO_MM[s]) return PT3_TO_MM[s];
  const n = parseInt(s,10);
  if (!isNaN(n) && n>=1 && n<=12) return String(n).padStart(2,'0');
  return null;
}

function toNumberBR(v){
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/[R$\s.]/g,'').replace(',', '.')) || 0;
}

let METAS_CACHE = [];

async function fetchMetas(){
  try {
    const sheetId = '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('BDADOS METAS')}&range=A:E`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Erro METAS: HTTP ' + res.status);
    const txt = await res.text();
    const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}')+1));
    const cols = json.table.cols.length;
    const values = (json.table.rows || []).map(r => {
      const arr = new Array(cols).fill('');
      (r.c || []).forEach((cell, i) => { arr[i] = cell ? (cell.v ?? '') : ''; });
      return arr;
    });
    METAS_CACHE = values.map(r => ({
      ano: String(r[0] ?? '').trim(),
      mes: normMesToken(r[1]),
      linha: String(r[2] ?? '').trim(),
      metaMes: toNumberBR(r[3]),
      metaDia: toNumberBR(r[4]),
    })).filter(m => m.ano && m.mes);
    console.log('✅ Metas carregadas:', METAS_CACHE.length);
    return METAS_CACHE;
  } catch (error) {
    console.error('❌ Erro ao carregar metas:', error);
    return [];
  }
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
// === [END INJECTED] ==========================================================

const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'PEDIDOS GERAL',
    RANGE: 'A:AE'
};

const COLS = {
    MES: 0, NUM_OMIE: 1, NUM_VIRTUAL: 2, LINHA: 3, MATRIZ_FRANQ: 4,
    ATENDIMENTO: 5, CNPJ_CPF: 6, ESTADO: 7, REGIAO: 8, FORMA_PGTO: 9,
    VALOR_PEDIDO: 10, ENXOVAL_REPOS: 11, DATA_INCLUSAO: 12, ENTRADA_PROD: 13,
    EMBALADO_EM: 14, ENTRADA_FAT: 15, NUM_NF: 16, FATURADO_EM: 17,
    ENTRADA_EXP: 18, EXPEDIDO_EM: 19, TRANSPORTADORA: 20, DEAD_LINE: 21,
    STATUS_PEDIDO: 22, DURACAO: 23, SITUACAO: 24, SITUACAO_CONCLUSAO: 25,
    MES_PEDIDO: 26, SEMANA_PEDIDO: 27, MES_DEADLINE: 28, SEMANA_DEADLINE: 29,
    MES_FATURAMENTO: 30
};

let allData = [];
let HEADERS = [];
let historicoChart, pagamentoChart, regiaoChart, compraChartInstance;

function getColIndexByTitle(name){
    if (!HEADERS || HEADERS.length === 0) return -1;
    const target = String(name).trim().toLowerCase();
    for (let i=0;i<HEADERS.length;i++){
        const h = (HEADERS[i]||'').toString().trim().toLowerCase();
        if (h === target) return i;
    }
    return -1;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}

function parseValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const cleaned = value.toString().replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value;
    const linha = document.getElementById('filterLinha').value;
    
    const mesNome = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ][parseInt(mes) - 1];
    
    return {
        ano,
        mes,
        mesAno: `${mesNome}/${ano}`,
        linha,
        mesNome
    };
}

async function fetchSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('Nenhum dado encontrado na planilha');
        }
        
        HEADERS = data.values[0] || [];
        allData = data.values.slice(1);
        console.log(`✅ ${allData.length} registros carregados`);
        
        return allData;
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        throw error;
    }
}

function filterData(data, filters) {
    return data.filter(row => {
        const mesRow = row[COLS.MES] || '';
        if (mesRow !== filters.mesAno) return false;
        
        if (filters.linha !== 'todas') {
            const linhaRow = row[COLS.LINHA] || '';
            if (!linhaRow.includes(filters.linha)) return false;
        }
        
        return true;
    });
}

function calculateKPIs(data, filters){
  const f = filterData(data, filters);
  const metas = resolveMetasFor(filters);

  const valorVendas = f.reduce((s,r) => s + (r[COLS.EXPEDIDO_EM] ? toNumberBR(r[COLS.VALOR_PEDIDO]) : 0), 0);
  const pedidosAtraso = f.filter(r => r[COLS.DEAD_LINE] && !r[COLS.EXPEDIDO_EM]).length;
  const pedidosLiberar = f.filter(r => ((r[COLS.STATUS_PEDIDO]||'')+'').match(/Aguardando|Liberar/i)).length;
  const pedidosExped = f.filter(r => r[COLS.EXPEDIDO_EM]).length;

  return {
    metaMes: metas.metaMes,
    metaDia: metas.metaDia,
    valorVendas, 
    pedidosAtraso, 
    pedidosLiberar, 
    pedidosExpedidos: pedidosExped
  };
}

function calculateFranquiaData(data, filters, franquiaNome) {
    const filtered = data.filter(row => {
        const mesRow = row[COLS.MES] || '';
        const linhaRow = row[COLS.LINHA] || '';
        return mesRow === filters.mesAno && linhaRow.includes(franquiaNome);
    });
    
    const orcamentos = filtered.filter(row => {
        const tipo = row[COLS.ENXOVAL_REPOS] || '';
        return tipo.includes('Enxoval') || !row[COLS.EXPEDIDO_EM];
    });
    
    const qtdOrc = orcamentos.length;
    const valOrc = orcamentos.reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO]), 0);
    
    const pedidos = filtered.filter(row => row[COLS.EXPEDIDO_EM]);
    const qtdPed = pedidos.length;
    const valPed = pedidos.reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO]), 0);
    
    const ticket = qtdPed > 0 ? valPed / qtdPed : 0;
    const conversao = qtdOrc > 0 ? (qtdPed / qtdOrc) * 100 : 0;
    
    return { qtdOrc, valOrc, qtdPed, valPed, ticket, conversao };
}

function calculateHistoricoAnual(data, ano) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return meses.map((mesNome, idx) => {
        const mesAno = mesNome + '/' + ano;
        const rows = data.filter(r => (r[COLS.MES] || '') === mesAno);
        
        const orcamentos = rows
            .filter(row => !row[COLS.EXPEDIDO_EM])
            .reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO]), 0);
        
        const vendas = rows
            .filter(row => row[COLS.EXPEDIDO_EM])
            .reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO]), 0);
        
        const mm = String(idx + 1).padStart(2, '0');
        const metasMes = METAS_CACHE.filter(m => m.ano === String(ano) && m.mes === mm);
        const meta = metasMes.reduce((sum, m) => sum + (m.metaMes || 0), 0);
        
        return { mes: mesNome, orcamentos, vendas, meta };
    });
}

function calculatePagamentos(data, filters) {
    const filtered = filterData(data, filters);
    const pagamentos = {};
    
    filtered.forEach(row => {
        const forma = row[COLS.FORMA_PGTO] || 'Não informado';
        pagamentos[forma] = (pagamentos[forma] || 0) + 1;
    });
    
    const total = Object.values(pagamentos).reduce((a, b) => a + b, 0);
    
    return Object.keys(pagamentos).map(forma => ({
        forma,
        valor: total > 0 ? (pagamentos[forma] / total) * 100 : 0
    }));
}

function calculateRegioes(data, filters) {
    const filtered = filterData(data, filters);
    const regioes = {};
    
    filtered.forEach(row => {
        const regiao = row[COLS.REGIAO] || 'Não informado';
        regioes[regiao] = (regioes[regiao] || 0) + 1;
    });
    
    return Object.keys(regioes).map(regiao => ({
        regiao,
        pedidos: regioes[regiao]
    }));
}

function updateKPIs(kpis, filters) {
    document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
    document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
    document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
    document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
    document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
    document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
    document.getElementById('mesRef').textContent = filters.mesAno;
}

function updateFranquia(codigo, franquiaNome, data, filters) {
    const franquiaData = calculateFranquiaData(data, filters, franquiaNome);
    
    document.getElementById(`${codigo}-qtd-orc`).textContent = formatNumber(franquiaData.qtdOrc);
    document.getElementById(`${codigo}-val-orc`).textContent = formatCurrency(franquiaData.valOrc);
    document.getElementById(`${codigo}-qtd-ped`).textContent = formatNumber(franquiaData.qtdPed);
    document.getElementById(`${codigo}-val-ped`).textContent = formatCurrency(franquiaData.valPed);
    document.getElementById(`${codigo}-ticket`).textContent = formatCurrency(franquiaData.ticket);
    document.getElementById(`${codigo}-conversao`).textContent = franquiaData.conversao.toFixed(1) + '%';
    document.getElementById(`${codigo}-conversao-bar`).style.width = Math.min(franquiaData.conversao, 100) + '%';
}

function updateAllFranquias(data, filters) {
    updateFranquia('cs', 'Cacau Show', data, filters);
    updateFranquia('kp', 'Kopenhagen', data, filters);
    updateFranquia('bc', 'Brasil Cacau', data, filters);
    updateFranquia('pb', 'PolyBee', data, filters);
    updateFranquia('id', 'Industries', data, filters);
    updateFranquia('skd', 'Skullderia', data, filters);
}

function createHistoricoChart(data, ano) {
    const ctx = document.getElementById('historicoChart').getContext('2d');
    const historicoData = calculateHistoricoAnual(data, ano);
    
    if (historicoChart) historicoChart.destroy();

    historicoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicoData.map(d => d.mes),
            datasets: [
                {
                    label: 'Orçamentos',
                    data: historicoData.map(d => d.orcamentos),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Vendas',
                    data: historicoData.map(d => d.vendas),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Meta',
                    data: historicoData.map(d => d.meta),
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createPagamentoChart(data, filters) {
    const ctx = document.getElementById('pagamentoChart').getContext('2d');
    const pagamentos = calculatePagamentos(data, filters);
    
    if (pagamentoChart) pagamentoChart.destroy();

    pagamentoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: pagamentos.map(p => p.forma),
            datasets: [{
                data: pagamentos.map(p => p.valor),
                backgroundColor: ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
                borderColor: '#1e293b',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function createRegiaoChart(data, filters) {
    const ctx = document.getElementById('regiaoChart').getContext('2d');
    const regioes = calculateRegioes(data, filters);
    
    if (regiaoChart) regiaoChart.destroy();

    regiaoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regioes.map(r => r.regiao),
            datasets: [{
                label: 'Pedidos',
                data: regioes.map(r => r.pedidos),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createCompraChart(data, filters){
    const colCompra = getColIndexByTitle('Compra');
    const canvas = document.getElementById('compraChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const f = filterData(data, filters);

    let counts = { 'Primeira compra': 0, 'Recompra': 0, 'Outros': 0 };

    if (colCompra >= 0){
        f.forEach(r => {
            const v = (r[colCompra] || '').toString().toLowerCase();
            if (v.includes('primeira')) counts['Primeira compra']++;
            else if (v.includes('recompra')) counts['Recompra']++;
            else counts['Outros']++;
        });
    }

    if (compraChartInstance) compraChartInstance.destroy();

    compraChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#22c55e','#3b82f6','#8b5cf6'],
                borderColor: '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.parsed} pedidos`
                    }
                }
            }
        }
    });
}

async function updateDashboard() {
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';

    try {
        if (allData.length === 0) {
            await fetchSheetData();
            if (METAS_CACHE.length === 0) await fetchMetas();
        }
        
        const filters = getCurrentFilters();
        console.log('📊 Filtros aplicados:', filters);
        
        const kpis = calculateKPIs(allData, filters);
        updateKPIs(kpis, filters);
        
        updateAllFranquias(allData, filters);
        
        createHistoricoChart(allData, filters.ano);
        createPagamentoChart(allData, filters);
        createRegiaoChart(allData, filters);
        createCompraChart(allData, filters);

        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
        
        console.log('✅ Dashboard atualizado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
        loading.style.display = 'none';
    }
}

function setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    document.getElementById('filterAno').value = year;
    document.getElementById('filterMes').value = month;
}

function startAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Auto-refresh: recarregando dados...');
        allData = [];
        updateDashboard();
    }, 300000);
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Dashboard Policryl...');
    setCurrentDate();
    updateDashboard();
    startAutoRefresh();
});
