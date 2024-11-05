import { pool } from "../config/db.js";
import { validateUserCredentials } from "../schemas/user.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";

export class AuthController {

    static async login(req, res) {
        console.log("Validating: ", req.body)
        const isValidUser = validateUserCredentials(req.body);

        if (!isValidUser.valid) {
            return res.status(400).json({ error: isValidUser.message });
        }

        const { email, password } = req.body;

        verifyPassword(email, password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error connecting to the database" });
            }

            if (!result.isMatch) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const { RoleID } = result;

            const token = jwt.sign({ email, role: RoleID }, JWT_SECRET, { expiresIn: "1h" });
            res.cookie('token', token, { httpOnly: true });
            return res.redirect('/');
        });
    }

    

    static async register(req, res) {
        // TODO: Implementación del registro
    }
}


export const verifyPassword = (email, plainPassword, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            callback(err, null);
            return;
        }

        const query = 'SELECT Password, RoleID FROM UserAuthentication WHERE Email = ?';

        connection.query(query, [email], (error, results) => {
            connection.release();

            if (error) {
                console.error('Error executing the query:', error);
                callback(error, null);
                return;
            }

            if (results.length === 0) {
                callback(null, false); // no hay usuariuo
                return;
            }

            const { Password: hashedPassword, RoleID } = results[0];

            // contraseña correcta
            bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    callback(err, null);
                    return;
                }

                // Pasamos también el RoleID si la contraseña es correcta
                callback(null, isMatch ? { isMatch, RoleID } : { isMatch: false });
            });
        });
    });
};

