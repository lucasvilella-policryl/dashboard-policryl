// CONFIGURAÇÃO OTIMIZADA - DASHBOARD POLICRYL
const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:AR' // Até a coluna AR para cobrir todos os dados
};

console.log('🔥 Dashboard Policryl - Carregando dados consolidados...');

// MAPEAMENTO DAS COLUNAS DA NOVA ABA BDADOS DASH
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

// VARIÁVEIS GLOBAIS
let allData = [];
let HEADERS = [];

// FUNÇÕES UTILITÁRIAS
function formatCurrency(value) {
    if (!value) value = 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    if (!value) value = 0;
    return new Intl.NumberFormat('pt-BR').format(value);
}

function formatPercent(value) {
    if (!value) value = 0;
    return value.toFixed(1) + '%';
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
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesNome = meses[parseInt(mes) - 1] || 'Out';
    
    return {
        ano,
        mes,
        linha,
        mesAno: `${mesNome}/${ano}`,
        mesNome
    };
}

// CARREGAR DADOS DA NOVA ABA
async function fetchSheetData() {
    console.log('📡 Conectando ao Google Sheets (BDADOS DASH)...');
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
        
        console.log('🔗 URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Erro da API: ${data.error.message}`);
        }
        
        if (!data.values || data.values.length === 0) {
            throw new Error('Planilha vazia ou sem dados');
        }
        
        HEADERS = data.values[0];
        allData = data.values.slice(1);
        
        console.log(`✅ Dados carregados: ${allData.length} registros da BDADOS DASH`);
        console.log('📋 Cabeçalhos:', HEADERS);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return false;
    }
}

// ENCONTRAR DADOS PARA OS FILTROS ATUAIS
function findDataForFilters(filters) {
    const mesNumero = filters.mes.padStart(2, '0'); // Garantir 2 dígitos
    const ano = filters.ano;
    
    console.log(`🔍 Buscando dados: Ano=${ano}, Mês=${mesNumero}, Linha=${filters.linha}`);
    
    // Primeiro, tentar encontrar linha específica
    if (filters.linha !== 'todas') {
        const specificRow = allData.find(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = String(row[COLS.MES] || '').trim();
            const rowLinha = String(row[COLS.LINHA] || '').trim();
            
            return rowAno === ano && rowMes === mesNumero && rowLinha === filters.linha;
        });
        
        if (specificRow) {
            console.log(`✅ Encontrado dados específicos para ${filters.linha}`);
            return specificRow;
        }
    }
    
    // Se não encontrou específico ou é "todas", somar todas as linhas do mês
    const monthRows = allData.filter(row => {
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = String(row[COLS.MES] || '').trim();
        return rowAno === ano && rowMes === mesNumero;
    });
    
    if (monthRows.length > 0) {
        console.log(`✅ Encontrado ${monthRows.length} registros para o mês (consolidado)`);
        
        // Criar objeto consolidado somando todas as linhas
        const consolidated = new Array(COLS.PEDIDOS_MATRIZ + 1).fill(0);
        
        monthRows.forEach(row => {
            for (let i = 3; i <= COLS.PEDIDOS_MATRIZ; i++) { // A partir das metas
                if (row[i]) {
                    consolidated[i] += parseValue(row[i]);
                }
            }
        });
        
        // Manter ano, mês e linha do primeiro registro (ou vazio)
        consolidated[COLS.ANO] = ano;
        consolidated[COLS.MES] = mesNumero;
        consolidated[COLS.LINHA] = 'Consolidado';
        
        return consolidated;
    }
    
    console.log('❌ Nenhum dado encontrado para os filtros');
    return null;
}

// CALCULAR KPIs COM DADOS CONSOLIDADOS
function calculateKPIs(currentRow) {
    if (!currentRow) {
        console.log('⚠️ Sem dados para calcular KPIs');
        return getEmptyKPIs();
    }
    
    try {
        console.log('📈 Calculando KPIs com dados consolidados...');
        
        return {
            metaMes: parseValue(currentRow[COLS.META_MES]),
            metaDia: parseValue(currentRow[COLS.META_DIARIA]),
            valorVendas: parseValue(currentRow[COLS.VALOR_PEDIDOS]),
            pedidosAtraso: parseValue(currentRow[COLS.PEDIDOS_ATRASADOS]),
            pedidosLiberar: parseValue(currentRow[COLS.PEDIDOS_A_LIBERAR]),
            pedidosExpedidos: parseValue(currentRow[COLS.PEDIDOS_EXPEDIDOS_MES]),
            porcentagemMeta: parseValue(currentRow[COLS.PORCENTAGEM_META]),
            qtdePedidos: parseValue(currentRow[COLS.QTDE_PEDIDOS]),
            taxaConversao: parseValue(currentRow[COLS.TAXA_CONVERSAO_PEDIDOS])
        };
        
    } catch (error) {
        console.error('❌ Erro ao calcular KPIs:', error);
        return getEmptyKPIs();
    }
}

function getEmptyKPIs() {
    return {
        metaMes: 0,
        metaDia: 0,
        valorVendas: 0,
        pedidosAtraso: 0,
        pedidosLiberar: 0,
        pedidosExpedidos: 0,
        porcentagemMeta: 0,
        qtdePedidos: 0,
        taxaConversao: 0
    };
}

// CALCULAR DADOS DA FRANQUIA ESPECÍFICA
function getFranquiaData(franquiaNome) {
    try {
        const filters = getCurrentFilters();
        const mesNumero = filters.mes.padStart(2, '0');
        const ano = filters.ano;
        
        // Buscar linha específica da franquia
        const franquiaRow = allData.find(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = String(row[COLS.MES] || '').trim();
            const rowLinha = String(row[COLS.LINHA] || '').trim();
            
            return rowAno === ano && rowMes === mesNumero && rowLinha === franquiaNome;
        });
        
        if (franquiaRow) {
            return {
                qtdOrc: parseValue(franquiaRow[COLS.QTDE_ORCAMENTOS]),
                valOrc: parseValue(franquiaRow[COLS.VALOR_ORCAMENTOS]),
                qtdPed: parseValue(franquiaRow[COLS.QTDE_PEDIDOS]),
                valPed: parseValue(franquiaRow[COLS.VALOR_PEDIDOS]),
                ticket: parseValue(franquiaRow[COLS.TICKET_MEDIO_PEDIDOS]),
                conversao: parseValue(franquiaRow[COLS.TAXA_CONVERSAO_PEDIDOS])
            };
        }
        
        console.log(`⚠️ Dados não encontrados para franquia: ${franquiaNome}`);
        return { qtdOrc: 0, valOrc: 0, qtdPed: 0, valPed: 0, ticket: 0, conversao: 0 };
        
    } catch (error) {
        console.error(`❌ Erro ao buscar dados da franquia ${franquiaNome}:`, error);
        return { qtdOrc: 0, valOrc: 0, qtdPed: 0, valPed: 0, ticket: 0, conversao: 0 };
    }
}

// ATUALIZAR INTERFACE
function updateKPIs(kpis, filters) {
    try {
        document.getElementById('metaMes').textContent = formatCurrency(kpis.metaMes);
        document.getElementById('metaDia').textContent = formatCurrency(kpis.metaDia);
        document.getElementById('valorVendas').textContent = formatCurrency(kpis.valorVendas);
        document.getElementById('pedidosAtraso').textContent = formatNumber(kpis.pedidosAtraso);
        document.getElementById('pedidosLiberar').textContent = formatNumber(kpis.pedidosLiberar);
        document.getElementById('pedidosExpedidos').textContent = formatNumber(kpis.pedidosExpedidos);
        document.getElementById('mesRef').textContent = filters.mesAno;
        
        console.log('✅ KPIs atualizados com dados consolidados');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar KPIs:', error);
    }
}

function updateFranquias() {
    const franquias = [
        { codigo: 'cs', nome: 'Cacau Show' },
        { codigo: 'kp', nome: 'Kopenhagen' },
        { codigo: 'bc', nome: 'Brasil Cacau' },
        { codigo: 'pb', nome: 'PolyBee' },
        { codigo: 'id', nome: 'Industries' },
        { codigo: 'skd', nome: 'Skullderia' }
    ];
    
    franquias.forEach(franq => {
        try {
            const data = getFranquiaData(franq.nome);
            
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(data.qtdOrc);
            document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(data.valOrc);
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(data.qtdPed);
            document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(data.valPed);
            document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(data.ticket);
            document.getElementById(`${franq.codigo}-conversao`).textContent = formatPercent(data.conversao);
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(data.conversao, 100) + '%';
            
            console.log(`✅ ${franq.nome}: ${data.qtdPed} pedidos, R$ ${data.valPed}`);
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar ${franq.codigo}:`, error);
        }
    });
}

// CRIAR GRÁFICOS SIMPLIFICADOS
function createCharts(currentRow) {
    if (!currentRow) return;
    
    try {
        createPagamentoChart(currentRow);
        createRegiaoChart(currentRow);
        createCompraChart(currentRow);
    } catch (error) {
        console.error('❌ Erro ao criar gráficos:', error);
    }
}

function createPagamentoChart(data) {
    const ctx = document.getElementById('pagamentoChart')?.getContext('2d');
    if (!ctx) return;
    
    const pagamentos = [
        { forma: 'PIX', valor: parseValue(data[COLS.VALORES_PIX]) },
        { forma: 'Cartão Crédito', valor: parseValue(data[COLS.VALORES_CARTAO_CREDITO]) },
        { forma: 'Boleto', valor: parseValue(data[COLS.VALORES_BOLETO]) }
    ].filter(p => p.valor > 0);
    
    if (window.pagamentoChart) window.pagamentoChart.destroy();
    
    if (pagamentos.length > 0) {
        window.pagamentoChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: pagamentos.map(p => p.forma),
                datasets: [{
                    data: pagamentos.map(p => p.valor),
                    backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                        }
                    }
                }
            }
        });
    }
}

function createRegiaoChart(data) {
    const ctx = document.getElementById('regiaoChart')?.getContext('2d');
    if (!ctx) return;
    
    const regioes = [
        { regiao: 'Centro-Oeste', pedidos: parseValue(data[COLS.REGIAO_CENTRO_OESTE]) },
        { regiao: 'Nordeste', pedidos: parseValue(data[COLS.REGIAO_NORDESTE]) },
        { regiao: 'Norte', pedidos: parseValue(data[COLS.REGIAO_NORTE]) },
        { regiao: 'Sudeste', pedidos: parseValue(data[COLS.REGIAO_SUDESTE]) },
        { regiao: 'Sul', pedidos: parseValue(data[COLS.REGIAO_SUL]) }
    ].filter(r => r.pedidos > 0);
    
    if (window.regiaoChart) window.regiaoChart.destroy();
    
    if (regioes.length > 0) {
        window.regiaoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regioes.map(r => r.regiao),
                datasets: [{
                    label: 'Pedidos',
                    data: regioes.map(r => r.pedidos),
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function createCompraChart(data) {
    const ctx = document.getElementById('compraChart')?.getContext('2d');
    if (!ctx) return;
    
    const compras = [
        { tipo: 'Primeira Compra', valor: parseValue(data[COLS.PRIMEIRA_COMPRA]) },
        { tipo: 'Recompra', valor: parseValue(data[COLS.RECOMPRA]) }
    ].filter(c => c.valor > 0);
    
    if (window.compraChart) window.compraChart.destroy();
    
    if (compras.length > 0) {
        window.compraChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: compras.map(c => c.tipo),
                datasets: [{
                    data: compras.map(c => c.valor),
                    backgroundColor: ['#22c55e', '#3b82f6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// FUNÇÃO PRINCIPAL
async function updateDashboard() {
    console.log('🎯 Atualizando dashboard com dados consolidados...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        // Carregar dados se necessário
        if (allData.length === 0) {
            console.log('📥 Buscando dados da BDADOS DASH...');
            const success = await fetchSheetData();
            
            if (!success) {
                console.log('🔄 Falha ao carregar dados consolidados');
                return;
            }
        }
        
        const filters = getCurrentFilters();
        console.log('🎛️ Filtros aplicados:', filters);
        
        // Encontrar dados para os filtros
        const currentRow = findDataForFilters(filters);
        
        // Calcular KPIs
        const kpis = calculateKPIs(currentRow);
        updateKPIs(kpis, filters);
        
        // Atualizar franquias
        updateFranquias();
        
        // Criar gráficos
        createCharts(currentRow);
        
        console.log('✅ Dashboard atualizado com dados consolidados!');
        
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
    } finally {
        if (loading) {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }
}

// INICIALIZAÇÃO
function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard Policryl (BDADOS DASH)...');
    
    try {
        // Configurar data atual
        const now = new Date();
        document.getElementById('filterAno').value = now.getFullYear();
        document.getElementById('filterMes').value = '10'; // Outubro
        
        // Adicionar event listeners aos filtros
        ['filterAno', 'filterMes', 'filterLinha'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', updateDashboard);
            }
        });
        
        // Iniciar primeira carga
        setTimeout(() => {
            updateDashboard();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
}

// INICIAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', initializeDashboard);

console.log('🔧 Dashboard Policryl - Script para BDADOS DASH carregado');
