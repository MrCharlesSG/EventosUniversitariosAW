import { pool } from "../config/db.js";

export class EventsController {
    static async getAll(req, res) {
        const { role, email } = req.user; // Suponiendo que el email del usuario está en el token

        let events = []; // Inicializa como un array vacío

        try {
            if (role === 1) { // Organizador
                const query = 'SELECT * FROM Event WHERE OrganizerID = ? ORDER BY DateTime ASC';
                console.log("Getting events of ", email, " with role ", role)
                pool.query(
                    query,
                    email,
                    (err, rows) => {
                        if(err) return res.status(500).json({ message: err.message });
                        return res.json(rows);
                    }
                );
            } else if (role === 2) { // TODO
                const [studentEvents] = await pool.query(
                    `SELECT e.* FROM Event e
                     WHERE e.ID NOT IN (
                         SELECT EventID FROM Enrollment WHERE UserEmail = ?
                     )
                     AND e.Capacity > (
                         SELECT COUNT(*) FROM Enrollment WHERE EventID = e.ID
                     )
                     ORDER BY e.DateTime ASC`,
                    [email]
                );
                events = studentEvents;
            } else {
                return res.status(403).json({ error: "Acceso denegado" });
            }
        } catch (error) {
            console.error("Error retrieving events:", error);
            res.status(500).json({ error: "Error retrieving events" });
        }
    }
}
