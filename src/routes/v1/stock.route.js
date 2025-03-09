const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { stockValidation } = require("../../validations");
const { stockController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/history")
  .get(
    validate(stockValidation.getStockHistory),
    stockController.getStockHistory
  );

router
  .route("/alerts")
  .get(
    validate(stockValidation.getStockAlerts),
    stockController.getStockAlerts
  );

router
  .route("/:productId/current")
  .get(
    validate(stockValidation.getCurrentStock),
    stockController.getCurrentStock
  );

router
  .route("/:productId/monthly-report")
  .get(
    checkRole("MANAGER", "ADMIN"),
    validate(stockValidation.generateMonthlyReport),
    stockController.generateMonthlyReport
  );

module.exports = router;
