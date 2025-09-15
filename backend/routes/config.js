const express = require("express");
const router = express.Router();
const configController = require("../controllers/configController");

router.get("/sports", configController.getSports);
router.get("/tournament-formats", configController.getTournamentFormats);
router.get("/modality-type", configController.getModalityType);
router.get("/game-formats", configController.getGameFormats);
router.get("/auto-calendar", configController.getAutoCalendarOptions);

module.exports = router;
