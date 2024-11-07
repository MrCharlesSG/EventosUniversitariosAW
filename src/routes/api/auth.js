import { Router } from "express";
import { AuthController } from "../../controllers/auth.js";
import { isAuthenticated } from "../../middleware/auth.js";
export const authRouter = Router();

authRouter.post("/login", AuthController.login)
authRouter.post("/register", AuthController.register)
authRouter.post("/logout", isAuthenticated, AuthController.logout)
authRouter.post("/modifyUserInfo", isAuthenticated, AuthController.modifyUserInfo)