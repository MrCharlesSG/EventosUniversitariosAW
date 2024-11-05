import { Router } from "express";
import { authRouter } from "./auth.js";
import { eventsRouter } from "./events.js";
import { isAuthenticated } from "../../middleware/auth.js";


export const apiRouter = Router();

apiRouter.use("/auth", authRouter )

apiRouter.use("/events", isAuthenticated, eventsRouter)