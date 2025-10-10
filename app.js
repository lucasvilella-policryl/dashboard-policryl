// DASHBOARD POLICRYL - VERSÃO COMPLETA COM AUTO-REFRESH
console.log('🚀 Dashboard Policryl - Carregando todos os dados...');

const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:AR'
};

// MAPEAMENTO COMPLETO DAS COLUNAS (baseado nos cabeçalhos)
const COLS = {
    // Colunas básicas
    ANO: 0,
    MES: 1,
    LINHA: 2,
    
    // Metas
    META_MES: 3,
    META_DIARIA: 4,
    PORCENTAGEM_META: 5,
    
    // Orçamentos
    QTDE_ORCAMENTOS: 6,
    VALOR_ORCAMENTOS: 7,
    TICKET_MEDIO_ORCAMENTOS: 8,
    QTDE_ITENS_ORCAMENTOS: 9,
    
    // Simples Remessa
    QTDE_SIMPLES_REMESSA: 10,
    VALOR_SIMPLES_REMESSA: 11,
    QTDE_ITENS_SIMPLES_REMESSA: 12,
    
    // Pedidos
    QTDE_PEDIDOS: 13,
    VALOR_PEDIDOS: 14,
    TICKET_MEDIO_PEDIDOS: 15,
    QTDE_ITENS_PEDIDOS: 16,
    TAXA_CONVERSAO_PEDIDOS: 17,
    TAXA_CONVERSAO_VALORES: 18,
    
    // Formas de Pagamento
    PEDIDOS_PIX: 19,
    VALORES_PIX: 20,
    PEDIDOS_CARTAO_CREDITO: 21,
    VALORES_CARTAO_CREDITO: 22,
    PEDIDOS_BOLETO: 23,
    VALORES_BOLETO: 24,
    
    // Status dos Pedidos
    PEDIDOS_ATRASADOS: 25,
    PEDIDOS_A_LIBERAR: 26,
    PEDIDOS_FATURADOS_MES: 27,
    PEDIDOS_EXPEDIDOS_MES: 28,
    PEDIDOS_ENVIO_ATRASO: 29,
    PEDIDOS_ENVIO_PRAZO: 30,
    
    // Comportamento de Compra
    PRIMEIRA_COMPRA: 31,
    RECOMPRA: 32,
    TEMPO_MEDIO_TOTAL: 33,
    
    // Regiões
    REGIAO_CENTRO_OESTE: 34,
    REGIAO_NORDESTE: 35,
    REGIAO_NORTE: 36,
    REGIAO_SUDESTE: 37,
    REGIAO_SUL: 38,
    
    // Tipo de Cliente
    PEDIDOS_FRANQUIAS: 39,
    PEDIDOS_MATRIZ: 40
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

function formatPercent(v) {
    return (v || 0).toFixed(1) + '%';
}

function parseValue(v) { 
    if (!v || v === '') return 0;
    if (typeof v === 'number') return v;
    
    // Para valores como "R$ 199.800,00"
    if (typeof v === 'string' && v.includes('R$')) {
        const cleaned = v.replace(/[R$\s.]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }
    
    // Para números simples
    const cleaned = String(v).replace(/[^\d,.-]/g, '').replace(',', '.');
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
            
            // DEBUG: Mostrar estrutura dos dados
            console.log('🔍 Estrutura dos primeiros registros:');
            for (let i = 0; i < Math.min(3, allData.length); i++) {
                console.log(`Registro ${i + 1}:`, {
                    ano: allData[i][COLS.ANO],
                    mes: allData[i][COLS.MES],
                    linha: allData[i][COLS.LINHA],
                    metaMes: allData[i][COLS.META_MES],
                    valorOrcamentos: allData[i][COLS.VALOR_ORCAMENTOS],
                    valorPedidos: allData[i][COLS.VALOR_PEDIDOS],
                    colunasPreenchidas: allData[i].filter(cell => cell && cell !== '').length
                });
            }
            
            return true;
        }
    } catch (error) {
        console.log('⚠️ Erro ao carregar dados:', error);
    }
    return false;
}

// BUSCAR DADOS PARA OS FILTROS
function findDataForFilters(filters) {
    const dadosFiltrados = allData.filter(row => {
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = normalizarMes(row[COLS.MES]);
        const rowLinha = String(row[COLS.LINHA] || '').trim();
        
        return rowAno === filters.ano && 
               rowMes === filters.mes && 
               (filters.linha === 'todas' || rowLinha === filters.linha);
    });

    console.log(`🔍 Encontrados ${dadosFiltrados.length} registros para ${filters.mesAno}, ${filters.linha}`);

    if (dadosFiltrados.length === 0) return null;
    if (dadosFiltrados.length === 1) return dadosFiltrados[0];

    // Consolidar múltiplos registros
    const consolidado = new Array(Object.keys(COLS).length).fill(0);
    
    dadosFiltrados.forEach(row => {
        Object.values(COLS).forEach(colIndex => {
            if (row[colIndex] !== undefined && row[colIndex] !== '') {
                consolidado[colIndex] += parseValue(row[colIndex]);
            }
        });
    });
    
    return consolidado;
}

// GRÁFICO DE HISTÓRICO - COM DADOS REAIS DE ORÇAMENTOS E VENDAS
function createHistoricoChart() {
    const ctx = document.getElementById('historicoChart');
    if (!ctx) {
        console.log('❌ Canvas historicoChart não encontrado');
        return;
    }
    
    if (historicoChart) historicoChart.destroy();
    
    console.log('🎯 Criando gráfico de histórico com dados reais...');
    
    // BUSCAR DADOS REAIS PARA O HISTÓRICO
    const anoAtual = '2025';
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const dadosReais = meses.map((mesNome, index) => {
        const mesNumero = String(index + 1).padStart(2, '0');
        
        // Buscar dados do mês
        const dadosMes = allData.filter(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = normalizarMes(row[COLS.MES]);
            return rowAno === anoAtual && rowMes === mesNumero;
        });
        
        // Calcular totais com dados reais
        const metaMes = dadosMes.reduce((total, row) => total + parseValue(row[COLS.META_MES]), 0);
        const valorOrcamentos = dadosMes.reduce((total, row) => total + parseValue(row[COLS.VALOR_ORCAMENTOS]), 0);
        const valorVendas = dadosMes.reduce((total, row) => total + parseValue(row[COLS.VALOR_PEDIDOS]), 0);
        
        console.log(`📊 ${mesNome}/${anoAtual}: Orçamentos ${formatCurrency(valorOrcamentos)}, Vendas ${formatCurrency(valorVendas)}, Meta ${formatCurrency(metaMes)}`);
        
        return {
            mes: mesNome,
            orcamentos: valorOrcamentos, // DADOS REAIS DE ORÇAMENTOS
            vendas: valorVendas, // DADOS REAIS DE VENDAS
            meta: metaMes // DADOS REAIS DE META
        };
    });
    
    console.log('📈 Dados reais para histórico:', dadosReais);
    
    const historicoData = {
        labels: meses,
        datasets: [
            {
                label: 'Orçamentos',
                data: dadosReais.map(d => d.orcamentos), // DADOS REAIS
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5
            },
            {
                label: 'Vendas',
                data: dadosReais.map(d => d.vendas), // DADOS REAIS
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5
            },
            {
                label: 'Meta',
                data: dadosReais.map(d => d.meta), // DADOS REAIS
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

// GRÁFICO DE PAGAMENTOS - COM DADOS REAIS
function createPagamentoChart() {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) return;
    if (pagamentoChart) pagamentoChart.destroy();
    
    const filters = getCurrentFilters();
    const currentRow = findDataForFilters(filters);
    
    // USAR DADOS REAIS DE PAGAMENTOS
    const pagamentosData = {
        labels: ['PIX', 'Cartão Crédito', 'Boleto'],
        datasets: [{
            data: [
                currentRow ? parseValue(currentRow[COLS.VALORES_PIX]) : 0,
                currentRow ? parseValue(currentRow[COLS.VALORES_CARTAO_CREDITO]) : 0,
                currentRow ? parseValue(currentRow[COLS.VALORES_BOLETO]) : 0
            ],
            backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6'],
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

// GRÁFICO DE REGIÕES - COM DADOS REAIS
function createRegiaoChart() {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) return;
    if (regiaoChart) regiaoChart.destroy();
    
    const filters = getCurrentFilters();
    const currentRow = findDataForFilters(filters);
    
    const regioesData = {
        labels: ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul'],
        datasets: [{
            label: 'Pedidos por Região',
            data: [
                currentRow ? parseValue(currentRow[COLS.REGIAO_CENTRO_OESTE]) : 0,
                currentRow ? parseValue(currentRow[COLS.REGIAO_NORDESTE]) : 0,
                currentRow ? parseValue(currentRow[COLS.REGIAO_NORTE]) : 0,
                currentRow ? parseValue(currentRow[COLS.REGIAO_SUDESTE]) : 0,
                currentRow ? parseValue(currentRow[COLS.REGIAO_SUL]) : 0
            ],
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

// GRÁFICO DE COMPRAS - COM DADOS REAIS
function createCompraChart() {
    const ctx = document.getElementById('compraChart');
    if (!ctx) return;
    if (compraChart) compraChart.destroy();
    
    const filters = getCurrentFilters();
    const currentRow = findDataForFilters(filters);
    
    const compraData = {
        labels: ['Primeira Compra', 'Recompra'],
        datasets: [{
            data: [
                currentRow ? parseValue(currentRow[COLS.PRIMEIRA_COMPRA]) : 0,
                currentRow ? parseValue(currentRow[COLS.RECOMPRA]) : 0
            ],
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

// ATUALIZAR TUDO - COM TODOS OS DADOS REAIS
async function updateDashboard() {
    console.log('🔄 Atualizando dashboard com todos os dados reais...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        const filters = getCurrentFilters();
        const currentRow = findDataForFilters(filters);
        
        // USAR DADOS REAIS PARA TODOS OS KPIs
        const kpis = {
            metaMes: currentRow ? parseValue(currentRow[COLS.META_MES]) : 0,
            metaDia: currentRow ? parseValue(currentRow[COLS.META_DIARIA]) : 0,
            valorVendas: currentRow ? parseValue(currentRow[COLS.VALOR_PEDIDOS]) : 0,
            pedidosAtraso: currentRow ? parseValue(currentRow[COLS.PEDIDOS_ATRASADOS]) : 0,
            pedidosLiberar: currentRow ? parseValue(currentRow[COLS.PEDIDOS_A_LIBERAR]) : 0,
            pedidosExpedidos: currentRow ? parseValue(currentRow[COLS.PEDIDOS_EXPEDIDOS_MES]) : 0
        };

        // ATUALIZAR KPIs
        document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;

        // FRANQUIAS COM DADOS REAIS
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
            
            if (dadosFranquia.length > 0) {
                const franqData = dadosFranquia[0];
                const qtdOrc = parseValue(franqData[COLS.QTDE_ORCAMENTOS]);
                const valOrc = parseValue(franqData[COLS.VALOR_ORCAMENTOS]);
                const qtdPed = parseValue(franqData[COLS.QTDE_PEDIDOS]);
                const valPed = parseValue(franqData[COLS.VALOR_PEDIDOS]);
                const ticket = qtdPed > 0 ? valPed / qtdPed : 0;
                const conversao = qtdOrc > 0 ? (qtdPed / qtdOrc) * 100 : 0;
                
                document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(qtdOrc);
                document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(valOrc);
                document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
                document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(valPed);
                document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(ticket);
                document.getElementById(`${franq.codigo}-conversao`).textContent = formatPercent(conversao);
                document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(conversao, 100) + '%';
            } else {
                // Se não encontrou dados, zerar
                document.getElementById(`${franq.codigo}-qtd-orc`).textContent = '0';
                document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(0);
                document.getElementById(`${franq.codigo}-qtd-ped`).textContent = '0';
                document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(0);
                document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(0);
                document.getElementById(`${franq.codigo}-conversao`).textContent = '0%';
                document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '0%';
            }
        });

        // CRIAR TODOS OS GRÁFICOS COM DADOS REAIS
        createHistoricoChart();
        createPagamentoChart();
        createRegiaoChart();
        createCompraChart();

        console.log('✅ Dashboard atualizado com TODOS os dados reais!');
        
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

// ==================== AUTO-REFRESH ====================

// AUTO-REFRESH A CADA 2 MINUTOS
function startAutoRefresh() {
    console.log('🔄 Iniciando auto-refresh (2 minutos)...');
    
    setInterval(() => {
        console.log('⏰ Atualização automática - Recarregando dados...');
        allData = []; // Limpar cache para forçar recarregamento
        updateDashboard();
    }, 2 * 60 * 1000); // 2 minutos em milissegundos
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
        
        // 🆕 INICIAR AUTO-REFRESH APÓS PRIMEIRA CARGA
        startAutoRefresh();
    }, 1000);
}

// INICIAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', init);

console.log('🔧 Dashboard Policryl - Script completo carregado');
