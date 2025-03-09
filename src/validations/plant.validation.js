const Joi = require('joi');

const createPlant = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    code: Joi.string().required(),
  }),
};

const getPlants = {
  query: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPlant = {
  params: Joi.object().keys({
    plantId: Joi.string().uuid().required(),
  }),
};

const updatePlant = {
  params: Joi.object().keys({
    plantId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      code: Joi.string(),
    })
    .min(1),
};

const deletePlant = {
  params: Joi.object().keys({
    plantId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createPlant,
  getPlants,
  getPlant,
  updatePlant,
  deletePlant,
};
