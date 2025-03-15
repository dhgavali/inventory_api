const httpStatus = require("http-status");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { inwardService } = require("../services");

/**
 * Create a new inward entry
 * @route POST /api/v1/inwards
 */
const createInward = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant before creating inward entries"
    );
  }

  // Ensure req.body is an array
  const inwardItems = Array.isArray(req.body) ? req.body : [req.body];
  
  // Check if array is empty
  if (inwardItems.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No inward items provided"
    );
  }

  // Process each inward item
  const results = [];
  for (const item of inwardItems) {
    const inward = await inwardService.createInward(item, req.user);
    results.push(inward);
  }

  res.status(httpStatus.CREATED).send(
    ApiResponse.success(
      httpStatus.CREATED, 
      inwardItems.length > 1 ? 'Multiple inwards created successfully' : 'Inward created successfully', 
      results
    )
  );
});

/**
 * Get all inwards
 * @route GET /api/v1/inwards
 */
const getInwards = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to view inward entries"
  //   );
  // }

  const filter = pick(req.query, [
    "status",
    "source",
    "productId",
    "supplierId",
  ]);

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
  const result = await inwardService.queryInwards(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Inwards fetched successfully', result));
});

/**
 * Get inward by id
 * @route GET /api/v1/inwards/:inwardId
 */
const getInward = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view inward entries"
    );
  }

  const inward = await inwardService.getInwardById(req.params.inwardId);
  if (!inward) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inward entry not found");
  }

  // Check if the inward belongs to the user's plant
  if (inward.plantId !== req.user.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access inward entries in your plant"
    );
  }

  // If user is SHIFT_INCHARGE, they can only access their own entries
  if (
    req.user.role === "SHIFT_INCHARGE" &&
    inward.createdById !== req.user.id
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access your own inward entries"
    );
  }

  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Inward fetched successfully', inward));
});

/**
 * Get pending inwards for approval
 * @route GET /api/v1/inwards/pending
 */
const getPendingInwards = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view pending inward entries"
    );
  }

  if (!["SUPERVISOR", "MANAGER", "ADMIN"].includes(req.user.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only supervisors, managers, and admins can view pending inward entries"
    );
  }

  const options = pick(req.query, ["limit", "page"]);
  const result = await inwardService.getPendingInwards(options, req.user);
  res.send(result);
});

/**
 * Approve an inward entry
 * @route PATCH /api/v1/inwards/:inwardId/approve
 */
const approveInward = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to approve inward entries"
    );
  }

  if (!["SUPERVISOR", "MANAGER", "ADMIN"].includes(req.user.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only supervisors, managers, and admins can approve inward entries"
    );
  }

  const inward = await inwardService.approveInward(
    req.params.inwardId,
    req.body,
    req.user
  );
  res.send(inward);
});

module.exports = {
  createInward,
  getInwards,
  getInward,
  getPendingInwards,
  approveInward,
};
