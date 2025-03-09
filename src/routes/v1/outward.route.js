const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { outwardValidation } = require("../../validations");
const { outwardController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("SHIFT_INCHARGE", "SUPERVISOR", "MANAGER", "ADMIN"),
    validate(outwardValidation.createOutward),
    outwardController.createOutward
  )
  .get(validate(outwardValidation.getOutwards), outwardController.getOutwards);

router
  .route("/:outwardId")
  .get(validate(outwardValidation.getOutward), outwardController.getOutward);

module.exports = router;
