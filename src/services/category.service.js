const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const prisma = require("../database/prisma");
const { getCategoryColumns } = require("../utils/ColumnModels");

/**
 * Create a category
 * @param {Object} categoryData
 * @returns {Promise<Object>}
 */
const createCategory = async (categoryData) => {
  // Check if category with the same code already exists
  const existingCategory = await prisma.category.findUnique({
    where: { categoryCode: categoryData.categoryCode },
  });

  if (existingCategory) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category code already taken");
  }

  return prisma.category.create({
    data: categoryData,
  });
};

/**
 * Get category by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getCategoryById = async (id) => {
  return prisma.category.findUnique({
    where: { id },
  });
};

/**
 * Query for categories
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @param {Object} loggedInUser - Logged in user
 * @returns {Promise<Object>}
 */
const queryCategories = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const categories = await prisma.category.findMany({
    where: filter,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "asc" }
      : { name: "asc" },
  });

  const count = await prisma.category.count({
    where: filter,
  });
  
  const columns = getCategoryColumns(loggedInUser.role);
  
  return {
    categories,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Update category by id
 * @param {string} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateCategoryById = async (categoryId, updateBody) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Check if code is being updated and if it's already taken
  if (updateBody.categoryCode && updateBody.categoryCode !== category.categoryCode) {
    const existingCategory = await prisma.category.findUnique({
      where: { categoryCode: updateBody.categoryCode },
    });

    if (existingCategory) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category code already taken");
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: updateBody,
  });
};

/**
 * Delete category by id
 * @param {string} categoryId
 * @returns {Promise<Object>}
 */
const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Check if category is used in any products
  const productCount = await prisma.product.count({
    where: { categoryId },
  });

  if (productCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete category that is linked to products"
    );
  }

  return prisma.category.delete({
    where: { id: categoryId },
  });
};

module.exports = {
  createCategory,
  getCategoryById,
  queryCategories,
  updateCategoryById,
  deleteCategoryById,
}; 