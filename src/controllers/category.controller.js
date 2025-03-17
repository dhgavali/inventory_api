const httpStatus = require("http-status");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { categoryService } = require("../services");

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'Category created successfully', category));
});

const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "categoryCode"]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await categoryService.queryCategories(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Categories fetched successfully', result));
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Category fetched successfully', category));
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategoryById(
    req.params.categoryId,
    req.body
  );
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Category updated successfully', category));
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategoryById(req.params.categoryId);
  res.status(httpStatus.NO_CONTENT).send(ApiResponse.success(httpStatus.NO_CONTENT, 'Category deleted successfully'));
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
