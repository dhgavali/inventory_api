const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { authService, userService, tokenService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'User created successfully', { user, tokens }));
});

const login = catchAsync(async (req, res) => {
  const { mobileNumber, password } = req.body;
  const user = await authService.loginUserWithMobileAndPassword(mobileNumber, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send(ApiResponse.success(httpStatus.OK, 'User logged in successfully', { user, tokens }));
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send(ApiResponse.success(httpStatus.NO_CONTENT, 'User logged out successfully'));
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send(ApiResponse.success(httpStatus.OK, 'User logged in successfully', { ...tokens }));
});

const createPlant = catchAsync(async (req, res) => {
  const plant = await authService.createPlant(req.body, req.user);
  res.status(httpStatus.CREATED).send(ApiResponse.success(httpStatus.CREATED, 'Plant created successfully', plant));
});

const addUserToPlant = catchAsync(async (req, res) => {
  const user = await authService.addUserToPlant(req.params.userId, req.params.plantId, req.user);
  res.send(ApiResponse.success(httpStatus.OK, 'User added to plant successfully', user));
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  createPlant,
  addUserToPlant,
};
