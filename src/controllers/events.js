import { pool } from "../config/db.js";
import { isNormalUser, isOrganizer } from "../utils/auth-utils.js";

export class EventsController {
    static async getAll(req, res) {
        try {
            const userEmail = req.user.email; 
            const query = `
                SELECT 
                    Event.*, 
                    CASE 
                        WHEN Enrollment.UserEmail IS NOT NULL THEN true 
                        ELSE false 
                    END AS isEnrolled
                FROM Event
                LEFT JOIN Enrollment ON Event.ID = Enrollment.EventID AND Enrollment.UserEmail = ?
                ORDER BY Event.DateTime ASC
            `;
    
            console.log("Getting all events with enrollment status");
    
            pool.query(query, [userEmail], (err, rows) => {
                if (err) return res.status(500).json({ message: err.message });
                return res.json(rows);
            });
        } catch (error) {
            console.error("Error retrieving events:", error);
            res.status(500).json({ error: "Error retrieving events" });
        }
    }
    


    static async getOrganizersEvents(req, res) {
        const { role, email } = req.user;
        try {
            if (isOrganizer(role)) { 
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

        const { title, description, dateTime, location, capacity, eventTypeID } = req.body;

        try {
            const query = `
                INSERT INTO Event (Title, Description, DateTime, Location, Capacity, EventTypeID, OrganizerID)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            pool.query(
                query,
                [title, description, dateTime, location, capacity, eventTypeID, email],
                (err, result) => {
                    if(err) return res.status(500).json({ message: err.message });
                    res.status(201).redirect('/events');
                }
            );
            
        } catch (error) {
            console.error("Error al crear el evento:", error);
            res.status(500).json({ error: "Error al crear el evento" });
        }
    }

    static async updateEvent(req, res) {
        const { role, email } = req.user;
        const { id } = req.params;
        const { title, description, dateTime, location, capacity, eventTypeID } = req.body;

        if (!isOrganizer(role)) {
            return res.status(403).json({ error: "No tienes permisos para actualizar eventos" });
        }

        console.log("Updating as an organizer ", email, " this is the new title ", title)

        try {
            pool.query(
                "SELECT * FROM Event WHERE ID = ? AND OrganizerID = ?",
                [id, email],
                (err, result) => {
                    if(err) return res.status(500).json({ message: err.message });
                    if (result.length === 0) {
                        return res.status(404).json({ error: "Evento no encontrado o no tienes permiso para editarlo" });
                    }
                    const query = `
                        UPDATE Event
                        SET Title = ?, Description = ?, DateTime = ?, Location = ?, Capacity = ?, EventTypeID = ?
                        WHERE ID = ? AND OrganizerID = ?
                    `;
                    pool.query(
                        query,
                        [title, description, dateTime, location, capacity, eventTypeID, id, email],
                        (err, result) => {
                            if(err) return res.status(500).json({ message: err.message });
                            //Notify everyone of event updated
                            res.status(201).redirect('/events');
                        }
                    );
                }
                
            );            
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
            pool.query(
                "SELECT * FROM Event WHERE ID = ? AND OrganizerID = ?",
                [id, email],
                (err, result) => {
                    if(err) return res.status(500).json({ message: err.message });
                    if (result.length === 0) {
                        return res.status(404).json({ error: "Evento no encontrado o no tienes permiso para editarlo" });
                    }
                    console.log("Deleting as an organizer ", email, " the event ", result[0].Title)
                    const query = "DELETE FROM Event WHERE ID = ? AND OrganizerID = ?";
                    pool.query(
                        query,
                        [id, email],
                        (err, result) => {
                            if(err) return res.status(500).json({ message: err.message });
                            //NOTIFY evryone of canceled event
                            res.status(201).redirect('/events');
                        }
                    );
                }
                
            );            
        } catch (error) {
            console.error("Error al actualizar el evento:", error);
            res.status(500).json({ error: "Error al actualizar el evento" });
        }
    }


}
