const express = require("express");
const validate = require("../../middlewares/validate");
const { checkJWT, checkRole } = require("../../middlewares/auth");
const { categoryValidation } = require("../../validations");
const { categoryController } = require("../../controllers");

const router = express.Router();

router.use(checkJWT);

router
  .route("/")
  .post(
    checkRole("MANAGER", "ADMIN"),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  )
  .get(
    validate(categoryValidation.getCategories),
    categoryController.getCategories
  );

router
  .route("/:categoryId")
  .get(
    validate(categoryValidation.getCategory),
    categoryController.getCategory
  )
  .patch(
    checkRole("MANAGER", "ADMIN"),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    checkRole("ADMIN"),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

module.exports = router;
