import { pool } from "../config/db.js";

export class NotificationsController {
    static async getAll(req, res) {
        const { email } = req.user; // Datos del usuario autenticado, supongo que vienen desde `req.user`
        
        try {
            // Definir la consulta SQL para obtener todas las notificaciones
            let query = `SELECT n.ID, n.EventID, n.UserEmail, n.Message, e.Title AS EventTitle, e.DateTime AS EventDateTime 
                         FROM Notifications AS n
                         INNER JOIN Event AS e ON n.EventID = e.ID
                         WHERE n.UserEmail = ?`;
            console.log("Getting notifications of ", email)
            pool.query(
                query,
                email,
                (err, rows) => {
                    if(err) return res.status(500).json({ message: err.message });
                    return res.json(rows);
                }
            )
        } catch (error) {
            console.error("Error al obtener notificaciones:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las notificaciones"
            });
        }
    }
}
