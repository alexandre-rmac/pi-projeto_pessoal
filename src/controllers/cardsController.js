var cardsModel = require("../models/cardsModel");

function comandantes(req, res) {
    var nome = req.query.nome || "";
    cardsModel.buscarComandantes(nome)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao buscar comandantes." }); });
}

function lote(req, res) {
    var nomes = req.body.nomes;
    if (!Array.isArray(nomes) || nomes.length === 0) return res.status(400).json({ erro: "Envie um array 'nomes'." });

    cardsModel.buscarPorNomes(nomes)
        .then(encontradas => {
            var nomesEncontrados = encontradas.map(c => c.name.toLowerCase());
            var naoEncontradas = nomes.filter(n => !nomesEncontrados.includes(n.toLowerCase()));
            res.json({ encontradas, naoEncontradas });
        })
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao buscar lote." }); });
}

function buscar(req, res) {
    var nome = req.query.nome || "";
    var identidadeDeck = req.query.identidade;
    var limite = parseInt(req.query.limite) || 20;
    if (![20, 50, 100].includes(limite)) limite = 20;
    var offset = parseInt(req.query.offset) || 0;

    if (nome.length < 2) return res.status(400).json({ erro: "Informe ao menos 2 caracteres." });

    cardsModel.buscarPorNome(nome, identidadeDeck, limite, offset)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro na busca." }); });
}

function avancada(req, res) {
    var limite = parseInt(req.query.limite) || 20;
    if (![20, 50, 100].includes(limite)) limite = 20;
    var offset = parseInt(req.query.offset) || 0;

    var filtros = {
        nome: req.query.nome, cores: req.query.cores, identidade: req.query.identidade,
        cmc: req.query.cmc ? parseInt(req.query.cmc) : undefined,
        tipo: req.query.tipo, texto: req.query.texto
    };

    cardsModel.buscarAvancada(filtros, limite, offset)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro na busca avançada." }); });
}

module.exports = { comandantes, lote, buscar, avancada };