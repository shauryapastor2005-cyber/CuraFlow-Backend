import { ApiError } from "../utils/ApiError.js";

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user?.role)) {
      return next();
    }

    throw new ApiError(403, "Access denied");
  };
};

export { verifyRole };
