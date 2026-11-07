var decksModel = require("../models/decksModel");

function buscarDecksPorUsuario(req, res) {
  var fkUsuario = req.query.fkUsuario
  if (fkUsuario == undefined) {
    return res.status(404).send("O fkUsuario está undefined!")
  }
  decksModel.buscarDecksPorUsuario(fkUsuario)
    .then((resultado) => {
      res.status(200).json(resultado)
    })
    .catch((erro) => {
      console.log(erro)
      res.status(500).json(erro.sqlMessage)
    })
}

function buscarDecksPorNome(req, res) {
  var nome = req.query.nome;
  if (nome == undefined) return res.status(400).send("O nome está undefined!")
  decksModel.buscarDecksPorNome(nome)
    .then((resultado) => {
      res.status(200).json(resultado);
    })
    .catch((erro) => {
      console.log(erro)
      res.status(500).json(erro.sqlMessage)
    })
}

function listarDecks(req, res) {
  decksModel.listarDecks()
    .then((resultado) => {
      res.status(200).json(resultado);
    })
    .catch((erro) => {
      console.log(erro)
      res.status(500).json(erro.sqlMessage)
    })
}

function buscarDecksPorId(req, res) {
  var id = req.params.id;
  if (id == undefined) return res.status(400).send("O id está undefined!")
  decksModel.buscarPorId(id).then((resultado) => {
    res.status(200).json(resultado);
  })
    .catch((erro) => {
      console.log(erro)
      req.status(500).json(erro.sqlMessage)
    })
}

function cadastrarDecks(req, res) {
  var nome = req.body.nome
  var commander = req.body.commander
  var cores = req.body.cores
  var fkUsuario = req.body.fkUsuario
  if (nome == undefined) return res.status(400).send("O nome está undefined!")
  if (commander == undefined) return res.status(400).send("O commander está undefined!")
  if (cores == undefined) return res.status(400).send("As cores estão undefined!")
  if (fkUsuario == undefined) return res.status(400).send("O fkUsuario está undefined!")

  decksModel.buscarPorNome(nome).then((resultado) => {
    if (resultado.length > 0) {
      res.status(400).json({ mensagem: `o deck com o nome ${nome} já existe` });
    } else {
      decksModel.cadastrarDecks(nome, commander, cores, fkUsuario)
        .then((resultado) => {
          res.status(201).json(resultado);
        })
        .catch((erro) => {
          console.log(erro)
          res.status(500).json(erro.sqlMessage)
        })
    }
  })
  .catch((erro) => {
    console.log(erro)
    res.status(500).json(erro.sqlMessage)
  })
}

module.exports = {
  buscarDecksPorNome,
  buscarDecksPorId,
  buscarDecksPorUsuario,
  cadastrarDecks,
  listarDecks,
};
