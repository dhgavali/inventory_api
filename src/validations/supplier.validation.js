const Joi = require("joi");

const createSupplier = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    name: Joi.string().required(),
    city: Joi.string(),
    email: Joi.string().email(),
    mobileNumber: Joi.string(),
    remark: Joi.string(),
    plantId: Joi.string().uuid(),
  }),
};

const getSuppliers = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    city: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSupplier = {
  params: Joi.object().keys({
    supplierId: Joi.string().required().uuid(),
  }),
};

const updateSupplier = {
  params: Joi.object().keys({
    supplierId: Joi.string().required().uuid(),
  }),
  body: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    city: Joi.string(),
    email: Joi.string().email(),
    mobileNumber: Joi.string(),
    remark: Joi.string(),
  }).min(1),
};

const deleteSupplier = {
  params: Joi.object().keys({
    supplierId: Joi.string().required().uuid(),
  }),
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
};
