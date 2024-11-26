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
                    e.DateTime, 
                    e.ID, 
                    f.ID AS FacultyID, 
                    f.Name AS FacultyName, 
                    f.University AS FacultyUniversity, 
                    e.Capacity, 
                    e.OrganizerID,
                    enr.Status,
                    et.Name AS EventType, 
                    (
                        SELECT COUNT(*) AS EnrollmentCount 
                        FROM enrollment en 
                        WHERE en.EventID = e.ID 
                        AND en.Status IN ('confirmed', 'waiting')
                    ) AS EnrollmentCount
                FROM 
                    Event e
                LEFT JOIN 
                    Faculty f ON e.Location = f.ID
                LEFT JOIN 
                    Enrollment enr ON e.ID = enr.EventID AND enr.UserEmail = ?
                LEFT JOIN 
                    eventtype et ON et.ID = e.EventTypeID
                WHERE 
                    e.Active = 1 
                ORDER BY 
                    e.DateTime ASC;
            `;
    
            console.log("Getting all events with enrollment status");
    
            // Usar await para esperar la consulta
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
                        e.DateTime, 
                        e.ID, 
                        f.ID AS FacultyID, 
                        f.Name AS FacultyName, 
                        f.University AS FacultyUniversity, 
                        e.Capacity, 
                        e.OrganizerID,
                        et.Name AS EventType, 
                        (
                            SELECT COUNT(*) AS EnrollmentCount 
                            FROM enrollment en 
                            WHERE en.EventID = e.ID 
                            AND en.Status IN ('confirmed', 'waiting')
                        ) AS EnrollmentCount
                    FROM 
                        Event e
                    LEFT JOIN 
                        Faculty f ON e.Location = f.ID
                    LEFT JOIN 
                        eventtype et ON et.ID = e.EventTypeID
                    WHERE 
                        e.Active = 1 AND e.OrganizerID = ?
                    ORDER BY 
                        e.DateTime ASC;
                `;
                
                console.log("Getting events of ", email, " with role ", role);
    
                // Usar await para esperar la consulta a la base de datos
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
        
        const isValidEvent = validateEventData(req.body);
        if (!isValidEvent.valid) {
            return res.status(400).json({ error: isValidEvent.message });
        }
        const { title, description, dateTime, location, capacity, eventTypeID } = req.body;
    
        try {
            const query = `
                INSERT INTO Event (Title, Description, DateTime, Location, Capacity, EventTypeID, OrganizerID, Active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
    
            await pool.query(query, [title, description, dateTime, location, capacity, eventTypeID, email]);
    
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
        console.log("Validating ", req.body)
        const isValidEvent = validateEventData(req.body);
        if (!isValidEvent.valid) {
            return res.status(400).json({ error: isValidEvent.message });
        }
        const { title, description, dateTime, location, capacity, eventTypeID } = req.body;
    
        console.log("Updating as an organizer ", email, " this is the new title ", title);
    
        try {
            const [eventOfDb] = await pool.query(
                "SELECT * FROM Event WHERE ID = ? AND OrganizerID = ?",
                [id, email]
            );
    
            if (eventOfDb.length === 0) {
                return res.status(404).json({ error: "Evento no encontrado o no tienes permiso para editarlo" });
            }
    
            const updateQuery = `
                UPDATE Event
                SET Title = ?, Description = ?, DateTime = ?, Location = ?, Capacity = ?, EventTypeID = ?
                WHERE ID = ? AND OrganizerID = ?
            `;
            await pool.query(updateQuery, [title, description, dateTime, location, capacity, eventTypeID, id, email]);
    
            const message = `Se ha modificado este evento: ${eventOfDb[0].Title}`;
            await NotificationsController.sendNotificationOfModificatedEvent(
                id,
                email,
                message
            );
    
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
    


}
