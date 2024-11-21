import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { json } from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api/index.js';
import { viewsRouter } from './routes/views.js';
import expressLayouts from 'express-ejs-layouts';

const app = express();
app.use(json());
app.use(express.urlencoded({
    extended: true
    }));
    
app.use(cookieParser());
app.use(expressLayouts);
app.use(session({
    secret: process.env.JWT_SECRET_KEY || '1234',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = 3000;

/**
 * Rutas
 */
app.use("/", viewsRouter);
app.use("/api", apiRouter);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
