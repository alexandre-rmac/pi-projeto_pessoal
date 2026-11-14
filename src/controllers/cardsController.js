var cartasModel = require("../models/cartasModel");

function comandantes(req, res) {
    var nome = req.query.nome || "";
    cartasModel.buscarComandantes(nome)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao buscar comandantes." }); });
}

function lote(req, res) {
    var nomes = req.body.nomes;
    if (!Array.isArray(nomes) || nomes.length === 0) {
        return res.status(400).json({ erro: "Envie um array 'nomes'." });
    }
    cartasModel.buscarPorNomes(nomes)
        .then(encontradas => {
            var nomesEncontrados = encontradas.map(c => c.nome.toLowerCase());
            var naoEncontradas = nomes.filter(n => !nomesEncontrados.includes(n.toLowerCase()));
            res.json({ encontradas, naoEncontradas });
        })
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao buscar lote." }); });
}

function buscar(req, res) {
    var nome = req.query.nome || "";
    var limite = parseInt(req.query.limite) || 20;
    if (![20, 50, 100].includes(limite)) limite = 20; // Força os limites permitidos
    var offset = parseInt(req.query.offset) || 0;

    if (nome.length < 2) return res.status(400).json({ erro: "Informe ao menos 2 caracteres." });

    cartasModel.buscarPorNome(nome, limite, offset)
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

    cartasModel.buscarAvancada(filtros, limite, offset)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro na busca avançada." }); });
}

function detalhes(req, res) {
    var uuids = req.body.uuids;
    if (!Array.isArray(uuids) || uuids.length === 0) return res.status(400).json({ erro: "Envie 'uuids'." });
    cartasModel.detalhesPorUuids(uuids)
        .then(r => res.json(r))
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro nos detalhes." }); });
}

module.exports = { comandantes, lote, buscar, avancada, detalhes };