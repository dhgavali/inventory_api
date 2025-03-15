const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { supplierValidation } = require("../../validations");
const { supplierController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("MANAGER", "ADMIN"),
    validate(supplierValidation.createSupplier),
    supplierController.createSupplier
  )
  .get(
    validate(supplierValidation.getSuppliers),
    supplierController.getSuppliers
  );

router
  .route("/:supplierId")
  .get(
    validate(supplierValidation.getSupplier),
    supplierController.getSupplier
  )
  .patch(
    checkRole("MANAGER", "ADMIN"),
    validate(supplierValidation.updateSupplier),
    supplierController.updateSupplier
  )
  .delete(
    checkRole("ADMIN"),
    validate(supplierValidation.deleteSupplier),
    supplierController.deleteSupplier
  );

module.exports = router;
