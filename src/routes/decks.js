var express = require("express");
var router = express.Router();
var decksController = require("../controllers/decksController");

// Deck CRUD
router.get("/", decksController.listarPorUsuario);
router.post("/", decksController.cadastrar);


router.get("/:id/full", decksController.detalheCompleto);
router.post("/:id/cards/bulk", decksController.adicionarCartasLote);
router.delete("/:id/cards/:idCarta", decksController.removerCarta);
router.get("/:id/cards", decksController.listarCartas);
router.post("/:id/cards", decksController.adicionarCarta);

router.get("/:id", decksController.detalhe);
router.put("/:id", decksController.atualizar);
router.delete("/:id", decksController.deletar);

module.exports = router;