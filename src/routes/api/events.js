import { Router } from "express";
import { EventsController } from "../../controllers/events.js";
import { isAuthenticated, isTheAuthenticatedUserAOrganizer } from "../../middleware/auth.js";


export const eventsRouter = Router();

eventsRouter.get("/", EventsController.getAll)

eventsRouter.get("/user", isTheAuthenticatedUserAOrganizer, EventsController.getOrganizersEvents )

eventsRouter.post("/:id/update",isTheAuthenticatedUserAOrganizer, EventsController.updateEvent)

eventsRouter.post("/:id/cancel",isTheAuthenticatedUserAOrganizer, EventsController.cancelEvent)

eventsRouter.post("/",isTheAuthenticatedUserAOrganizer, EventsController.createEvent)

