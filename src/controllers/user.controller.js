const httpStatus = require('http-status');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const pick = require('../utils/pick');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'User created successfully', user));
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
  const result = await userService.queryUsers(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Users fetched successfully', result));
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'User fetched successfully', user));
});

const getUsersByRole = catchAsync(async (req, res) => {
  const filter = { role: req.params.role };
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
  const result = await userService.queryUsers(filter, options, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'Users fetched successfully', result));
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body, req.user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'User updated successfully', user));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send(ApiResponse.success(httpStatus.NO_CONTENT, 'User deleted successfully'));
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  getUsersByRole,
  updateUser,
  deleteUser,
};
