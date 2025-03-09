const express = require('express');
const validate = require('../../middlewares/validate');
const { checkJWT, checkRole } = require('../../middlewares/auth');
const { authValidation } = require('../../validations');
const { authController } = require('../../controllers');
const { authLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

router.use(authLimiter);

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

router.post('/plants', checkJWT, checkRole('ADMIN'), validate(authValidation.createPlant), authController.createPlant);
router.post(
  '/plants/:plantId/users/:userId',
  checkJWT,
  checkRole('ADMIN'),
  validate(authValidation.addUserToPlant),
  authController.addUserToPlant
);

module.exports = router;
