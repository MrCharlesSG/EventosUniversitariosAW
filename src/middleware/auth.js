import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log("There is no token")
        return res.redirect('/auth/login');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Error verifying token, ", err.message)
            return res.redirect('/auth/login');
        }

        req.user = decoded;
        next();
    });
};

export const isUser = (req, res, next) => {
    isAuthenticated(req, res, () => {
        const { role } = req.user;
        const USER_ROLE_ID = 2;

        if (role === USER_ROLE_ID) {
            next();
        } else {
            console.log("Is not a user")
            res.status(403).json({ error: "Acceso denegado, no eres usuario" });
        }
    });
};

export const isOrganizer = (req, res, next) => {
    isAuthenticated(req, res, () => {
        const { role } = req.user;
        const ORGANIZER_ROLE_ID = 1; 

        if (role === ORGANIZER_ROLE_ID) {
            next();
        } else {
            console.log("Is not a organizer")
            res.status(403).json({ error: "Acceso denegado, no eres organizador" });
        }
    });
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