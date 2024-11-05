import { Router } from "express";
import { EventsController } from "../../controllers/events.js";


export const eventsRouter = Router();

eventsRouter.get("/", EventsController.getAll)

