const Joi = require("joi");

const uuid = (value, helpers) => {
  if (
    !value.match(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    )
  ) {
    return helpers.message("{{#label}} must be a valid UUID");
  }
  return value;
};

const createProduct = {
  body: Joi.object().keys({
    designName: Joi.string().required(),
    designCode: Joi.string().required(),
    neck: Joi.number().required(),
    volume: Joi.number().required(),
    weight: Joi.number().required(),
    colour: Joi.string().required(),
    itemCode: Joi.string().required(),
    unitType: Joi.string().required(),
    buyPrice: Joi.number().required(),
    sellPrice: Joi.number().required(),
    remark: Joi.string().allow(null, ""),
    minStockAlert: Joi.number().integer().required(),
    openingStock: Joi.number().integer().required(),
    qrBarcode: Joi.string().allow(null, ""),
    bagSize: Joi.number().integer().required(),
    traySize: Joi.number().integer().required(),
  }),
};

const getProducts = {
  query: Joi.object().keys({
    designName: Joi.string(),
    designCode: Joi.string(),
    colour: Joi.string(),
    itemCode: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(uuid).required(),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(uuid).required(),
  }),
  body: Joi.object()
    .keys({
      designName: Joi.string(),
      designCode: Joi.string(),
      neck: Joi.number(),
      volume: Joi.number(),
      weight: Joi.number(),
      colour: Joi.string(),
      itemCode: Joi.string(),
      unitType: Joi.string(),
      buyPrice: Joi.number(),
      sellPrice: Joi.number(),
      remark: Joi.string().allow(null, ""),
      minStockAlert: Joi.number().integer(),
      qrBarcode: Joi.string().allow(null, ""),
      bagSize: Joi.number().integer(),
      traySize: Joi.number().integer(),
    })
    .min(1),
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(uuid).required(),
  }),
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
