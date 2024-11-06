import { Router } from "express";
import { isAuthenticated } from "../../middleware/auth.js";
import { authRouter } from "./auth.js";
import { eventsRouter } from "./events.js";
import { notificationRouter } from "./notifications.js";
import { enrollRouter } from "./enroll.js";


export const apiRouter = Router();

apiRouter.use("/auth", authRouter )

apiRouter.use("/events", isAuthenticated, eventsRouter)

apiRouter.use("/enroll", isAuthenticated, enrollRouter)

apiRouter.use("/notifications", isAuthenticated, notificationRouter)