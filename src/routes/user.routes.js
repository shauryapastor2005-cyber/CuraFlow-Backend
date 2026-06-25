import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  // WE HAVE DONE NOTHING
  // JUST ADDED OUR MULTER MIDDLEWARE
  // INSIDE ROUTES
  // SO NOW WHEN WE CALL REQ.BODY WE
  //GET SOME MORE FIELDS FOR HANDLING
  //IMAGES AND VIDEOS
  // see we added files fields names avatar and coverimage
  // so now when we call req.body we have now additional fields .avatar
  //this part is handling the file upload in step 1 of retreiving user data
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(
  verifyJWT, // Protect this route. Middleware verifies access token,

  // ensures the user still exists in DB,

  // and attaches the authenticated user object to req.user.

  // If any check fails, request is rejected before reaching logoutUser.

  logoutUser
);
//secured route
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/refresh-token").post(refreshAccessToken);

//secured route
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-user-details").patch(verifyJWT, updateUserDetails);

//secure + multer middleware
router.route("/update-avatar").patch(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateUserAvatar
);

router.route("/update-cover-image").patch(
  verifyJWT,
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  updateUserCoverImage
);
export default router;
