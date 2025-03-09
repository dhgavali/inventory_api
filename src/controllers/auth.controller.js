const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { mobileNumber, password } = req.body;
  const user = await authService.loginUserWithMobileAndPassword(mobileNumber, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const createPlant = catchAsync(async (req, res) => {
  const plant = await authService.createPlant(req.body, req.user);
  res.status(httpStatus.CREATED).send(plant);
});

const addUserToPlant = catchAsync(async (req, res) => {
  const user = await authService.addUserToPlant(req.params.userId, req.params.plantId, req.user);
  res.send(user);
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  createPlant,
  addUserToPlant,
};
