const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { plantService } = require('../services');
const pick = require('../utils/pick');

const createPlant = catchAsync(async (req, res) => {
  const plant = await plantService.createPlant(req.body, req.user);
  res.status(httpStatus.CREATED).send(plant);
});

const getPlants = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'code']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
  const result = await plantService.queryPlants(filter, options);
  res.send(result);
});

const getPlant = catchAsync(async (req, res) => {
  const plant = await plantService.getPlantById(req.params.plantId);
  if (!plant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plant not found');
  }
  res.send(plant);
});

const updatePlant = catchAsync(async (req, res) => {
  const plant = await plantService.updatePlantById(req.params.plantId, req.body, req.user);
  res.send(plant);
});

const deletePlant = catchAsync(async (req, res) => {
  await plantService.deletePlantById(req.params.plantId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPlant,
  getPlants,
  getPlant,
  updatePlant,
  deletePlant,
};
