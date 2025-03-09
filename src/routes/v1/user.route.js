const express = require('express');
const validate = require('../../middlewares/validate');
const { checkJWT, checkRole } = require('../../middlewares/auth');
const { userValidation } = require('../../validations');
const { userController } = require('../../controllers');

const router = express.Router();

router.use(checkJWT);

router
  .route('/')
  .post(checkRole('ADMIN'), validate(userValidation.createUser), userController.createUser)
  .get(checkRole('ADMIN', 'MANAGER'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(checkRole('ADMIN', 'MANAGER'), validate(userValidation.getUser), userController.getUser)
  .patch(checkRole('ADMIN'), validate(userValidation.updateUser), userController.updateUser)
  .delete(checkRole('ADMIN'), validate(userValidation.deleteUser), userController.deleteUser);

router
  .route('/role/:role')
  .get(checkRole('ADMIN', 'MANAGER'), validate(userValidation.getUsersByRole), userController.getUsersByRole);

module.exports = router;
