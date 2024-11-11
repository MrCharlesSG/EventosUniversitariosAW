import { Router } from "express";
import { AuthController } from "../../controllers/auth.js";
import { isAuthenticated } from "../../middleware/auth.js";
import { ResetPasswordController } from "../../controllers/resetPassword.js";
export const authRouter = Router();


export const isnec = (req, res, next) => {
    console.log(req)
    next();
};
authRouter.post("/login",isnec, AuthController.login)
authRouter.post("/register", AuthController.register)
authRouter.post("/logout", isAuthenticated, AuthController.logout)
authRouter.post("/modifyUserInfo", isAuthenticated, AuthController.modifyUserInfo)

authRouter.post('/request-password-reset', ResetPasswordController.requestPasswordReset);
authRouter.post('/reset/:userId/:token', ResetPasswordController.resetPassword);
