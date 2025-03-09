const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    password: Joi.string().required().custom(password),
    employeeCode: Joi.string(),
    role: Joi.string().required().valid('OPERATOR', 'SHIFT_INCHARGE', 'SUPERVISOR', 'MANAGER', 'ADMIN'),
    photo: Joi.string(),
    plantId: Joi.string().uuid(),
  }),
};

const login = {
  body: Joi.object().keys({
    mobileNumber: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const createPlant = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    code: Joi.string().required(),
  }),
};

const addUserToPlant = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
    plantId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  createPlant,
  addUserToPlant,
};
