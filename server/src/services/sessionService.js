const env = require("../config/env");
const { signToken, cookieOptions } = require("../utils/jwt");

function issueSession(res, user) {
  const token = signToken({ sub: user.id });
  res.cookie(env.cookieName, token, cookieOptions);
}

function clearSession(res) {
  res.clearCookie(env.cookieName, { ...cookieOptions, maxAge: 0 });
}

module.exports = {
  issueSession,
  clearSession,
};
