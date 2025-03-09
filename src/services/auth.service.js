const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const tokenService = require('./token.service');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const prisma = require('../database/prisma');

const loginUserWithMobileAndPassword = async (mobileNumber, password) => {
  const user = await userService.getUserByMobile(mobileNumber);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect mobile number or password');
  }
  return user;
};

const logout = async (refreshToken) => {
  const refreshTokenDoc = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: 'REFRESH',
      expires: {
        gt: new Date(),
      },
    },
  });

  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }

  await prisma.token.delete({
    where: {
      id: refreshTokenDoc.id,
    },
  });
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'REFRESH');
    const user = await userService.getUserById(refreshTokenDoc.userId);

    if (!user) {
      throw new Error();
    }

    await prisma.token.delete({
      where: {
        id: refreshTokenDoc.id,
      },
    });

    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const createPlant = async (plantData, loggedInUser) => {
  const existingPlant = await prisma.plant.findUnique({
    where: {
      code: plantData.code,
    },
  });

  if (existingPlant) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plant code already exists');
  }

  return prisma.plant.create({
    data: {
      ...plantData,
      createdById: loggedInUser.id,
      updatedById: loggedInUser.id,
    },
  });
};

const addUserToPlant = async (userId, plantId, loggedInUser) => {
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
  });

  if (!plant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plant not found');
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      plantId,
      updatedById: loggedInUser.id,
    },
  });
};

module.exports = {
  loginUserWithMobileAndPassword,
  logout,
  refreshAuth,
  createPlant,
  addUserToPlant,
};
