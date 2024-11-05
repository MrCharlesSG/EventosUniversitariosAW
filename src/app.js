import express, { json } from 'express';
import { viewsRouter } from './routes/views.js';
import cookieParser from 'cookie-parser';

import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api/index.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();

app.use(json());
app.use(express.urlencoded({ extended: true })); 

app.use(cookieParser());

const PORT = 3000;

app.use('/public', express.static(path.join(__dirname, 'public')));


/**
 * ROUTES
 */

app.use("/", viewsRouter)
app.use("/api", apiRouter)



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});