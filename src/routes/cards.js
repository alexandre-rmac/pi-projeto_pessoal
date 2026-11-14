var express = require("express");
var router = express.Router();
var cardsController = require("../controllers/cardsController");

router.get("/comandantes", cardsController.comandantes);
router.post("/lote",       cardsController.lote);
router.get("/buscar",      cardsController.buscar);
router.get("/avancada",    cardsController.avancada);
router.post("/detalhes",   cardsController.detalhes);

module.exports = router;