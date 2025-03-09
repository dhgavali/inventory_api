const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { inwardValidation } = require("../../validations");
const { inwardController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("SHIFT_INCHARGE", "SUPERVISOR", "MANAGER", "ADMIN"),
    validate(inwardValidation.createInward),
    inwardController.createInward
  )
  .get(validate(inwardValidation.getInwards), inwardController.getInwards);

router
  .route("/pending")
  .get(
    checkRole("SUPERVISOR", "MANAGER", "ADMIN"),
    validate(inwardValidation.getPendingInwards),
    inwardController.getPendingInwards
  );

router
  .route("/:inwardId")
  .get(validate(inwardValidation.getInward), inwardController.getInward);

router
  .route("/:inwardId/approve")
  .patch(
    checkRole("SUPERVISOR", "MANAGER", "ADMIN"),
    validate(inwardValidation.approveInward),
    inwardController.approveInward
  );

module.exports = router;
