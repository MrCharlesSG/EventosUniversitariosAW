import { Router } from "express";
import { authRouter } from "./auth.js";


export const apiRouter = Router();

apiRouter.use("/auth", authRouter )