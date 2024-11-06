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
        console.log("Enrolling emial, ", email, " frm event ", idEvent)

        try {
            // existe evento?
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
            pool.query(eventQuery, [idEvent], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });

                if (result.length === 0) {
                    return res.status(404).json({ error: "Evento no encontrado" });
                }

                const event = result[0];

                // ya inscrito?
                isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                    if (err) return res.status(500).json({ message: err.message });

                    if (enrollmentResult.length > 0) {
                        return res.status(400).json({ error: "Ya estás inscrito en este evento" });
                    }

                    // capacidad
                    const checkCapacityQuery = "SELECT COUNT(*) AS enrolledCount FROM Enrollment WHERE EventID = ?";
                    pool.query(checkCapacityQuery, [idEvent], (err, countResult) => {
                        if (err) return res.status(500).json({ message: err.message });

                        const enrolledCount = countResult[0].enrolledCount;
                        if (enrolledCount >= event.Capacity) {
                            return res.status(400).json({ error: "El evento ha alcanzado su capacidad máxima" });
                        }

                        // Registrar al usuario en la tabla de inscripciones
                        const enrollQuery = "INSERT INTO Enrollment (EventID, UserEmail) VALUES (?, ?)";
                        pool.query(enrollQuery, [idEvent, email], (err, insertResult) => {
                            if (err) return res.status(500).json({ message: err.message });

                            res.status(201).json({ message: "Inscripción exitosa al evento", eventId: idEvent });
                        });
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
        console.log("Unenrolling emial, ", email, " frm event ", idEvent)
        try {
            isEnrolledQuery(idEvent, email, (err, enrollmentResult) => {
                if (err) return res.status(500).json({ message: err.message });

                if (enrollmentResult.length === 0) {
                    return res.status(400).json({ error: "No estás inscrito en este evento" });
                }

                const unenrollQuery = "DELETE FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
                pool.query(unenrollQuery, [idEvent, email], (err, deleteResult) => {
                    if (err) return res.status(500).json({ message: err.message });

                    res.status(200).json({ message: "Se ha cancelado la inscripción del evento", eventId: idEvent });
                });
            });
        } catch (error) {
            console.error("Error al cancelar la inscripción al evento:", error);
            res.status(500).json({ error: "Error al cancelar la inscripción al evento" });
        }
    }
}

const isEnrolledQuery = (idEvent, email, callback) => {
    const checkEnrollmentQuery = "SELECT * FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
    pool.query(checkEnrollmentQuery, [idEvent, email], callback);
};
