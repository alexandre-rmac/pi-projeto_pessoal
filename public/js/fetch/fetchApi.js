const api = {
    async buscarComandantes(nome) {
        const res = await fetch(`/cards/comandantes?nome=${encodeURIComponent(nome)}`);
        if (!res.ok) throw new Error('Erro ao buscar comandantes');
        return res.json();
    },

    async criarDeck(dados) {
        const res = await fetch(`/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json();
            throw new Error(erro.erro || 'Erro ao criar deck');
        }
        return res.json();
    },

    async adicionarCartaAoDeck(idDeck, dados) {
        const res = await fetch(`/decks/${idDeck}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json();
            throw new Error(erro.erro || 'Erro ao adicionar carta');
        }
        return res.json();
    },

    async buscarCartas(nome) {
        const res = await fetch(`/cards/buscar?nome=${encodeURIComponent(nome)}&limite=20`);
        if (!res.ok) throw new Error('Erro ao buscar cartas');
        return res.json();
    },

    async buscarPorNomes(nomes) {
        const res = await fetch(`/cards/lote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomes })
        });
        if (!res.ok) throw new Error('Erro ao buscar lote');
        return res.json();
    },

    async adicionarCartasLote(idDeck, cartas, idBoard, fkUsuario) {
        const res = await fetch(`/decks/${idDeck}/cards/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartas, idBoard, fkUsuario })
        });
        if (!res.ok) throw new Error('Erro ao importar lote');
        return res.json();
    },

    async buscarDeckCompleto(idDeck, fkUsuario) {
        const res = await fetch(`/decks/${idDeck}/full?fkUsuario=${fkUsuario}`);
        if (!res.ok) throw new Error("Erro ao carregar deck.");
        return res.json();
    },

    async removerCarta(idDeck, idCarta, idBoard, fkUsuario, quantidade) {
        const res = await fetch(`/decks/${idDeck}/cards/${idCarta}?idBoard=${idBoard}&fkUsuario=${fkUsuario}&quantidade=${quantidade}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Erro ao remover carta.");
        return res.json();
    }
};