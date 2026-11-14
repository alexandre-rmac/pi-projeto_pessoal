var decksModel = require("../models/decksModel");

function listarPorUsuario(req, res) {
  var fkUsuario = req.query.fkUsuario;
  if (!fkUsuario) return res.status(400).json({ erro: "fkUsuario obrigatório." });

  decksModel.buscarDecksPorUsuario(fkUsuario)
    .then(r => res.json(r))
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao listar decks." }); });
}

function detalhe(req, res) {
  var id = req.params.id;
  decksModel.buscarPorId(id)
    .then(r => {
      if (!r || r.length === 0) return res.status(404).json({ erro: "Deck não encontrado." });
      res.json(r[0]);
    })
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao buscar deck." }); });
}

function cadastrar(req, res) {
  var { nome, commander, identidade, fkUsuario } = req.body;
  if (!nome || !commander || !identidade || !fkUsuario) {
    return res.status(400).json({ erro: "nome, commander, identidade e fkUsuario são obrigatórios." });
  }

  decksModel.cadastrarDecks(nome, commander, identidade, fkUsuario)
    .then(r => res.status(201).json(r))
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao cadastrar deck." }); });
}

function listarCartas(req, res) {
  var idDeck = req.params.id;
  decksModel.listarCartasDoDeck(idDeck)
    .then(r => res.json(r))
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao listar cartas do deck." }); });
}

function atualizar(req, res) {
  var id = req.params.id;
  var { nome, commander, identidade, fkUsuario } = req.body;
  if (!nome || !commander || !identidade || !fkUsuario) {
    return res.status(400).json({ erro: "nome, commander, identidade e fkUsuario são obrigatórios." });
  }

  decksModel.atualizarDeck(id, nome, commander, identidade, fkUsuario)
    .then(r => {
      if (r.affectedRows === 0) return res.status(403).json({ erro: "Acesso negado ou deck não encontrado." });
      res.json({ mensagem: "Deck atualizado com sucesso." });
    })
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao atualizar deck." }); });
}

function deletar(req, res) {
  var id = req.params.id;
  var fkUsuario = req.query.fkUsuario; // Passado via query string no DELETE
  if (!fkUsuario) return res.status(400).json({ erro: "fkUsuario obrigatório." });

  decksModel.deletarDeck(id, fkUsuario)
    .then(r => {
      if (r.affectedRows === 0) return res.status(403).json({ erro: "Acesso negado ou deck não encontrado." });
      res.json({ mensagem: "Deck deletado com sucesso." });
    })
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao deletar deck." }); });
}

function adicionarCarta(req, res) {
  var idDeck = req.params.id;
  var { idCarta, idBoard, quantidade, fkUsuario } = req.body;
  if (!idCarta || !idBoard || !quantidade || !fkUsuario) {
    return res.status(400).json({ erro: "idCarta, idBoard, quantidade e fkUsuario são obrigatórios." });
  }

  decksModel.adicionarCarta(idDeck, idCarta, idBoard, quantidade, fkUsuario)
    .then(r => res.json(r))
    .catch(e => {
      console.error(e);
      if (e.message.includes("Acesso negado")) return res.status(403).json({ erro: e.message });
      res.status(500).json({ erro: "Erro ao adicionar carta." });
    });
}

function removerCarta(req, res) {
  var idDeck = req.params.id;
  var idCarta = req.params.idCarta;
  var idBoard = req.query.idBoard;
  var fkUsuario = req.query.fkUsuario;

  if (!idBoard || !fkUsuario) return res.status(400).json({ erro: "idBoard e fkUsuario são obrigatórios na query." });

  decksModel.removerCarta(idDeck, idCarta, idBoard, fkUsuario)
    .then(r => {
      if (r.affectedRows === 0) return res.status(403).json({ erro: "Acesso negado ou carta não encontrada." });
      res.json({ mensagem: "Carta removida com sucesso." });
    })
    .catch(e => { console.error(e); res.status(500).json({ erro: "Erro ao remover carta." }); });
}

module.exports = {
  listarPorUsuario, detalhe, cadastrar, atualizar, deletar,
  listarCartas, adicionarCarta, removerCarta
};