const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { productValidation } = require("../../validations");
const { productController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("ADMIN", "MANAGER"),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(validate(productValidation.getProducts), productController.getProducts);

router.route("/list").get(productController.getProductList);

router
  .route("/:productId")
  .get(validate(productValidation.getProduct), productController.getProduct)
  .patch(
    checkRole("ADMIN", "MANAGER"),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(
    checkRole("ADMIN", "MANAGER"),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

module.exports = router;
