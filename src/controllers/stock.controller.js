const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { stockService } = require("../services");
const ApiResponse = require("../utils/ApiResponse");

/**
 * Get current stock for a product
 * @route GET /api/v1/stock/:productId/current
 */
const getCurrentStock = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view stock"
    );
  }

  const stock = await stockService.getCurrentStock(
    req.params.productId,
    req.user
  );
  res.send(stock);
});

/**
 * Get stock history
 * @route GET /api/v1/stock/history
 */
const getStockHistory = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view stock history"
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
  const result = await stockService.queryStockHistory(
    filter,
    options,
    req.user
  );
  res.send(result);
});

/**
 * Get stock alerts
 * @route GET /api/v1/stock/alerts
 */
const getStockAlerts = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view stock alerts"
    );
  }

  const options = pick(req.query, ["limit", "page"]);
  const result = await stockService.getStockAlerts(options, req.user);
  res.send(result);
});

/**
 * Generate monthly report
 * @route GET /api/v1/stock/:productId/monthly-report
 */
const generateMonthlyReport = catchAsync(async (req, res) => {
  if (!["MANAGER", "ADMIN"].includes(req.user.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only managers and admins can generate monthly reports"
    );
  }

  const filter = {};

  if (req.query.productId) {
    filter.productId = req.query.productId;
  }

  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  filter.month = month;
  filter.year = year;

  const options = pick(req.query, ["limit", "page", "sortOrder"]);
  const report = await stockService.getMonthlyReport(filter, options, req.user);

  res.status(httpStatus.OK).send(report);
});

const getDailyReport = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["productId"]);

  if (req.query.startDate && req.query.endDate) {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999);

    filter.dateRange = {
      start: startDate,
      end: endDate,
    };
  } else {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2);
    startDate.setHours(0, 0, 0, 0);

    filter.dateRange = {
      start: startDate,
      end: endDate,
    };
  }

  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await stockService.getDailyReport(filter, options, req.user);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getCurrentStock,
  getStockHistory,
  getStockAlerts,
  generateMonthlyReport,
  getDailyReport,
};
