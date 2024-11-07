import jwt from 'jsonwebtoken';
import { isNormalUser, isOrganizer } from '../utils/auth-utils.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";

export const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        console.log("No active session");
        return res.redirect('/auth/login');
    }

    req.user = req.session.user;
    next();
};

export const isAuthenticatedUser = (req, res, next) => {
    isAuthenticated(req, res, () => {
        const { role } = req.user;

        if (isNormalUser(role)) {
            next();
        } else {
            console.log("Is not a user")
            res.status(403).json({ error: "Acceso denegado, no eres usuario" });
        }
    });
};

export const isAuthenticatedOrganizer = (req, res, next) => {
    isAuthenticated(req, res, () => {
        const { role } = req.user;

        if (isOrganizer(role)) {
            next();
        } else {
            console.log("Is not a organizer")
            res.status(403).json({ error: "Acceso denegado, no eres organizador" });
        }
    });
};

export const isTheAuthenticatedUserAOrganizer = (req, res, next) => {
    
        const { role } = req.user;

        if (isOrganizer(role)) {
            next();
        } else {
            console.log("Is not a organizer")
            res.status(403).json({ error: "Acceso denegado, no eres organizador" });
        }
};

export const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.token; 

    if(!token) next();

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                console.log("Esta autenticado redireccionando")
                return res.redirect('/');
            }
            next();
        });
    }
};