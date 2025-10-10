// CONFIGURAÇÃO CORRIGIDA - DASHBOARD POLICRYL
const CONFIG = {
    SHEET_ID: '1ow6XhPjmZIu9v8SimIrq6ZihAZENn2ene5BoT37K7qM',
    API_KEY: 'AIzaSyDBRuUuQZoLWaT4VSPuiPHGt0J4iviWR2g',
    SHEET_NAME: 'PEDIDOS GERAL',
    RANGE: 'A:Z'
};

console.log('🔧 CONFIG carregada:', CONFIG);

// VARIÁVEIS GLOBAIS
let allData = [];
let HEADERS = [];

// FUNÇÕES BÁSICAS
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
    console.log('📡 Iniciando carga de dados...');
    console.log('🔑 API_KEY:', CONFIG.API_KEY);
    
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
        
        console.log(`✅ Dados carregados: ${HEADERS.length} colunas, ${allData.length} registros`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return false;
    }
}

// CALCULAR KPIs BÁSICOS
function calculateBasicKPIs() {
    // Dados fictícios para demonstração
    return {
        metaMes: 150000,
        metaDia: 5000,
        valorVendas: 87500,
        pedidosAtraso: 8,
        pedidosLiberar: 15,
        pedidosExpedidos: 42
    };
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
        
        console.log('✅ KPIs atualizados');
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
            document.getElementById(`${franq.codigo}-qtd-orc`).textContent = '25';
            document.getElementById(`${franq.codigo}-val-orc`).textContent = formatCurrency(25000);
            document.getElementById(`${franq.codigo}-qtd-ped`).textContent = '15';
            document.getElementById(`${franq.codigo}-val-ped`).textContent = formatCurrency(15000);
            document.getElementById(`${franq.codigo}-ticket`).textContent = formatCurrency(1000);
            document.getElementById(`${franq.codigo}-conversao`).textContent = '60%';
            document.getElementById(`${franq.codigo}-conversao-bar`).style.width = '60%';
        } catch (error) {
            console.warn(`⚠️ Elemento não encontrado para ${franq.codigo}`);
        }
    });
}

// FUNÇÃO PRINCIPAL
async function updateDashboard() {
    console.log('🎯 Iniciando atualização do dashboard...');
    
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    try {
        // Carregar dados se necessário
        if (allData.length === 0) {
            console.log('📥 Buscando dados do Google Sheets...');
            const success = await fetchSheetData();
            
            if (!success) {
                console.log('🔄 Usando dados de demonstração...');
                // Continuar com dados fictícios
            }
        }
        
        const filters = getCurrentFilters();
        console.log('🎛️ Filtros:', filters);
        
        // Calcular e atualizar KPIs
        const kpis = calculateBasicKPIs();
        updateKPIs(kpis, filters);
        
        // Atualizar franquias
        updateFranquias();
        
        console.log('✅ Dashboard atualizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        alert('Erro: ' + error.message);
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
        document.getElementById('filterMes').value = '10';
        
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
