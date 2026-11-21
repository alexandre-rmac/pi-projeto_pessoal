const urlParams = new URLSearchParams(window.location.search);
const idDeck = urlParams.get('id');
const fkUsuario = sessionStorage.getItem('ID_USUARIO');

// Paleta de cores padrão do projeto
const CORES = {
    W: '#f9faf4', U: '#aae0fa', B: '#a69f9c', R: '#f9a98c', G: '#a5d6a7', C: '#aaa'
};
const CORES_NOMES = { W: 'Branco', U: 'Azul', B: 'Preto', R: 'Vermelho', G: 'Verde', C: 'Incolor' };
const TIPOS_NOMES = {
    Creature: 'Criaturas', Instant: 'Instantâneas', Sorcery: 'Feitiços',
    Artifact: 'Artefatos', Enchantment: 'Encantamentos', Planeswalker: 'Planeswalkers', Land: 'Terrenos'
};

// Configuração global do Chart.js para tema escuro
Chart.defaults.color = '#aba999';
Chart.defaults.font.family = "'Linden Hill', sans-serif";
Chart.defaults.plugins.legend.display = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!idDeck || !fkUsuario) return;

    try {
        mostrarLoading();
        const data = await api.buscarDashboardDeck(idDeck, fkUsuario);
        
        // Preencher Cabeçalho e Cards Básicos
        document.getElementById('titulo-deck').innerText = data.deck.nome;
        document.getElementById('subtitulo-comandante').innerText = `Comandante: ${data.deck.commander}`;
        document.getElementById('btn-voltar').href = `/usuario/editar-deck.html?id=${idDeck}`;
        
        document.getElementById('stat-total').innerText = data.totalCartas;
        document.getElementById('stat-terrenos').innerText = data.totalTerrenos;
        document.getElementById('stat-cmc').innerText = data.cmcMedioPadrao;
        document.getElementById('stat-cmc-ponderado').innerText = `(Ponderado: ${data.cmcMedioPonderado})`;

        // Renderizar Gráficos
        renderizarCurvaMana(data.curvaMana);
        renderizarDevocao(data.devocao);
        renderizarProducao(data.producaoMana);
        renderizarTipos(data.tiposCount);

    } catch (error) {
        console.error(error);
        mostrarModal('Erro', 'Erro ao carregar a dashboard do deck.');
    } finally {
        esconderLoading();
    }
});

function renderizarCurvaMana(curva) {
    const labels = Object.keys(curva);
    const valores = Object.values(curva);
    const ctx = document.getElementById('chart-curva').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l === '7+' ? '7+' : l),
            datasets: [{
                data: valores,
                backgroundColor: '#d6a441', // Destaque
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderizarDevocao(devocao) {
    const labels = Object.keys(devocao).filter(c => devocao[c] > 0);
    const valores = labels.map(c => devocao[c]);
    const cores = labels.map(c => CORES[c]);
    const ctx = document.getElementById('chart-devocao').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(c => CORES_NOMES[c]),
            datasets: [{ data: valores, backgroundColor: cores, borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: true, position: 'right' } }
        }
    });
}

function renderizarProducao(producao) {
    const labels = Object.keys(producao).filter(c => producao[c] > 0);
    const valores = labels.map(c => producao[c]);
    const cores = labels.map(c => CORES[c]);
    const ctx = document.getElementById('chart-producao').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(c => CORES_NOMES[c]),
            datasets: [{ data: valores, backgroundColor: cores, borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', // Transforma em barras horizontais
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderizarTipos(tipos) {
    // Ordena do maior para o menor
    const labels = Object.keys(tipos).sort((a, b) => tipos[b] - tipos[a]);
    const valores = labels.map(t => tipos[t]);
    
    const ctx = document.getElementById('chart-tipos').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(t => TIPOS_NOMES[t] || t),
            datasets: [{
                data: valores,
                backgroundColor: '#c4a466', // Destaque suave
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { grid: { display: false } }
            }
        }
    });
}