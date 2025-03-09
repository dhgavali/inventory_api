const httpStatus = require("http-status");
const moment = require("moment");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");

/**
 * Get current stock for a product
 * @param {string} productId
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const getCurrentStock = async (productId, loggedInUser) => {
  // Check if the product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if the product belongs to the user's plant
  if (product.plantId !== loggedInUser.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access products in your plant"
    );
  }

  // Get the current date (start of day)
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Try to find today's stock entry
  const todayStock = await prisma.stock.findUnique({
    where: {
      productId_date: {
        productId,
        date: currentDate,
      },
    },
  });

  if (todayStock) {
    return {
      productId,
      date: todayStock.date,
      openingStock: todayStock.openingStock,
      inwardQty: todayStock.inwardQty,
      outwardQty: todayStock.outwardQty,
      closingStock: todayStock.closingStock,
      product,
    };
  }

  // If no entry for today, find the most recent stock entry
  const lastStock = await prisma.stock.findFirst({
    where: {
      productId,
      date: {
        lt: currentDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  if (lastStock) {
    return {
      productId,
      date: currentDate,
      openingStock: lastStock.closingStock,
      inwardQty: 0,
      outwardQty: 0,
      closingStock: lastStock.closingStock,
      product,
    };
  }

  // If no previous stock entries, use the product's opening stock
  return {
    productId,
    date: currentDate,
    openingStock: product.openingStock,
    inwardQty: 0,
    outwardQty: 0,
    closingStock: product.openingStock,
    product,
  };
};

/**
 * Query for stock history
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const queryStockHistory = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    ...filter,
    plantId: loggedInUser.plantId,
  };

  const stockHistory = await prisma.stock.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "desc" }
      : { date: "desc" },
    include: {
      product: {
        select: {
          designName: true,
          itemCode: true,
          designCode: true,
          colour: true,
          unitType: true,
        },
      },
    },
  });

  const count = await prisma.stock.count({
    where: whereCondition,
  });

  return {
    stocks: stockHistory,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get stock alert for products with stock below minimum level
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const getStockAlerts = async (options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Get current date
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Get all products in the user's plant
  const products = await prisma.product.findMany({
    where: {
      plantId: loggedInUser.plantId,
    },
    include: {
      stocks: {
        where: {
          date: currentDate,
        },
        orderBy: {
          date: "desc",
        },
        take: 1,
      },
    },
    skip,
    take: limit,
  });

  // Filter products and check if current stock is below minimum alert level
  const alerts = [];
  for (const product of products) {
    let currentStock;

    if (product.stocks.length > 0) {
      // Use today's stock
      currentStock = product.stocks[0].closingStock;
    } else {
      // Check for most recent stock before today
      const lastStock = await prisma.stock.findFirst({
        where: {
          productId: product.id,
          date: {
            lt: currentDate,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      currentStock = lastStock ? lastStock.closingStock : product.openingStock;
    }

    if (currentStock <= product.minStockAlert) {
      alerts.push({
        product: {
          id: product.id,
          designName: product.designName,
          itemCode: product.itemCode,
          unitType: product.unitType,
          minStockAlert: product.minStockAlert,
        },
        currentStock,
        shortageAmount: product.minStockAlert - currentStock,
      });
    }
  }

  // Count total products with alerts
  const countWithAlerts = await prisma.product.count({
    where: {
      plantId: loggedInUser.plantId,
      // This is a simplification; actual logic would require a more complex query
      // to check current stock levels against minStockAlert
    },
  });

  return {
    alerts,
    page,
    limit,
    totalPages: Math.ceil(countWithAlerts / limit),
    totalResults: countWithAlerts,
  };
};

/**
 * Generate monthly report for a product
 * @param {string} productId
 * @param {number} month
 * @param {number} year
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const generateMonthlyReport = async (productId, month, year, loggedInUser) => {
  // Check if the product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if the product belongs to the user's plant
  if (product.plantId !== loggedInUser.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access products in your plant"
    );
  }

  // Get start and end of the month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Get all stock entries for the month
  const stockEntries = await prisma.stock.findMany({
    where: {
      productId,
      plantId: loggedInUser.plantId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Get the last stock entry from the previous month to determine opening stock
  const previousMonthEnd = new Date(year, month - 1, 0);
  previousMonthEnd.setHours(23, 59, 59, 999);

  const previousMonthStock = await prisma.stock.findFirst({
    where: {
      productId,
      plantId: loggedInUser.plantId,
      date: {
        lte: previousMonthEnd,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate totals
  const openingStock = previousMonthStock
    ? previousMonthStock.closingStock
    : product.openingStock;

  let inwardQty = 0;
  let outwardQty = 0;
  let closingStock = openingStock;

  stockEntries.forEach((entry) => {
    inwardQty += entry.inwardQty;
    outwardQty += entry.outwardQty;
  });

  closingStock = openingStock + inwardQty - outwardQty;

  // Check if report already exists
  const existingReport = await prisma.monthlyReport.findUnique({
    where: {
      productId_month_year_plantId: {
        productId,
        month,
        year,
        plantId: loggedInUser.plantId,
      },
    },
  });

  let report;
  if (existingReport) {
    // Update existing report
    report = await prisma.monthlyReport.update({
      where: {
        id: existingReport.id,
      },
      data: {
        openingStock,
        inwardQty,
        outwardQty,
        closingStock,
        generatedAt: new Date(),
      },
    });
  } else {
    // Create new report
    report = await prisma.monthlyReport.create({
      data: {
        productId,
        plantId: loggedInUser.plantId,
        month,
        year,
        openingStock,
        inwardQty,
        outwardQty,
        closingStock,
        generatedAt: new Date(),
      },
    });
  }

  return {
    ...report,
    product,
    monthName: moment()
      .month(month - 1)
      .format("MMMM"),
  };
};

module.exports = {
  getCurrentStock,
  queryStockHistory,
  getStockAlerts,
  generateMonthlyReport,
};
