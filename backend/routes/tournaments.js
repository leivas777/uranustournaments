const express = require("express");
const router = express.Router();
const tournamentController = require("../controllers/tournamentController");
const { tournamentValidation } = require("../middleware/validation");
const { authenticateFirebase } = require("../middleware/firebaseAuth");
const {requireTournamentAccess } = require("../middleware/authorization");

router.use(authenticateFirebase)

router.post("/draft", tournamentValidation, tournamentController.createDraft);

router.put("/:id/sport", tournamentController.updateSportAndModalities);
router.put("/:id/calendar", tournamentController.updateCalendarAndFormat);
router.put("/:id/final-phase", tournamentController.updateFinalPhase);
router.put("/:id/finalize", tournamentController.finalizeTournament);
router.put("/:id/summary", tournamentController.getTournamentSummary);
router.delete("/:id/draft", tournamentController.deleteDraft);

module.exports = router;
