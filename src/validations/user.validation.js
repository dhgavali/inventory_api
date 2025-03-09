const Joi = require('joi');
const { password } = require('./custom.validation');

const createUser = {
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

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string().valid('OPERATOR', 'SHIFT_INCHARGE', 'SUPERVISOR', 'MANAGER', 'ADMIN'),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

const getUsersByRole = {
  params: Joi.object().keys({
    role: Joi.string().valid('OPERATOR', 'SHIFT_INCHARGE', 'SUPERVISOR', 'MANAGER', 'ADMIN').required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      mobileNumber: Joi.string(),
      password: Joi.string().custom(password),
      employeeCode: Joi.string(),
      role: Joi.string().valid('OPERATOR', 'SHIFT_INCHARGE', 'SUPERVISOR', 'MANAGER', 'ADMIN'),
      photo: Joi.string(),
      plantId: Joi.string().uuid(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  getUsersByRole,
  updateUser,
  deleteUser,
};
