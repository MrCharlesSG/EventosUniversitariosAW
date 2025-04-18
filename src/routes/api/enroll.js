import { Router } from "express";
import { EnrollController } from "../../controllers/enroll.js";


export const enrollRouter = Router();

enrollRouter.post("/:idEvent", EnrollController.enroll)

enrollRouter.get("/isEnroll/:idEvent", EnrollController.isEnrolled)

enrollRouter.delete("/:idEvent", EnrollController.unenroll)

enrollRouter.get("/:idEvent/confirm/emails", EnrollController.getConfirmedEmails)
enrollRouter.get("/:idEvent/waiting/emails", EnrollController.getWaitingEmails)



