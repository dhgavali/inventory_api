const Joi = require("joi");

const getCurrentStock = {
  params: Joi.object().keys({
    productId: Joi.string().required().uuid(),
  }),
};

const getStockHistory = {
  query: Joi.object().keys({
    productId: Joi.string().uuid(),
    startDate: Joi.date(),
    endDate: Joi.date().when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")),
    }),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getStockAlerts = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const generateMonthlyReport = {
  params: Joi.object().keys({
    productId: Joi.string().required().uuid(),
  }),
  query: Joi.object().keys({
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(2000).max(2100),
  }),
};

module.exports = {
  getCurrentStock,
  getStockHistory,
  getStockAlerts,
  generateMonthlyReport,
};
