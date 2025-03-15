const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const prisma = require('../database/prisma');
const { getUserColumns } = require('../utils/ColumnModels');
const createUser = async (userBody, loggedInUser = null) => {
  if (await getUserByMobile(userBody.mobileNumber)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
  }

  const hashedPassword = await bcrypt.hash(userBody.password, 8);

  const userData = {
    ...userBody,
    password: hashedPassword,
    plainPassword: userBody.password,
  };

  if (loggedInUser) {
    userData.plantId = loggedInUser.plantId;
    userData.createdById = loggedInUser.id;
    userData.updatedById = loggedInUser.id;
  }

  return prisma.user.create({
    data: userData,
  });
};

const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const getUserByMobile = async (mobileNumber) => {
  return prisma.user.findUnique({
    where: { mobileNumber },
  });
};

const queryUsers = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    ...filter,
    plantId: loggedInUser.plantId,
  };

  if (filter.role) {
    whereCondition.role = filter.role;
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: options.sortOrder || 'asc' } : { createdAt: 'desc' },
  });

  // adding plant name to the users
  const plants = await prisma.plant.findMany();
  const plantsMap = plants.reduce((acc, plant) => {
    acc[plant.id] = plant.name;
    return acc;
  }, {});

  users.forEach(user => {
    user.plantName = plantsMap[user.plantId];
  });

  const count = await prisma.user.count({
    where: whereCondition,
  });
  
  const columns = getUserColumns(loggedInUser.role);

  return {
    users,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

const updateUserById = async (userId, updateBody, loggedInUser) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (
    updateBody.mobileNumber &&
    (await getUserByMobile(updateBody.mobileNumber)) &&
    updateBody.mobileNumber !== user.mobileNumber
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
  }

  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 8);
    updateBody.plainPassword = updateBody.password;
  }

  updateBody.updatedById = loggedInUser.id;

  return prisma.user.update({
    where: { id: userId },
    data: updateBody,
  });
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return prisma.user.delete({
    where: { id: userId },
  });
};

module.exports = {
  createUser,
  getUserById,
  getUserByMobile,
  queryUsers,
  updateUserById,
  deleteUserById,
};
