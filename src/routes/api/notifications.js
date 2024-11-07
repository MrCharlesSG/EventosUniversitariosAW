import { Router } from "express";
import { NotificationsController } from "../../controllers/notifications.js";


export const notificationRouter = Router();

notificationRouter.get("/", NotificationsController.getAll)
notificationRouter.get("/andCheck", NotificationsController.getAllNotCheckedAndCheck)