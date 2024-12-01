import { pool } from "../config/db.js";
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET_KEY || "1234";
//https://www.linkedin.com/pulse/recuperar-cuenta-restaurando-contrase%C3%B1a-password-con-y-miguel-%C3%A1ngel?originalSubdomain=es
export class ResetPasswordController {

    static async requestPasswordReset(req, res) {
        const { email } = req.body;
        console.log("requesting paasswodr reset ", email)
        if (!email) return res.status(400).json({ error: "El correo electrónico es requerido" });

        try {
            const query = "SELECT * FROM User WHERE Email = ?";
           const [rows] = await pool.query(query, email)
           if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:"Usuario no encontrado"
                });
            }
           return res.redirect(`/auth/reset-password/${email}`) 
        } catch (error) {
            console.error("Error al request nueva contraseña:", error);
            return res.status(500).json({
                success: false,
                message: "Error al solicitar el cambio de contraseña"
            });
        }
    }

    static async resetPassword(req, res) {
        const { email, password } = req.body;

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
}
