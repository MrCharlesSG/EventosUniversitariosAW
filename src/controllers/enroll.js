import { pool } from "../config/db.js";

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
            // Verificar si el evento existe
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
            pool.query(eventQuery, [idEvent], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });

                if (result.length === 0) {
                    return res.status(404).json({ error: "Evento no encontrado" });
                }

                const event = result[0];

                // ya inscrito
                isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                    if (err) return res.status(500).json({ message: err.message });

                    if (enrollmentResult.length > 0) {
                        return res.status(400).json({ error: "Ya estás inscrito en este evento" });
                    }

                    // en cola
                    const checkCapacityQuery = "SELECT COUNT(*) AS enrolledCount FROM Enrollment WHERE EventID = ? AND Status = 'confirmed'";
                    pool.query(checkCapacityQuery, [idEvent], (err, countResult) => {
                        if (err) return res.status(500).json({ message: err.message });

                        const enrolledCount = countResult[0].enrolledCount;

                        
                        if (enrolledCount >= event.Capacity) {
                            // en espera
                            const queueQuery = `
                                INSERT INTO Enrollment (EventID, UserEmail, Status, QueueDateTime) 
                                VALUES (?, ?, 'waiting', NOW())
                            `;
                            pool.query(queueQuery, [idEvent, email], (err) => {
                                if (err) return res.status(500).json({ message: err.message });

                                res.status(201).json({ message: "Inscripción en cola de espera", eventId: idEvent });
                            });
                        } else {
                            // confirmado
                            const enrollQuery = "INSERT INTO Enrollment (EventID, UserEmail, Status) VALUES (?, ?, 'confirmed')";
                            pool.query(enrollQuery, [idEvent, email], (err) => {
                                if (err) return res.status(500).json({ message: err.message });

                                res.status(201).json({ message: "Inscripción exitosa al evento", eventId: idEvent });
                            });
                        }
                    });
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
            isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                if (err) return res.status(500).json({ message: err.message });

                if (enrollmentResult.length === 0) {
                    return res.status(400).json({ error: "No estás inscrito en este evento" });
                }

                const unenrollQuery = "DELETE FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
                pool.query(unenrollQuery, [idEvent, email], (err, deleteResult) => {
                    if (err) return res.status(500).json({ message: err.message });

                    // Tras liberar el lugar, promover el primer usuario en espera
                    const promoteQuery = `
                        SELECT * FROM Enrollment WHERE EventID = ? AND Status = 'waiting' 
                        ORDER BY QueueDateTime ASC LIMIT 1
                    `;
                    pool.query(promoteQuery, [idEvent], (err, queueResult) => {
                        if (err) return res.status(500).json({ message: err.message });

                        if (queueResult.length > 0) {
                            const userInQueue = queueResult[0];
                            const updateStatusQuery = `
                                UPDATE Enrollment 
                                SET Status = 'confirmed', QueueDateTime = NULL 
                                WHERE EventID = ? AND UserEmail = ?
                            `;
                            pool.query(updateStatusQuery, [idEvent, userInQueue.UserEmail], (err, updateResult) => {
                                if (err) return res.status(500).json({ message: err.message });
                                
                                res.status(200).json({ 
                                    message: "Se ha cancelado la inscripción del evento y el primer usuario en espera ha sido promovido", 
                                    eventId: idEvent 
                                });
                            });
                        } else {
                            res.status(200).json({ 
                                message: "Se ha cancelado la inscripción del evento", 
                                eventId: idEvent 
                            });
                        }
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

