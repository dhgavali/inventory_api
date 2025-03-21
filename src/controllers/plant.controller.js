const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { plantService } = require("../services");
const pick = require("../utils/pick");

const createPlant = catchAsync(async (req, res) => {
  const plant = await plantService.createPlant(req.body, req.user);
  res
    .status(httpStatus.CREATED)
    .send(
      ApiResponse.success(
        httpStatus.CREATED,
        "Plant created successfully",
        plant
      )
    );
});

const getPlants = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "code"]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await plantService.queryPlants(filter, options, req.user);
  res
    .status(httpStatus.OK)
    .send(
      ApiResponse.success(httpStatus.OK, "Plants fetched successfully", result)
    );
});

const getPlant = catchAsync(async (req, res) => {
  const plant = await plantService.getPlantById(req.params.plantId);
  if (!plant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plant not found");
  }
  res
    .status(httpStatus.OK)
    .send(
      ApiResponse.success(httpStatus.OK, "Plant fetched successfully", plant)
    );
});

const updatePlant = catchAsync(async (req, res) => {
  const plant = await plantService.updatePlantById(
    req.params.plantId,
    req.body,
    req.user
  );
  res
    .status(httpStatus.OK)
    .send(
      ApiResponse.success(httpStatus.OK, "Plant updated successfully", plant)
    );
});

const deletePlant = catchAsync(async (req, res) => {
  await plantService.deletePlantById(req.params.plantId);
  res
    .status(httpStatus.NO_CONTENT)
    .send(
      ApiResponse.success(httpStatus.NO_CONTENT, "Plant deleted successfully")
    );
});

const removeMemberFromPlant = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { plantId } = req.body;

  const user = await plantService.removeMemberFromPlant(
    userId,
    plantId,
    req.user
  );
  res
    .status(httpStatus.OK)
    .send(
      ApiResponse.success(
        httpStatus.OK,
        "User removed from plant successfully",
        user
      )
    );
});

module.exports = {
  createPlant,
  getPlants,
  getPlant,
  updatePlant,
  deletePlant,
  removeMemberFromPlant,
};
