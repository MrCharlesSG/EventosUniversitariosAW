import { pool } from "../config/db.js";

export class NotificationsController {
    static async getAllNotCheckedAndCheck(req, res) {
        const { email } = req.user; 
        
        try {
            const query = "SELECT ID, Sender, UserEmail, Message, Date, Checked FROM Notifications WHERE UserEmail = ? AND Checked = 0 ORDER BY Date DESC";

            console.log("Getting notifications and checking of ", email)
            pool.query(
                query,
                email,
                (err, rows) => {
                    if(err) return res.status(500).json({ message: err.message });

                    //Check
                    const queryUpdate = "UPDATE Notifications SET Checked = 1 WHERE UserEmail = ? AND Checked = 0";
                    pool.query(queryUpdate, email, (updateErr) => {
                        if (updateErr) {
                            console.error("Error al actualizar el estado de las notificaciones", updateErr);
                            return res.status(500).json({ message: updateErr.message });
                        }
                        console.log("Notifications marked as checked.");
                    });


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


    static async getAll(req, res) {
        const { email } = req.user; 
        try {
            const query = "SELECT ID, Sender, UserEmail, Message, Date, Checked FROM Notifications WHERE UserEmail = ? ORDER BY Date DESC";
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
