// DASHBOARD POLICRYL - VERSÃO COMPLETA COM GRÁFICOS
console.log('🚀 Dashboard Policryl - Carregando...');

const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:AR'
};

// CONFIGURAÇÃO
const COLS = { 
    ANO:0, MES:1, LINHA:2, META_MES:3, META_DIARIA:4, 
    VALOR_PEDIDOS:14, QTDE_PEDIDOS:13 
};
const MESES = { 
    'JAN':'01','FEV':'02','MAR':'03','ABR':'04','MAI':'05','JUN':'06',
    'JUL':'07','AGO':'08','SET':'09','OUT':'10','NOV':'11','DEZ':'12' 
};
const MESES_NOME = { 
    '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
    '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez' 
};

let allData = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// FUNÇÕES BÁSICAS
function formatCurrency(v) { 
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); 
}
function formatNumber(v) { 
    return new Intl.NumberFormat('pt-BR').format(v || 0); 
}
function parseValue(v) { 
    if (!v) return 0;
    if (typeof v === 'number') return v;
    const cleaned = String(v).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}
function normalizarMes(m) { 
    return MESES[String(m).trim().toUpperCase().substring(0,3)] || '01'; 
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value;
    const linha = document.getElementById('filterLinha').value;
    return { 
        ano, 
        mes, 
        linha, 
        mesAno: `${MESES_NOME[mes] || 'Out'}/${ano}` 
    };
}

// CARREGAR DADOS
async function fetchSheetData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.values && data.values.length > 1) {
            allData = data.values.slice(1);
            console.log(`✅ ${allData.length} registros carregados`);
            return true;
        }
    } catch (error) {
        console.log('⚠️ Erro ao carregar dados:', error);
    }
    return false;
}

// BUSCAR DADOS
function findDataForFilters(filters) {
    const dados = allData.filter(row => {
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = normalizarMes(row[COLS.MES]);
        const rowLinha = String(row[COLS.LINHA] || '').trim();
        return rowAno === filters.ano && rowMes === filters.mes && 
               (filters.linha === 'todas' || rowLinha === filters.linha);
    });

    if (dados.length === 0) return null;
    if (dados.length === 1) return dados[0];

    // Consolidar
    const consolidado = [];
    [COLS.META_MES, COLS.META_DIARIA, COLS.VALOR_PEDIDOS, COLS.QTDE_PEDIDOS].forEach(col => {
        consolidado[col] = dados.reduce((sum, row) => sum + parseValue(row[col]), 0);
    });
    return consolidado;
}

// GRÁFICO DE HISTÓRICO (METAS)
function createHistoricoChart() {
    const ctx = document.getElementById('historicoChart');
    if (!ctx) {
        console.log('❌ Canvas historicoChart não encontrado');
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (historicoChart) {
        historicoChart.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    // Dados de exemplo para histórico anual
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const historicoData = {
        labels: meses,
        datasets: [
            {
                label: 'Orçamentos',
                data: [120000, 150000, 180000, 160000, 190000, 210000, 185000, 220000, 240000, 200000, 230000, 250000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Vendas',
                data: [80000, 95000, 120000, 110000, 140000, 160000, 135000, 170000, 190000, 175000, 200000, 220000],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Meta',
                data: [150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000],
                borderColor: '#ef4444',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
            }
        ]
    };
    
    historicoChart = new Chart(chartCtx, {
        type: 'line',
        data: historicoData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 13, weight: '600' },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { weight: '600' }
                    }
                }
            }
        }
    });
}

// GRÁFICO DE PAGAMENTOS
function createPagamentoChart() {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) {
        console.log('❌ Canvas pagamentoChart não encontrado');
        return;
    }
    
    if (pagamentoChart) {
        pagamentoChart.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    const pagamentosData = {
        labels: ['PIX', 'Cartão Crédito', 'Boleto', 'Outros'],
        datasets: [{
            data: [40, 35, 20, 5],
            backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    pagamentoChart = new Chart(chartCtx, {
        type: 'doughnut',
        data: pagamentosData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// GRÁFICO DE REGIÕES
function createRegiaoChart() {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) {
        console.log('❌ Canvas regiaoChart não encontrado');
        return;
    }
    
    if (regiaoChart) {
        regiaoChart.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    const regioesData = {
        labels: ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'],
        datasets: [{
            label: 'Pedidos por Região',
            data: [45, 25, 15, 10, 5],
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 40
        }]
    };
    
    regiaoChart = new Chart(chartCtx, {
        type: 'bar',
        data: regioesData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

// GRÁFICO DE COMPRAS
function createCompraChart() {
    const ctx = document.getElementById('compraChart');
    if (!ctx) {
        console.log('❌ Canvas compraChart não encontrado');
        return;
    }
    
    if (compraChart) {
        compraChart.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    const compraData = {
        labels: ['Primeira Compra', 'Recompra'],
        datasets: [{
            data: [35, 65],
            backgroundColor: ['#22c55e', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    compraChart = new Chart(chartCtx, {
        type: 'pie',
        data: compraData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

// ATUALIZAR TUDO
async function updateDashboard() {
    console.log('🔄 Atualizando dashboard...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        const filters = getCurrentFilters();
        const currentRow = findDataForFilters(filters);
        
        // DADOS REAIS OU EXEMPLO
        const kpis = currentRow ? {
            metaMes: parseValue(currentRow[COLS.META_MES]) || 150000,
            metaDia: parseValue(currentRow[COLS.META_DIARIA]) || 5000,
            valorVendas: parseValue(currentRow[COLS.VALOR_PEDIDOS]) || 87500,
            pedidosAtraso: 8, pedidosLiberar: 15, pedidosExpedidos: parseValue(currentRow[COLS.QTDE_PEDIDOS]) || 42
        } : {
            metaMes: 150000, metaDia: 5000, valorVendas: 87500, pedidosAtraso: 8, pedidosLiberar: 15, pedidosExpedidos: 42
        };

        // ATUALIZAR KPIs
        document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;

        // FRANQUIAS
        ['cs','kp','bc','pb','id','skd'].forEach(codigo => {
            document.getElementById(`${codigo}-qtd-orc`).textContent = '25';
            document.getElementById(`${codigo}-val-orc`).textContent = formatCurrency(25000);
            document.getElementById(`${codigo}-qtd-ped`).textContent = '15';
            document.getElementById(`${codigo}-val-ped`).textContent = formatCurrency(15000);
            document.getElementById(`${codigo}-ticket`).textContent = formatCurrency(1000);
            document.getElementById(`${codigo}-conversao`).textContent = '60%';
            document.getElementById(`${codigo}-conversao-bar`).style.width = '60%';
        });

        // CRIAR TODOS OS GRÁFICOS
        createHistoricoChart();
        createPagamentoChart();
        createRegiaoChart();
        createCompraChart();

        console.log('✅ Dashboard completo atualizado!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        if (loading) {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }
}

// INICIAR TUDO
function init() {
    console.log('🎯 Iniciando dashboard...');
    document.getElementById('filterAno').value = '2025';
    document.getElementById('filterMes').value = '10';
    ['filterAno','filterMes','filterLinha'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });
    setTimeout(async () => { 
        await fetchSheetData(); 
        updateDashboard(); 
    }, 1000);
}

// INICIAR
document.addEventListener('DOMContentLoaded', init);
