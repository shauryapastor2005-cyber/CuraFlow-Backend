import { User } from "../models/users.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../services/email.service.js";
import { welcomeEmailTemplate } from "../templates/welcomeEmail.template.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Validation
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, username, email, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //shortcut for checking on DB if any user with email or username exist or not
  });
  if (existedUser) {
    throw new ApiError(409, "username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  //   console.log("coverImageLocalPath: ", coverImageLocalPath);

  //validation of avatarLocalPath whether it exists
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //once validation now upload them to cloudinary from cloudinary util method
  // first import cloudinary then upload
  const avatar = await uploadOnCloudinary(avatarLocalPath); // we got cloudinary url now by using avatar.url
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //checking if uploaded on clooudinary or not
  if (!avatar) {
    throw new ApiError(500, "failed to upload");
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // we havent checked coverImage as it is not compulsory
    email: email,
    password: password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  try {
    const welcomeEmailHtml = welcomeEmailTemplate({
      fullname: createdUser.fullname,
    });

    await sendEmail({
      to: createdUser.email,
      subject: "Welcome to CuraFlow AI",
      html: welcomeEmailHtml,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error.message);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
        1. req body -> retrive data
        2. username or email based login
        3.  find user exists
        4. check the password entered to password in db
        5. generate access and refresh token
        6 send access token and refresh token as cookie 
    */
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist.");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //cookies part
  const options = {
    httpOnly: true, //security steps
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  //we have to clear cookies
  //we have to remove refresh tokens also
  /// This controller should only be accessible to a logged-in user.
  // Therefore we protected the route using verifyJWT middleware.
  // verifyJWT performs three things:
  // 1. Checks whether access token exists.
  // 2. Verifies that token is valid and untampered.
  // 3. Ensures the corresponding user still exists in database.
  // If all checks succeed, middleware attaches authenticated user
  // to req.user and only then transfers control to this controller.
  // Hence we can safely assume that req.user contains the current
  // authenticated user and use its _id without querying token again.

  await User.findByIdAndUpdate(
    req.user._id, //req.user is valid as our authmiddleware addded it through seured checks
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true, //security step
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body?.refreshToken; //if someone sending through mobile

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(401, "invalid refresh token");
  }

  if (incommingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  //since we have injected our auth middleware so we have access to user from req
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "invalid access");
  }
  if (!(await user.isPasswordCorrect(oldPassword))) {
    throw new ApiError(400, "old password is not correct");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "new password and old password do not match");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password is changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;
  if (!email && !fullname) {
    throw new ApiError(400, "enter email or fullname");
  }
  const updateFields = {};

  if (email) {
    updateFields.email = email;
  }

  if (fullname) {
    updateFields.fullname = fullname;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to update avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(500, "Failed to update cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
