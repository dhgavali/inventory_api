const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { stockService } = require("../services");

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
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to generate reports"
    );
  }

  if (!["MANAGER", "ADMIN"].includes(req.user.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only managers and admins can generate monthly reports"
    );
  }

  // Default to current month and year if not provided
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const report = await stockService.generateMonthlyReport(
    req.params.productId,
    month,
    year,
    req.user
  );
  res.send(report);
});

module.exports = {
  getCurrentStock,
  getStockHistory,
  getStockAlerts,
  generateMonthlyReport,
};
