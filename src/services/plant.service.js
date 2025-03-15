const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const prisma = require('../database/prisma');
const { getPlantColumns } = require('../utils/ColumnModels');
const createPlant = async (plantData, loggedInUser) => {
  if (await getPlantByCode(plantData.code)) {
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

const getPlantById = async (id) => {
  return prisma.plant.findUnique({
    where: { id },
  });
};

const getPlantByCode = async (code) => {
  return prisma.plant.findUnique({
    where: { code },
  });
};

const queryPlants = async (filter, options, loggedInUser) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const plants = await prisma.plant.findMany({
    where: filter,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: options.sortOrder || 'asc' } : { createdAt: 'desc' },
  });

  const count = await prisma.plant.count({
    where: filter,
  });

  const columns = getPlantColumns(loggedInUser.role);

  return {
    plants,
    columns,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

const updatePlantById = async (plantId, updateBody, loggedInUser) => {
  const plant = await getPlantById(plantId);
  if (!plant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plant not found');
  }

  if (updateBody.code && (await getPlantByCode(updateBody.code)) && updateBody.code !== plant.code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plant code already taken');
  }

  return prisma.plant.update({
    where: { id: plantId },
    data: {
      ...updateBody,
      updatedById: loggedInUser.id,
    },
  });
};

const deletePlantById = async (plantId) => {
  const plant = await getPlantById(plantId);
  if (!plant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plant not found');
  }

  return prisma.plant.delete({
    where: { id: plantId },
  });
};

module.exports = {
  createPlant,
  getPlantById,
  getPlantByCode,
  queryPlants,
  updatePlantById,
  deletePlantById,
};
