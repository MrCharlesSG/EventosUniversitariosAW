import { pool } from "../config/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";
//https://www.linkedin.com/pulse/recuperar-cuenta-restaurando-contrase%C3%B1a-password-con-y-miguel-%C3%A1ngel?originalSubdomain=es
export class ResetPasswordController {

    static async changePassword(req, res) {
        const { password } = req.body;
        const email = req.user.email;

        if (!password) return res.status(400).json({ error: "Nueva contraseña requerida" });
       
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const query = "UPDATE UserAuthentication SET Password = ? WHERE Email = ?";
            const [result] = await pool.query(query, [hashedPassword, email])
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json({
                success: true,
                message:"Contraseña reseteada con éxito"
            })
        } catch (error) {
            console.error("Error al resetear contraseña:", error);
            return res.status(500).json({
                success: false,
                message: "Error al resetear contraseña"
            });
        }            
           
    }

    static async resetPassword(req, res) {
        const { token } = req.params; 
        const { password } = req.body; 
    
        if (!password) {
            return res.status(400).json({ error: "La nueva contraseña es requerida." });
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const email = decoded.email;
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const [result] = await pool.query(
                "UPDATE UserAuthentication SET Password = ? WHERE Email = ?",
                [hashedPassword, email]
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Usuario no encontrado." });
            }
    
            res.status(200).json({ message: "Contraseña restablecida con éxito." });
        } catch (error) {
            console.error("Error al restablecer la contraseña:", error);
    
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({ error: "El token ha expirado." });
            } else if (error.name === "JsonWebTokenError") {
                return res.status(400).json({ error: "Token inválido." });
            }
    
            res.status(500).json({ error: "Error al procesar la solicitud." });
        }
    }   
    

    static async requestPasswordReset(req, res) {
        const { email } = req.body;

        try {
            const [user] = await pool.query("SELECT Email FROM UserAuthentication WHERE Email = ?", [email]);
            if (user.length === 0) {
                return res.status(404).json({ error: "Usuario no encontrado." });
            }

            const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
            const address = process.env.RESET_PASSWORD_EMAIL_ADDRESS;
            const pass = process.env.RESET_PASSWORD_EMAIL_PASSWORD;
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                auth: {
                    user: "recuperadordecontrasenasparaaw@gmail.com",
                    pass: "lmsm wabq hgde btos",
                },
                tls: {
                    rejectUnauthorized: false 
                }
            });

            const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

            const mailOptions = {
                from: `"Recuperación de Contraseña" <${process.env.RESET_PASSWORD_EMAIL_ADDRESS}>`,
                to: email,
                subject: "Solicitud de recuperación de contraseña",
                html: `
                    <h3>Recuperación de Contraseña</h3>
                    <p>Haz clic en el enlace de abajo para restablecer tu contraseña:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>Este enlace expira en 1 hora.</p>
                `,
            };

            await transporter.sendMail(mailOptions);
            console.log("email sent")
            return res.status(200).json({ message: "Correo de recuperación enviado." });
        } catch (error) {
            console.error("Error al solicitar recuperación de contraseña:", error);
            return res.status(500).json({ error: "Error al procesar la solicitud." });
        }
    }
}


