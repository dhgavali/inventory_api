const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const prisma = require("../database/prisma");

const checkJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        plant: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
  }
};

const checkRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }

    if (!requiredRoles.includes(req.user.role)) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions")
      );
    }

    next();
  };
};

module.exports = {
  checkJWT,
  checkRole,
};
