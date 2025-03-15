const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");

/**
 * Create a supplier
 * @param {Object} supplierData
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const createSupplier = async (supplierData, loggedInUser) => {
  // Check if supplier with the same code already exists
  const existingSupplier = await prisma.supplier.findUnique({
    where: { code: supplierData.code },
  });

  if (existingSupplier) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Supplier code already taken");
  }

  // Set plant ID if not provided
  if (!supplierData.plantId && loggedInUser.plantId) {
    supplierData.plantId = loggedInUser.plantId;
  }

  return prisma.supplier.create({
    data: {
      ...supplierData,
      createdById: loggedInUser.id,
      updatedById: loggedInUser.id,
    },
  });
};

/**
 * Get supplier by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getSupplierById = async (id) => {
  return prisma.supplier.findUnique({
    where: { id },
  });
};

/**
 * Query for suppliers
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const querySuppliers = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    ...filter,
    plantId: loggedInUser.plantId,
  };

  const suppliers = await prisma.supplier.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "asc" }
      : { createdAt: "desc" },
  });

  const count = await prisma.supplier.count({
    where: whereCondition,
  });

  return {
    suppliers,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Update supplier by id
 * @param {string} supplierId
 * @param {Object} updateBody
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const updateSupplierById = async (supplierId, updateBody, loggedInUser) => {
  const supplier = await getSupplierById(supplierId);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }

  // Check if supplier belongs to user's plant
  if (supplier.plantId !== loggedInUser.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only update suppliers in your plant"
    );
  }

  // Check if code is being updated and if it's already taken
  if (updateBody.code && updateBody.code !== supplier.code) {
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code: updateBody.code },
    });

    if (existingSupplier) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Supplier code already taken");
    }
  }

  return prisma.supplier.update({
    where: { id: supplierId },
    data: {
      ...updateBody,
      updatedById: loggedInUser.id,
    },
  });
};

/**
 * Delete supplier by id
 * @param {string} supplierId
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const deleteSupplierById = async (supplierId, loggedInUser) => {
  const supplier = await getSupplierById(supplierId);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }

  // Check if supplier belongs to user's plant
  if (supplier.plantId !== loggedInUser.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only delete suppliers in your plant"
    );
  }

  // Check if supplier is used in any inwards
  const inwardCount = await prisma.inward.count({
    where: { supplierId },
  });

  if (inwardCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete supplier that is used in inward entries"
    );
  }

  return prisma.supplier.delete({
    where: { id: supplierId },
  });
};

module.exports = {
  createSupplier,
  getSupplierById,
  querySuppliers,
  updateSupplierById,
  deleteSupplierById,
};
