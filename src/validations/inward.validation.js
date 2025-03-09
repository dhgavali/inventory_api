const Joi = require("joi");

const createInward = {
  body: Joi.object().keys({
    source: Joi.string().valid("MANUFACTURED", "SUPPLIER").required(),
    productId: Joi.string().required().uuid(),
    manufacturedQty: Joi.when("source", {
      is: "MANUFACTURED",
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().optional(),
    }),
    qtyIncharge: Joi.when("source", {
      is: "MANUFACTURED",
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().optional(),
    }),
    qtySupervisor: Joi.when("source", {
      is: "MANUFACTURED",
      then: Joi.number().integer().min(1),
      otherwise: Joi.number().optional(),
    }),
    finalQty: Joi.when("source", {
      is: "SUPPLIER",
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().optional(),
    }),
    supplierId: Joi.when("source", {
      is: "SUPPLIER",
      then: Joi.string().required().uuid(),
      otherwise: Joi.string().optional(),
    }),
    date: Joi.date().default(new Date()),
    time: Joi.date().default(new Date()),
  }),
};

const getInwards = {
  query: Joi.object().keys({
    status: Joi.string().valid("PENDING", "APPROVED"),
    source: Joi.string().valid("MANUFACTURED", "SUPPLIER"),
    productId: Joi.string().uuid(),
    supplierId: Joi.string().uuid(),
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

const getInward = {
  params: Joi.object().keys({
    inwardId: Joi.string().required().uuid(),
  }),
};

const getPendingInwards = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const approveInward = {
  params: Joi.object().keys({
    inwardId: Joi.string().required().uuid(),
  }),
  body: Joi.object().keys({
    qtySupervisor: Joi.number().integer().min(1).required(),
  }),
};

module.exports = {
  createInward,
  getInwards,
  getInward,
  getPendingInwards,
  approveInward,
};
