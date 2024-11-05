import { Router } from "express";
import { authRouter } from "./auth.js";
import { eventsRouter } from "./events.js";
import { isAuthenticated } from "../../middleware/auth.js";
import { notificationRouter } from "./notifications.js";


export const apiRouter = Router();

apiRouter.use("/auth", authRouter )

apiRouter.use("/events", isAuthenticated, eventsRouter)

apiRouter.use("/notifications", isAuthenticated, notificationRouter)