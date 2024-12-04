import { pool } from "../config/db.js";
import cron from 'node-cron'

export class NotificationsController {
    static async getAllNotCheckedAndCheck(req, res) {
        const { email } = req.user;
    
        try {
            const query = `
                SELECT n.ID, n.Sender, un.UserEmail, n.Message, n.Date, un.Checked
                FROM Notifications n
                JOIN UserNotifications un ON n.ID = un.NotificationID
                WHERE un.UserEmail = ? AND un.Checked = 0
                ORDER BY n.Date DESC
            `;
    
            console.log("Getting notifications and checking for ", email);
            const [rows] = await pool.query(query, [email]);
            
            const queryUpdate = `
                UPDATE UserNotifications
                SET Checked = 1
                WHERE UserEmail = ? AND Checked = 0
            `;
            await pool.query(queryUpdate, [email]);
    
            console.log("Notifications marked as checked.");
            
            return res.json(rows);
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
            const query = `
                SELECT n.ID, n.Sender, un.UserEmail, n.Message, n.Date, un.Checked
                FROM Notifications n
                JOIN UserNotifications un ON n.ID = un.NotificationID
                WHERE un.UserEmail = ?
                ORDER BY n.Date DESC
            `;
    
            console.log("Getting notifications for ", email);
            const [rows] = await pool.query(query, [email]);
    
            return res.json(rows);
        } catch (error) {
            console.error("Error al obtener notificaciones:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las notificaciones"
            });
        }
    }
    
    static async sendNotificationOfModificatedEvent(event, sender, message) {
        console.log("Sending Notification ", message);
    
        try {
            const getUsersQuery = "SELECT UserEmail FROM Enrollment WHERE EventID = ?";
            const [users] = await pool.query(getUsersQuery, [event]);
    
            if (users.length === 0) return true; 
            
            const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
            const [result] = await pool.query(notificationQuery, [sender, message]);
    
            const notificationId = result.insertId;
    
            users.forEach(async user => {
                const insertUserNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
                await pool.query(insertUserNotificationQuery, [user.UserEmail, notificationId]);
                console.log(`Notificación enviada a ${user.UserEmail}`);
            })
    
        } catch (err) {
            console.error("Error al enviar la notificación:", err);
            throw new Error(err.message); 
        }
    }
        static async notifyUsersAboutUpcomingEvents() {
            try {
                const query = `
                    SELECT 
                        e.ID AS EventID,
                        e.Title AS EventTitle,
                        e.TimeInit,
                        e.OrganizerID,
                        GROUP_CONCAT(DISTINCT u.UserEmail) AS EnrolledUsers
                    FROM Event e
                    LEFT JOIN Enrollment u ON e.ID = u.EventID AND (u.Status = 'confirmed' or u.Status = 'waiting')
                    WHERE 
                        e.Active = 1 AND 
                        e.TimeInit > NOW() AND 
                        e.TimeInit <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
                    GROUP BY e.ID
                `;
                const [events] = await pool.query(query);
    
                if (events.length === 0) {
                    console.log("No hay eventos próximos en las próximas 24 horas.");
                    return;
                }
    
                events.forEach(async (event) => {
                    const { EventTitle, TimeInit, OrganizerID, EnrolledUsers } = event;
    
                    const timeRemaining = Math.ceil((new Date(TimeInit) - new Date()) / 3600000); 
                    const message = `Recuerda que el evento "${EventTitle}" empieza en menos de ${timeRemaining} horas.`;
    
                    if (EnrolledUsers) {
                        const users = EnrolledUsers.split(',');
                        users.forEach(async (user) => {
                            await this.sendNotificationToUser(OrganizerID, user, message); 
                        });
                    }
    
                });
            } catch (err) {
                console.error("Error al enviar notificaciones automáticas:", err);
            }
        }
    

    static async sendNotificationToUser(sender, receiver, message) {
        const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
    
        try {
            const [result] = await pool.query(notificationQuery, [sender, message]);
    
            const notificationId = result.insertId;
            const insertOrganizerNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
    
            await pool.query(insertOrganizerNotificationQuery, [receiver, notificationId]);
    
            console.log(`Notificación enviada al usuario: ${receiver} from ${sender}`);
        } catch (err) {
            console.error("Error al crear o asociar la notificación:", err);
            throw new Error("Error al crear o asociar la notificación: " + err.message); 
        }
    } 
}

cron.schedule('0 8 * * *', () => {
    console.log("Iniciando tarea de notificaciones automáticas...");
    NotificationsController.notifyUsersAboutUpcomingEvents();
});