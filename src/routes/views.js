import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, isAuthenticatedOrganizer, isAuthenticatedUser, redirectIfAuthenticated } from "../middleware/auth.js";
import { isOrganizer } from "../utils/auth-utils.js";
import { pool } from "../config/db.js";  // Asegúrate de tener acceso a tu pool de base de datos

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const viewsRouter = Router();

viewsRouter.get('/', isAuthenticated, (req, res) => {
    res.redirect('/events')
   /* res.render('index', { 
        role: req.user.role
    });*/
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

viewsRouter.get("/notifications", isAuthenticated, (req, res) => {
    res.render('notifications',{
        role: req.user.role,
        user: req.user.email,
        
    })
})



viewsRouter.get("/auth/login", redirectIfAuthenticated, (req, res) => {
   res.render('login')
});

viewsRouter.get("/auth/forgot-password", redirectIfAuthenticated, (req, res) => {
    res.render('forgot-password')
 });

 viewsRouter.get("/auth/reset-password/:token", (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token });
});

viewsRouter.get("/auth/register", redirectIfAuthenticated, async (req, res) => {
    try {
        const faculties = await pool.query("SELECT * FROM Faculty");
        console.log("The faculties attributes R ", faculties);

        const roles = await pool.query("SELECT ID, Name FROM Role");
        res.render('register', { faculties, roles });
    } catch (err) {
        console.error("Error al obtener datos para el registro:", err);
        res.status(500).send("Error al obtener datos para el registro");
    }
});


viewsRouter.get("/profile", isAuthenticated, async (req, res) => {
    try {
        const email = req.session.user.email;

        const faculties = await pool.query("SELECT * FROM Faculty");
        console.log("The faculties attributes ", faculties);

        const result = await pool.query(
            "SELECT u.Email, u.FullName, u.Phone, f.ID AS FacultyID, f.Name AS FacultyName FROM User u JOIN Faculty f ON u.FacultyID = f.ID WHERE u.Email = ?",
            [email]
        );
        console.log("The profile attributes ", result);

        const user = result[0];
        res.render("profile", { user, faculties });
    } catch (err) {
        console.error("Error al obtener datos del perfil:", err);
        res.status(500).send("Error al obtener datos del perfil");
    }
});


viewsRouter.get("/events/info", isAuthenticatedOrganizer, async (req, res) => {
    try {
        const [eventTypeList] = await pool.query("SELECT * FROM EventType");
        const [facultyList] = await pool.query("SELECT * FROM Faculty");
        const eventID = req.query.eventID;

        if (eventID) {
            const [rows] = await pool.query("SELECT * FROM Event WHERE ID = ?", [eventID]);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Evento no encontrado" });
            }

            res.render('event-info', {
                role: req.user.role,
                eventTypeList,
                facultyList,
                event: rows[0],
            });
        } else {
            res.status(404).json({ error: "Vista no encontrada" });
        }
    } catch (err) {
        console.error("Error al cargar el formulario: ", err);
        res.status(500).json({ error: "Error al cargar el formulario" });
    }
});



viewsRouter.get("/events/add", isAuthenticatedOrganizer, async (req, res) => {
    try {
        const eventTypeList = await pool.query("SELECT * FROM EventType");
        res.render('event-add', {
            role: req.user.role,
            eventTypeList,
        });
    } catch (err) {
        console.error("Error al cargar el formulario: ", err);
        res.status(500).json({ error: "Error al cargar el formulario" });
    }
});

