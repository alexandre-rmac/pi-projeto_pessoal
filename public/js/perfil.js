const fkUsuario = sessionStorage.getItem('ID_USUARIO');

const CORES_MAP = {
    W: { nome: 'Branco', hex: '#fed', icone: 'fa-sun', texto: '#111' },
    U: { nome: 'Azul', hex: '#55d', icone: 'fa-droplet', texto: '#111' },
    B: { nome: 'Preto', hex: '#535', icone: 'fa-skull', texto: '#111' },
    R: { nome: 'Vermelho', hex: '#a33', icone: 'fa-fire', texto: '#111' },
    G: { nome: 'Verde', hex: '#373', icone: 'fa-tree', texto: '#111' }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!fkUsuario) {
        window.location.href = 'login.html';
        return;
    }

    await carregarDadosPerfil();
});

async function carregarDadosPerfil() {
    try {
        mostrarLoading();
        const data = await api.buscarDashboardPerfil(fkUsuario);
        renderizarDashboard(data);
    } catch (error) {
        console.error(error);
        mostrarModal('Erro', 'Não foi possível carregar o dashboard.');
    } finally {
        esconderLoading();
    }
}

function renderizarDashboard(data) {
    // 1. Indicadores Básicos
    document.getElementById('stat-total-decks').innerText = data.totalDecks;
    
    let completos = data.decks.filter(d => d.status === 'completo').length;
    let incompletos = data.decks.filter(d => d.status === 'incompleto').length;
    
    document.getElementById('stat-completos').innerText = completos;
    document.getElementById('stat-incompletos').innerText = incompletos;

    // 2. Cores Favoritas
    const coresFavoritasDiv = document.getElementById('cores-favoritas');
    const textoCores = document.getElementById('texto-cores');
    
    if (data.coresMaisUtilizadas.length > 0) {
        coresFavoritasDiv.innerHTML = data.coresMaisUtilizadas.map(cor => {
            const c = CORES_MAP[cor];
            return `<div class="cor-icone" style="background: ${c.hex};" title="${c.nome}"><i class="fa-solid ${c.icone}"></i></div>`;
        }).join('');

        if (data.coresMaisUtilizadas.length === 1) {
            textoCores.innerText = `Sua cor favorita é ${CORES_MAP[data.coresMaisUtilizadas[0]].nome}.`;
        } else {
            const nomes = data.coresMaisUtilizadas.map(c => CORES_MAP[c].nome).join(', ');
            textoCores.innerText = `Empate entre ${data.coresMaisUtilizadas.length} cores: ${nomes}.`;
        }
    } else {
        coresFavoritasDiv.innerHTML = '<span class="descricao">Nenhum deck cadastrado.</span>';
        textoCores.innerText = '';
    }

    // 3. Gráfico de Barras (Decks por Cor)
    const grafico = document.getElementById('grafico-cores');
    grafico.innerHTML = '';
    
    ['W', 'U', 'B', 'R', 'G'].forEach(cor => {
        const qtd = data.coresFreq[cor];
        const pct = data.totalDecks > 0 ? (qtd / data.totalDecks) * 100 : 0;
        const c = CORES_MAP[cor];

        grafico.innerHTML += `
            <div class="barra-item">
                <div class="barra-label"><i class="fa-solid ${c.icone}"></i> ${c.nome}</div>
                <div class="barra-track">
                    <div class="barra-fill" style="width: ${pct}%; background: ${c.hex};"></div>
                </div>
                <div class="barra-value">${qtd}</div>
            </div>
        `;
    });

    // 4. Chama a renderização dos cards de deck
    renderizarDecks(data.decks);
}

function renderizarDecks(decks) {
    const gridDecks = document.getElementById('grid-decks');
    
    // Guarda o HTML do card de "Criar Deck" antes de limpar
    const cardCriarHTML = document.getElementById('card-criar-deck').outerHTML;
    
    // Limpa todo o grid
    gridDecks.innerHTML = '';

    // Renderiza cada deck
    decks.forEach(deck => {
        const cores = deck.identidade !== 'C' ? deck.identidade.split('') : [];
        let bgGradient = 'background: var(--superficie-2);';
        
        if (cores.length === 1) {
            bgGradient = `background: linear-gradient(135deg, ${CORES_MAP[cores[0]].hex} 0%, var(--superficie) 100%);`;
        } else if (cores.length > 1) {
            let stops = cores.map((cor, i) => `${CORES_MAP[cor].hex} ${(i / (cores.length - 1)) * 100}%`).join(', ');
            bgGradient = `background: linear-gradient(135deg, ${stops});`;
        }

        const statusLabel = deck.status === 'completo' ? 'Completo' : 'Em construção';
        const statusClass = deck.status === 'completo' ? 'completo' : 'incompleto';

        const card = document.createElement('div');
        card.className = 'deck-card';
        card.innerHTML = `
            <div class="deck-card-header" style="${bgGradient}">
                <span class="deck-card-status ${statusClass}">
                    <i class="fa-solid fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i> ${statusLabel}
                </span>
                <div style="display: flex; gap: 4px;">
                    ${cores.map(cor => `<div class="cor-icone" style="width: 18px; height: 18px; font-size: 0.6rem; background: ${CORES_MAP[cor].hex};"><i class="fa-solid ${CORES_MAP[cor].icone}"></i></div>`).join('')}
                </div>
            </div>
            <div class="deck-card-body">
                <h3 class="deck-card-titulo">${deck.nome}</h3>
                <p class="deck-card-comandante">Comandante: ${deck.commander}</p>
                <div class="deck-card-progresso">
                    <span>Cartas</span>
                    <span>${deck.totalMainboard}/100</span>
                </div>
                <div class="deck-card-actions">
                    <a href="/usuario/editar-deck.html?id=${deck.id}" class="btn-action"><i class="fa-solid fa-pen"></i> Editar</a>
                    <a href="/dashboard-deck.html?id=${deck.id}" class="btn-action"><i class="fa-solid fa-chart-simple"></i> Dashboard</a>
                    <button class="btn-action excluir" onclick="confirmarExclusao(${deck.id}, '${deck.nome}')"><i class="fa-solid fa-trash"></i> Excluir</button>
                </div>
            </div>
        `;
        gridDecks.appendChild(card);
    });

    // Reinsere o card de Criar Deck no final
    gridDecks.insertAdjacentHTML('beforeend', cardCriarHTML);
}

function confirmarExclusao(idDeck, nomeDeck) {
    mostrarModalConfirmacao(
        'Excluir Deck',
        `Tem certeza que deseja excluir o deck <strong>${nomeDeck}</strong>? Esta ação não pode ser desfeita.`,
        async () => {
            try {
                mostrarLoading();
                await api.deletarDeck(idDeck, fkUsuario);
                
                // Recarrega os dados do perfil (isso já vai atualizar o topo e os cards)
                await carregarDadosPerfil();
                
            } catch (error) {
                console.error(error);
                mostrarModal('Erro', 'Não foi possível excluir o deck.');
            } finally {
                esconderLoading();
            }
        }
    );
}