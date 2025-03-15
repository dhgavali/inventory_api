const Joi = require("joi");

const createInward = {
  body: Joi.alternatives().try(
    // Accept a single object
    Joi.object().keys({
      productId: Joi.string().required(),
      manufacturedQty: Joi.number(),
      qtyIncharge: Joi.number(),
      qtySupervisor: Joi.number(),
      source: Joi.string().valid('MANUFACTURED', 'SUPPLIER').required(),
      date: Joi.date().required(),
      // other fields...
    }),
    // Accept an array of objects
    Joi.array().items(
      Joi.object().keys({
        productId: Joi.string().required(),
        manufacturedQty: Joi.number(),
        qtyIncharge: Joi.number(),
        qtySupervisor: Joi.number(),
        source: Joi.string().valid('MANUFACTURED', 'SUPPLIER').required(),
        date: Joi.date().required(),
        // other fields...
      })
    ).min(1)
  ),
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
