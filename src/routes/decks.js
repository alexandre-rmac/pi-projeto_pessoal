var express = require("express");
var router = express.Router();

var decksController = require("../controllers/decksController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
  decksController.cadastrarDecks(req, res);
})

router.get("/buscar", function (req, res) {
  decksController.buscarDecksPorUsuario(req, res);
});

router.get("/buscarPorNome", function (req, res) {
  decksController.buscarDecksPorNome(req, res)
})

router.get("/buscar/:id", function (req, res) {
  decksController.buscarDecksPorId(req, res);
});

router.get("/listarDecks", function (req, res) {
  decksController.listarDecks(req, res);
});

module.exports = router;