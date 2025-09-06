const jwt = require('jsonwebtoken');

const generateWebAppButton = (text, partnerId) => {
  const webAppUrl = process.env.WEBAPP_URL || `${process.env.DOMAIN}/webapp`;
  const token = jwt.sign(
    { partnerId, type: 'partner' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    text,
    web_app: {
      url: `${webAppUrl}?token=${token}`
    }
  };
};

const generateAdminWebAppButton = (text, adminId) => {
  const webAppUrl = process.env.WEBAPP_URL || `${process.env.DOMAIN}/webapp`;
  const token = jwt.sign(
    { adminId, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  return {
    text,
    web_app: {
      url: `${webAppUrl}/admin?token=${token}`
    }
  };
};

const verifyWebAppToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateWebAppButton,
  generateAdminWebAppButton,
  verifyWebAppToken
};