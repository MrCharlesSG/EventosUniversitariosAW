import express, { json } from 'express'
import { viewsRouter } from './routes/views.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();
app.use(json());
const PORT = 3000;

app.use('/public', express.static(path.join(__dirname, 'public')));


/**
 * ROUTES
 */

app.use("/", viewsRouter)



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});