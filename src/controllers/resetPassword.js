import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";

export class ResetPasswordController {

    static async requestPasswordReset(req, res) {
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: "El correo electrónico es requerido" });

        // Check if the user exists
        const query = "SELECT * FROM User WHERE Email = ?";
        pool.query(query, [email], (err, results) => {
            if (err) return res.status(500).json({ error: "Error en el servidor" });
            if (results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

            const user = results[0];
            const secret = JWT_SECRET+ user.Password;
            const token = jwt.sign({ id: user.ID, email: user.Email }, secret, { expiresIn: '1h' });

            // Construct reset link
            const resetLink = `http://${req.headers.host}/auth/reset/${token}`;

            //send email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.RESET_PASSWORD_EMAIL_ADDRESS,
                    pass: process.env.RESET_PASSWORD_EMAIL_PASSWORD,
                }
            });

            const mailOptions = {
                to: email,
                from: process.env.RESET_PASSWORD_EMAIL_ADDRESS,
                subject: 'Password Reset',
                text: `Has solicitado restablecer tu contraseña.\n\n
                       Haz clic en el siguiente enlace o pégalo en tu navegador:\n
                       ${resetLink}\n\n
                       Si no solicitaste este cambio, ignora este correo.`
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err){
                    console.log(err)
                    return res.status(500).json({ error: "Error al enviar el correo" });
                }
                res.status(200).json({ message: "Correo de restablecimiento enviado" });
            });
        });
    }    

    static async resetPassword(req, res) {
        const { token } = req.params;
        const { password } = req.body;
    
        if (!password) return res.status(400).json({ error: "Nueva contraseña requerida" });
    
        const decoded = jwt.decode(token)

        const query = "SELECT * FROM User WHERE ID = ?";
        pool.query(query, [userId], (err, results) => {
            if (err || results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    
            const user = results[0];
            const secret = JWT_SECRET+ user.Password; 

            try {
                jwt.verify(token, secret);
    
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) return res.status(500).json({ error: "Error al cifrar la contraseña" });
    
                    const updatePasswordQuery = "UPDATE User SET Password = ? WHERE ID = ?";
                    pool.query(updatePasswordQuery, [hashedPassword, user.ID], (err) => {
                        if (err) return res.status(500).json({ error: "Error al actualizar contraseña" });
                        res.status(200).json({ message: "Contraseña actualizada con éxito" });
                    });
                });
            } catch (error) {
                res.status(400).json({ error: "Token no válido o expirado" });
            }
        });
    }
    
}
