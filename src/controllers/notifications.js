import { pool } from "../config/db.js";

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
    
            if (users.length === 0) return true; // Si no hay usuarios, simplemente se resuelve la promesa.
    
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
    
    

    static async sendOrganizerNotification(eventId, sender, message) {
        console.log("Sending Notification to Organizer: ", message);
    
        try {
            const getOrganizerQuery = "SELECT OrganizerID AS OrganizerEmail FROM Event WHERE ID = ?";
            const [result] = await pool.query(getOrganizerQuery, [eventId]);
    
            if (result.length === 0) {
                throw new Error("No se encontró organizador para el evento especificado.");
            }
    
            const organizerEmail = result[0].OrganizerEmail;
    
            const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
            const [notificationResult] = await pool.query(notificationQuery, [sender, message]);
    
            const notificationId = notificationResult.insertId;
    
            const insertOrganizerNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
            await pool.query(insertOrganizerNotificationQuery, [organizerEmail, notificationId]);
    
            console.log(`Notificación enviada al organizador: ${organizerEmail}`);
        } catch (err) {
            console.error("Error al enviar la notificación al organizador:", err);
            throw new Error("Error al enviar la notificación al organizador: " + err.message); // Lanzamos el error
        }
    }
    
    
    
    
}
