// CONFIGURAÇÃO CORRIGIDA - DASHBOARD POLICRYL
const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'BDADOS DASH',
    RANGE: 'A:AR'
};

console.log('🔥 Dashboard Policryl - Carregando...');

// MAPEAMENTO DAS COLUNAS (baseado nos cabeçalhos que vieram)
const COLS = {
    ANO: 0,
    MES: 1,
    LINHA: 2,
    META_MES: 3,
    META_DIARIA: 4,
    PORCENTAGEM_META: 5,
    QTDE_ORCAMENTOS: 6,
    VALOR_ORCAMENTOS: 7,
    TICKET_MEDIO_ORCAMENTOS: 8,
    QTDE_ITENS_ORCAMENTOS: 9,
    QTDE_SIMPLES_REMESSA: 10,
    VALOR_SIMPLES_REMESSA: 11,
    QTDE_ITENS_SIMPLES_REMESSA: 12,
    QTDE_PEDIDOS: 13,
    VALOR_PEDIDOS: 14,
    TICKET_MEDIO_PEDIDOS: 15,
    QTDE_ITENS_PEDIDOS: 16,
    TAXA_CONVERSAO_PEDIDOS: 17,
    TAXA_CONVERSAO_VALORES: 18,
    PEDIDOS_PIX: 19,
    VALORES_PIX: 20,
    PEDIDOS_CARTAO_CREDITO: 21,
    VALORES_CARTAO_CREDITO: 22,
    PEDIDOS_BOLETO: 23,
    VALORES_BOLETO: 24,
    PEDIDOS_ATRASADOS: 25,
    PEDIDOS_A_LIBERAR: 26,
    PEDIDOS_FATURADOS_MES: 27,
    PEDIDOS_EXPEDIDOS_MES: 28,
    PEDIDOS_ENVIO_ATRASO: 29,
    PEDIDOS_ENVIO_PRAZO: 30,
    PRIMEIRA_COMPRA: 31,
    RECOMPRA: 32,
    TEMPO_MEDIO_TOTAL: 33,
    REGIAO_CENTRO_OESTE: 34,
    REGIAO_NORDESTE: 35,
    REGIAO_NORTE: 36,
    REGIAO_SUDESTE: 37,
    REGIAO_SUL: 38,
    PEDIDOS_FRANQUIAS: 39,
    PEDIDOS_MATRIZ: 40
};

// CONVERSÃO DE MESES
const MESES = {
    'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
};

const MESES_NOME = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
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
    if (!value || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function normalizarMes(mes) {
    if (!mes) return '01';
    const mesUpper = String(mes).trim().toUpperCase().substring(0, 3);
    return MESES[mesUpper] || '01';
}

function getCurrentFilters() {
    const ano = document.getElementById('filterAno').value;
    const mes = document.getElementById('filterMes').value;
    const linha = document.getElementById('filterLinha').value;
    
    const mesNome = MESES_NOME[mes] || 'Out';
    
    return {
        ano,
        mes,
        linha,
        mesAno: `${mesNome}/${ano}`,
        mesNome
    };
}

// CARREGAR DADOS
async function fetchSheetData() {
    console.log('📡 Conectando ao Google Sheets...');
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;
        
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
        
        console.log(`✅ Dados carregados: ${allData.length} registros`);
        console.log('🔍 Primeiras linhas com dados:', allData.slice(0, 3));
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return false;
    }
}

// ENCONTRAR DADOS PARA OS FILTROS
function findDataForFilters(filters) {
    const mesFiltro = filters.mes; // Já vem como '01', '02', etc.
    const anoFiltro = filters.ano;
    const linhaFiltro = filters.linha;
    
    console.log(`🔍 Buscando: ${anoFiltro}-${mesFiltro}, Linha: ${linhaFiltro}`);
    
    // Buscar dados que correspondam aos filtros
    let dadosEncontrados = [];
    
    allData.forEach((row, index) => {
        const rowAno = String(row[COLS.ANO] || '').trim();
        const rowMes = normalizarMes(row[COLS.MES]);
        const rowLinha = String(row[COLS.LINHA] || '').trim();
        
        const anoMatch = rowAno === anoFiltro;
        const mesMatch = rowMes === mesFiltro;
        let linhaMatch = true;
        
        if (linhaFiltro !== 'todas') {
            linhaMatch = rowLinha === linhaFiltro;
        }
        
        if (anoMatch && mesMatch && linhaMatch) {
            console.log(`✅ Encontrado na linha ${index + 2}:`, row);
            dadosEncontrados.push(row);
        }
    });
    
    console.log(`📊 Total encontrado: ${dadosEncontrados.length} registros`);
    
    if (dadosEncontrados.length === 0) {
        console.log('⚠️ Nenhum dado encontrado para os filtros atuais');
        return null;
    }
    
    // Se encontrou apenas um, retorna ele
    if (dadosEncontrados.length === 1) {
        return dadosEncontrados[0];
    }
    
    // Se encontrou múltiplos, consolidar (para "todas" as linhas)
    const consolidado = new Array(HEADERS.length).fill(0);
    consolidado[COLS.ANO] = anoFiltro;
    consolidado[COLS.MES] = MESES_NOME[mesFiltro];
    consolidado[COLS.LINHA] = 'Consolidado';
    
    dadosEncontrados.forEach(row => {
        for (let i = COLS.META_MES; i < Math.min(row.length, HEADERS.length); i++) {
            if (row[i] !== undefined && row[i] !== '') {
                consolidado[i] += parseValue(row[i]);
            }
        }
    });
    
    return consolidado;
}

// CALCULAR KPIs
function calculateKPIs(currentRow) {
    if (!currentRow) {
        console.log('⚠️ Usando dados de exemplo');
        return {
            metaMes: 150000,
            metaDia: 5000,
            valorVendas: 87500,
            pedidosAtraso: 8,
            pedidosLiberar: 15,
            pedidosExpedidos: 42
        };
    }
    
    try {
        console.log('📈 Calculando KPIs...');
        
        return {
            metaMes: parseValue(currentRow[COLS.META_MES]),
            metaDia: parseValue(currentRow[COLS.META_DIARIA]),
            valorVendas: parseValue(currentRow[COLS.VALOR_PEDIDOS]),
            pedidosAtraso: parseValue(currentRow[COLS.PEDIDOS_ATRASADOS]),
            pedidosLiberar: parseValue(currentRow[COLS.PEDIDOS_A_LIBERAR]),
            pedidosExpedidos: parseValue(currentRow[COLS.PEDIDOS_EXPEDIDOS_MES])
        };
        
    } catch (error) {
        console.error('❌ Erro ao calcular KPIs:', error);
        return {
            metaMes: 150000,
            metaDia: 5000,
            valorVendas: 87500,
            pedidosAtraso: 8,
            pedidosLiberar: 15,
            pedidosExpedidos: 42
        };
    }
}

// DADOS DA FRANQUIA
function getFranquiaData(franquiaNome) {
    try {
        const filters = getCurrentFilters();
        const mesFiltro = filters.mes;
        const anoFiltro = filters.ano;
        
        const franquiaRow = allData.find(row => {
            const rowAno = String(row[COLS.ANO] || '').trim();
            const rowMes = normalizarMes(row[COLS.MES]);
            const rowLinha = String(row[COLS.LINHA] || '').trim();
            
            return rowAno === anoFiltro && rowMes === mesFiltro && rowLinha === franquiaNome;
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
        
        // Se não encontrou, retorna zeros
        return { qtdOrc: 0, valOrc: 0, qtdPed: 0, valPed: 0, ticket: 0, conversao: 0 };
        
    } catch (error) {
        console.error(`❌ Erro na franquia ${franquiaNome}:`, error);
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
        
    } catch (error) {
        console.error('❌ Erro ao atualizar KPIs:', error);
    }
}

function updateFranquias() {
    const franquias = [
        { codigo: 'cs', nome: 'FRA - Cacau Show' },
        { codigo: 'kp', nome: 'FRA - Kopenhagen' },
        { codigo: 'bc', nome: 'FRA - Brasil Cacau' },
        { codigo: 'pb', nome: 'PLB - PolyBee' },
        { codigo: 'id', nome: 'IND - Industries' },
        { codigo: 'skd', nome: 'SKD - Skullderia' }
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
            
            const barra = document.getElementById(`${franq.codigo}-conversao-bar`);
            if (barra) {
                barra.style.width = Math.min(data.conversao, 100) + '%';
            }
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar ${franq.codigo}:`, error);
        }
    });
}

// FUNÇÃO PRINCIPAL
async function updateDashboard() {
    console.log('🎯 Atualizando dashboard...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        if (allData.length === 0) {
            console.log('📥 Carregando dados...');
            await fetchSheetData();
        }
        
        const filters = getCurrentFilters();
        console.log('🎛️ Filtros:', filters);
        
        const currentRow = findDataForFilters(filters);
        const kpis = calculateKPIs(currentRow);
        
        updateKPIs(kpis, filters);
        updateFranquias();
        
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

// INICIALIZAÇÃO
function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard...');
    
    const now = new Date();
    document.getElementById('filterAno').value = now.getFullYear();
    document.getElementById('filterMes').value = '10';
    
    ['filterAno', 'filterMes', 'filterLinha'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDashboard);
    });
    
    setTimeout(updateDashboard, 1000);
}

// INICIAR
document.addEventListener('DOMContentLoaded', initializeDashboard);
