import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, redirectIfAuthenticated } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export const viewsRouter = Router();

viewsRouter.get('/', isAuthenticated, (req, res) => {
    res.render('index');
});

viewsRouter.get('/events', isAuthenticated, (req, res) => {
    res.render('events');
});

viewsRouter.get("/auth/login", redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});
