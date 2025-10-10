// CONFIGURAÇÃO FINAL - DASHBOARD POLICRYL
const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'PEDIDOS GERAL',
    RANGE: 'A:AE'
};

console.log('🔥 Dashboard Policryl - Carregando...');

// MAPEAMENTO DE COLUNAS BASEADO NA SUA PLANILHA
const COLS = {
    MES: 0,              // A - MÊS
    NUM_OMIE: 1,         // B - Nº Omie
    NUM_VIRTUAL: 2,      // C - Nº L. Virtual
    LINHA: 3,            // D - Linha
    MATRIZ_FRANQ: 4,     // E - Matriz ou Franquia?
    ATENDIMENTO: 5,      // F - Atendimento por
    CNPJ_CPF: 6,         // G - CNPJ / CPF
    ESTADO: 7,           // H - Estado
    REGIAO: 8,           // I - Região Geográfica
    FORMA_PGTO: 9,       // J - Forma de Pagamento
    VALOR_PEDIDO: 10,    // K - Valor do Pedido
    ENXOVAL_REPOS: 11,   // L - Enxoval ou Repos.?
    DATA_INCLUSAO: 12,   // M - Data da Inclusão
    ENTRADA_PROD: 13,    // N - Entrad. Produção
    EMBALADO_EM: 14,     // O - Embalado em
    ENTRADA_FAT: 15,     // P - Entr. Faturamento
    NUM_NF: 16,          // Q - Nº Nota Fiscal
    FATURADO_EM: 17,     // R - Faturado em
    ENTRADA_EXP: 18,     // S - Entr. Expedição
    EXPEDIDO_EM: 19,     // T - Expedido em
    TRANSPORTADORA: 20,  // U - Transportadora
    DEAD_LINE: 21,       // V - Dead Line
    STATUS_PEDIDO: 22,   // W - Status do Pedido
    DURACAO: 23,         // X - Duração do Pedido
    SITUACAO: 24,        // Y - Situação do Pedido
    SITUACAO_CONCLUSAO: 25, // Z - Situação da Conclusão
    MES_PEDIDO: 26,      // AA - Mês do Pedido
    SEMANA_PEDIDO: 27,   // AB - Semana do Pedido
    MES_DEADLINE: 28,    // AC - Mês do Dead Line
    SEMANA_DEADLINE: 29, // AD - Semana do Dead Line
    MES_FATURAMENTO: 30  // AE - Mês do Faturamento
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

// CARREGAR DADOS DO GOOGLE SHEETS
async function fetchSheetData() {
    console.log('📡 Conectando ao Google Sheets...');
    
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
        
        console.log(`✅ Dados carregados: ${allData.length} registros`);
        console.log('📋 Cabeçalhos:', HEADERS);
        
        // DEBUG: Mostrar primeiras linhas
        console.log('🔍 Primeiras 3 linhas de dados:');
        for (let i = 0; i < Math.min(3, allData.length); i++) {
            console.log(`Linha ${i + 1}:`, allData[i]);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return false;
    }
}

// FILTRAR DADOS
function filterData(data, filters) {
    const filtered = data.filter(row => {
        const mesRow = row[COLS.MES] || '';
        const matchesMes = mesRow === filters.mesAno;
        
        let matchesLinha = true;
        if (filters.linha !== 'todas') {
            const linhaRow = row[COLS.LINHA] || '';
            matchesLinha = linhaRow.includes(filters.linha);
        }
        
        return matchesMes && matchesLinha;
    });
    
    console.log(`📊 Filtro: ${filters.mesAno} + ${filters.linha} = ${filtered.length} registros`);
    return filtered;
}

// CALCULAR KPIs COM DADOS REAIS
function calculateKPIs() {
    try {
        const filters = getCurrentFilters();
        const filteredData = filterData(allData, filters);
        
        console.log(`📈 Calculando KPIs para ${filteredData.length} registros...`);
        
        // VALOR EM VENDAS (apenas pedidos expedidos)
        const valorVendas = filteredData
            .filter(row => row[COLS.EXPEDIDO_EM] && row[COLS.EXPEDIDO_EM].trim() !== '')
            .reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO] || 0), 0);
        
        // PEDIDOS EM ATRASO (tem dead line mas não expedido)
        const pedidosAtraso = filteredData.filter(row => 
            row[COLS.DEAD_LINE] && 
            row[COLS.DEAD_LINE].trim() !== '' && 
            (!row[COLS.EXPEDIDO_EM] || row[COLS.EXPEDIDO_EM].trim() === '')
        ).length;
        
        // PEDIDOS À LIBERAR (status específico)
        const pedidosLiberar = filteredData.filter(row => {
            const status = (row[COLS.STATUS_PEDIDO] || '').toString().toLowerCase();
            return status.includes('aguardando') || status.includes('liberar');
        }).length;
        
        // PEDIDOS EXPEDIDOS
        const pedidosExpedidos = filteredData.filter(row => 
            row[COLS.EXPEDIDO_EM] && row[COLS.EXPEDIDO_EM].trim() !== ''
        ).length;
        
        console.log('📊 Resultados dos cálculos:', {
            valorVendas,
            pedidosAtraso,
            pedidosLiberar,
            pedidosExpedidos
        });
        
        return {
            metaMes: 150000, // Temporário - depois integramos com metas
            metaDia: 5000,   // Temporário
            valorVendas,
            pedidosAtraso,
            pedidosLiberar,
            pedidosExpedidos
        };
        
    } catch (error) {
        console.error('❌ Erro ao calcular KPIs:', error);
        return {
            metaMes: 150000,
            metaDia: 5000,
            valorVendas: 0,
            pedidosAtraso: 0,
            pedidosLiberar: 0,
            pedidosExpedidos: 0
        };
    }
}

// CALCULAR DADOS DAS FRANQUIAS
function calculateFranquiaData(franquiaNome) {
    try {
        const filters = getCurrentFilters();
        const allFiltered = filterData(allData, filters);
        
        // Filtrar pela franquia específica
        const filtered = allFiltered.filter(row => {
            const linhaRow = row[COLS.LINHA] || '';
            return linhaRow.includes(franquiaNome);
        });
        
        console.log(`🏪 ${franquiaNome}: ${filtered.length} registros`);
        
        // Orçamentos (Enxoval ou não expedidos)
        const orcamentos = filtered.filter(row => {
            const tipo = row[COLS.ENXOVAL_REPOS] || '';
            return tipo.includes('Enxoval') || !row[COLS.EXPEDIDO_EM] || row[COLS.EXPEDIDO_EM].trim() === '';
        });
        
        // Pedidos (expedidos)
        const pedidos = filtered.filter(row => 
            row[COLS.EXPEDIDO_EM] && row[COLS.EXPEDIDO_EM].trim() !== ''
        );
        
        const qtdOrc = orcamentos.length;
        const valOrc = orcamentos.reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO] || 0), 0);
        const qtdPed = pedidos.length;
        const valPed = pedidos.reduce((sum, row) => sum + parseValue(row[COLS.VALOR_PEDIDO] || 0), 0);
        const ticket = qtdPed > 0 ? valPed / qtdPed : 0;
        const conversao = qtdOrc > 0 ? (qtdPed / qtdOrc) * 100 : 0;
        
        return { qtdOrc, valOrc, qtdPed, valPed, ticket, conversao };
        
    } catch (error) {
        console.error(`❌ Erro ao calcular dados da franquia ${franquiaNome}:`, error);
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
        
        console.log('✅ KPIs atualizados com dados reais');
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
            const data = calculateFranquiaData(franq.nome);
            
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = formatNumber(data.qtdOrc);
            document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(data.valOrc);
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = formatNumber(data.qtdPed);
            document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(data.valPed);
            document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(data.ticket);
            document.getElementById(`${franq.codigo}-conversao`).textContent = data.conversao.toFixed(1) + '%';
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = Math.min(data.conversao, 100) + '%';
            
            console.log(`✅ ${franq.nome}: ${data.qtdPed} pedidos, R$ ${data.valPed}`);
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
        // Carregar dados se necessário
        if (allData.length === 0) {
            console.log('📥 Buscando dados do Google Sheets...');
            const success = await fetchSheetData();
            
            if (!success) {
                console.log('🔄 Falha ao carregar dados reais');
                return;
            }
        }
        
        const filters = getCurrentFilters();
        console.log('🎛️ Filtros aplicados:', filters);
        
        // Calcular KPIs com dados reais
        const kpis = calculateKPIs();
        updateKPIs(kpis, filters);
        
        // Atualizar franquias
        updateFranquias();
        
        console.log('✅ Dashboard atualizado com dados REAIS!');
        
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
    console.log('🚀 Inicializando Dashboard Policryl...');
    
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

console.log('🔧 Dashboard Policryl - Script carregado e pronto');
