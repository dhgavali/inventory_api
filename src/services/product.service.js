const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");

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
      plantId: "eea87b46-0ab1-4b8e-9e36-3523c1a3e14c",
    
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
  const columns = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'designName', headerName: 'Design Name', width: 150 },
    { field: 'designCode', headerName: 'Design Code', width: 150 },
    { field: 'colour', headerName: 'Colour', width: 150 },
    { field: 'itemCode', headerName: 'Item Code', width: 150 },
    { field: 'unitType', headerName: 'Unit Type', width: 150 },
    { field: 'buyPrice', headerName: 'Buy Price', width: 150 },
    { field: 'sellPrice', headerName: 'Sell Price', width: 150 },
    { field: 'minStockAlert', headerName: 'Min Stock Alert', width: 150 },
    { field: 'openingStock', headerName: 'Opening Stock', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },
    { field: 'updatedAt', headerName: 'Updated At', width: 150 },
    { field: 'handleProcess', headerName: 'Handle Process', width: 150 },
  ];
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
