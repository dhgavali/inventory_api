const cron = require("node-cron");
const prisma = require("../database/prisma");
const logger = require("../config/logger");

const scheduleStockUpdateJob = () => {
  cron.schedule("50 23 * * *", async () => {
    logger.info("Running daily stock update job");
    try {
      await updateDailyStocks();
      logger.info("Daily stock update completed successfully");
    } catch (error) {
      logger.error(`Error in daily stock update: ${error.message}`);
    }
  });
};

const updateDailyStocks = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const products = await prisma.product.findMany();

  for (const product of products) {
    const todayStock = await prisma.stock.findUnique({
      where: {
        productId_date: {
          productId: product.id,
          date: today,
        },
      },
    });

    if (!todayStock) {
      const yesterdayStock = await prisma.stock.findFirst({
        where: {
          productId: product.id,
          date: {
            lt: today,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      const openingStock = yesterdayStock
        ? yesterdayStock.closingStock
        : product.openingStock;

      const inwardQty = await getInwardQuantity(product.id, today);
      const outwardQty = await getOutwardQuantity(product.id, today);

      await prisma.stock.create({
        data: {
          productId: product.id,
          plantId: product.plantId,
          date: today,
          openingStock,
          inwardQty,
          outwardQty,
          closingStock: openingStock + inwardQty - outwardQty,
        },
      });
    }

    const tomorrowStock = await prisma.stock.findUnique({
      where: {
        productId_date: {
          productId: product.id,
          date: tomorrow,
        },
      },
    });

    if (!tomorrowStock) {
      const updatedTodayStock = await prisma.stock.findUnique({
        where: {
          productId_date: {
            productId: product.id,
            date: today,
          },
        },
      });

      await prisma.stock.create({
        data: {
          productId: product.id,
          plantId: product.plantId,
          date: tomorrow,
          openingStock: updatedTodayStock
            ? updatedTodayStock.closingStock
            : product.openingStock,
          inwardQty: 0,
          outwardQty: 0,
          closingStock: updatedTodayStock
            ? updatedTodayStock.closingStock
            : product.openingStock,
        },
      });
    }
  }
};

const getInwardQuantity = async (productId, date) => {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const inwards = await prisma.inward.findMany({
    where: {
      productId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "APPROVED",
    },
  });

  return inwards.reduce((sum, inward) => sum + inward.finalQty, 0);
};

const getOutwardQuantity = async (productId, date) => {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const outwards = await prisma.outward.findMany({
    where: {
      productId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return outwards.reduce((sum, outward) => sum + outward.quantity, 0);
};

const scheduleMonthlyReportJob = () => {
  cron.schedule("55 23 * * *", async () => {
    const now = new Date();
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    if (now.getDate() === lastDayOfMonth) {
      logger.info("Running monthly report generation job");
      try {
        await generateMonthlyReports(now.getMonth() + 1, now.getFullYear());
        logger.info("Monthly report generation completed successfully");
      } catch (error) {
        logger.error(`Error in monthly report generation: ${error.message}`);
      }
    }
  });
};

const generateMonthlyReports = async (month, year) => {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get all inward entries for the month
    const inwardEntries = await prisma.inward.findMany({
      where: {
        productId: product.id,
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

    const lastDayPrevMonth = new Date(year, month - 1, 0);
    lastDayPrevMonth.setHours(23, 59, 59, 999);

    const previousStock = await prisma.stock.findFirst({
      where: {
        productId: product.id,
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

    const existingReport = await prisma.monthlyReport.findUnique({
      where: {
        productId_month_year_plantId: {
          productId: product.id,
          month,
          year,
          plantId: product.plantId,
        },
      },
    });

    if (existingReport) {
      await prisma.monthlyReport.update({
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
      await prisma.monthlyReport.create({
        data: {
          productId: product.id,
          plantId: product.plantId,
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
  }
};

module.exports = {
  scheduleStockUpdateJob,
  scheduleMonthlyReportJob,
};
