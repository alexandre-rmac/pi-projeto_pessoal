const urlParams = new URLSearchParams(window.location.search);
const idDeck = urlParams.get('id');
const fkUsuario = sessionStorage.getItem('ID_USUARIO');

let deckData = null;
let cartaPreviewAtual = null;
let idBoardPreview = 1;
let isFromSearch = false;
let abaAtiva = 1;

document.addEventListener('DOMContentLoaded', async () => {
    if (!idDeck) {
        alert("ID do deck não encontrado.");
        window.location.href = 'perfil.html';
        return;
    }

    configurarAbas();
    configurarImportacaoCSV();
    configurarAcoesPreview();
    configurarBuscaCartas();

    await carregarDeckInicial();
});

function prepararCartas(cartas) {
    return cartas.map(c => ({
        ...c,
        idCarta: c.idCarta || c.id,
        colors: c.colorsStr ? c.colorsStr.split('') : [],
        colorsId: c.identidade ? c.identidade.split('') : []
    }));
}

async function carregarDeckInicial() {
    try {
        atualizarStatus('salvando');
        const data = await api.buscarDeckCompleto(idDeck, fkUsuario);
        deckData = {
            deck: data.deck,
            cartas: prepararCartas(data.cartas)
        };

        document.getElementById('titulo-deck').innerText = deckData.deck.nome;
        document.getElementById('subtitulo-comandante').innerText = `Comandante: ${deckData.deck.commander}`;

        atualizarInterface();
        atualizarStatus('salvo');
    } catch (error) {
        console.error(error);
        atualizarStatus('erro');
        mostrarModal('Erro', 'Não foi possível carregar o deck.');
    }
}

function configurarAbas() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            abaAtiva = parseInt(e.currentTarget.dataset.board);
            atualizarInterface();
        });
    });
}

function atualizarInterface() {
    const cartasDoBoard = deckData.cartas.filter(c => c.idBoard === abaAtiva);
    const comandante = deckData.cartas.find(c => c.name === deckData.deck.commander);

    [1, 2, 3, 4].forEach(b => {
        const total = deckData.cartas.filter(c => c.idBoard === b).reduce((acc, c) => acc + c.quantidade, 0);
        document.getElementById(`badge-${b}`).innerText = total;
    });

    renderizarAbaAtiva(cartasDoBoard, comandante);
    atualizarValidacoes(deckData.cartas.filter(c => c.idBoard === 1), comandante, deckData.deck.identidade);
}

function renderizarAbaAtiva(cartas, comandante) {
    const grid = document.getElementById('grid-cmc');
    grid.innerHTML = '';

    if (cartas.length === 0 && !(abaAtiva === 1 && comandante)) {
        grid.innerHTML = `<p class="board-vazio">Nenhuma carta registrada neste board.</p>`;
        return;
    }

    const cmcGroups = {};
    const terrenosNaoBasicos = [];
    const terrenosBasicos = [];

    cartas.forEach(c => {
        if (c.idCarta === comandante.idCarta) return
        if (c.type.includes('Land')) {
            if (c.type.includes('Basic')) terrenosBasicos.push(c);
            else terrenosNaoBasicos.push(c);
        } else {
            const key = c.cmc >= 7 ? '7+' : c.cmc;
            if (!cmcGroups[key]) cmcGroups[key] = [];
            cmcGroups[key].push(c);
        }
    });

    if (abaAtiva === 1 && comandante) {
        const colComandante = document.createElement('div');
        colComandante.className = 'cmc-column commander-column';
        colComandante.innerHTML = `<span class="cmc-title"><i class="fa-solid fa-crown"></i> Comandante</span>`;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'card-visual-wrapper';
        const cardContainer = document.createElement('div');
        wrapper.appendChild(cardContainer);
        renderizarCarta(comandante, cardContainer);
        wrapper.onclick = () => abrirPreview(comandante, 1, false);
        
        colComandante.appendChild(wrapper);
        grid.appendChild(colComandante);
    }

    Object.keys(cmcGroups).sort((a,b) => a === '7+' ? 1 : (b === '7+' ? -1 : a - b)).forEach(cmc => {
        const cartasCmc = cmcGroups[cmc];
        cartasCmc.sort((a, b) => a.name.localeCompare(b.name));

        const col = document.createElement('div');
        col.className = 'cmc-column';
        
        cartasCmc.forEach(carta => {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-visual-wrapper';
            const cardContainer = document.createElement('div');
            wrapper.appendChild(cardContainer);
            renderizarCarta(carta, cardContainer);
            wrapper.onclick = () => abrirPreview(carta, abaAtiva, false);
            col.appendChild(wrapper);
        });
        grid.appendChild(col);
    });

    if (terrenosNaoBasicos.length > 0) {
        terrenosNaoBasicos.sort((a, b) => a.name.localeCompare(b.name));
        const col = document.createElement('div');
        col.className = 'cmc-column';
        terrenosNaoBasicos.forEach(carta => {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-visual-wrapper';
            const cardContainer = document.createElement('div');
            wrapper.appendChild(cardContainer);
            renderizarCarta(carta, cardContainer);
            wrapper.onclick = () => abrirPreview(carta, abaAtiva, false);
            col.appendChild(wrapper);
        });
        grid.appendChild(col);
    }

    if (terrenosBasicos.length > 0) {
        terrenosBasicos.sort((a, b) => a.name.localeCompare(b.name));
        const col = document.createElement('div');
        col.className = 'cmc-column';
        terrenosBasicos.forEach(carta => {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-visual-wrapper';
            const cardContainer = document.createElement('div');
            wrapper.appendChild(cardContainer);
            renderizarCarta(carta, cardContainer);
            wrapper.onclick = () => abrirPreview(carta, abaAtiva, false);
            col.appendChild(wrapper);
        });
        grid.appendChild(col);
    }
}

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
    renderizarCarta(carta, container);

    if (isFromSearch) {
        btnMover.innerHTML = "Adicionar ao Deck";
        btnMover.classList.replace('btn-outline', 'btn');
        btnExcluir.classList.add('hidden');
        inputQtd.value = 1;
        selectBoard.value = 1;
    } else {
        btnMover.innerHTML = "Mover";
        btnMover.classList.replace('btn', 'btn-outline');
        btnExcluir.classList.remove('hidden');
        inputQtd.max = carta.quantidade || 1;
        inputQtd.value = 1;
        selectBoard.value = idBoard;
    }

    previewArea.classList.remove('hidden');
    acoesArea.classList.remove('hidden');
}

function configurarAcoesPreview() {
    document.getElementById('btn-excluir-preview').onclick = async () => {
        if (!cartaPreviewAtual || isFromSearch) return;
        const qtd = parseInt(document.getElementById('input-qtd').value);
        await removerCarta(cartaPreviewAtual, idBoardPreview, qtd);
        fecharPreview();
    };

    document.getElementById('btn-mover-preview').onclick = async () => {
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
        fecharPreview();
    };
}

function fecharPreview() {
    document.getElementById('preview-carta').classList.add('hidden');
    document.getElementById('preview-acoes').classList.add('hidden');
    cartaPreviewAtual = null;
}

async function adicionarCarta(carta, idBoard, quantidade = 1) {
    try {
        atualizarStatus('salvando');
        await api.adicionarCartaAoDeck(idDeck, {
            idCarta: carta.idCarta || carta.id,
            idBoard: idBoard,
            quantidade: quantidade,
            fkUsuario: fkUsuario
        });

        let existente = deckData.cartas.find(x => x.idCarta === (carta.idCarta || carta.id) && x.idBoard === idBoard);
        if (existente) {
            existente.quantidade += quantidade;
        } else {
            deckData.cartas.push({ ...carta, idCarta: carta.idCarta || carta.id, idBoard, quantidade });
        }
        atualizarInterface();
        atualizarStatus('salvo');
    } catch (error) {
        atualizarStatus('erro');
        console.error(error);
        mostrarModal('Erro', 'Erro ao adicionar carta.');
    }
}

async function removerCarta(carta, idBoard, quantidade = 1) {
    try {
        atualizarStatus('salvando');
        await api.removerCarta(idDeck, carta.idCarta, idBoard, fkUsuario, quantidade);

        const index = deckData.cartas.findIndex(c => c.idCarta === carta.idCarta && c.idBoard === idBoard);
        if (index !== -1) {
            if (deckData.cartas[index].quantidade > quantidade) deckData.cartas[index].quantidade -= quantidade;
            else deckData.cartas.splice(index, 1);
        }
        atualizarInterface();
        atualizarStatus('salvo');
    } catch (error) {
        atualizarStatus('erro');
        console.error(error);
        mostrarModal('Erro', 'Erro ao remover carta.');
    }
}

function configurarBuscaCartas() {
    const inputBusca = document.getElementById('search-card');
    const suggestionsBox = document.getElementById('suggestions');

    inputBusca.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) { suggestionsBox.style.display = 'none'; return; }

        try {
            const res = await fetch(`/cards/buscar?nome=${encodeURIComponent(query)}&limite=20&identidade=${deckData.deck.identidade}`);
            const resultados = await res.json();
            if (resultados.length === 0) { suggestionsBox.style.display = 'none'; return; }

            suggestionsBox.innerHTML = resultados.map(c => `
                <div class="suggestion-item" data-card='${encodeURIComponent(JSON.stringify(c))}'>${c.name}</div>
            `).join('');
            suggestionsBox.style.display = 'block';
        } catch (err) { console.error(err); }
    }, 400));

    suggestionsBox.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;

        suggestionsBox.style.display = 'none';
        inputBusca.value = '';

        try {
            const cardJson = JSON.parse(decodeURIComponent(item.dataset.card));
            cardJson.idCarta = cardJson.id; 
            cardJson.colors = cardJson.colorsStr ? cardJson.colorsStr.split('') : [];
            cardJson.colorsId = cardJson.identidade ? cardJson.identidade.split('') : [];
            
            abrirPreview(cardJson, 1, true); 
        } catch (err) { 
            console.error("Erro ao ler carta da busca:", err); 
        }
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
        const qtd = c.quantidade;
        totalCartas += qtd;

        if (!c.type.includes('Land')) cmcTotal += (c.cmc * qtd);
        else totalTerrenos += qtd;

        if (c.type.includes('Creature')) criaturas += qtd;
        else if (!c.type.includes('Land')) naoCriaturas += qtd;

        if (!c.type.includes('Basic Land')) copiasMap[c.name] = (copiasMap[c.name] || 0) + qtd;

        if (c.identidade !== 'C' && identidadeDeck !== 'C') {
            for (let cor of c.identidade) if (!identidadeDeck.includes(cor)) valIdentidadeOk = false;
        }
    });

    if (comandante) {
        totalCartas += 1;
        cmcTotal += comandante.cmc;
        if (comandante.type.includes('Creature')) criaturas += 1; else naoCriaturas += 1;
    }

    const cartasNaoTerreno = totalCartas - totalTerrenos;
    
    document.getElementById('stat-total').innerText = totalCartas;
    document.getElementById('stat-criaturas').innerText = criaturas;
    document.getElementById('stat-nao-criaturas').innerText = naoCriaturas;
    document.getElementById('stat-terrenos').innerText = totalTerrenos;
    document.getElementById('stat-cmc-medio').innerText = cartasNaoTerreno > 0 ? (cmcTotal / cartasNaoTerreno).toFixed(1) : '0.0';

    const valTotal = document.getElementById('val-total');
    valTotal.innerHTML = totalCartas === 100 
        ? `<i class="fa-solid fa-circle-check"></i> 100 cartas no deck` 
        : `<i class="fa-solid fa-circle-xmark"></i> ${totalCartas} / 100 cartas`;
    valTotal.className = totalCartas === 100 ? 'ok' : 'erro';

    const valCopias = document.getElementById('val-copias');
    const temCopias = Object.values(copiasMap).some(qtd => qtd > 1);
    valCopias.innerHTML = !temCopias 
        ? `<i class="fa-solid fa-circle-check"></i> Sem cópias repetidas` 
        : `<i class="fa-solid fa-circle-xmark"></i> Cópias repetidas`;
    valCopias.className = !temCopias ? 'ok' : 'erro';

    const valIdentidade = document.getElementById('val-identidade');
    valIdentidade.innerHTML = valIdentidadeOk 
        ? `<i class="fa-solid fa-circle-check"></i> Identidade de cor respeitada` 
        : `<i class="fa-solid fa-circle-xmark"></i> Cores fora da identidade`;
    valIdentidade.className = valIdentidadeOk ? 'ok' : 'erro';
}