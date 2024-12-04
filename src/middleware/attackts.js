import { pool } from '../config/db.js'; 

const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|alter|union|script|eval|exec|truncate|database|table|column)\b|\%27|\%22|--|#|\b(drop|rename|grant|revoke)\b|;|--|\b(select|insert|update|delete)\b)/i;

export const sqlInjectionMiddleware = (req, res, next) => {
    Object.keys(req.body).forEach((key) => {
        const value = req.body[key];

        if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
            console.log(`Posible inyección SQL detectada en el campo: ${key}`);
            saveAttack(req);
            return res.status(400).json({ error: "Solicitud no válida, posible inyección SQL detectada." });
        }
    });
    next();
};


const saveAttack = async (req) => {
    try {
        await pool.query(
            'INSERT INTO sql_injections (ip_address, attempted_query, timestamp) VALUES (?, ?, ?)',
            [req.ip, JSON.stringify(req.body), new Date()]
        );
        console.log('Intento de inyección SQL registrado');
    } catch (err) {
        console.error('Error al guardar el intento de inyección SQL:', err);
    }
}

const checkBlockedIpMiddleware = async (req, res, next) => {
    const clientIp = req.ip;

    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) AS attempts FROM sql_injections WHERE ip_address = ?',
            [clientIp]
        );

        if (rows[0].attempts >= 1) {
            return res.status(403).render('errors/403', {layout:false});
        }

        next();
    } catch (err) {
        console.error('Error al verificar IP bloqueada:', err);
        next();
    }
};

export default checkBlockedIpMiddleware;
