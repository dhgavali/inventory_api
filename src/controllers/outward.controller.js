const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { outwardService } = require("../services");

/**
 * Create a new outward entry
 * @route POST /api/v1/outwards
 */
const createOutward = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant before creating outward entries"
    );
  }

  const outward = await outwardService.createOutward(req.body, req.user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'Outward created successfully', outward));
});

/**
 * Get all outwards
 * @route GET /api/v1/outwards
 */
const getOutwards = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view outward entries"
    );
  }

  const filter = pick(req.query, ["productId"]);

  // Date range filtering
  if (req.query.startDate && req.query.endDate) {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    filter.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await outwardService.queryOutwards(filter, options, req.user);
  // res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Inwards fetched successfully', result));
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Outwards fetched successfully', result));

});

/**
 * Get outward by id
 * @route GET /api/v1/outwards/:outwardId
 */
const getOutward = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view outward entries"
    );
  }

  const outward = await outwardService.getOutwardById(req.params.outwardId);
  if (!outward) {
    throw new ApiError(httpStatus.NOT_FOUND, "Outward entry not found");
  }

  // Check if the outward belongs to the user's plant
  if (outward.plantId !== req.user.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access outward entries in your plant"
    );
  }

  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Outward fetched successfully', outward));
});

module.exports = {
  createOutward,
  getOutwards,
  getOutward,
};
