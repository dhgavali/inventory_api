const httpStatus = require("http-status");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { supplierService } = require("../services");

const createSupplier = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant before creating suppliers"
    );
  }

  const supplier = await supplierService.createSupplier(req.body, req.user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'Supplier created successfully', supplier));
});

const getSuppliers = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view suppliers"
    );
  }

  const filter = pick(req.query, ["code", "name", "city"]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
  const result = await supplierService.querySuppliers(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Suppliers fetched successfully', result));
});

const getSupplier = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to view suppliers"
    );
  }

  const supplier = await supplierService.getSupplierById(req.params.supplierId);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }

  if (supplier.plantId !== req.user.plantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only access suppliers in your plant"
    );
  }

  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Supplier fetched successfully', supplier));
});

const updateSupplier = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to update suppliers"
    );
  }

  const supplier = await supplierService.updateSupplierById(
    req.params.supplierId,
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Supplier updated successfully', supplier));
});

const deleteSupplier = catchAsync(async (req, res) => {
  if (!req.user.plantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must be assigned to a plant to delete suppliers"
    );
  }

  await supplierService.deleteSupplierById(req.params.supplierId, req.user);
  res.status(httpStatus.NO_CONTENT).send(ApiResponse.success(httpStatus.NO_CONTENT, 'Supplier deleted successfully'));
});

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
}; 