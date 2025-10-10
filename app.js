// DASHBOARD POLICRYL - VERSÃO FINAL E CORRIGIDA
console.log('🚀 Dashboard Policryl - Carregando...');

// ==================== CONFIGURAÇÃO GERAL ====================
const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    SHEET_NAME: 'BDADOS DASH', // Única aba com todos os dados
    RANGE: 'A:AO' // Colunas de A até AO
};

// Mapeamento de colunas da aba 'BDADOS DASH' (baseado no cabeçalho fornecido)
const COLS = {
    ANO: 0,                     // A - Ano
    MES: 1,                     // B - Mes
    LINHA: 2,                   // C - Linha
    META_MES: 3,                // D - Meta_Mes
    META_DIARIA: 4,             // E - Meta_Diaria
    // F a L - Orçamentos e Simples Remessa
    QTDE_PEDIDOS: 13,           // N - Qtde_Pedidos
    VALOR_PEDIDOS: 14,          // O - Valor_Pedidos
    TICKET_MEDIO_PEDIDOS: 15,   // P - TicketMedio_Pedidos
    // Q a R - Taxas de Conversão
    // S a X - Formas de Pagamento
    PEDIDOS_ATRASADOS: 25,      // Z - Pedidos_Atrasados
    PEDIDOS_A_LIBERAR: 26,      // AA - Pedidos_A_Liberar
    // AB a AD - Status de Pedidos
    PRIMEIRA_COMPRA: 31,        // AF - Primeira_Compra
    RECOMPRA: 32,               // AG - Recompra
    // AH - Tempo Médio
    REGIAO_CENTRO_OESTE: 34,    // AI - Região_Centro_Oeste
    REGIAO_NORDESTE: 35,        // AJ - Região_Nordeste
    REGIAO_NORTE: 36,           // AK - Região_Norte
    REGIAO_SUDESTE: 37,         // AL - Região_Sudeste
    REGIAO_SUL: 38,             // AM - Região_Sul
    // AN a AO - Franquias vs Matriz
};

// Variáveis globais
let allData = [];
let historicoChart, pagamentoChart, regiaoChart, compraChart;

// ==================== FUNÇÕES DE UTILIDADE ====================
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function parseValue(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function getMesNome(mesNumero) {
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return nomes[parseInt(mesNumero, 10) - 1] || '';
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value; // '01', '02', etc.
    const linha = document.getElementById('filterLinha').value;
    return { ano, mes, linha, mesAno: `${getMesNome(mes)}/${ano}` };
}

// ==================== BUSCA DE DADOS (GVIZ) ====================
async function fetchSheetData() {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME )}&range=${CONFIG.RANGE}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
        const data = JSON.parse(jsonString);

        if (data.status === 'error') {
            throw new Error(data.errors.map(e => e.detailed_message).join(', '));
        }

        // Pula o cabeçalho (primeira linha)
        return data.table.rows.slice(1).map(row => (row.c || []).map(cell => (cell ? cell.v : null)));
    } catch (error) {
        console.error(`❌ Erro ao buscar dados da aba "${CONFIG.SHEET_NAME}":`, error);
        throw error;
    }
}

// ==================== PROCESSAMENTO E CÁLCULOS ====================
function filterData(filters) {
    return allData.filter(row => {
        if (!row || row.length === 0) return false;
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = String(row[COLS.MES] || '').trim().padStart(2, '0');
        
        const anoMatch = rowAno === filters.ano;
        const mesMatch = rowMes === filters.mes;
        
        if (filters.linha === 'todas') {
            return anoMatch && mesMatch;
        }
        
        const rowLinha = String(row[COLS.LINHA] || '').trim();
        return anoMatch && mesMatch && rowLinha === filters.linha;
    });
}

function calculateKPIs(filteredData) {
    return filteredData.reduce((acc, row) => {
        acc.metaMes += parseValue(row[COLS.META_MES]);
        acc.metaDia += parseValue(row[COLS.META_DIARIA]);
        acc.valorVendas += parseValue(row[COLS.VALOR_PEDIDOS]);
        acc.pedidosAtraso += parseValue(row[COLS.PEDIDOS_ATRASADOS]);
        acc.pedidosLiberar += parseValue(row[COLS.PEDIDOS_A_LIBERAR]);
        acc.pedidosExpedidos += parseValue(row[COLS.QTDE_PEDIDOS]);
        return acc;
    }, { metaMes: 0, metaDia: 0, valorVendas: 0, pedidosAtraso: 0, pedidosLiberar: 0, pedidosExpedidos: 0 });
}

function calculateHistoricoAnual(ano) {
    const historico = {};
    const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    meses.forEach(mes => {
        historico[mes] = { mes: getMesNome(mes), vendas: 0, meta: 0 };
    });

    allData.forEach(row => {
        if (String(row[COLS.ANO]).trim() === ano) {
            const mes = String(row[COLS.MES]).trim().padStart(2, '0');
            if (historico[mes]) {
                historico[mes].vendas += parseValue(row[COLS.VALOR_PEDIDOS]);
                historico[mes].meta += parseValue(row[COLS.META_MES]);
            }
        }
    });

    return Object.values(historico);
}

// ==================== ATUALIZAÇÃO DA UI E GRÁFICOS ====================
function updateKPIs(kpis, filters) {
    document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
    document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
    document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
    document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
    document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
    document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
    document.getElementById('mesRef').textContent = filters.mesAno;
}

function updateAllFranquias(filters) {
    const franquias = ['cs', 'kp', 'bc', 'pb', 'id', 'skd'];
    const nomesLinhas = {
        'cs': 'FRA - Cacau Show', 'kp': 'FRA - Kopenhagen', 'bc': 'FRA - Brasil Cacau',
        'pb': 'PLB - PolyBee', 'id': 'IND - Industries', 'skd': 'SKD - Skullderia'
    };

    franquias.forEach(codigo => {
        const nomeLinha = nomesLinhas[codigo];
        const dataFranquia = allData.find(row => 
            String(row[COLS.ANO]).trim() === filters.ano &&
            String(row[COLS.MES]).trim().padStart(2, '0') === filters.mes &&
            String(row[COLS.LINHA]).trim() === nomeLinha
        );

        const qtdPed = dataFranquia ? parseValue(dataFranquia[COLS.QTDE_PEDIDOS]) : 0;
        const valPed = dataFranquia ? parseValue(dataFranquia[COLS.VALOR_PEDIDOS]) : 0;
        const ticket = dataFranquia ? parseValue(dataFranquia[COLS.TICKET_MEDIO_PEDIDOS]) : 0;
        
        document.getElementById(`${codigo}-qtd-ped`).textContent = formatNumber(qtdPed);
        document.getElementById(`${codigo}-val-ped`).textContent = formatCurrency(valPed);
        document.getElementById(`${codigo}-ticket`).textContent = formatCurrency(ticket);
        // Campos de orçamento e conversão podem ser preenchidos se os dados existirem
        document.getElementById(`${codigo}-qtd-orc`).textContent = '0';
        document.getElementById(`${codigo}-val-orc`).textContent = formatCurrency(0);
        document.getElementById(`${codigo}-conversao`).textContent = '0.0%';
        document.getElementById(`${codigo}-conversao-bar`).style.width = '0%';
    });
}

function createChart(chartInstance, chartId, type, data, options) {
    const ctx = document.getElementById(chartId);
    if (!ctx) return null;
    if (chartInstance) chartInstance.destroy();
    return new Chart(ctx.getContext('2d'), { type, data, options });
}

function updateCharts(filteredData, filters) {
    // Histórico Anual
    const historicoData = calculateHistoricoAnual(filters.ano);
    historicoChart = createChart(historicoChart, 'historicoChart', 'line', {
        labels: historicoData.map(d => d.mes),
        datasets: [
            { label: 'Vendas', data: historicoData.map(d => d.vendas), borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
            { label: 'Meta', data: historicoData.map(d => d.meta), borderColor: '#ef4444', borderDash: [5, 5], fill: false, tension: 0.4 }
        ]
    }, { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } });

    // Pagamentos (Soma dos valores das colunas de pagamento)
    const pagamentos = filteredData.reduce((acc, row) => {
        acc.PIX += parseValue(row[20]); // Coluna U - Valores_PIX
        acc.Cartao += parseValue(row[22]); // Coluna W - Valores_Cartao_Credito
        acc.Boleto += parseValue(row[24]); // Coluna Y - Valores_Boleto
        return acc;
    }, { PIX: 0, Cartao: 0, Boleto: 0 });
    pagamentoChart = createChart(pagamentoChart, 'pagamentoChart', 'doughnut', {
        labels: ['PIX', 'Cartão de Crédito', 'Boleto'],
        datasets: [{ data: [pagamentos.PIX, pagamentos.Cartao, pagamentos.Boleto], backgroundColor: ['#8b5cf6', '#3b82f6', '#22c55e'] }]
    }, { responsive: true, maintainAspectRatio: false, cutout: '65%' });

    // Regiões
    const regioes = filteredData.reduce((acc, row) => {
        acc['Centro-Oeste'] += parseValue(row[COLS.REGIAO_CENTRO_OESTE]);
        acc['Nordeste'] += parseValue(row[COLS.REGIAO_NORDESTE]);
        acc['Norte'] += parseValue(row[COLS.REGIAO_NORTE]);
        acc['Sudeste'] += parseValue(row[COLS.REGIAO_SUDESTE]);
        acc['Sul'] += parseValue(row[COLS.REGIAO_SUL]);
        return acc;
    }, { 'Centro-Oeste': 0, 'Nordeste': 0, 'Norte': 0, 'Sudeste': 0, 'Sul': 0 });
    regiaoChart = createChart(regiaoChart, 'regiaoChart', 'bar', {
        labels: Object.keys(regioes),
        datasets: [{ label: 'Pedidos', data: Object.values(regioes), backgroundColor: 'rgba(139, 92, 246, 0.8)' }]
    }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } });

    // Compra vs Recompra
    const primeiraCompra = filteredData.reduce((sum, row) => sum + parseValue(row[COLS.PRIMEIRA_COMPRA]), 0);
    const recompra = filteredData.reduce((sum, row) => sum + parseValue(row[COLS.RECOMPRA]), 0);
    compraChart = createChart(compraChart, 'compraChart', 'pie', {
        labels: ['Primeira Compra', 'Recompra'],
        datasets: [{ data: [primeiraCompra, recompra], backgroundColor: ['#22c55e', '#3b82f6'] }]
    }, { responsive: true, maintainAspectRatio: false });
}

// ==================== FUNÇÃO PRINCIPAL ====================
async function updateDashboard() {
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';

    try {
        if (allData.length === 0) {
            allData = await fetchSheetData();
            console.log(`✅ ${allData.length} registros carregados de '${CONFIG.SHEET_NAME}'`);
        }

        const filters = getCurrentFilters();
        console.log('📊 Filtros aplicados:', filters);

        const filteredData = filterData(filters);
        
        const kpis = calculateKPIs(filteredData);
        updateKPIs(kpis, filters);
        
        updateAllFranquias(filters);
        
        updateCharts(filteredData, filters);

        console.log('✅ Dashboard atualizado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
        alert('Erro ao carregar ou processar os dados. Verifique o console para detalhes.');
    } finally {
        setTimeout(() => { loading.style.display = 'none'; }, 500);
    }
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Dashboard...');
    
    const now = new Date();
    document.getElementById('filterAno').value = now.getFullYear();
    document.getElementById('filterMes').value = String(now.getMonth() + 1).padStart(2, '0');

    ['filterAno', 'filterMes', 'filterLinha'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });

    updateDashboard();

    setInterval(() => {
        console.log('🔄 Auto-refresh: recarregando dados...');
        allData = [];
        updateDashboard();
    }, 300000); // 5 minutos
});

