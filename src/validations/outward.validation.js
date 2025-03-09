const Joi = require("joi");

const createOutward = {
  body: Joi.object().keys({
    productId: Joi.string().required().uuid(),
    quantity: Joi.number().integer().min(1).required(),
    remarks: Joi.string().allow("", null),
    date: Joi.date().default(new Date()),
  }),
};

const getOutwards = {
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

const getOutward = {
  params: Joi.object().keys({
    outwardId: Joi.string().required().uuid(),
  }),
};

module.exports = {
  createOutward,
  getOutwards,
  getOutward,
};
