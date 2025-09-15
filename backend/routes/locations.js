const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

router.get("/federative-unities", locationController.getFederativeUnities);
router.get("/cities/:stateId", locationController.getCitiesByStates);

module.exports = router;
