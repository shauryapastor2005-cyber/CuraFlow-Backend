import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

import { User } from "../models/users.model.js";

// Middleware whose purpose is to convert an anonymous request
// into an authenticated request by attaching req.user

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Step 1:
    // Extract access token either from cookies (browser)
    // or Authorization header (mobile apps, Postman)
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Step 2:
    // If no token was provided, user is not logged in
    if (!token) {
      throw new ApiError(401, "unauthorised request");
    }

    // Step 3:
    // Verify token signature using our secret key.
    // If token is modified, expired, or fake, jwt.verify() throws error.
    // On success it returns payload containing _id and other fields.
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Step 4:
    // Even if token is valid, ensure that the user still exists.
    // Example:
    // User logs in -> gets token -> account deleted later.
    // Token may still be valid, but user no longer exists.
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // Step 5:
    // Token belongs to no existing user.
    // Therefore reject the request.
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Step 6:
    // Attach authenticated user object to request.
    // All subsequent controllers can directly access req.user
    // without querying database again.
    req.user = user;

    // Step 7:
    // Authentication successful.
    // Pass control to next middleware/controller.
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid access token");
  }
});
