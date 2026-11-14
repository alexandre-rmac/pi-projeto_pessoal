const urlParams = new URLSearchParams(window.location.search);
const idDeck = urlParams.get('id');
const fkUsuario = sessionStorage.getItem('ID_USUARIO');

let deckData = null;
let cartaPreviewAtual = null; 
let idBoardPreview = 1;       
let isFromSearch = false;

document.addEventListener('DOMContentLoaded', async () => {
    configurarAccordions();

    if (!idDeck) {
        alert("ID do deck não encontrado.");
        window.location.href = 'perfil.html';
        return;
    }

    await carregarDeckInicial();
    configurarBuscaCartas();
    configurarAcoesPreview();
});

function normalizarCarta(c) {
    return {
        ...c,
        cmc: c.cmc !== undefined ? c.cmc : (c.manaValue || 0), // <-- PROTEÇÃO
        name: c.nome || c.name,
        type: c.tipo || c.type,
        colors: c.cores ? c.cores.split('') : (c.colors || []),
        colorsId: c.identidade ? c.identidade.split('') : (c.colorsId || []),
        manaCost: c.manaCost || '',
        text: c.text || '',
        power: c.power || '',
        toughness: c.toughness || '',
        keywords: c.keywords || []
    };
}

async function carregarDeckInicial() {
    try {
        mostrarLoading();
        const res = await fetch(`/decks/${idDeck}/full?fkUsuario=${fkUsuario}`);
        if (!res.ok) throw new Error("Erro ao carregar deck.");
        deckData = await res.json();

        const uuids = [...new Set(deckData.cartas.map(c => c.uuid))];
        if (uuids.length > 0) {
            const detalhes = await api.detalhesPorUuids(uuids);
            const jsonMap = new Map(detalhes.map(d => [d.uuid, d]));
            deckData.cartas.forEach(c => {
                const json = jsonMap.get(c.uuid);
                if (json) { 
                    c.manaCost = json.manaCost; 
                    c.text = json.text; 
                    c.keywords = json.keywords;
                    c.power = json.power;
                    c.toughness = json.toughness;
                    if (c.cmc === undefined) c.cmc = json.cmc; // <-- PROTEÇÃO
                }
            });
        }

        document.getElementById('titulo-deck').innerText = deckData.deck.nome;
        document.getElementById('subtitulo-comandante').innerText = `Comandante: ${deckData.deck.commander}`;

        atualizarInterface();
    } catch (error) {
        console.error(error);
    } finally {
        esconderLoading();
    }
}

function atualizarInterface() {
    let mainboard = [], terrenos = [], sideboard = [], maybeboard = [], wishboard = [];
    let comandante = null;

    deckData.cartas.forEach(c => {
        if (c.nome === deckData.deck.commander) comandante = c;
        else if (c.idBoard === 1) { if (c.tipo.includes('Land')) terrenos.push(c); else mainboard.push(c); }
        else if (c.idBoard === 2) sideboard.push(c);
        else if (c.idBoard === 3) maybeboard.push(c);
        else if (c.idBoard === 4) wishboard.push(c);
    });

    if (comandante) {
        const cNorm = normalizarCarta(comandante);
        const manaHtml = renderManaCost(cNorm.manaCost);
        const box = document.getElementById('area-comandante');
        box.innerHTML = `
            <div class="comandante-icon"><i class="fa-solid fa-crown"></i></div>
            <div style="flex-grow: 1;">
                <span class="descricao" style="text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">Comandante</span>
                <h2 class="titulo" style="font-size: 1.3rem; margin: 0;">${cNorm.name}</h2>
            </div>
            <div class="card-mana" style="display: flex; gap: 2px;">${manaHtml}</div>
        `;
        if (!cartaPreviewAtual) abrirPreview(comandante, 1, false);
        box.onclick = () => abrirPreview(comandante, 1, false);
    }

    renderizarBoardGrid(mainboard, 'grid-cmc-mainboard', 1);
    renderizarBoardGrid(terrenos, 'grid-cmc-terrenos', 1);
    renderizarBoardSecundario(sideboard, 'conteudo-sideboard', 2);
    renderizarBoardSecundario(maybeboard, 'conteudo-maybeboard', 3);
    renderizarBoardSecundario(wishboard, 'conteudo-wishboard', 4);

    document.getElementById('badge-mainboard').innerText = mainboard.reduce((a, c) => a + Number(c.quantidade), 0);
    document.getElementById('badge-terrenos').innerText = terrenos.reduce((a, c) => a + Number(c.quantidade), 0);
    document.getElementById('badge-sideboard').innerText = sideboard.reduce((a, c) => a + Number(c.quantidade), 0);
    document.getElementById('badge-maybeboard').innerText = maybeboard.reduce((a, c) => a + Number(c.quantidade), 0);
    document.getElementById('badge-wishboard').innerText = wishboard.reduce((a, c) => a + Number(c.quantidade), 0);

    document.getElementById('board-terrenos').style.display = terrenos.length > 0 ? 'block' : 'none';
    atualizarValidacoes([...mainboard, ...terrenos], comandante, deckData.deck.identidade);
}

function renderizarBoardGrid(cartas, containerId, idBoard) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';
    if (cartas.length === 0) return;

    const cmcGroups = {};
    for (let i = 0; i <= 7; i++) cmcGroups[i] = [];
    
    cartas.forEach(c => {
        const cmcVal = c.cmc !== undefined && c.cmc !== null ? Number(c.cmc) : 0;
        const key = cmcVal >= 7 ? '7+' : cmcVal;
        if (!cmcGroups[key]) cmcGroups[key] = [];
        cmcGroups[key].push(c);
    });

    Object.keys(cmcGroups).forEach(cmc => {
        if (cmcGroups[cmc].length === 0) return;
        
        cmcGroups[cmc].sort((a, b) => (a.nome || a.name).localeCompare(b.nome || b.name));
        
        const col = document.createElement('div');
        col.className = 'cmc-column';

        cmcGroups[cmc].forEach(carta => {
            col.appendChild(criarCardVisual(carta, idBoard));
        });
        grid.appendChild(col);
    });
}

function renderizarBoardSecundario(cartas, containerId, idBoard) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (cartas.length === 0) {
        container.innerHTML = `<p class="board-vazio">Nenhuma carta registrada neste board.</p>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid-cmc';

    const cmcGroups = {};
    for (let i = 0; i <= 7; i++) cmcGroups[i] = [];
    
    cartas.forEach(c => {
        const cmcVal = c.cmc !== undefined && c.cmc !== null ? Number(c.cmc) : 0;
        const key = cmcVal >= 7 ? '7+' : cmcVal;
        if (!cmcGroups[key]) cmcGroups[key] = [];
        cmcGroups[key].push(c);
    });

    Object.keys(cmcGroups).forEach(cmc => {
        if (cmcGroups[cmc].length === 0) return;
        
        cmcGroups[cmc].sort((a, b) => (a.nome || a.name).localeCompare(b.nome || b.name));

        const col = document.createElement('div');
        col.className = 'cmc-column';
        cmcGroups[cmc].forEach(carta => col.appendChild(criarCardVisual(carta, idBoard)));
        grid.appendChild(col);
    });
    container.appendChild(grid);
}

function criarCardVisual(carta, idBoard) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-visual-wrapper';
    const container = document.createElement('div');
    wrapper.appendChild(container);
    renderizarCarta(normalizarCarta(carta), container);
    wrapper.onclick = () => abrirPreview(carta, idBoard, false);
    return wrapper;
}

// ==========================================
// 2. PREVIEW INTELIGENTE (MOVE vs ADICIONAR)
// ==========================================
function abrirPreview(carta, idBoard, fromSearch = false) {
    cartaPreviewAtual = carta;
    idBoardPreview = idBoard;
    isFromSearch = fromSearch;

    const previewArea = document.getElementById('preview-carta');
    const acoesArea = document.getElementById('preview-acoes');
    const container = document.getElementById('preview-card-render');
    const btnMover = document.getElementById('btn-mover-preview');
    const btnExcluir = document.getElementById('btn-excluir-preview');
    const inputQtd = document.getElementById('input-qtd');
    const selectBoard = document.getElementById('select-board');

    container.innerHTML = '';
    renderizarCarta(normalizarCarta(carta), container);

    if (isFromSearch) {
        btnMover.innerHTML = "Adicionar ao Deck";
        btnMover.classList.remove('btn-outline');
        btnMover.classList.add('btn');
        btnExcluir.classList.add('hidden');
        inputQtd.value = 1;
        inputQtd.disabled = false;
        selectBoard.value = 1;
    } else {
        btnMover.innerHTML = "Mover";
        btnMover.classList.remove('btn');
        btnMover.classList.add('btn-outline');
        btnExcluir.classList.remove('hidden');
        inputQtd.max = carta.quantidade || 1;
        inputQtd.value = 1;
        inputQtd.disabled = false;
        selectBoard.value = idBoard;
    }

    previewArea.classList.remove('hidden');
    acoesArea.classList.remove('hidden');
}

function configurarAcoesPreview() {
    const btnExcluir = document.getElementById('btn-excluir-preview');
    const btnMover = document.getElementById('btn-mover-preview');

    btnExcluir.onclick = async () => {
        if (!cartaPreviewAtual || isFromSearch) return;
        const qtd = parseInt(document.getElementById('input-qtd').value);

        await removerCarta(cartaPreviewAtual, idBoardPreview, qtd);
        document.getElementById('preview-carta').classList.add('hidden');
        document.getElementById('preview-acoes').classList.add('hidden');
        cartaPreviewAtual = null;
    };

    btnMover.onclick = async () => {
        if (!cartaPreviewAtual) return;
        const qtd = parseInt(document.getElementById('input-qtd').value);
        const destino = parseInt(document.getElementById('select-board').value);

        if (isFromSearch) {
            await adicionarCarta(cartaPreviewAtual, destino, qtd);
        } else {
            if (destino === idBoardPreview) return alert("A carta já está neste board.");
            await removerCarta(cartaPreviewAtual, idBoardPreview, qtd);
            await adicionarCarta(cartaPreviewAtual, destino, qtd);
        }

        document.getElementById('preview-carta').classList.add('hidden');
        document.getElementById('preview-acoes').classList.add('hidden');
        cartaPreviewAtual = null;
    };
}

// ==========================================
// 3. ADIÇÃO E REMOÇÃO NO BANCO
// ==========================================
async function adicionarCarta(carta, idBoard, quantidade = 1) {
    try {
        atualizarStatus('salvando');
        const c = normalizarCarta(carta); 
        
        await api.adicionarCartaAoDeck(idDeck, {
            idCarta: c.idCarta || c.id,
            idBoard: idBoard,
            quantidade: quantidade,
            fkUsuario: fkUsuario
        });

        let existente = deckData.cartas.find(x => x.idCarta === (c.idCarta || c.id) && x.idBoard === idBoard);
        
        if (existente) {
            existente.quantidade = Number(existente.quantidade) + quantidade;
        } else {
            deckData.cartas.push({
                idCarta: c.idCarta || c.id,
                nome: c.name,
                tipo: c.type,
                cmc: c.cmc || 0, // <-- GARANTE QUE NUNCA SERÁ UNDEFINED
                uuid: c.uuid,
                identidade: c.identidade || (c.colorsId ? c.colorsId.join('') : 'C'),
                cores: c.colors.join(''), 
                quantidade: quantidade, 
                idBoard: idBoard,
                manaCost: c.manaCost, 
                text: c.text, 
                keywords: c.keywords,
                power: c.power,
                toughness: c.toughness
            });
        }
        atualizarInterface();
        atualizarStatus('salvo');
    } catch (error) {
        atualizarStatus('erro'); console.error(error);
    }
}

async function removerCarta(carta, idBoard, quantidade = 1) {
    try {
        atualizarStatus('salvando');
        const idCarta = carta.idCarta || carta.id;

        const res = await fetch(`/decks/${idDeck}/cards/${idCarta}?idBoard=${idBoard}&fkUsuario=${fkUsuario}&quantidade=${quantidade}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Erro ao remover");

        const index = deckData.cartas.findIndex(c => c.idCarta === idCarta && c.idBoard === idBoard);
        if (index !== -1) {
            if (deckData.cartas[index].quantidade > quantidade) deckData.cartas[index].quantidade -= quantidade;
            else deckData.cartas.splice(index, 1);
        }
        atualizarInterface();
        atualizarStatus('salvo');
    } catch (error) {
        atualizarStatus('erro'); console.error(error);
    }
}

// ==========================================
// 4. BUSCA LATERAL
// ==========================================
function configurarBuscaCartas() {
    const inputBusca = document.getElementById('search-card');
    const suggestionsBox = document.getElementById('suggestions');

    const buscar = debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) { suggestionsBox.style.display = 'none'; return; }

        try {
            const res = await fetch(`/cards/buscar?nome=${encodeURIComponent(query)}&limite=20&identidade=${deckData.deck.identidade}`);
            const resultados = await res.json();
            if (resultados.length === 0) { suggestionsBox.style.display = 'none'; return; }

            suggestionsBox.innerHTML = resultados.map(c => `
                <div class="suggestion-item" data-uuid="${c.codigo}" data-id="${c.id}">${c.nome}</div>
            `).join('');
            suggestionsBox.style.display = 'block';
        } catch (err) { console.error(err); }
    }, 400);

    inputBusca.addEventListener('input', buscar);

    suggestionsBox.addEventListener('click', async (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;

        const uuid = item.dataset.uuid;
        const idCarta = item.dataset.id;
        suggestionsBox.style.display = 'none';
        inputBusca.value = '';

        try {
            mostrarLoading();
            const detalhes = await api.detalhesPorUuids([uuid]);
            if (detalhes.length > 0) {
                let cardJson = detalhes[0];
                cardJson.id = Number(idCarta);
                
                abrirPreview(cardJson, 1, true); 
            }
        } catch (err) { console.error(err); } finally { esconderLoading(); }
    });
}

// ==========================================
// 5. UTILITÁRIOS E VALIDAÇÕES
// ==========================================
function configurarAccordions() {
    document.querySelectorAll('.board-header-toggle').forEach(header => {
        header.addEventListener('click', (e) => {
            const details = e.currentTarget.parentElement;
            const content = details.querySelector('.board-content');
            const icon = header.querySelector('i');
            if (content) {
                content.classList.toggle('hidden');
                icon.className = content.classList.contains('hidden') ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down';
            }
        });
    });
}

function atualizarStatus(status) {
    const el = document.getElementById('status-salvamento');
    if (status === 'salvando') { el.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`; el.style.color = 'var(--destaque)'; }
    else if (status === 'salvo') { el.innerHTML = `<i class="fa-solid fa-check"></i> Salvo`; el.style.color = 'var(--destaque-verde)'; }
    else if (status === 'erro') { el.innerHTML = `<i class="fa-solid fa-xmark"></i> Erro ao salvar`; el.style.color = 'var(--destaque-vermelho)'; }
}

function atualizarValidacoes(cartasMainboard, comandante, identidadeDeck) {
    let totalCartas = 0, cmcTotal = 0, totalTerrenos = 0;
    let criaturas = 0, naoCriaturas = 0;
    let copiasMap = {}, valIdentidadeOk = true;

    cartasMainboard.forEach(c => {
        const qtd = Number(c.quantidade);
        totalCartas += qtd;

        if (!c.tipo.includes('Land')) cmcTotal += (Number(c.cmc) * qtd);
        else totalTerrenos += qtd;

        if (c.tipo.includes('Creature')) criaturas += qtd;
        else if (!c.tipo.includes('Land')) naoCriaturas += qtd;

        if (!c.tipo.includes('Basic Land')) copiasMap[c.nome] = (copiasMap[c.nome] || 0) + qtd;

        if (c.identidade !== 'C' && identidadeDeck !== 'C') {
            for (let cor of c.identidade) if (!identidadeDeck.includes(cor)) valIdentidadeOk = false;
        }
    });

    if (comandante) {
        totalCartas += 1;
        cmcTotal += Number(comandante.cmc || 0);
        if (comandante.tipo.includes('Creature')) criaturas += 1; else naoCriaturas += 1;
    }

    const cartasNaoTerreno = totalCartas - totalTerrenos;
    document.getElementById('stat-total').innerText = totalCartas;
    document.getElementById('stat-criaturas').innerText = criaturas;
    document.getElementById('stat-nao-criaturas').innerText = naoCriaturas;
    document.getElementById('stat-terrenos').innerText = totalTerrenos;
    document.getElementById('stat-cmc-medio').innerText = cartasNaoTerreno > 0 ? (cmcTotal / cartasNaoTerreno).toFixed(1) : '0.0';

    const valTotal = document.getElementById('val-total');
    if (totalCartas === 100) { valTotal.innerHTML = `<i class="fa-solid fa-circle-check"></i> 100 cartas no deck`; valTotal.className = 'ok'; }
    else { valTotal.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${totalCartas} / 100 cartas`; valTotal.className = 'erro'; }

    const valCopias = document.getElementById('val-copias');
    if (!Object.values(copiasMap).some(qtd => qtd > 1)) { valCopias.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sem cópias repetidas`; valCopias.className = 'ok'; }
    else { valCopias.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Cópias repetidas`; valCopias.className = 'erro'; }

    const valIdentidade = document.getElementById('val-identidade');
    if (valIdentidadeOk) { valIdentidade.innerHTML = `<i class="fa-solid fa-circle-check"></i> Identidade de cor respeitada`; valIdentidade.className = 'ok'; }
    else { valIdentidade.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Cores fora da identidade`; valIdentidade.className = 'erro'; }
}