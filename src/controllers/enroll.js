import { pool } from "../config/db.js";
import { NotificationsController } from "./notifications.js";

export class EnrollController {
    static async isEnrolled(req, res) {
        const { email } = req.user;
        const { idEvent } = req.params;

        isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
            if (err) return res.status(500).json({ message: err.message });

            const enrolled = enrollmentResult.length > 0;
            return res.status(200).json({ enrolled });
        });
    }

    static async enroll(req, res) {
        const { email } = req.user;
        const { idEvent } = req.params;
    
        try {
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
            const updateEnrollementQuery = "UPDATE Enrollment SET Status = ?, QueueDateTime = NULL WHERE EventID = ? AND UserEmail = ?";
            
            pool.query(eventQuery, idEvent, (err, eventResult) => {
                if (err) return res.status(500).json({ message: err.message });
                if (eventResult.length === 0) return res.status(400).json({ error: "No existe este evento" });
    
                const event = eventResult[0];
                console.log("Enrolling ", email, "to event ", eventResult[0].Title)
                isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).json({ message: err.message });
                    }
    
                    if (enrollmentResult.length !== 0) {
                        const enrollmentStatus = enrollmentResult[0].Status;
                        if (enrollmentStatus !== 'cancelled') return res.status(400).json({ error: "Ya estás inscrito a este evento" });
                        
                        checkCapacityQuery(event, (thereIsSpace) => {
                            pool.query(updateEnrollementQuery, [thereIsSpace ? 'confirmed' : 'waiting', idEvent, email], (err) => {
                                if (err) return res.status(500).json({ message: err.message });
                                console.log("Updating enrollement to ", thereIsSpace ? 'confirmed' : 'waiting')

                                const message = "El usuario " + email + 
                                (thereIsSpace ? ' se ha inscrito de nuevo a tu evento: ' : ' esta en la cola de tu evento: ')
                                 + event.Title;

                                console.log("Notifying Of correct enroll to organizer ", message)
                                NotificationsController.sendNotificationToUser(
                                    email, event.OrganizerID, message,
                                    () => res.status(200),
                                    (message) => res.status(500).json({ message })

                                )
                                return res.status(200).json({ message: thereIsSpace ? "El usuario ha sido inscrito" : "El usuario está en cola" });
                            });
                        }, (message) => res.status(500).json({ message }));
                    } else {
                        enrollQuery(event, email,
                            (message) => {

                                console.log("Notifying Of correct enroll to organizer ", message)
                                NotificationsController.sendNotificationToUser(
                                    email, event.OrganizerID, message,
                                    () => res.status(200),
                                    (message) => res.status(500).json({ message })

                                )
                            },
                            (message) => res.status(500).json({ message })
                        );
                    }
                });
            });
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
    
            isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                if (err) return res.status(500).json({ message: err.message });
                if (enrollmentResult.length === 0 || enrollmentResult[0].Status === 'cancelled') {
                    return res.status(400).json({ error: "El usuario no está inscrito al evento" });
                }
    
                // get Event info
                pool.query(eventQuery, [idEvent], (err, eventResult) => {
                    if (err) return res.status(500).json({ message: err.message });
                    if (eventResult.length === 0) return res.status(400).json({ error: "Evento no encontrado" });
    
                    const event = eventResult[0];
                    console.log("The event where ", email, " whant to unenroll ", event);
    
                    // set state to cancelled
                    pool.query(updateEnrollmentQuery, ['cancelled', idEvent, email], (err) => {
                        if (err) return res.status(500).json({ message: err.message });
    
                        // notify organizer 
                        const organizerMessage = `El usuario ${email} se ha desapuntado del evento ${event.Title}.`;
                        NotificationsController.sendOrganizerNotification(
                            idEvent, email, organizerMessage,
                            () => {
                                console.log("desapuntado con exito , checkin en cola");
                                pool.query(promoteQuery, [idEvent], (err, queueResult) => {
                                    if (err) return res.status(500).json({ message: err.message });
    
                                    if (queueResult.length > 0) {
                                        // Promote 
                                        console.log("hay cola ");
                                        const promoteUser = queueResult[0].UserEmail;
                                        pool.query(updateEnrollmentQuery, ['confirmed', idEvent, promoteUser], (err) => {
                                            if (err) return res.status(500).json({ message: err.message });
                                            console.log("promoting ", promoteUser);
                                            // Notify user
                                            const userMessage = `Te has movido de la cola a inscrito en el evento ${event.Title}.`;
                                            NotificationsController.sendNotificationToUser(
                                                event.OrganizerID, promoteUser, userMessage,
                                                () => res.status(200).json({ message: `Usuario ${email} se ha desapuntado y ${promoteUser} se ha inscrito.` }),
                                                (message) => res.status(500).json({ message })
                                            );
                                        });
                                    } else {
                                        console.log("No hay cola ");
                                        return res.status(200).json({ message: `Usuario ${email} se ha desapuntado del evento ${idEvent}.` });
                                    }
                                });
                            },
                            (message) => res.status(500).json({ message })
                        );
                    });
                });
            });
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
            pool.query(confirmedQuery, [idEvent], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
    
                const confirmedEmails = result.map(row => row.UserEmail);
                res.status(200).json({ confirmed: confirmedEmails });
            });
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
            pool.query(waitingQuery, [idEvent], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });
    
                const waitingEmails = result.map(row => row.UserEmail);
                res.status(200).json({ waiting: waitingEmails });
            });
        } catch (error) {
            console.error("Error al obtener correos de usuarios en espera:", error);
            res.status(500).json({ error: "Error al obtener correos de usuarios en espera" });
        }
    }
    

}

const isEnrolledQuery = (idEvent, email, callback) => {
    const checkEnrollmentQuery = "SELECT * FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
    pool.query(checkEnrollmentQuery, [idEvent, email], callback);
};


const enrollQuery = (event, email, callback, callbackError) => {
    const enrollConfirmed = "INSERT INTO Enrollment (EventID, UserEmail, Status) VALUES (?, ?, 'confirmed')";
    const enrollWaiting = "INSERT INTO Enrollment (EventID, UserEmail, Status, QueueDateTime) VALUES (?, ?, 'waiting', NOW())";

    checkCapacityQuery(event, (thereIsSpace) => {
        pool.query(thereIsSpace ? enrollConfirmed : enrollWaiting, [event.ID, email], 
            (err) => {
                if (err) return callbackError(err.message);
                console.log("Enrrolled correctyly ")
                const message = "El usuario " + email + 
                                (thereIsSpace ? ' se ha inscrito a tu evento: ' : ' esta en la cola de tu evento: ')
                                 + event.Title;
                callback(message);
            }
        );
    }, callbackError);
};

const checkCapacityQuery = (event, callback, errorCallback) => {
    const queryCheckCapacity = "SELECT COUNT(*) AS enrolledCount FROM Enrollment WHERE EventID = ? AND Status = 'confirmed'";
    pool.query(queryCheckCapacity, [event.ID], (err, capacityResult) => {
        if (err) return errorCallback(err.message);

        const capacity = capacityResult[0].enrolledCount;
        const thereIsSpace = capacity < event.Capacity;  // Corrected logic
        callback(thereIsSpace);
    });
};
