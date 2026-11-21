var express = require("express");
var router = express.Router();
var dashboardController = require("../controllers/dashboardController");

router.get("/perfil", dashboardController.perfil);
router.get("/deck/:id", dashboardController.deck);

module.exports = router;