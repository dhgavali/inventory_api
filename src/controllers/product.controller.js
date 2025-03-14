const httpStatus = require("http-status");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { productService } = require("../services");

/**
 * Create a new product
 * @route POST /api/v1/products
 */
const createProduct = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant before creating products"
  //   );
  // }

  const product = await productService.createProduct(req.body, req.user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'Product created successfully', product));
});

/**
 * Get all products
 * @route GET /api/v1/products
 */
const getProducts = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to view products"
  //   );
  // }

  const filter = pick(req.query, [
    "designName",
    "designCode",
    "colour",
    "itemCode",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await productService.queryProducts(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Products fetched successfully', result));
});

/**
 * Get product by id
 * @route GET /api/v1/products/:productId
 */
const getProduct = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to view products"
  //   );
  // }

  const product = await productService.getProductById(req.params.productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // // Check if the product belongs to the user's plant
  // if (product.plantId !== req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You can only access products in your plant"
  //   );
  // }

  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Product fetched successfully', product));
});

/**
 * Get product list (minimal fields)
 * @route GET /api/v1/products/list
 */
const getProductList = catchAsync(async (req, res) => {
  // Check if user has a plant assigned
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to list products"
  //   );
  // }

  const products = await productService.getProductList(req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Product list fetched successfully', products));
});

/**
 * Update product by id
 * @route PATCH /api/v1/products/:productId
 */
const updateProduct = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to update products"
  //   );
  // }

  const product = await productService.updateProductById(
    req.params.productId,
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Product updated successfully', product));
});

/**
 * Delete product by id
 * @route DELETE /api/v1/products/:productId
 */
const deleteProduct = catchAsync(async (req, res) => {
  // if (!req.user.plantId) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You must be assigned to a plant to delete products"
  //   );
  // }

  await productService.deleteProductById(req.params.productId, req.user);
  res.status(httpStatus.NO_CONTENT).send(ApiResponse.success(httpStatus.NO_CONTENT, 'Product deleted successfully'));
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getProductList,
  updateProduct,
  deleteProduct,
};
