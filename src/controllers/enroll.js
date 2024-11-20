import { pool } from "../config/db.js";
import { NotificationsController } from "./notifications.js";

export class EnrollController {

    static async isEnrolled(req, res) {
        const { email } = req.user;
        const { idEvent } = req.params;

        try {
            const enrollmentResult = await isEnrolledQuery(idEvent, email);
    
            const enrolled = enrollmentResult.length > 0;
    
            return res.status(200).json({ enrolled });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }

    }

    static async enroll(req, res) {
        const { email } = req.user;
        const { idEvent } = req.params;
    
        try {
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
            const updateEnrollementQuery = "UPDATE Enrollment SET Status = ?, QueueDateTime = NULL WHERE EventID = ? AND UserEmail = ?";
    
            const [eventResult] = await pool.query(eventQuery, [idEvent]);
    
            if (eventResult.length === 0) {
                return res.status(400).json({ error: "No existe este evento" });
            }
    
            const event = eventResult[0];
            console.log("Enrolling ", email, "to event ", event.Title);
    
            const [enrollmentResult] = await pool.query("SELECT * FROM Enrollment WHERE EventID = ? AND UserEmail = ?", [idEvent, email]);
    
            if (enrollmentResult.length !== 0) {
                const enrollmentStatus = enrollmentResult[0].Status;
                if (enrollmentStatus !== 'cancelled') {
                    return res.status(400).json({ error: "Ya estás inscrito a este evento" });
                }
    
                const thereIsSpace = await checkCapacityQuery(event);
    
                const status = thereIsSpace ? 'confirmed' : 'waiting';
    
                await pool.query(updateEnrollementQuery, [status, idEvent, email]);
                console.log("Updating enrollment to ", status);
    
                const message = "El usuario " + email + (thereIsSpace ? ' se ha inscrito de nuevo a tu evento: ' : ' está en la cola de tu evento: ') + event.Title;
    
                console.log("Notifying of correct enroll to organizer ", message);
    
                await NotificationsController.sendNotificationToUser(
                    email, 
                    event.OrganizerID, 
                    message
                );
    
                return res.status(200).json({ message: thereIsSpace ? "El usuario ha sido inscrito" : "El usuario está en cola" });
    
            } else {
                await enrollQuery(event, email);
    
                const message = "El usuario " + email + " se ha inscrito a tu evento: " + event.Title;
    
                console.log("Notifying of correct enroll to organizer ", message);
    
                await NotificationsController.sendNotificationToUser(
                    email, 
                    event.OrganizerID, 
                    message
                );
    
                return res.status(200).json({ message: "El usuario ha sido inscrito exitosamente" });
            }
        } catch (error) {
            console.error("Error al inscribir al evento:", error);
            res.status(500).json({ error: "Error al inscribir al evento" });
        }
    }
    

    static async unenroll(req, res) {
        const { email } = req.user;
        const { idEvent } = req.params;
    
        try {
            const promoteQuery = "SELECT * FROM Enrollment WHERE EventID = ? AND Status = 'waiting' ORDER BY QueueDateTime ASC LIMIT 1";
            const updateEnrollmentQuery = "UPDATE Enrollment SET Status = ?, QueueDateTime = NULL WHERE EventID = ? AND UserEmail = ?";
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
    
            const enrollmentResult = await isEnrolledQuery(idEvent, email);
            if (enrollmentResult.length === 0 || enrollmentResult[0].Status === 'cancelled') {
                return res.status(400).json({ error: "El usuario no está inscrito al evento" });
            }
    
            const [eventResult] = await pool.query(eventQuery, [idEvent]);
            if (eventResult.length === 0) {
                return res.status(400).json({ error: "Evento no encontrado" });
            }
    
            const event = eventResult[0];
            console.log("The event where ", email, " wants to unenroll from ", event);
    
            await pool.query(updateEnrollmentQuery, ['cancelled', idEvent, email]);
    
            // Notify organizer
            const organizerMessage = `El usuario ${email} se ha desapuntado del evento ${event.Title}.`;
            await NotificationsController.sendOrganizerNotification(idEvent, email, organizerMessage);
    
            const [queueResult] = await pool.query(promoteQuery, [idEvent]);
    
            if (queueResult.length > 0) {
                // Promote user from the queue
                console.log("There is a queue");
                const promoteUser = queueResult[0].UserEmail;
                await pool.query(updateEnrollmentQuery, ['confirmed', idEvent, promoteUser]);
                console.log("Promoting ", promoteUser);
    
                // Notify the user that they have been promoted
                const userMessage = `Te has movido de la cola a inscrito en el evento ${event.Title}.`;
                await NotificationsController.sendNotificationToUser(
                    event.OrganizerID, promoteUser, userMessage
                );
    
                return res.status(200).json({ message: `Usuario ${email} se ha desapuntado y ${promoteUser} se ha inscrito.` });
            } else {
                console.log("No queue");
                return res.status(200).json({ message: `Usuario ${email} se ha desapuntado del evento ${idEvent}.` });
            }
        } catch (error) {
            console.error("Error al cancelar la inscripción al evento:", error);
            res.status(500).json({ error: "Error al cancelar la inscripción al evento" });
        }
    }
    
    

    static async getConfirmedEmails(req, res) {
        const { idEvent } = req.params;
    
        try {
            const confirmedQuery = `
                SELECT UserEmail 
                FROM Enrollment 
                WHERE EventID = ? AND Status = 'confirmed'
            `;
            
            const [result] = await pool.query(confirmedQuery, [idEvent]);
    
            const confirmedEmails = result.map(row => row.UserEmail);
            res.status(200).json({ confirmed: confirmedEmails });
    
        } catch (error) {
            console.error("Error al obtener correos de usuarios confirmados:", error);
            res.status(500).json({ error: "Error al obtener correos de usuarios confirmados" });
        }
    }
    
    static async getWaitingEmails(req, res) {
        const { idEvent } = req.params;
    
        try {
            const waitingQuery = `
                SELECT UserEmail 
                FROM Enrollment 
                WHERE EventID = ? AND Status = 'waiting'
                ORDER BY QueueDateTime ASC
            `;
            
            const [result] = await pool.query(waitingQuery, [idEvent]);
    
            const waitingEmails = result.map(row => row.UserEmail);
            res.status(200).json({ waiting: waitingEmails });
    
        } catch (error) {
            console.error("Error al obtener correos de usuarios en espera:", error);
            res.status(500).json({ error: "Error al obtener correos de usuarios en espera" });
        }
    } 
}

const isEnrolledQuery = async (idEvent, email) => {
    const checkEnrollmentQuery = "SELECT * FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
    const [result] = await pool.query(checkEnrollmentQuery, [idEvent, email]);
    return result;
};

const enrollQuery = async (event, email, callback, callbackError) => {
    const enrollConfirmed = "INSERT INTO Enrollment (EventID, UserEmail, Status) VALUES (?, ?, 'confirmed')";
    const enrollWaiting = "INSERT INTO Enrollment (EventID, UserEmail, Status, QueueDateTime) VALUES (?, ?, 'waiting', NOW())";

    try {
        const thereIsSpace = await checkCapacityQuery(event);
        const query = thereIsSpace ? enrollConfirmed : enrollWaiting;

        await pool.query(query, [event.ID, email]);

        console.log("Enrolled correctly");
        const message = `El usuario ${email} ${thereIsSpace ? 'se ha inscrito a tu evento: ' : 'está en la cola de tu evento: '} ${event.Title}`;
        callback(message);
    } catch (err) {
        callbackError(err.message);
    }
};

const checkCapacityQuery = async (event) => {
    const queryCheckCapacity = "SELECT COUNT(*) AS enrolledCount FROM Enrollment WHERE EventID = ? AND Status = 'confirmed'";
    const [capacityResult] = await pool.query(queryCheckCapacity, [event.ID]);
    
    const capacity = capacityResult[0].enrolledCount;
    const thereIsSpace = capacity < event.Capacity;
    return thereIsSpace;
};

