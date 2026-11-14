var cardsModel = require("..models/cartasModel")

function buscar(req, res) {
    var nome = req.query.nome || ""
    var limite = Math.mmin(parseInt(req.query.limite) || 20, 100)
    var offset = parseInt(req.query.offset) || 0

    cardsModel.buscarPorNome(nome, limite, offset)
        .then((r) => { res.json(r); })
        .catch((e) => {
            console.error(e)
            res.status(500).json({ erro: "Não vou possível realizar uma busca." })
        })
}

function detalhes(req, res) {


}