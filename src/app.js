import express, { json } from 'express';
import { viewsRouter } from './routes/views.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuración del motor de plantillas
app.set('view engine', 'ejs'); // Establecer EJS como motor de vistas
app.set('views', path.join(__dirname, 'views')); // Establecer la carpeta de vistas

// Sirve archivos estáticos de la carpeta public dentro de src
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
