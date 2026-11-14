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
  if (!idDeck || idDeck <= 0) {
    return res.status(400).json({ erro: "ID do deck inválido." });
  }
  if (!fkUsuario || fkUsuario <= 0) {
    return res.status(400).json({ erro: "fkUsuario obrigatório." });
  }

  dashboardModel.deck(idDeck, fkUsuario)
    .then(function (dados) {
      if (!dados) return res.status(404).json({ erro: "Deck não encontrado ou não pertence ao usuário." });
      res.json(dados);
    })
    .catch(function (erro) {
      console.error(erro);
      res.status(500).json({ erro: "Erro ao carregar dashboard do deck." });
    });
}

module.exports = { perfil, deck };