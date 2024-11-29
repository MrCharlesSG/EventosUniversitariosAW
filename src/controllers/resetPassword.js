import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";
//https://www.linkedin.com/pulse/recuperar-cuenta-restaurando-contrase%C3%B1a-password-con-y-miguel-%C3%A1ngel?originalSubdomain=es
export class ResetPasswordController {

    static async requestPasswordReset(req, res) {
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: "El correo electrónico es requerido" });

        // Verificar si el usuario existe
        const query = "SELECT * FROM User WHERE Email = ?";
        pool.query(query, [email], (err, results) => {
            if (err) return res.status(500).json({ error: "Error en el servidor" });
            if (results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

            // Si el usuario existe, redirigir al formulario de restablecimiento de contraseña con el correo en la URL
            res.redirect(`/auth/reset-password?email=${email}`);
        });
    }

    // Realiza el cambio de contraseña
    static async resetPassword(req, res) {
        const { email, password } = req.body;

        if (!password) return res.status(400).json({ error: "Nueva contraseña requerida" });

        // Hash de la nueva contraseña
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: "Error al cifrar la contraseña" });

            // Actualizar la contraseña en la base de datos
            const query = "UPDATE User SET Password = ? WHERE Email = ?";
            pool.query(query, [hashedPassword, email], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar contraseña" });
                res.status(200).json({ message: "Contraseña actualizada con éxito" });
            });
        });
    }
}
