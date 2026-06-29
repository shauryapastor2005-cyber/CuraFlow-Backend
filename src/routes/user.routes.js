import { Router } from "express";
import {
  changeCurrentPassword,
  createCaregiver,
  deleteCaregiver,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  suspendCaregiver,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";
const router = Router();

router.route("/register").post(
  verifyJWT,
  verifyRole("admin"),
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
  createCaregiver
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
//secured route
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/refresh-token").post(refreshAccessToken);

//secured route
router.route("/current-user").get(verifyJWT, getCurrentUser);
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

router
  .route("/caregivers/:caregiverId/suspend")
  .patch(verifyJWT, verifyRole("admin"), suspendCaregiver);

router
  .route("/caregivers/:caregiverId")
  .delete(verifyJWT, verifyRole("admin"), deleteCaregiver);
export default router;
