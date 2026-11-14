const inputBusca = document.getElementById('ipt_search_commander');
const suggestionsBox = document.getElementById('suggestions');
const btnCriar = document.getElementById('btn_criar');

let comandanteSelecionado = null;

const buscarComandantes = debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    try {
        const comandantes = await api.buscarComandantes(query);
        if (comandantes.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        suggestionsBox.innerHTML = comandantes.map(c =>
            `<div class="suggestion-item" data-uuid="${c.codigo}" data-id="${c.id}" data-identidade="${c.identidade}">${c.nome}</div>`
        ).join('');

        suggestionsBox.style.display = 'block';

    } catch (err) {
        console.error(err);
    }
}, 400);

inputBusca.addEventListener('input', buscarComandantes);

// Quando o usuário clica em um comandante da lista
suggestionsBox.addEventListener('click', async (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;

    const uuid = item.dataset.uuid;
    // Note: Você precisará guardar o ID do banco no data-attribute também
    // Vamos alterar a renderização das sugestões acima para incluir o ID

    inputBusca.value = item.innerText;
    suggestionsBox.style.display = 'none';

    try {
        mostrarLoading();
        const detalhes = await api.detalhesPorUuids([uuid]);

        if (detalhes.length > 0) {
            renderizarCarta(detalhes[0], 'card-preview');
        }
    } catch (err) {
        console.error(err);
    } finally {
        esconderLoading();
    }
});



// NOVO EVENTO NO CLIQUE DA SUGESTÃO PARA GUARDAR O OBJETO COMPLETO
suggestionsBox.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (item) {
        comandanteSelecionado = {
            id: item.dataset.id,
            uuid: item.dataset.uuid,
            nome: item.innerText,
            identidade: item.dataset.identidade
        };
    }
});

// Fecha sugestões ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsBox.style.display = 'none';
    }
});

btnCriar.addEventListener('click', async () => {
    const nomeDeck = document.getElementById('ipt_nome_deck').value.trim();
    const fkUsuario = sessionStorage.getItem('ID_USUARIO');

    if (!nomeDeck || !comandanteSelecionado || !fkUsuario) {
        alert("Preencha o nome, selecione um comandante e verifique seu login.");
        return;
    }

    try {
        mostrarLoading();

        // 1. Cria o Deck
        const resultadoCriacao = await api.criarDeck({
            nome: nomeDeck,
            commander: comandanteSelecionado.nome,
            identidade: comandanteSelecionado.identidade,
            fkUsuario: fkUsuario
        });

        console.log("Resposta da criação do deck:", resultadoCriacao);

        // O MySQL retorna o ID gerado na propriedade insertId
        const idNovoDeck = resultadoCriacao.insertId;

        if (!idNovoDeck) {
            throw new Error("O back-end não retornou o ID do deck criado.");
        }

        // 2. Adiciona o Comandante na Mainboard (idBoard: 1, quantidade: 1)
        await api.adicionarCartaAoDeck(idNovoDeck, {
            idCarta: comandanteSelecionado.id, // Usa o ID numérico, não o UUID
            idBoard: 1, // 1 = Mainboard
            quantidade: 1,
            fkUsuario: fkUsuario
        });

        alert("Deck criado com sucesso!");
        window.location.href = `editar-deck.html?id=${idNovoDeck}`;

    } catch (error) {
        console.error(error);
        alert("Erro ao criar deck: " + error.message);
    } finally {
        esconderLoading();
    }
});