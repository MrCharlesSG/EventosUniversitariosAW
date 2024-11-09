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
            pool.query(query, [email], (err, rows) => {
                if (err) {
                    return res.status(500).json({ message: err.message });
                }
    
                // check
                const queryUpdate = `
                    UPDATE UserNotifications
                    SET Checked = 1
                    WHERE UserEmail = ? AND Checked = 0
                `;
                pool.query(queryUpdate, [email], (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating the notifications state", updateErr);
                        return res.status(500).json({ message: updateErr.message });
                    }
                    console.log("Notifications marked as checked.");
                });
    
                return res.json(rows);
            });
    
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
            pool.query(query, [email], (err, rows) => {
                if (err) {
                    return res.status(500).json({ message: err.message });
                }
                return res.json(rows);
            });
    
        } catch (error) {
            console.error("Error al obtener notificaciones:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las notificaciones"
            });
        }
    }
    
    

    static sendNotificaionOfModificatedEvent(event, sender, message, callback, errorCallback) {
        console.log("Sending Notification ", message);
    
        const getUsersQuery = "SELECT UserEmail FROM Enrollment WHERE EventID = ?";
        pool.query(getUsersQuery, [event], (err, users) => {
            if (err) {
                return errorCallback(err.message);
            }
    
            const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
            
                
            if(users.lenght==0) return callback();
            pool.query(notificationQuery, [sender, message], (err, result) => {
                if (err) {
                    console.error("Error al crear la notificación:", err);
                    return callback(err.message);
                }
                const notificationId = result.insertId;
    
                users.forEach(user => {
                    const insertUserNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
                    pool.query(insertUserNotificationQuery, [user.UserEmail, notificationId], (err) => {
                        if (err) {
                            console.error("Error al asociar la notificación con el usuario:", err);
                        } else {
                            console.log(`Notificación enviada a ${user.UserEmail}`);
                        }
                    });
                });
                return callback();
            });
        });
    }

    static sendNotificationToUser(sender, receiber, message, callback, errorCallback) {
        const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
    
        pool.query(notificationQuery, [sender, message], (err, result) => {
            if (err) {
                console.error("Error al crear la notificación:", err);
                return errorCallback("Error al crear la notificación: " + err.message);
            }
    
            const notificationId = result.insertId;
            const insertOrganizerNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
            pool.query(insertOrganizerNotificationQuery, [receiber, notificationId], (err) => {
                if (err) {
                    console.error("Error al asociar la notificación con el usuario:", err);
                    return errorCallback("Error al asociar la notificación con el usuario: " + err.message);
                }
    
                console.log(`Notificación enviada al usuario: ${receiber} from ${sender}`);
                callback(); 
            });
        });
    }

    static sendOrganizerNotification(eventId, sender, message, callback, errorCallback) {
        console.log("Sending Notification to Organizer: ", message);
    
        // Obtener el organizador del evento
        const getOrganizerQuery = "SELECT OrganizerID AS OrganizerEmail FROM Event WHERE ID = ?";
    
        pool.query(getOrganizerQuery, [eventId], (err, result) => {
            if (err) {
                return errorCallback("Error al obtener el organizador del evento: " + err.message);
            }
    
            if (result.length === 0) {
                return errorCallback("No se encontró organizador para el evento especificado.");
            }
    
            const organizerEmail = result[0].OrganizerEmail;
    
            // Crear la notificación para el organizador
            const notificationQuery = "INSERT INTO Notifications (Sender, Date, Message) VALUES (?, NOW(), ?)";
            pool.query(notificationQuery, [sender, message], (err, result) => {
                if (err) {
                    console.error("Error al crear la notificación:", err);
                    return errorCallback(err.message);
                }
    
                const notificationId = result.insertId;
    
                // Asocia la notificación con el organizador
                const insertOrganizerNotificationQuery = "INSERT INTO UserNotifications (UserEmail, NotificationID, Checked) VALUES (?, ?, 0)";
                pool.query(insertOrganizerNotificationQuery, [organizerEmail, notificationId], (err) => {
                    if (err) {
                        console.error("Error al asociar la notificación con el organizador:", err);
                        return errorCallback("Error al asociar la notificación con el organizador: " + err.message);
                    }
    
                    console.log(`Notificación enviada al organizador: ${organizerEmail}`);
                    return callback();
                });
            });
        });
    }
    
    
}
