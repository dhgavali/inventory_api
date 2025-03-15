const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");
const { getProductColumns } = require("../utils/ColumnModels");
/**
 * Create a new product
 * @param {Object} productData
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const createProduct = async (productData, loggedInUser) => {
  if (await getProductByItemCode(productData.itemCode)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Item code already exists");
  }

  return prisma.product.create({
    data: {
      ...productData,
      plantId: loggedInUser.plantId,
    
      createdById: loggedInUser.id,
      updatedById: loggedInUser.id,
    },
  });
};

/**
 * Get product by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
  });
};

/**
 * Get product by item code
 * @param {string} itemCode
 * @returns {Promise<Object>}
 */
const getProductByItemCode = async (itemCode) => {
  return prisma.product.findUnique({
    where: { itemCode },
  });
};

/**
 * Query for products
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const queryProducts = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  
  // const whereCondition = {
  //   ...filter,
  //   plantId: loggedInUser.plantId,
  // };

  const products = await prisma.product.findMany({
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "asc" }
      : { createdAt: "desc" },
  });

  const count = await prisma.product.count();
  const plants = await prisma.plant.findMany();
  const plantsMap = plants.reduce((acc, plant) => {
    acc[plant.id] = plant.name;
    return acc;
  }, {});
  products.forEach(product => {
    product.plantName = plantsMap[product.plantId];
  });

  const columns = getProductColumns(loggedInUser.role);
  return {
    products,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get product list (minimal fields)
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Array>}
 */
const getProductList = async (loggedInUser) => {
  return prisma.product.findMany({
    select: {
      id: true,
      designName: true,
      itemCode: true,
    },
    orderBy: {
      designName: "asc",
    },
  });
};

/**
 * Update product by id
 * @param {string} productId
 * @param {Object} updateBody
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const updateProductById = async (productId, updateBody, loggedInUser) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // // Check if the product belongs to the user's plant
  // if (product.plantId !== loggedInUser.plantId) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You can only update products in your plant"
  //   );
  // }

  // If itemCode is being updated, check if it already exists
  if (
    updateBody.itemCode &&
    (await getProductByItemCode(updateBody.itemCode)) &&
    updateBody.itemCode !== product.itemCode
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Item code already taken");
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...updateBody,
      updatedById: loggedInUser.id,
    },
  });
};

/**
 * Delete product by id
 * @param {string} productId
 * @param {Object} loggedInUser
 * @returns {Promise<Object>}
 */
const deleteProductById = async (productId, loggedInUser) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if the product belongs to the user's plant
  // if (product.plantId !== loggedInUser.plantId) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You can only delete products in your plant"
  //   );
  // }

  // Check if product is used in stocks, inwards, or outwards
  const stockCount = await prisma.stock.count({
    where: { productId },
  });

  const inwardCount = await prisma.inward.count({
    where: { productId },
  });

  const outwardCount = await prisma.outward.count({
    where: { productId },
  });

  if (stockCount > 0 || inwardCount > 0 || outwardCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product cannot be deleted because it is used in stock, inward, or outward records"
    );
  }

  return prisma.product.delete({
    where: { id: productId },
  });
};

module.exports = {
  createProduct,
  getProductById,
  getProductByItemCode,
  queryProducts,
  getProductList,
  updateProductById,
  deleteProductById,
};
