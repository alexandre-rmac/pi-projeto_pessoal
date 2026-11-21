var dashboardModel = require("../models/dashboardModel");

function perfil(req, res) {
  var fkUsuario = parseInt(req.query.fkUsuario);
  if (!fkUsuario || fkUsuario <= 0) {
    return res.status(400).json({ erro: "fkUsuario obrigatório." });
  }

  dashboardModel.perfil(fkUsuario)
    .then(function (dados) { res.json(dados); })
    .catch(function (erro) {
      console.error(erro);
      res.status(500).json({ erro: "Erro ao carregar dashboard de perfil." });
    });
}

function deck(req, res) {
    var idDeck = parseInt(req.params.id);
    var fkUsuario = parseInt(req.query.fkUsuario);

    if (!idDeck || !fkUsuario) return res.status(400).json({ erro: "Parâmetros inválidos." });

    dashboardModel.deck(idDeck, fkUsuario)
        .then(r => {
            if (!r) return res.status(404).json({ erro: "Deck não encontrado." });
            res.json(r);
        })
        .catch(e => { console.error(e); res.status(500).json({ erro: "Erro na dashboard do deck." }); });
}

module.exports = { perfil, deck };