import { validateProduct } from "../schemas/products.js";
import { pool } from "../config/db.js"

export class EventsController {

    static async getAll (req, res) {
        const query = 'SELECT * FROM events WHERE activo = 1';
        pool.query(
            query,
            (err, rows) => {
                if(err) return res.status(500).json({ message: err.message });
                return res.json(rows);
            }
        )
    }

}