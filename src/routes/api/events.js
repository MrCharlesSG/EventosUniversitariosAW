import { Router } from "express";
import { EventsController } from "../../controllers/events.js";


export const eventsRouter = Router();

eventsRouter.get("/", EventsController.getAll)

eventsRouter.post("/:id/update", EventsController.updateEvent)

eventsRouter.delete("/:id/cancel", EventsController.cancelEvent)

eventsRouter.post("/", EventsController.createEvent)

