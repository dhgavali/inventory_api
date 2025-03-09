const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const prisma = require('../database/prisma');

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, 'ACCESS');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, 'REFRESH');

  await prisma.token.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expires: refreshTokenExpires.toDate(),
      type: 'REFRESH',
    },
  });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const verifyToken = async (token, type) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await prisma.token.findFirst({
      where: {
        token,
        type,
        userId: payload.sub,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!tokenDoc) {
      throw new Error('Token not found');
    }

    return tokenDoc;
  } catch (error) {
    throw new Error('Token verification failed');
  }
};

module.exports = {
  generateToken,
  generateAuthTokens,
  verifyToken,
};
