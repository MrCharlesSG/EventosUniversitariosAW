import { classicalElectronRadiusDependencies } from "mathjs";
import { pool } from "../config/db.js";
import { isNormalUser, isOrganizer } from "../utils/auth-utils.js";


export class EnrollController {

    static async isEnrrolled(req, res){
        const { email } = req.user; 
        const { idEvent } = req.params;
        isEnrrolledQuery(idEvent, email,  (err, enrollmentResult) => {
                if (err) return res.status(500).json({ message: err.message });

                const enrrolled = enrollmentResult.length > 0;            
                return res.status(200).json({ enrrolled })
            }
        )
    }


    static async enroll(req, res) {
        const { email } = req.user; 
        const { idEvent } = req.params;

        try {
            // existe evento
            const eventQuery = "SELECT * FROM Event WHERE ID = ?";
            pool.query(eventQuery, [idEvent], (err, result) => {
                if (err) return res.status(500).json({ message: err.message });

                if (result.length === 0) {
                    return res.status(404).json({ error: "Evento no encontrado" });
                }

                const event = result[0];

                
                isEnrrolledQuery( idEvent, email, (err, enrollmentResult) => {
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

                            // NOTIFICAR a organizador
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

    // Otras funciones...
}

const isEnrrolledQuery = (idEvent, email, callback) => {
    const checkEnrollmentQuery = "SELECT * FROM Enrollment WHERE EventID = ? AND UserEmail = ?";
    pool.query(checkEnrollmentQuery, [idEvent, email],callback)
}
