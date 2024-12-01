import moment from "moment";
import { pool } from "../config/db.js";
import { validateEventData } from "../schemas/event.js";
import { isNormalUser, isOrganizer } from "../utils/auth-utils.js";
import { NotificationsController } from "./notifications.js";

export class EventsController {
    static async getAll(req, res) {
        try {
            const userEmail = req.user.email;
    
            const getEventsQuery = `
                SELECT 
                    e.Title, 
                    e.Description, 
                    e.TimeInit,
                    e.TimeEnd, 
                    e.ID AS ID, 
                    f.ID AS FacultyID, 
                    f.Name AS FacultyName, 
                    f.University AS FacultyUniversity, 
                    r.Capacity AS Capacity, 
                    r.Name AS RoomName, 
                    e.OrganizerID, 
                    enr.Status AS Status,
                    et.Name AS EventType, 
                    (
                        SELECT COUNT(*) 
                        FROM Enrollment en 
                        WHERE en.EventID = e.ID 
                        AND en.Status IN ('confirmed', 'waiting')
                    ) AS EnrollmentCount
                FROM 
                    Event e
                LEFT JOIN 
                    Rooms r ON e.Location = r.RoomID
                LEFT JOIN 
                    Faculty f ON r.FacultyID = f.ID
                LEFT JOIN 
                    Enrollment enr ON e.ID = enr.EventID AND enr.UserEmail = ?
                LEFT JOIN 
                    EventType et ON et.ID = e.EventTypeID
                WHERE 
                    e.Active = 1 
                ORDER BY 
                    e.TimeInit ASC;

            `;
    
            console.log("Getting all events with enrollment status");
    
            const [rows] = await pool.query(getEventsQuery, [userEmail]);
    
            return res.json(rows);
        } catch (error) {
            console.error("Error retrieving events:", error);
            res.status(500).json({ error: "Error retrieving events" });
        }
    }
    
    


    static async getOrganizersEvents(req, res) {
        const { role, email } = req.user;
    
        try {
            if (isOrganizer(role)) { 
                const query = `
                    SELECT 
                        e.Title, 
                        e.Description, 
                        e.TimeInit,
                        e.TimeEnd, 
                        e.ID AS ID, 
                        f.ID AS FacultyID, 
                        f.Name AS FacultyName, 
                        f.University AS FacultyUniversity, 
                        r.Capacity AS Capacity, 
                        r.Name AS RoomName, 
                        e.OrganizerID,
                        et.Name AS EventType, 
                        (
                            SELECT COUNT(*) 
                            FROM Enrollment en 
                            WHERE en.EventID = e.ID 
                            AND en.Status IN ('confirmed', 'waiting')
                        ) AS EnrollmentCount
                    FROM 
                        Event e
                    LEFT JOIN 
                        Rooms r ON e.Location = r.RoomID
                    LEFT JOIN 
                        Faculty f ON r.FacultyID = f.ID
                    LEFT JOIN 
                        EventType et ON et.ID = e.EventTypeID
                    WHERE 
                        e.Active = 1 
                        AND e.OrganizerID = ?
                    ORDER BY 
                        e.TimeInit ASC;

                `;
                
                console.log("Getting events of ", email, " with role ", role);
    
                const [rows] = await pool.query(query, [email]);
                
                return res.json(rows);
            } else {
                return res.status(403).json({ error: "Acceso denegado" });
            }
        } catch (error) {
            console.error("Error retrieving events:", error);
            res.status(500).json({ error: "Error retrieving events" });
        }
    }
    


    static async createEvent(req, res) {
        const { role, email } = req.user;
    
        if (!isOrganizer(role)) {
            return res.status(403).json({ error: "No tienes permisos para crear eventos" });
        }
        
        console.log("Validating ", req.body)
        const isValidEvent = validateEventData(req.body);
        if (!isValidEvent.valid) {
            return res.status(400).json({ error: isValidEvent.message });
        }
        const { title, description, timeInit, location, eventTypeID, durationHours, durationMinutes } = req.body;
    
        let startDate = moment(timeInit);
        let timeEnd = startDate.add(parseInt(durationHours), 'hours').add(parseInt(durationMinutes), 'minutes').toISOString();
        
        try {
            const [existingEvents] = await pool.query(`
                SELECT * FROM Event 
                WHERE Location = ? 
                AND Active = 1 
                AND (
                    (TimeInit BETWEEN ? AND ?) 
                    OR (TimeEnd BETWEEN ? AND ?) 
                    OR (? BETWEEN TimeInit AND TimeEnd) 
                    OR (? BETWEEN TimeInit AND TimeEnd)
                )
            `, [location, timeInit, timeEnd, timeInit, timeEnd, timeInit, timeEnd]);
    
            if (existingEvents.length > 0) {
                return res.status(400).json({ error: 'La sala está ocupada en el rango de tiempo especificado.' });
            }
            const query = `
                INSERT INTO Event (Title, Description, TimeInit, TimeEnd , Location, EventTypeID, OrganizerID, Active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
    
            await pool.query(query, [title, description, timeInit, timeEnd, location, eventTypeID, email]);
    
            res.status(201).redirect('/events');
        } catch (error) {
            console.error("Error al crear el evento:", error);
            res.status(500).json({ error: "Error al crear el evento" });
        }
    }
    

    static async updateEvent(req, res) {
        const { role, email } = req.user;
        if (!isOrganizer(role)) {
            return res.status(403).json({ error: "No tienes permisos para actualizar eventos" });
        }
    
        const { id } = req.params;
        const { title, description, timeInit, location, eventTypeID, durationHours, durationMinutes } = req.body;
    
        console.log("Validating ", req.body);
        const isValidEvent = validateEventData(req.body);
        if (!isValidEvent.valid) {
            return res.status(400).json({ error: isValidEvent.message });
        }
    
        let startDate = moment.utc(timeInit);
        let timeEnd = startDate.add(parseInt(durationHours), 'hours').add(parseInt(durationMinutes), 'minutes').toISOString();
    
        try {
            const [[eventOfDb]] = await pool.query(
                "SELECT * FROM Event WHERE ID = ? AND OrganizerID = ?",
                [id, email]
            );
    
            if (!eventOfDb) {
                return res.status(404).json({ error: "Evento no encontrado o no tienes permiso para editarlo" });
            }
    
            const [existingEvents] = await pool.query(`
                SELECT * FROM Event 
                WHERE Location = ? 
                AND Active = 1 
                AND ID != ?  
                AND (
                    (TimeInit BETWEEN ? AND ?) 
                    OR (TimeEnd BETWEEN ? AND ?) 
                    OR (? BETWEEN TimeInit AND TimeEnd) 
                    OR (? BETWEEN TimeInit AND TimeEnd)
                )
            `, [location, id, timeInit, timeEnd, timeInit, timeEnd, timeInit, timeEnd]);
    
            if (existingEvents.length > 0) {
                return res.status(400).json({ error: 'La sala está ocupada en el rango de tiempo especificado.' });
            }
    
            const [[newRoom]] = await pool.query("SELECT Capacity FROM Rooms WHERE RoomID = ?", [location]);
            if (!newRoom) {
                return res.status(404).json({ error: "La sala seleccionada no existe" });
            }
            const newCapacity = newRoom.Capacity;
    
            const [[currentRoom]] = await pool.query("SELECT Capacity FROM Rooms WHERE RoomID = ?", [eventOfDb.Location]);
            const currentCapacity = currentRoom ? currentRoom.Capacity : 0;
    
            if (newCapacity !== currentCapacity) {
                console.log(`Capacity changed from ${currentCapacity} to ${newCapacity}`);
                const [currentEnrollments] = await pool.query(`
                    SELECT * FROM Enrollment 
                    WHERE EventID = ? 
                    AND Status = 'confirmed' 
                    ORDER BY DateTime ASC
                `, [id]);
    
                if (newCapacity < currentEnrollments.length) {
                    const excessUsers = currentEnrollments.slice(newCapacity);
                    for (const user of excessUsers) {
                        await pool.query("UPDATE Enrollment SET Status = 'waiting' WHERE EventID = ? AND UserEmail = ?", [id, user.UserEmail]);

                        const userMessage = `El evento ${title} ha cambiado de sala y ahora estás en la cola.`;
                        await NotificationsController.sendNotificationToUser(eventOfDb.OrganizerID, user.UserEmail, userMessage);
                    }
                } else if (newCapacity > currentEnrollments.length) {
                    const slotsToFill = newCapacity - currentEnrollments.length;
                    const [queueUsers] = await pool.query(`
                        SELECT * FROM Enrollment 
                        WHERE EventID = ? 
                        AND Status = 'waiting' 
                        ORDER BY DateTime ASC 
                        LIMIT ?
                    `, [id, slotsToFill]);
    
                    for (const user of queueUsers) {
                        await pool.query("UPDATE Enrollment SET Status = 'confirmed' WHERE EventID = ? AND UserEmail = ?", [id, user.UserEmail]);

                        const userMessage = `Te has movido de la cola a inscrito en el evento ${title}.`;
                        await NotificationsController.sendNotificationToUser(eventOfDb.OrganizerID, user.UserEmail, userMessage);
                    }
                }
            }
    
            const updateQuery = `
                UPDATE Event
                SET Title = ?, Description = ?, TimeInit = ?, TimeEnd = ?, Location = ?, EventTypeID = ?
                WHERE ID = ? AND OrganizerID = ?
            `;
            await pool.query(updateQuery, [title, description, timeInit, timeEnd, location, eventTypeID, id, email]);
    
            const message = `Se ha modificado este evento: ${eventOfDb.Title}`;
            await NotificationsController.sendNotificationOfModificatedEvent(id, email, message);
    
            res.status(201).redirect('/events');
        } catch (error) {
            console.error("Error al actualizar el evento:", error);
            res.status(500).json({ error: "Error al actualizar el evento" });
        }
    }
    
    

    static async cancelEvent(req, res) {
        const { role, email } = req.user;
        const { id } = req.params;
    
        if (!isOrganizer(role)) {
            return res.status(403).json({ error: "No tienes permisos para eliminar eventos" });
        }
    
        try {
            const [eventOfDb] = await pool.query(
                "SELECT * FROM Event WHERE ID = ? AND OrganizerID = ?",
                [id, email]
            );
    
            if (eventOfDb.length === 0) {
                return res.status(404).json({ error: "Evento no encontrado o no tienes permiso para editarlo" });
            }
    
            console.log("Deleting as an organizer ", email, " the event ", eventOfDb[0].Title);
    
            const updateQuery = "UPDATE Event SET Active = 0 WHERE ID = ? AND OrganizerID = ?";
            await pool.query(updateQuery, [id, email]);
    
            const message = `El evento ${eventOfDb[0].Title} ha sido cancelado.`;
            await NotificationsController.sendNotificationOfModificatedEvent(id, email, message);
    
            res.status(201).redirect('/events');
        } catch (error) {
            console.error("Error al cancelar el evento:", error);
            res.status(500).json({ error: "Error al cancelar el evento" });
        }
    }
    

    static async getRoomsByFacultyID(req, res) {
        try {
            const facultyID = req.params.id;
            const { timeInit, hours, minutes, eventID } = req.query;
    
            if (!facultyID) {
                return res.status(400).json({ error: 'El ID de la facultad es obligatorio.' });
            }
    
            if (!timeInit || isNaN(hours) || isNaN(minutes)) {
                let query = `
                    SELECT r.RoomID, r.Name, r.Capacity
                    FROM Rooms r
                    WHERE r.FacultyID = ?
                `;
                const params = [facultyID];
    
                const [rooms] = await pool.query(query, params);
                return res.status(200).json(rooms);
            }
    
            const timeInitMoment = moment.utc(timeInit);
            if (!timeInitMoment.isValid()) {
                return res.status(400).json({ error: 'La hora de inicio es inválida.' });
            }
    
            const durationInMinutes = (parseInt(hours) * 60) + parseInt(minutes);  
            const timeEndMoment = timeInitMoment.add(durationInMinutes, 'minutes');
            const timeEnd = timeEndMoment.toISOString(); 
    
            let query = `
                SELECT r.RoomID, r.Name, r.Capacity
                FROM Rooms r
                WHERE r.FacultyID = ?
            `;
            const params = [facultyID];
    
            query += `
                AND r.RoomID NOT IN (
                    SELECT e.Location
                    FROM Event e
                    WHERE e.Active = 1
                    AND e.ID != ? 
                    AND (
                        (e.TimeInit BETWEEN ? AND ?)
                        OR (e.TimeEnd BETWEEN ? AND ?)
                        OR (? BETWEEN e.TimeInit AND e.TimeEnd)
                        OR (? BETWEEN e.TimeInit AND e.TimeEnd)
                    )
                )
            `;
            
            params.push(eventID, timeInit, timeEnd, timeInit, timeEnd, timeInit, timeEnd);
    
            const [rooms] = await pool.query(query, params);
    
            res.status(200).json(rooms);
        } catch (err) {
            console.error("Error al obtener salas disponibles:", err);
            res.status(500).json({ error: 'Error al obtener salas disponibles.' });
        }
    }
    


}
