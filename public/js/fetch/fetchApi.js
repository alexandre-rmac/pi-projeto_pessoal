

const api = {
    // Busca comandantes por nome
    async buscarComandantes(nome) {
        const res = await fetch(`/cards/comandantes?nome=${encodeURIComponent(nome)}`);
        if (!res.ok) throw new Error('Erro ao buscar comandantes');
        return res.json();
    },

    // Busca detalhes (manaCost, text) pelo UUID
    async detalhesPorUuids(uuids) {
        const res = await fetch(`/cards/detalhes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuids })
        });
        if (!res.ok) throw new Error('Erro ao buscar detalhes da carta');
        return res.json();
    },

    async criarDeck(dados) {
        const res = await fetch(`/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        console.log(res)
        if (!res.ok) {
            const erro = await res.json();
            throw new Error(erro.erro || 'Erro ao criar deck');
        }
        return res.json(); // Retorna { insertId, affectedRows }
    },

    async adicionarCartaAoDeck(idDeck, dados) {
        const res = await fetch(`/decks/${idDeck}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json();
            console.error(erro)
            throw new Error(erro.erro || 'Erro ao adicionar comandante');
        }
        return res.json();
    },

    async buscarCartas(nome) {
        const res = await fetch(`/cards/buscar?nome=${encodeURIComponent(nome)}&limite=20`);
        if (!res.ok) throw new Error('Erro ao buscar cartas');
        return res.json();
    }

};

