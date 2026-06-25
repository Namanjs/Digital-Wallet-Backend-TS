import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller";
import { upload } from "../middleware/multer.middleware";

const router = Router();

router.route("/registerUser").post(upload.fields([
    { name: 'avatar', maxCount: 1 }
]), registerUser);

router.route("/login").post(loginUser);

export {
    router as userRoutes
}