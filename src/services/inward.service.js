const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");
const { getInwardColumns } = require("../utils/ColumnModels");
/**
 * Create new inward entries (single or multiple)
 * @param {Object|Array} inwardData - Single inward object or array of inward objects
 * @param {Object} loggedInUser
 * @returns {Promise<Object|Array>}
 */
const createInward = async (inwardData, loggedInUser) => {
  // Check if input is an array, if not, convert to array for consistent processing
  const inwardItems = Array.isArray(inwardData) ? inwardData : [inwardData];
  const results = [];

  // Process each inward item
  for (const item of inwardItems) {
    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, `Product not found for item: ${JSON.stringify(item)}`);
    }

    // // Check if the product belongs to the user's plant
    // if (product.plantId !== loggedInUser.plantId) {
    //   throw new ApiError(
    //     httpStatus.FORBIDDEN,
    //     "You can only create inward entries for products in your plant"
    //   );
    // }

    // If source is SUPPLIER, validate supplier
    if (item.source === "SUPPLIER" && item.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: item.supplierId },
      });

      if (!supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, `Supplier not found for item: ${JSON.stringify(item)}`);
      }

      // Check if supplier belongs to the user's plant
      // if (supplier.plantId !== loggedInUser.plantId) {
      //   throw new ApiError(
      //     httpStatus.FORBIDDEN,
      //     "You can only use suppliers from your plant"
      //   );
      // }

      // Set supplier name and code
      item.supplierName = supplier.name;
      item.supplierCode = supplier.code;
    }

    // Get the current stock for opening stock
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const existingStock = await prisma.stock.findFirst({
      where: {
        productId: item.productId,
        date: {
          lt: currentDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const openingStock = existingStock
      ? existingStock.closingStock
      : product.openingStock;
    const finalQty =
      item.finalQty ||
      (item.source === "MANUFACTURED" ? item.qtySupervisor || 0 : 0);
    const closingStock = openingStock + finalQty;

    // Set status based on user role
    let status = "PENDING";
    if (
      loggedInUser.role === "SUPERVISOR" ||
      loggedInUser.role === "MANAGER" ||
      loggedInUser.role === "ADMIN"
    ) {
      status = "APPROVED";
    }

    // update the current quantity in the database; 
    if (status === "APPROVED") {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      const updatedCurrentStock = (product ? product.currentStock : 0) + finalQty;
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: updatedCurrentStock },
      });
    }
    // Create inward entry
    const inward = await prisma.inward.create({
      data: {
        ...item,
        openingStock,
        closingStock,
        status,
        plantId: loggedInUser.plantId,
        createdById: loggedInUser.id,
        finalQty: finalQty,
      },
    });

    // Update or create stock entry for the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStock = await prisma.stock.findUnique({
      where: {
        productId_date: {
          productId: item.productId,
          date: today,
        },
      },
    });

    if (todayStock) {
      // Update existing stock
      await prisma.stock.update({
        where: {
          id: todayStock.id,
        },
        data: {
          inwardQty: todayStock.inwardQty + finalQty,
          closingStock:
            todayStock.openingStock +
            todayStock.inwardQty +
            finalQty -
            todayStock.outwardQty,
          updatedById: loggedInUser.id,
        },
      });
    } else {
      // Create new stock entry
      await prisma.stock.create({
        data: {
          productId: item.productId,
          plantId: loggedInUser.plantId,
          date: today,
          openingStock,
          inwardQty: finalQty,
          closingStock: openingStock + finalQty,
          createdById: loggedInUser.id,
          updatedById: loggedInUser.id,
        },
      });
    }

    results.push(inward);
  }

  // Return array if input was array, otherwise return single object
  return Array.isArray(inwardData) ? results : results[0];
};

/**
 * Get inward by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getInwardById = async (id) => {
  return prisma.inward.findUnique({
    where: { id },
    include: {
      product: true,
      supplier: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      supervisor: {
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
 * Query for inwards
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const queryInwards = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // const whereCondition = {
  //   ...filter,
  //   plantId: loggedInUser.plantId,
  // };

  const whereCondition = {
    ...filter,
    plantId: loggedInUser.plantId,
  };

  // If user is SHIFT_INCHARGE, only show their entries
  if (loggedInUser.role === "SHIFT_INCHARGE") {
    whereCondition.createdById = loggedInUser.id;
  }



  const inwards = await prisma.inward.findMany({
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
          // inwardQty: true,
          // outwardQty: true,
          // closingStock: true,
          // openingStock:/ true,
        },
      },
      supplier: {
        select: {
          name: true,
          code: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          role: true,
        },
      },
      supervisor: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  const count = await prisma.inward.count({
    where: whereCondition,
  });



  const columns = getInwardColumns(loggedInUser.role);
  return {
    inwards,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get pending inwards for approval
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const getPendingInwards = async (options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    plantId: loggedInUser.plantId,
    status: "PENDING",
    source: "MANUFACTURED",
  };

  const pendingInwards = await prisma.inward.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: { date: "desc" },
    include: {
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

  const count = await prisma.inward.count({
    where: whereCondition,
  });

  return {
    inwards: pendingInwards,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Approve inward entry
 * @param {string} inwardId
 * @param {Object} approvalData
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const approveInward = async (inwardId, approvalData, loggedInUser) => {
  // Check if inward exists
  const inward = await prisma.inward.findUnique({
    where: { id: inwardId },
    include: {
      product: true,
    },
  });

  if (!inward) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inward entry not found");
  }

  // Check if inward belongs to user's plant
  if (inward.plantId !== loggedInUser.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only approve inward entries in your plant"
    );
  }

  // Check if user is supervisor or higher
  if (!["SUPERVISOR", "MANAGER", "ADMIN"].includes(loggedInUser.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only supervisors, managers, and admins can approve inward entries"
    );
  }

  // Check if inward is pending
  if (inward.status !== "PENDING") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This inward entry has already been processed"
    );
  }

  // Check if inward is manufactured
  if (inward.source !== "MANUFACTURED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only manufactured inward entries require approval"
    );
  }

  // Calculate new stock
  const finalQty = approvalData.qtySupervisor;
  const closingStock = inward.openingStock + finalQty;

  // Update inward entry
  const updatedInward = await prisma.inward.update({
    where: { id: inwardId },
    data: {
      qtySupervisor: finalQty,
      finalQty: finalQty,
      closingStock,
      status: "APPROVED",
      supervisorId: loggedInUser.id,
      updatedAt: new Date(),
    },
  });

 
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });
    const updatedCurrentStock = (product ? product.currentStock : 0) + finalQty;
    await prisma.product.update({
      where: { id: item.productId },
      data: { currentStock: updatedCurrentStock },
    });
  

  // Update stock entry for the day
  const today = new Date(inward.date);
  today.setHours(0, 0, 0, 0);

  const todayStock = await prisma.stock.findUnique({
    where: {
      productId_date: {
        productId: inward.productId,
        date: today,
      },
    },
  });

  if (todayStock) {
    // Calculate change in inward qty
    const qtyChange = finalQty - inward.finalQty;

    // Update existing stock
    await prisma.stock.update({
      where: {
        id: todayStock.id,
      },
      data: {
        inwardQty: todayStock.inwardQty + qtyChange,
        closingStock:
          todayStock.openingStock +
          todayStock.inwardQty +
          qtyChange -
          todayStock.outwardQty,
        updatedById: loggedInUser.id,
      },
    });
  }

  return updatedInward;
};

module.exports = {
  createInward,
  getInwardById,
  queryInwards,
  getPendingInwards,
  approveInward,
};
