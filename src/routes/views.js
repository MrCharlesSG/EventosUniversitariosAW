import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, isAuthenticatedOrganizer, redirectIfAuthenticated } from "../middleware/auth.js";
import { isOrganizer } from "../utils/auth-utils.js";
import { pool } from "../config/db.js";  // Asegúrate de tener acceso a tu pool de base de datos

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const viewsRouter = Router();

viewsRouter.get('/', isAuthenticated, (req, res) => {
    res.render('index', { 
        role: req.user.role
    });
});

viewsRouter.get('/events', isAuthenticated, (req, res) => {
    res.render('events', { 
        role: req.user.role,
        user: req.user.email,
        isMyEvents: false
    });
});

viewsRouter.get("/myevents", isAuthenticated, (req, res) => {
    res.render('events', { 
        role: req.user.role,
        user: req.user.email,
        isMyEvents: true
    });
})

viewsRouter.get("/auth/login", redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

viewsRouter.get("/events/form", isAuthenticatedOrganizer, async (req, res) => {
    pool.query(
        "SELECT * FROM EventType",
        (err, eventTypeList) => {
            if(err) {
                console.error("Error al cargar el formulario de eventos: ", err);
                res.status(500).json({ error: "Error al cargar el formulario de eventos" });
            }
            const eventID = req.query.eventID;

            if (eventID) {
                pool.query(
                    "SELECT * FROM Event WHERE ID = ?",
                    eventID,
                    (err, row) => {
                        if(err || row.length==0) return res.status(404).json({ error: "Evento no encontrado" });
                        res.render('event-form', { 
                            role: req.user.role,
                            eventTypeList,  
                            event:row[0],           
                        });
                    }
                )
            }else{
                res.render('event-form', { 
                    role: req.user.role,
                    eventTypeList,  
                    event:null,           
                });
            }
        }
    );
});
