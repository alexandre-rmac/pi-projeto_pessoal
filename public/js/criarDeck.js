const inputBusca = document.getElementById('ipt_search_commander');
const suggestionsBox = document.getElementById('suggestions');
const btnCriar = document.getElementById('btn_criar');
const inputNomeDeck = document.getElementById('ipt_nome_deck');

let comandanteSelecionado = null;
let resultadosBusca = []; // Cache local dos resultados para evitar nova requisição no clique

// 1. Limpa a seleção se o usuário começar a digitar novamente
inputBusca.addEventListener('input', () => {
    comandanteSelecionado = null;

    // Se apagar todo o texto, limpa o preview também
    if (inputBusca.value.trim() === '') {
        const previewRender = document.getElementById('card-preview');
        if (previewRender) {
            previewRender.innerHTML = '<p class="placeholder-text">A carta aparecerá aqui</p>';
        }
    }
});

const buscarComandantes = debounce(async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    try {
        resultadosBusca = await api.buscarComandantes(query);

        if (resultadosBusca.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Renderiza a lista usando apenas o índice do array (evita problemas de caracteres especiais)
        suggestionsBox.innerHTML = resultadosBusca.map((c, index) =>
            `<div class="suggestion-item" data-index="${index}">${c.name}</div>`
        ).join('');

        suggestionsBox.style.display = 'block';

    } catch (err) {
        console.error(err);
    }
}, 400);

inputBusca.addEventListener('input', buscarComandantes);

// 2. Evento de clique unificado: Renderiza o preview e salva o Comandante de uma vez
suggestionsBox.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;

    const index = Number(item.dataset.index);
    const cartaSelecionada = resultadosBusca[index];

    if (!cartaSelecionada) return;

    inputBusca.value = cartaSelecionada.name;
    suggestionsBox.style.display = 'none';

    // Salva o objeto completo do comandante selecionado
    comandanteSelecionado = cartaSelecionada;

    // Adapta as cores para o formato que o cardRender.js espera
    const cardPreview = {
        ...cartaSelecionada,
        colors: cartaSelecionada.colorsStr ? cartaSelecionada.colorsStr.split('') : [],
        colorsId: cartaSelecionada.identidade ? cartaSelecionada.identidade.split('') : []
    };

    renderizarCarta(cardPreview, 'card-preview');
});

// Fecha sugestões ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsBox.style.display = 'none';
    }
});

// 3. Ação do botão Criar Deck
btnCriar.addEventListener('click', async () => {
    const nomeDeck = inputNomeDeck.value.trim();
    const fkUsuario = sessionStorage.getItem('ID_USUARIO');

    if (!nomeDeck || !comandanteSelecionado || !fkUsuario) {
        alert("Preencha o nome, selecione um comandante e verifique seu login.");
        return;
    }
    if (inputNomeDeck.value.length > 30) {
        alert("O nome do Deck deve conter até 30 caracteres.")
        return
    }

    try {
        mostrarLoading();
        // Cria o Deck
        const resultadoCriacao = await api.criarDeck({
            nome: nomeDeck,
            commander: comandanteSelecionado.name,
            identidade: comandanteSelecionado.identidade,
            fkUsuario: fkUsuario
        });

        // Verificação dupla para pegar o insertId (dependendo da versão do driver)
        const idNovoDeck = resultadoCriacao.insertId || resultadoCriacao[0]?.insertId;

        if (!idNovoDeck) {
            throw new Error("O back-end não retornou o ID do deck criado.");
        }

        // Adiciona o Comandante na Mainboard (idBoard: 1, quantidade: 1)
        // Agora garante que usará o ID exato da carta que foi renderizada no preview
        await api.adicionarCartaAoDeck(idNovoDeck, {
            idCarta: comandanteSelecionado.id,
            idBoard: 1,
            quantidade: 1,
            fkUsuario: fkUsuario
        });


        setTimeout(300)
        
        window.location.href = `editar-deck.html?id=${idNovoDeck}`;


        // alert("Deck criado com sucesso!");

    } catch (error) {
        console.error(error);
        alert("Erro ao criar deck: " + error.message);
    } finally {
        esconderLoading();
    }
});