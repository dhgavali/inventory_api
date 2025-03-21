const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { plantValidation } = require("../../validations");
const { plantController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("ADMIN"),
    validate(plantValidation.createPlant),
    plantController.createPlant
  )
  .get(
    checkRole("ADMIN", "MANAGER"),
    validate(plantValidation.getPlants),
    plantController.getPlants
  );

router
  .route("/:plantId")
  .get(
    checkRole("ADMIN", "MANAGER"),
    validate(plantValidation.getPlant),
    plantController.getPlant
  )
  .patch(
    checkRole("ADMIN"),
    validate(plantValidation.updatePlant),
    plantController.updatePlant
  )
  .delete(
    checkRole("ADMIN"),
    validate(plantValidation.deletePlant),
    plantController.deletePlant
  );

router
  .route("/members/:userId/remove")
  .post(checkRole("ADMIN"), plantController.removeMemberFromPlant);

module.exports = router;
