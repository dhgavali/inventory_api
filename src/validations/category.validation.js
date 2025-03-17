const Joi = require("joi");

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    categoryCode: Joi.string().required(),
  }),
};

const getCategories = {
  query: Joi.object().keys({
    name: Joi.string(),
    categoryCode: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().uuid(),
  }),
};

const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().uuid(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    categoryCode: Joi.string(),
  }).min(1),
};

const deleteCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().uuid(),
  }),
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
