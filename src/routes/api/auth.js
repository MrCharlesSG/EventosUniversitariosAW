import { Router } from "express";
import { EventsController } from "../../controllers/events.js";
import { isAuthenticated, isTheAuthenticatedUserAOrganizer } from "../../middleware/auth.js";
import { EnrollController } from "../../controllers/enroll.js";


export const enrollRouter = Router();

enrollRouter.post("/:id", EnrollController.enroll)

enrollRouter.get("/isEnroll/:id", EnrollController.isEnrrolled)



