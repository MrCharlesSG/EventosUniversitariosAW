import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { json } from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api/index.js';
import { viewsRouter } from './routes/views.js';
import expressLayouts from 'express-ejs-layouts';
import checkBlockedIpMiddleware, { sqlInjectionMiddleware } from './middleware/attackts.js';
import moment from 'moment';

const app = express();
moment.locale('es');
app.locals.moment = moment;
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

app.use(checkBlockedIpMiddleware);

app.use(sqlInjectionMiddleware);

app.set('view engine', 'ejs'); 


app.post('/set-theme', (req, res) => {
    console.log("saving theme ", req.body)
    const { theme } = req.body;
    req.session.theme = {
        color: theme,
        letter: req.session.theme?.letter || ''
    }
    res.status(200).send({ message: 'Tema guardado' });
});
 
app.post('/set-letter-theme', (req, res) => {
    console.log("saving theme ", req.body)
    const { theme } = req.body;
    req.session.theme = {
        color: req.session.theme.color || '',
        letter: theme
    }
    res.status(200).send({ message: 'Tema guardado' });
});


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

app.use((req, res, next) => {
    res.status(404).render('errors/404',{ layout: false });
});