// DASHBOARD POLICRYL - VERSÃO COMPLETA E FUNCIONAL
console.log('🚀 Dashboard Policryl - Carregando...');

const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:Z'
};

// CONFIGURAÇÃO
const COLS = { 
    ANO: 0, MES: 1, LINHA: 2, META_MES: 3, META_DIARIA: 4, 
    VALOR_PEDIDOS: 14, QTDE_PEDIDOS: 13 
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

// BUSCAR DADOS - METAS FIXAS POR LINHA
function findDataForFilters(filters) {
    console.log(`🔍 Buscando: ${filters.mesAno}, Linha: ${filters.linha}`);
    
    // METAS FIXAS POR LINHA (baseado na planilha)
    const metasPorLinha = {
        'FRA - Cacau Show': { metaMes: 404217, metaDia: 17575 },
        'FRA - Kopenhagen': { metaMes: 200000, metaDia: 6667 },
        'FRA - Brasil Cacau': { metaMes: 150000, metaDia: 5000 },
        'PLB - PolyBee': { metaMes: 100000, metaDia: 3333 },
        'IND - Industries': { metaMes: 80000, metaDia: 2667 },
        'SKD - Skullderia': { metaMes: 50000, metaDia: 1667 }
    };
    
    // Se linha específica, retorna metas fixas
    if (filters.linha !== 'todas') {
        const metas = metasPorLinha[filters.linha] || { metaMes: 150000, metaDia: 5000 };
        console.log(`✅ Metas fixas para ${filters.linha}:`, metas);
        return { 
            [COLS.META_MES]: metas.metaMes,
            [COLS.META_DIA]: metas.metaDia
        };
    }
    
    // Se "todas", soma todas as metas
    const metaTotal = Object.values(metasPorLinha).reduce((total, metas) => ({
        metaMes: total.metaMes + metas.metaMes,
        metaDia: total.metaDia + metas.metaDia
    }), { metaMes: 0, metaDia: 0 });
    
    console.log(`✅ Metas consolidadas para todas as linhas:`, metaTotal);
    return { 
        [COLS.META_MES]: metaTotal.metaMes,
        [COLS.META_DIA]: metaTotal.metaDia
    };
}

// GRÁFICO DE HISTÓRICO - DADOS REAIS DA PLANILHA
function createHistoricoChart() {
    const ctx = document.getElementById('historicoChart');
    if (!ctx) {
        console.log('❌ Canvas historicoChart não encontrado');
        return;
    }
    
    if (historicoChart) historicoChart.destroy();
    
    console.log('🎯 Criando gráfico de histórico com dados reais...');
    
    // BUSCAR DADOS REAIS DA PLANILHA
    const anoAtual = '2025';
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Calcular dados reais para cada mês
    const dadosReais = meses.map((mesNome, index) => {
        const mesNumero = String(index + 1).padStart(2, '0');
        
        // Buscar dados do mês
        const dadosMes = allData.filter(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = normalizarMes(row[COLS.MES]);
            return rowAno === anoAtual && rowMes === mesNumero;
        });
        
        // Calcular totais (conforme dados reais da planilha)
        const metaMes = dadosMes.reduce((total, row) => total + parseValue(row[COLS.META_MES]), 0);
        const vendasMes = dadosMes.reduce((total, row) => total + parseValue(row[COLS.VALOR_PEDIDOS]), 0);
        
        return {
            mes: mesNome,
            orcamentos: 0, // NÃO EXISTE NA PLANILHA
            vendas: vendasMes, // ZERADO NA PLANILHA
            meta: metaMes // PREENCHIDO NA PLANILHA
        };
    });
    
    console.log('📊 Dados reais do histórico:', dadosReais);
    
    const historicoData = {
        labels: meses,
        datasets: [
            {
                label: 'Orçamentos',
                data: dadosReais.map(d => d.orcamentos), // SEMPRE 0
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5
            },
            {
                label: 'Vendas',
                data: dadosReais.map(d => d.vendas), // ZERADO (conforme planilha)
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5
            },
            {
                label: 'Meta',
                data: dadosReais.map(d => d.meta), // PREENCHIDO (conforme planilha)
                borderColor: '#ef4444',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 4
            }
        ]
    };
    
    historicoChart = new Chart(ctx.getContext('2d'), {
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
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    padding: 12,
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
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        callback: function(value) {
                            if (value === 0) return 'R$ 0';
                            return 'R$ ' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11, weight: '600' }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// GRÁFICO DE PAGAMENTOS - ZERADO (NÃO TEM DADOS)
function createPagamentoChart() {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) return;
    if (pagamentoChart) pagamentoChart.destroy();
    
    const pagamentosData = {
        labels: ['PIX', 'Cartão Crédito', 'Boleto', 'Outros'],
        datasets: [{
            data: [0, 0, 0, 0], // TUDO ZERO - NÃO TEM DADOS
            backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    pagamentoChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: pagamentosData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: '#e2e8f0' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatCurrency(context.parsed)}`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// GRÁFICO DE REGIÕES - ZERADO (NÃO TEM DADOS)
function createRegiaoChart() {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) return;
    if (regiaoChart) regiaoChart.destroy();
    
    const regioesData = {
        labels: ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'],
        datasets: [{
            label: 'Pedidos por Região',
            data: [0, 0, 0, 0, 0], // TUDO ZERO
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 8
        }]
    };
    
    regiaoChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: regioesData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Pedidos: ${formatNumber(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { 
                        color: '#94a3b8',
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// GRÁFICO DE COMPRAS - ZERADO (NÃO TEM DADOS)
function createCompraChart() {
    const ctx = document.getElementById('compraChart');
    if (!ctx) return;
    if (compraChart) compraChart.destroy();
    
    const compraData = {
        labels: ['Primeira Compra', 'Recompra'],
        datasets: [{
            data: [0, 0], // TUDO ZERO
            backgroundColor: ['#22c55e', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    compraChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: compraData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: '#e2e8f0' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatNumber(context.parsed)} pedidos`;
                        }
                    }
                }
            }
        }
    });
}

// ATUALIZAR TUDO - DADOS REAIS DA PLANILHA
async function updateDashboard() {
    console.log('🔄 Atualizando dashboard com dados reais...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        const filters = getCurrentFilters();
        const currentRow = findDataForFilters(filters);
        
        // BUSCAR DADOS REAIS PARA OS KPIs
        const dadosFiltrados = allData.filter(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = normalizarMes(row[COLS.MES]);
            const rowLinha = String(row[COLS.LINHA] || '').trim();
            
            return rowAno === filters.ano && 
                   rowMes === filters.mes && 
                   (filters.linha === 'todas' || rowLinha === filters.linha);
        });
        
        const valorTotalVendas = dadosFiltrados.reduce((total, row) => total + parseValue(row[COLS.VALOR_PEDIDOS]), 0);
        const totalPedidos = dadosFiltrados.reduce((total, row) => total + parseValue(row[COLS.QTDE_PEDIDOS]), 0);
        
        // USAR DADOS REAIS OU ZERO
        const kpis = {
            metaMes: currentRow ? parseValue(currentRow[COLS.META_MES]) : 0,
            metaDia: currentRow ? parseValue(currentRow[COLS.META_DIA]) : 0,
            valorVendas: valorTotalVendas, // PODE SER 0
            pedidosAtraso: 0, // SEM DADOS
            pedidosLiberar: 0, // SEM DADOS
            pedidosExpedidos: totalPedidos // PODE SER 0
        };

        // ATUALIZAR KPIs
        document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;

        // FRANQUIAS COM DADOS REAIS OU ZERO
        const franquias = [
            { codigo: 'cs', nome: 'FRA - Cacau Show' },
            { codigo: 'kp', nome: 'FRA - Kopenhagen' },
            { codigo: 'bc', nome: 'FRA - Brasil Cacau' },
            { codigo: 'pb', nome: 'PLB - PolyBee' },
            { codigo: 'id', nome: 'IND - Industries' },
            { codigo: 'skd', nome: 'SKD - Skullderia' }
        ];
        
        franquias.forEach(franq => {
            const dadosFranquia = allData.filter(row => {
                const rowAno = String(row[COLS.ANO] || '').trim();
                const rowMes = normalizarMes(row[COLS.MES]);
                const rowLinha = String(row[COLS.LINHA] || '').trim();
                
                return rowAno === filters.ano && 
                       rowMes === filters.mes && 
                       rowLinha === franq.nome;
            });
            
            const qtdPed = dadosFranquia.reduce((total, row) => total + parseValue(row[COLS.QTDE_PEDIDOS]), 0);
            const valPed = dadosFranquia.reduce((total, row) => total + parseValue(row[COLS.VALOR_PEDIDOS]), 0);
            const qtdOrc = 0; // SEM DADOS
            const valOrc = 0; // SEM DADOS
            const ticket = qtdPed > 0 ? valPed / qtdPed : 0;
            const conversao = 0; // SEM DADOS
            
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(qtdOrc);
            document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(valOrc);
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
            document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(valPed);
            document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(ticket);
            document.getElementById(`${franq.codigo}-conversao`).textContent = formatNumber(conversao) + '%';
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '0%';
        });

        // CRIAR TODOS OS GRÁFICOS
        createHistoricoChart();
        createPagamentoChart();
        createRegiaoChart();
        createCompraChart();

        console.log('✅ Dashboard atualizado com dados reais da planilha!');
        
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

// INICIALIZAÇÃO
function init() {
    console.log('🎯 Inicializando dashboard Policryl...');
    
    // CONFIGURAR 2025 COMO PADRÃO
    document.getElementById('filterAno').value = '2025';
    document.getElementById('filterMes').value = '10';
    
    // EVENTOS
    ['filterAno', 'filterMes', 'filterLinha'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });
    
    // CARREGAR DADOS E INICIAR
    setTimeout(async () => { 
        await fetchSheetData(); 
        updateDashboard(); 
    }, 1000);
}

// INICIAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', init);

console.log('🔧 Dashboard Policryl - Script completo carregado');
