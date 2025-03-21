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

const getMonthlyReport = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const productWhere = {
    plantId: loggedInUser.plantId,
  };

  if (filter.productId) {
    productWhere.id = filter.productId;
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    select: {
      id: true,
      designName: true,
      itemCode: true,
      openingStock: true,
    },
  });

  const monthlyReports = [];

  for (const product of products) {
    let monthlyReport = await prisma.monthlyReport.findUnique({
      where: {
        productId_month_year_plantId: {
          productId: product.id,
          month: filter.month,
          year: filter.year,
          plantId: loggedInUser.plantId,
        },
      },
    });

    if (!monthlyReport) {
      const startOfMonth = new Date(filter.year, filter.month - 1, 1);
      const endOfMonth = new Date(filter.year, filter.month, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const inwardEntries = await prisma.inward.findMany({
        where: {
          productId: product.id,
          plantId: loggedInUser.plantId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: "APPROVED",
        },
      });

      const outwardEntries = await prisma.outward.findMany({
        where: {
          productId: product.id,
          plantId: loggedInUser.plantId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const inwardQty = inwardEntries.reduce(
        (sum, entry) => sum + entry.finalQty,
        0
      );
      const outwardQty = outwardEntries.reduce(
        (sum, entry) => sum + entry.quantity,
        0
      );

      const lastDayPrevMonth = new Date(filter.year, filter.month - 1, 0);
      lastDayPrevMonth.setHours(23, 59, 59, 999);

      const previousStock = await prisma.stock.findFirst({
        where: {
          productId: product.id,
          plantId: loggedInUser.plantId,
          date: {
            lte: lastDayPrevMonth,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      const openingStock = previousStock
        ? previousStock.closingStock
        : product.openingStock;

      const closingStock = openingStock + inwardQty - outwardQty;

      monthlyReport = await prisma.monthlyReport.create({
        data: {
          productId: product.id,
          plantId: loggedInUser.plantId,
          month: filter.month,
          year: filter.year,
          openingStock,
          inwardQty,
          outwardQty,
          closingStock,
          generatedAt: new Date(),
        },
      });
    }

    monthlyReports.push({
      ...monthlyReport,
      itemCode: product.itemCode,
      productName: product.designName,
      monthName: new Date(0, filter.month - 1).toLocaleString("default", {
        month: "long",
      }),
    });
  }

  monthlyReports.sort((a, b) => a.productName.localeCompare(b.productName));

  const paginatedReports = monthlyReports.slice(skip, skip + limit);

  const columns = [
    { field: "month", headerName: "Month", width: 120 },
    { field: "year", headerName: "Year", width: 100 },
    { field: "monthName", headerName: "Month Name", width: 150 },
    { field: "itemCode", headerName: "Item Code", width: 150 },
    { field: "productName", headerName: "Product Name", width: 200 },
    { field: "openingStock", headerName: "Opening Stock", width: 150 },
    { field: "inwardQty", headerName: "Inward Qty", width: 120 },
    { field: "outwardQty", headerName: "Outward Qty", width: 120 },
    { field: "closingStock", headerName: "Closing Stock", width: 150 },
    { field: "generatedAt", headerName: "Generated At", width: 180 },
  ];

  return {
    reports: paginatedReports,
    columns,
    page,
    limit,
    totalPages: Math.ceil(monthlyReports.length / limit),
    totalResults: monthlyReports.length,
  };
};

const getDailyReport = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    plantId: loggedInUser.plantId,
  };

  if (filter.productId) {
    whereCondition.id = filter.productId;
  }

  const products = await prisma.product.findMany({
    where: whereCondition,
    select: {
      id: true,
      designName: true,
      itemCode: true,
      openingStock: true,
      currentStock: true,
    },
  });
  const reportData = [];

  for (const product of products) {
    const dateRange = filter.dateRange;
    const datesInRange = [];
    const currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      datesInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const date of datesInRange) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const stockEntry = await prisma.stock.findUnique({
        where: {
          productId_date: {
            productId: product.id,
            date: dayStart,
          },
        },
      });

      const inwardEntries = await prisma.inward.findMany({
        where: {
          productId: product.id,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: "APPROVED",
        },
      });

      const outwardEntries = await prisma.outward.findMany({
        where: {
          productId: product.id,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const inwardQty = inwardEntries.reduce(
        (sum, entry) => sum + entry.finalQty,
        0
      );
      const outwardQty = outwardEntries.reduce(
        (sum, entry) => sum + entry.quantity,
        0
      );

      let openingStock, closingStock;

      if (stockEntry) {
        openingStock = stockEntry.openingStock;
        closingStock = stockEntry.closingStock;
      } else {
        const previousStock = await prisma.stock.findFirst({
          where: {
            productId: product.id,
            date: {
              lt: dayStart,
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        if (previousStock) {
          openingStock = previousStock.closingStock;
        } else {
          openingStock = product.openingStock;
        }

        closingStock = openingStock + inwardQty - outwardQty;
      }

      reportData.push({
        date: dayStart,
        itemCode: product.itemCode,
        productName: product.designName,
        openingStock,
        inwardQty,
        outwardQty,
        closingStock,
      });
    }
  }

  reportData.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    return a.productName.localeCompare(b.productName);
  });

  const paginatedData = reportData.slice(skip, skip + limit);

  const columns = [
    { field: "date", headerName: "Date", width: 150 },
    { field: "itemCode", headerName: "Item Code", width: 150 },
    { field: "productName", headerName: "Product Name", width: 200 },
    { field: "openingStock", headerName: "Opening Stock", width: 150 },
    { field: "inwardQty", headerName: "Inward Qty", width: 120 },
    { field: "outwardQty", headerName: "Outward Qty", width: 120 },
    { field: "closingStock", headerName: "Closing Stock", width: 150 },
  ];

  return {
    reports: paginatedData,
    columns,
    page,
    limit,
    totalPages: Math.ceil(reportData.length / limit),
    totalResults: reportData.length,
  };
};

module.exports = {
  getCurrentStock,
  queryStockHistory,
  getStockAlerts,
  getMonthlyReport,
  getDailyReport,
};
