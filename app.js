// DASHBOARD POLICRYL - LENDO DA ABA BDADOS DASH
console.log('🚀 Dashboard Policryl - Iniciando...');

const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:AO'
};

// Mapeamento correto das colunas da sua planilha
const COLS = {
    ANO: 0,                          // A
    MES: 1,                          // B
    LINHA: 2,                        // C
    META_MES: 3,                     // D
    META_DIARIA: 4,                  // E
    PORCENTAGEM_META: 5,             // F
    QTDE_ORCAMENTOS: 6,              // G
    VALOR_ORCAMENTOS: 7,             // H
    TICKET_MEDIO_ORC: 8,             // I
    QTDE_ITENS_ORC: 9,               // J
    QTDE_SIMPLES_REMESSA: 10,        // K
    VALOR_SIMPLES_REMESSA: 11,       // L
    QTDE_ITENS_SIMPLES: 12,          // M
    QTDE_PEDIDOS: 13,                // N
    VALOR_PEDIDOS: 14,               // O
    TICKET_MEDIO_PED: 15,            // P
    QTDE_ITENS_PEDIDOS: 16,          // Q
    TAXA_CONVERSAO_PEDIDOS: 17,      // R
    TAXA_CONVERSAO_VALORES: 18,      // S
    PEDIDOS_PIX: 19,                 // T
    VALORES_PIX: 20,                 // U
    PEDIDOS_CARTAO: 21,              // V
    VALORES_CARTAO: 22,              // W
    PEDIDOS_BOLETO: 23,              // X
    VALORES_BOLETO: 24,              // Y
    PEDIDOS_ATRASADOS: 25,           // Z
    PEDIDOS_A_LIBERAR: 26,           // AA
    PEDIDOS_FATURADOS_MES: 27,       // AB
    PEDIDOS_EXPEDIDOS_MES: 28,       // AC
    PEDIDOS_ENVIO_ATRASO: 29,        // AD
    PEDIDOS_ENVIO_PRAZO: 30,         // AE
    PRIMEIRA_COMPRA: 31,             // AF
    RECOMPRA: 32,                    // AG
    TEMPO_MEDIO_TOTAL: 33,           // AH
    REGIAO_CENTRO_OESTE: 34,         // AI
    REGIAO_NORDESTE: 35,             // AJ
    REGIAO_NORTE: 36,                // AK
    REGIAO_SUDESTE: 37,              // AL
    REGIAO_SUL: 38,                  // AM
    PEDIDOS_FRANQUIAS: 39,           // AN
    PEDIDOS_MATRIZ: 40               // AO
};

let allData = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// ==================== FUNÇÕES UTILITÁRIAS ====================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function parseValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value;
    const linha = document.getElementById('filterLinha').value;
    
    const mesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesNome = mesNomes[parseInt(mes) - 1];
    
    return { ano, mes, linha, mesNome, mesAno: `${mesNome}/${ano}` };
}

// ==================== BUSCAR DADOS ====================

async function fetchSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
    
    try {
        console.log('📡 Buscando dados de BDADOS DASH...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('Nenhum dado encontrado na aba BDADOS DASH');
        }
        
        const headers = data.values[0];
        allData = data.values.slice(1);
        
        console.log(`✅ ${allData.length} registros carregados`);
        console.log('📋 Cabeçalhos:', headers);
        console.log('📊 Primeira linha:', allData[0]);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        alert(`Erro ao carregar dados: ${error.message}\n\nVerifique:\n1. A planilha está pública?\n2. A API Key está correta?\n3. A aba "BDADOS DASH" existe e tem dados?`);
        return false;
    }
}

// ==================== ENCONTRAR DADOS ====================

function findDataRow(filters) {
    const found = allData.find(row => {
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = String(row[COLS.MES] || '').trim().toLowerCase();
        const rowLinha = String(row[COLS.LINHA] || '').trim();
        
        const anoMatch = rowAno === filters.ano;
        const mesMatch = rowMes === filters.mes || 
                        rowMes === filters.mesNome.toLowerCase() || 
                        rowMes === filters.mesNome.substring(0, 3).toLowerCase();
        const linhaMatch = filters.linha === 'todas' || rowLinha === filters.linha;
        
        return anoMatch && mesMatch && linhaMatch;
    });
    
    if (found) {
        console.log('✅ Dados encontrados:', found.slice(0, 10));
    } else {
        console.log('⚠️ Nenhum dado encontrado para:', filters);
    }
    
    return found;
}

function aggregateData(filters) {
    if (filters.linha === 'todas') {
        const rows = allData.filter(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = String(row[COLS.MES] || '').trim().toLowerCase();
            
            const anoMatch = rowAno === filters.ano;
            const mesMatch = rowMes === filters.mes || 
                            rowMes === filters.mesNome.toLowerCase() || 
                            rowMes === filters.mesNome.substring(0, 3).toLowerCase();
            
            return anoMatch && mesMatch;
        });
        
        if (rows.length === 0) return null;
        
        const aggregated = rows[0].map((_, colIndex) => {
            if (colIndex <= 2) return rows[0][colIndex];
            
            const sum = rows.reduce((total, row) => {
                return total + parseValue(row[colIndex]);
            }, 0);
            
            return sum;
        });
        
        console.log('✅ Dados agregados (todas as linhas)');
        return aggregated;
    }
    
    return findDataRow(filters);
}

// ==================== ATUALIZAR DASHBOARD ====================

async function updateDashboard() {
    console.log('🔄 Atualizando dashboard...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        const filters = getCurrentFilters();
        console.log('🎯 Filtros:', filters);
        
        const dataRow = aggregateData(filters);
        
        if (!dataRow) {
            console.log('⚠️ Sem dados, zerando...');
            document.getElementById('metaMes').textContent = 'R$ 0,00';
            document.getElementById('metaDia').textContent = 'R$ 0,00';
            document.getElementById('valorVendas').textContent = 'R$ 0,00';
            document.getElementById('pedidosAtraso').textContent = '0';
            document.getElementById('pedidosLiberar').textContent = '0';
            document.getElementById('pedidosExpedidos').textContent = '0';
            document.getElementById('mesRef').textContent = filters.mesAno;
            
            ['bc', 'cs', 'kp', 'pb', 'id', 'skd'].forEach(codigo => {
                document.getElementById(`${codigo}-qtd-orc`).textContent = '0';
                document.getElementById(`${codigo}-val-orc`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-qtd-ped`).textContent = '0';
                document.getElementById(`${codigo}-val-ped`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-ticket`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-conversao`).textContent = '0%';
                document.getElementById(`${codigo}-conversao-bar`).style.width = '0%';
            });
            
            createHistoricoChart(filters);
            createPagamentoChart(filters);
            createRegiaoChart(filters);
            createCompraChart(filters);
            
            if (loading) loading.style.display = 'none';
            return;
        }
        
        // Extrair dados usando os índices corretos
        const metaMes = parseValue(dataRow[COLS.META_MES]);
        const metaDia = parseValue(dataRow[COLS.META_DIARIA]);
        const valorVendas = parseValue(dataRow[COLS.VALOR_PEDIDOS]);
        const pedidosAtraso = parseValue(dataRow[COLS.PEDIDOS_ATRASADOS]);
        const pedidosLiberar = parseValue(dataRow[COLS.PEDIDOS_A_LIBERAR]);
        const pedidosExpedidos = parseValue(dataRow[COLS.PEDIDOS_EXPEDIDOS_MES]);
        
        // Atualizar KPIs
        document.getElementById('metaMes').textContent = formatCurrency(metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;
        
        console.log('📊 KPIs:', {
            metaMes,
            metaDia,
            valorVendas,
            pedidosAtraso,
            pedidosLiberar,
            pedidosExpedidos
        });
        
        // Atualizar franquias
        updateFranquias(filters);
        
        // Criar gráficos
        createHistoricoChart(filters);
        createPagamentoChart(filters);
        createRegiaoChart(filters);
        createCompraChart(filters);
        
        console.log('✅ Dashboard atualizado!');
        
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

// ==================== ATUALIZAR FRANQUIAS ====================

function updateFranquias(filters) {
    const franquias = [
        { codigo: 'bc', nome: 'FRA - Brasil Cacau' },
        { codigo: 'cs', nome: 'FRA - Cacau Show' },
        { codigo: 'kp', nome: 'FRA - Kopenhagen' },
        { codigo: 'id', nome: 'IND - Industries' },
        { codigo: 'pb', nome: 'PLB - PolyBee' },
        { codigo: 'skd', nome: 'SKD - Skullderia' }
    ];
    
    franquias.forEach(franq => {
        const franqFilters = { ...filters, linha: franq.nome };
        const dataRow = findDataRow(franqFilters);
        
        if (!dataRow) {
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = '0';
            document.getElementById(`${franq.codigo}-val-orc`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = '0';
            document.getElementById(`${franq.codigo}-val-ped`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-ticket`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-conversao`).textContent = '0%';
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '0%';
            return;
        }
        
        const qtdOrc = parseValue(dataRow[COLS.QTDE_ORCAMENTOS]);
        const valOrc = parseValue(dataRow[COLS.VALOR_ORCAMENTOS]);
        const qtdPed = parseValue(dataRow[COLS.QTDE_PEDIDOS]);
        const valPed = parseValue(dataRow[COLS.VALOR_PEDIDOS]);
        const ticket = parseValue(dataRow[COLS.TICKET_MEDIO_PED]);
        const conversao = parseValue(dataRow[COLS.TAXA_CONVERSAO_PEDIDOS]);
        
        document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(qtdOrc);
        document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(valOrc);
        document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
        document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(valPed);
        document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(ticket);
        document.getElementById(`${franq.codigo}-conversao`).textContent = conversao.toFixed(1) + '%';
        document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(conversao, 100) + '%';
    });
}

// ==================== GRÁFICOS ====================

function createHistoricoChart(filters) {
    const ctx = document.getElementById('historicoChart');
    if (!ctx) return;
    if (historicoChart) historicoChart.destroy();
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const historicoData = meses.map((mesNome, idx) => {
        const mesFilters = { 
            ...filters, 
            mesNome, 
            mes: String(idx + 1).padStart(2, '0') 
        };
        const dataRow = aggregateData(mesFilters);
        
        if (!dataRow) {
            return { mes: mesNome, orcamentos: 0, vendas: 0, meta: 0 };
        }
        
        return {
            mes: mesNome,
            orcamentos: parseValue(dataRow[COLS.VALOR_ORCAMENTOS]),
            vendas: parseValue(dataRow[COLS.VALOR_PEDIDOS]),
            meta: parseValue(dataRow[COLS.META_MES])
        };
    });
    
    historicoChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Orçamentos',
                    data: historicoData.map(d => d.orcamentos),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5
                },
                {
                    label: 'Vendas',
                    data: historicoData.map(d => d.vendas),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5
                },
                {
                    label: 'Meta',
                    data: historicoData.map(d => d.meta),
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#e2e8f0', font: { size: 13, weight: '600' } } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'K'
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

function createPagamentoChart(filters) {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) return;
    if (pagamentoChart) pagamentoChart.destroy();
    
    const dataRow = aggregateData(filters);
    
    const valorPix = dataRow ? parseValue(dataRow[COLS.VALORES_PIX]) : 0;
    const valorCartao = dataRow ? parseValue(dataRow[COLS.VALORES_CARTAO]) : 0;
    const valorBoleto = dataRow ? parseValue(dataRow[COLS.VALORES_BOLETO]) : 0;
    
    pagamentoChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['PIX', 'Cartão', 'Boleto'],
            datasets: [{
                data: [valorPix, valorCartao, valorBoleto],
                backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } },
                tooltip: {
                    callbacks: {
                        label: (context) => context.label + ': ' + formatCurrency(context.parsed)
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function createRegiaoChart(filters) {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) return;
    if (regiaoChart) regiaoChart.destroy();
    
    const dataRow = aggregateData(filters);
    
    const centroOeste = dataRow ? parseValue(dataRow[COLS.REGIAO_CENTRO_OESTE]) : 0;
    const nordeste = dataRow ? parseValue(dataRow[COLS.REGIAO_NORDESTE]) : 0;
    const norte = dataRow ? parseValue(dataRow[COLS.REGIAO_NORTE]) : 0;
    const sudeste = dataRow ? parseValue(dataRow[COLS.REGIAO_SUDESTE]) : 0;
    const sul = dataRow ? parseValue(dataRow[COLS.REGIAO_SUL]) : 0;
    
    regiaoChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul'],
            datasets: [{
                label: 'Pedidos',
                data: [centroOeste, nordeste, norte, sudeste, sul],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    '#8b5cf6',
                    '#3b82f6',
                    '#22c55e',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function createCompraChart(filters) {
    const ctx = document.getElementById('compraChart');
    if (!ctx) return;
    if (compraChart) compraChart.destroy();
    
    const dataRow = aggregateData(filters);
    
    const primeiraCompra = dataRow ? parseValue(dataRow[COLS.PRIMEIRA_COMPRA]) : 0;
    const recompra = dataRow ? parseValue(dataRow[COLS.RECOMPRA]) : 0;
    
    compraChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Primeira Compra', 'Recompra'],
            datasets: [{
                data: [primeiraCompra, recompra],
                backgroundColor: ['#22c55e', '#3b82f6'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } },
                tooltip: {
                    callbacks: {
                        label: (context) => context.label + ': ' + formatNumber(context.parsed) + ' pedidos'
                    }
                }
            }
        }
    });
}

// ==================== INICIALIZAÇÃO ====================

function init() {
    console.log('🎯 Inicializando...');
    
    const now = new Date();
    document.getElementById('filterAno').value = now.getFullYear();
    document.getElementById('filterMes').value = String(now.getMonth() + 1).padStart(2, '0');
    
    setTimeout(async () => {
        const success = await fetchSheetData();
        if (success) {
            updateDashboard();
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', init);

console.log('✅ Script carregado');

// A aba BDADOS DASH tem dados consolidados por ANO, MÊS e LINHA
// Estrutura esperada: ANO | MÊS | LINHA | DADOS...

let allData = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// ==================== FUNÇÕES UTILITÁRIAS ====================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function parseValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value;
    const linha = document.getElementById('filterLinha').value;
    
    const mesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesNome = mesNomes[parseInt(mes) - 1];
    
    return { ano, mes, linha, mesNome, mesAno: `${mesNome}/${ano}` };
}

// ==================== BUSCAR DADOS ====================

async function fetchSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
    
    try {
        console.log('📡 Buscando dados de BDADOS DASH...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('Nenhum dado encontrado na aba BDADOS DASH');
        }
        
        // Primeira linha é o cabeçalho
        const headers = data.values[0];
        allData = data.values.slice(1);
        
        console.log(`✅ ${allData.length} registros carregados`);
        console.log('📋 Cabeçalhos:', headers);
        console.log('📊 Primeira linha de dados:', allData[0]);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        alert(`Erro ao carregar dados: ${error.message}\n\nVerifique:\n1. A planilha está pública?\n2. A API Key está correta?\n3. A aba "BDADOS DASH" existe e tem dados?`);
        return false;
    }
}

// ==================== ENCONTRAR DADOS ====================

function findDataRow(filters) {
    // Busca a linha que corresponde ao filtro (ano, mês, linha)
    const found = allData.find(row => {
        const rowAno = String(row[0] || '').trim();
        const rowMes = String(row[1] || '').trim();
        const rowLinha = String(row[2] || '').trim();
        
        const anoMatch = rowAno === filters.ano;
        const mesMatch = rowMes === filters.mes || 
                        rowMes === filters.mesNome || 
                        rowMes.toLowerCase() === filters.mesNome.toLowerCase();
        const linhaMatch = filters.linha === 'todas' || rowLinha === filters.linha;
        
        return anoMatch && mesMatch && linhaMatch;
    });
    
    if (found) {
        console.log('✅ Dados encontrados:', found);
    } else {
        console.log('⚠️ Nenhum dado encontrado para:', filters);
    }
    
    return found;
}

function aggregateData(filters) {
    // Se for "todas", soma os dados de todas as linhas
    if (filters.linha === 'todas') {
        const rows = allData.filter(row => {
            const rowAno = String(row[0] || '').trim();
            const rowMes = String(row[1] || '').trim();
            
            const anoMatch = rowAno === filters.ano;
            const mesMatch = rowMes === filters.mes || 
                            rowMes === filters.mesNome || 
                            rowMes.toLowerCase() === filters.mesNome.toLowerCase();
            
            return anoMatch && mesMatch;
        });
        
        if (rows.length === 0) return null;
        
        // Soma todas as colunas numéricas
        const aggregated = rows[0].map((_, colIndex) => {
            if (colIndex <= 2) return rows[0][colIndex]; // ANO, MÊS, LINHA
            
            const sum = rows.reduce((total, row) => {
                return total + parseValue(row[colIndex]);
            }, 0);
            
            return sum;
        });
        
        console.log('✅ Dados agregados (todas as linhas):', aggregated);
        return aggregated;
    }
    
    return findDataRow(filters);
}

// ==================== ATUALIZAR DASHBOARD ====================

async function updateDashboard() {
    console.log('🔄 Atualizando dashboard...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        const filters = getCurrentFilters();
        console.log('🎯 Filtros aplicados:', filters);
        
        const dataRow = aggregateData(filters);
        
        if (!dataRow) {
            console.log('⚠️ Nenhum dado encontrado, usando zeros');
            // Zerar tudo
            document.getElementById('metaMes').textContent = 'R$ 0,00';
            document.getElementById('metaDia').textContent = 'R$ 0,00';
            document.getElementById('valorVendas').textContent = 'R$ 0,00';
            document.getElementById('pedidosAtraso').textContent = '0';
            document.getElementById('pedidosLiberar').textContent = '0';
            document.getElementById('pedidosExpedidos').textContent = '0';
            document.getElementById('mesRef').textContent = filters.mesAno;
            
            // Zerar franquias
            ['bc', 'cs', 'kp', 'pb', 'id', 'skd'].forEach(codigo => {
                document.getElementById(`${codigo}-qtd-orc`).textContent = '0';
                document.getElementById(`${codigo}-val-orc`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-qtd-ped`).textContent = '0';
                document.getElementById(`${codigo}-val-ped`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-ticket`).textContent = 'R$ 0,00';
                document.getElementById(`${codigo}-conversao`).textContent = '0%';
                document.getElementById(`${codigo}-conversao-bar`).style.width = '0%';
            });
            
            createHistoricoChart(filters);
            createPagamentoChart(filters);
            createRegiaoChart(filters);
            createCompraChart(filters);
            
            if (loading) loading.style.display = 'none';
            return;
        }
        
        // AQUI VOCÊ PRECISA MAPEAR AS COLUNAS DA SUA ABA BDADOS DASH
        // Exemplo (ajuste os índices conforme sua planilha):
        // dataRow[0] = ANO
        // dataRow[1] = MÊS
        // dataRow[2] = LINHA
        // dataRow[3] = META_MES
        // dataRow[4] = META_DIA
        // dataRow[5] = VALOR_VENDAS
        // dataRow[6] = PEDIDOS_ATRASO
        // dataRow[7] = PEDIDOS_LIBERAR
        // dataRow[8] = PEDIDOS_EXPEDIDOS
        // ... etc
        
        // ⚠️ AJUSTE ESSES ÍNDICES CONFORME SUA PLANILHA ⚠️
        const metaMes = parseValue(dataRow[3]);
        const metaDia = parseValue(dataRow[4]);
        const valorVendas = parseValue(dataRow[5]);
        const pedidosAtraso = parseValue(dataRow[6]);
        const pedidosLiberar = parseValue(dataRow[7]);
        const pedidosExpedidos = parseValue(dataRow[8]);
        
        // Atualizar KPIs
        document.getElementById('metaMes').textContent = formatCurrency(metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;
        
        console.log('📊 KPIs atualizados:', {
            metaMes,
            metaDia,
            valorVendas,
            pedidosAtraso,
            pedidosLiberar,
            pedidosExpedidos
        });
        
        // Atualizar franquias
        updateFranquias(filters);
        
        // Criar gráficos
        createHistoricoChart(filters);
        createPagamentoChart(filters);
        createRegiaoChart(filters);
        createCompraChart(filters);
        
        console.log('✅ Dashboard atualizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
    } finally {
        if (loading) {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }
}

// ==================== ATUALIZAR FRANQUIAS ====================

function updateFranquias(filters) {
    const franquias = [
        { codigo: 'bc', nome: 'FRA - Brasil Cacau' },
        { codigo: 'cs', nome: 'FRA - Cacau Show' },
        { codigo: 'kp', nome: 'FRA - Kopenhagen' },
        { codigo: 'id', nome: 'IND - Industries' },
        { codigo: 'pb', nome: 'PLB - PolyBee' },
        { codigo: 'skd', nome: 'SKD - Skullderia' }
    ];
    
    franquias.forEach(franq => {
        const franqFilters = { ...filters, linha: franq.nome };
        const dataRow = findDataRow(franqFilters);
        
        if (!dataRow) {
            // Zerar
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = '0';
            document.getElementById(`${franq.codigo}-val-orc`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = '0';
            document.getElementById(`${franq.codigo}-val-ped`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-ticket`).textContent = 'R$ 0,00';
            document.getElementById(`${franq.codigo}-conversao`).textContent = '0%';
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '0%';
            return;
        }
        
        // ⚠️ AJUSTE OS ÍNDICES CONFORME SUA PLANILHA ⚠️
        const qtdOrc = parseValue(dataRow[9]);
        const valOrc = parseValue(dataRow[10]);
        const qtdPed = parseValue(dataRow[11]);
        const valPed = parseValue(dataRow[12]);
        const ticket = qtdPed > 0 ? valPed / qtdPed : 0;
        const conversao = qtdOrc > 0 ? (qtdPed / qtdOrc) * 100 : 0;
        
        document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(qtdOrc);
        document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(valOrc);
        document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
        document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(valPed);
        document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(ticket);
        document.getElementById(`${franq.codigo}-conversao`).textContent = conversao.toFixed(1) + '%';
        document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(conversao, 100) + '%';
    });
}

// ==================== GRÁFICOS ====================

function createHistoricoChart(filters) {
    const ctx = document.getElementById('historicoChart');
    if (!ctx) return;
    if (historicoChart) historicoChart.destroy();
    
    // Buscar dados de todos os meses do ano
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const historicoData = meses.map(mesNome => {
        const mesFilters = { ...filters, mesNome, mes: String(meses.indexOf(mesNome) + 1).padStart(2, '0') };
        const dataRow = aggregateData(mesFilters);
        
        if (!dataRow) {
            return { mes: mesNome, orcamentos: 0, vendas: 0, meta: 0 };
        }
        
        // ⚠️ AJUSTE OS ÍNDICES ⚠️
        return {
            mes: mesNome,
            orcamentos: parseValue(dataRow[10]), // Valor Orçamentos
            vendas: parseValue(dataRow[5]),      // Valor Vendas
            meta: parseValue(dataRow[3])         // Meta
        };
    });
    
    historicoChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: meses,
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
                legend: { position: 'top', labels: { color: '#e2e8f0' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'K'
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

function createPagamentoChart(filters) {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) return;
    if (pagamentoChart) pagamentoChart.destroy();
    
    // Dados mockados (ajuste conforme sua planilha)
    pagamentoChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['PIX', 'Cartão', 'Boleto', 'Outros'],
            datasets: [{
                data: [45, 30, 20, 5],
                backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
            },
            cutout: '65%'
        }
    });
}

function createRegiaoChart(filters) {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) return;
    if (regiaoChart) regiaoChart.destroy();
    
    regiaoChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'],
            datasets: [{
                label: 'Pedidos',
                data: [120, 85, 65, 45, 30],
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
                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function createCompraChart(filters) {
    const ctx = document.getElementById('compraChart');
    if (!ctx) return;
    if (compraChart) compraChart.destroy();
    
    compraChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Primeira Compra', 'Recompra'],
            datasets: [{
                data: [35, 65],
                backgroundColor: ['#22c55e', '#3b82f6'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0' } } }
        }
    });
}

// ==================== INICIALIZAÇÃO ====================

function init() {
    console.log('🎯 Inicializando dashboard...');
    
    // Definir data atual
    const now = new Date();
    document.getElementById('filterAno').value = now.getFullYear();
    document.getElementById('filterMes').value = String(now.getMonth() + 1).padStart(2, '0');
    
    // Carregar dados e atualizar
    setTimeout(async () => {
        const success = await fetchSheetData();
        if (success) {
            updateDashboard();
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', init);

console.log('✅ Script carregado');
