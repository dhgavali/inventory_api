const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { getOutwardColumns } = require("../utils/ColumnModels");
const prisma = require("../database/prisma");

/**
 * Create a new outward entry
 * @param {Object} outwardData
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const createOutward = async (outwardData, loggedInUser) => {
  // Check if the product exists
  const product = await prisma.product.findUnique({
    where: { id: outwardData.productId },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if the product belongs to the user's plant
  // if (product.plantId !== loggedInUser.plantId) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You can only create outward entries for products in your plant"
  //   );
  // }

  // Get the current stock
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const todayStock = await prisma.stock.findUnique({
    where: {
      productId_date: {
        productId: outwardData.productId,
        date: currentDate,
      },
    },
  });

  let currentStock;
  if (todayStock) {
    currentStock =
      todayStock.openingStock + todayStock.inwardQty - todayStock.outwardQty;
  } else {
    // Find the most recent stock entry
    const lastStock = await prisma.stock.findFirst({
      where: {
        productId: outwardData.productId,
        date: {
          lt: currentDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    if (lastStock) {
      currentStock = lastStock.closingStock;
    } else {
      // No stock history, use opening stock from product
      currentStock = product.openingStock;
    }
  }

  // Check if there's enough stock
  if (currentStock < outwardData.quantity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock. Available: ${currentStock}, Requested: ${outwardData.quantity}`
    );
  }

  // Create outward entry
  const outward = await prisma.outward.create({
    data: {
      ...outwardData,
      plantId: loggedInUser.plantId,
      createdById: loggedInUser.id,
    },
  });

  // Update or create stock entry for the day
  if (todayStock) {
    // Update existing stock
    await prisma.stock.update({
      where: {
        id: todayStock.id,
      },
      data: {
        outwardQty: todayStock.outwardQty + outwardData.quantity,
        closingStock:
          todayStock.openingStock +
          todayStock.inwardQty -
          (todayStock.outwardQty + outwardData.quantity),
        updatedById: loggedInUser.id,
      },
    });
  } else {
    // Create new stock entry
    await prisma.stock.create({
      data: {
        productId: outwardData.productId,
        plantId: loggedInUser.plantId,
        date: currentDate,
        openingStock: currentStock,
        outwardQty: outwardData.quantity,
        closingStock: currentStock - outwardData.quantity,
        createdById: loggedInUser.id,
        updatedById: loggedInUser.id,
      },
    });
  }

  return outward;
};

/**
 * Get outward by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getOutwardById = async (id) => {
  return prisma.outward.findUnique({
    where: { id },
    include: {
      product: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Query for outwards
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const queryOutwards = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    ...filter,
    plantId: loggedInUser.plantId,
  };

  const outwards = await prisma.outward.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "desc" }
      : { date: "desc" },
    include: {
      plant: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          designName: true,
          itemCode: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  const count = await prisma.outward.count({
    where: whereCondition,
  });
  
  outwards.map((outward) => {
    outward.designName = outward.product.designName;
    outward.itemCode = outward.product.itemCode;
    outward.plantName = outward.plant.name;

  });
  const columns = getOutwardColumns(loggedInUser.role);
  return {
    outwards,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

module.exports = {
  createOutward,
  getOutwardById,
  queryOutwards,
};
