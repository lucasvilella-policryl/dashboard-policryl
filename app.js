// ATUALIZAR TUDO (VERSÃO COM GRÁFICOS CORRIGIDA)
async function updateDashboard() {
    console.log('🔄 Atualizando...');
    
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

        // FRANQUIAS (DADOS FIXOS POR ENQUANTO)
        ['cs','kp','bc','pb','id','skd'].forEach(codigo => {
            document.getElementById(`${codigo}-qtd-orc`).textContent = '25';
            document.getElementById(`${codigo}-val-orc`).textContent = formatCurrency(25000);
            document.getElementById(`${codigo}-qtd-ped`).textContent = '15';
            document.getElementById(`${codigo}-val-ped`).textContent = formatCurrency(15000);
            document.getElementById(`${codigo}-ticket`).textContent = formatCurrency(1000);
            document.getElementById(`${codigo}-conversao`).textContent = '60%';
            document.getElementById(`${codigo}-conversao-bar`).style.width = '60%';
        });

        // CRIAR GRÁFICOS (PARTE CORRIGIDA)
        createCharts(currentRow);

        console.log('✅ Dashboard OK! Gráficos criados!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// ADICIONE ESTAS FUNÇÕES DE GRÁFICOS AO SEU app.js (coloque antes da função updateDashboard)
function createCharts(currentRow) {
    createPagamentoChart(currentRow);
    createRegiaoChart(currentRow);
    createCompraChart(currentRow);
}

function createPagamentoChart(data) {
    const ctx = document.getElementById('pagamentoChart');
    if (!ctx) {
        console.log('❌ Canvas pagamentoChart não encontrado');
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (window.pagamentoChartInstance) {
        window.pagamentoChartInstance.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    // Dados de exemplo para pagamentos
    const pagamentosData = {
        labels: ['PIX', 'Cartão Crédito', 'Boleto', 'Outros'],
        datasets: [{
            data: [40, 35, 20, 5],
            backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    window.pagamentoChartInstance = new Chart(chartCtx, {
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

function createRegiaoChart(data) {
    const ctx = document.getElementById('regiaoChart');
    if (!ctx) {
        console.log('❌ Canvas regiaoChart não encontrado');
        return;
    }
    
    if (window.regiaoChartInstance) {
        window.regiaoChartInstance.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    // Dados de exemplo para regiões
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
    
    window.regiaoChartInstance = new Chart(chartCtx, {
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

function createCompraChart(data) {
    const ctx = document.getElementById('compraChart');
    if (!ctx) {
        console.log('❌ Canvas compraChart não encontrado');
        return;
    }
    
    if (window.compraChartInstance) {
        window.compraChartInstance.destroy();
    }
    
    const chartCtx = ctx.getContext('2d');
    
    // Dados de exemplo para compras
    const compraData = {
        labels: ['Primeira Compra', 'Recompra'],
        datasets: [{
            data: [35, 65],
            backgroundColor: ['#22c55e', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };
    
    window.compraChartInstance = new Chart(chartCtx, {
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
