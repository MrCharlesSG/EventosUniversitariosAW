import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from "../config/db.js";
import { isAuthenticated, isAuthenticatedOrganizer, redirectIfAuthenticated } from "../middleware/auth.js";
import moment from 'moment-timezone'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const viewsRouter = Router();

const getTheme = (req) => {
    console.log("Getting saved themec ", req.session)
    return req.session.theme || ''
}

viewsRouter.get('/', isAuthenticated, (req, res) => {
    res.redirect('/events')
   /* res.render('index', { 
        role: req.user.role
    });*/
});

viewsRouter.get('/events', isAuthenticated, async (req, res) => {
    try {
        

        const [eventTypeList] = await pool.query("SELECT * FROM EventType");
        const [facultyList] = await pool.query("SELECT * FROM Faculty");

        res.render('events', {
            role: req.user.role,
            user: req.user.email,
            isMyEvents: false,
            eventTypeList,
            facultyList,
            theme: getTheme(req)
        });
    } catch (err) {
        console.error("Error al obtener eventos: ", err);
        res.status(500).json({ error: "Error al obtener los eventos" });
    }
});


viewsRouter.get("/myevents", isAuthenticated, async (req, res) => {
    try {

        const [eventTypeList] = await pool.query("SELECT * FROM EventType");
        const [facultyList] = await pool.query("SELECT * FROM Faculty");

        res.render('events', {
            role: req.user.role,
            user: req.user.email,
            isMyEvents: true, 
            eventTypeList,
            facultyList,
            theme: getTheme(req)
        });
    } catch (err) {
        console.error("Error al obtener mis eventos: ", err);
        res.status(500).json({ error: "Error al obtener los eventos" });
    }
});


viewsRouter.get("/notifications", isAuthenticated, (req, res) => {
    res.render('notifications',{
        role: req.user.role,
        user: req.user.email,
        theme: getTheme(req)
        
    })
})

viewsRouter.get("/accesibility", isAuthenticated, (req, res) => {
    res.render(
        'accesibility',
        { 
            role: req.user.role,
            theme: getTheme(req)
         },
        
    )
})


viewsRouter.get("/auth/login", redirectIfAuthenticated, (req, res) => {
    res.render('login', {layout:false})
});

viewsRouter.get("/auth/forgot-password", redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/forgot-password.html'));
 });

viewsRouter.get("/auth/register", redirectIfAuthenticated, async (req, res) => {
    try {
        const [faculties] = await pool.query("SELECT * FROM Faculty");
        console.log("The faculties attributes R ", faculties);

        const [roles] = await pool.query("SELECT ID, Name FROM Role");
        res.render('register', { faculties, roles , layout: false});
    } catch (err) {
        console.error("Error al obtener datos para el registro:", err);
        res.status(500).send("Error al obtener datos para el registro");
    }
});

viewsRouter.get("/profile/change-password", isAuthenticated, (req, res) => {
    
    const email = req.session.user.email; 
    
    res.render('reset-password', { token:null, email,urlRedirect :"/profile",role: req.user.role ,theme: getTheme(req), title:"Nueva Contraseña"});
});

viewsRouter.get("/reset-password/:token", (req, res) => {
    const { token } = req.params;
    res.render("reset-password", { token, title: "Restablecer Contraseña", layout:false, urlRedirect: '/auth/login' });
});

viewsRouter.get("/user-guide", (req, res) => {
    console.log("LA guia")
    res.render("guia-usuario", { layout: false });
});


viewsRouter.get("/profile", isAuthenticated, async (req, res) => {
    try {
        const email = req.session.user.email;
        const getUserEventsQuery = `
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
                et.Name AS EventType
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
                AND enr.Status IN ('confirmed', 'waiting')
            ORDER BY 
                e.TimeInit ASC;
        `;
    
        const [events] = await pool.query(getUserEventsQuery, [email]);

        const [faculties] = await pool.query("SELECT * FROM Faculty");
        console.log("The faculties attributes ", faculties);

        const [result] = await pool.query(
            "SELECT u.Email, u.FullName, u.Phone, f.ID AS FacultyID, f.Name AS FacultyName FROM User u JOIN Faculty f ON u.FacultyID = f.ID WHERE u.Email = ?",
            [email]
        );
        console.log("The profile attributes ", result);

        const user = result[0];
        
        res.render("profile", { 
            user, 
            faculties, 
            role: req.user.role, 
            theme: getTheme(req),
            events
        });
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
            const query = `
                    SELECT 
                        e.Title, 
                        e.Description, 
                        e.TimeInit,
                        e.TimeEnd, 
                        e.ID AS ID, 
                        r.FacultyID AS FacultyID, 
                        r.Capacity AS Capacity, 
                        r.Name AS RoomName, 
                        r.RoomID AS RoomID,
                        e.OrganizerID AS OrganizerID,
                        e.EventTypeID AS EventTypeID, 
                        e.Active AS Active,
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
                    WHERE 
                        e.ID = ?
                    ORDER BY 
                        e.TimeInit ASC;

                `;
            const [rows] = await pool.query(query, [eventID]);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Evento no encontrado" });
            }
            
            const event = rows[0];

            const facultyID = event.FacultyID;
            const timeInitCET = moment(event.TimeInit).tz('Europe/Madrid').format(); 
            const timeEndCET = moment(event.TimeEnd).tz('Europe/Madrid').format();   


            console.log("The event 1 ", event);
            let rooms = [];
            if (facultyID) {
                const timeInit = event.TimeInit;
                const timeEnd = event.TimeEnd;
                
                const [availableRooms] = await pool.query(`
                    SELECT 
                        r.RoomID, 
                        r.Name AS RoomName, 
                        r.Capacity
                    FROM 
                        Rooms r
                    WHERE 
                        r.FacultyID = ? 
                        AND r.RoomID NOT IN (
                            SELECT 
                                e.Location 
                            FROM 
                                Event e 
                            WHERE 
                                e.Active = 1
                                AND e.ID != ?  -- Excluir el evento actual si está ocupando la sala
                                AND (
                                    (e.TimeInit BETWEEN ? AND ?)
                                    OR (e.TimeEnd BETWEEN ? AND ?)
                                    OR (? BETWEEN e.TimeInit AND e.TimeEnd)
                                    OR (? BETWEEN e.TimeInit AND e.TimeEnd)
                                )
                        )
                `, [facultyID, eventID, timeInit, timeEnd, timeInit, timeEnd, timeInit, timeEnd]);
                

                rooms = availableRooms;
            }

            console.log("The event with converted times: ", {
                ...event,
                TimeInit: timeInitCET,
                TimeEnd: timeEndCET
            });
            
            res.render('event-info', {
                role: req.user.role,
                eventTypeList,
                facultyList,
                event: {
                    ...event,
                    TimeInit: timeInitCET,
                    TimeEnd: timeEndCET
                },
                rooms,  
                theme: getTheme(req)
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
        const [eventTypeList] = await pool.query("SELECT * FROM EventType");
        const [facultyList] = await pool.query("SELECT * FROM Faculty");
        res.render('event-add', {
            role: req.user.role,
            eventTypeList,
            facultyList,
            theme: getTheme(req),
            rooms:[]
        });
    } catch (err) {
        console.error("Error al cargar el formulario: ", err);
        res.status(500).json({ error: "Error al cargar el formulario" });
    }
});

viewsRouter.get("/calendar", isAuthenticated, async (req, res) => {
    res.render('calendar', {
        role: req.user.role,
        user: req.user.email,
        theme: getTheme(req),
    });
});

