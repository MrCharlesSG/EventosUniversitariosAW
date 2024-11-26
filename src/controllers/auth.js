import bcrypt from 'bcrypt';
import { pool } from "../config/db.js";
import { validateModifyUserInfo, validateRegisterCredentials, validateUserCredentials } from "../schemas/user.js";


export class AuthController {

    static async login(req, res) {
        console.log("Validating: ", req.body);
    
        const isValidUser = validateUserCredentials(req.body);
    
        if (!isValidUser.valid) {
            return res.status(400).json({ error: isValidUser.message });
        }
    
        const { email, password } = req.body;
    
        try {
            const result = await verifyPassword(email, password);
    
            if (!result.isMatch) {
                return res.status(401).json({ error: "Correo o contraseña inválida" });
            }
    
            const { RoleID } = result;
    
            req.session.user = { email, role: RoleID };
            console.log("Successs")
            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async logout(req, res) {
        console.log("Loging out")
        req.session.destroy((err) => {
            if (err) {
                console.error("Error al cerrar sesión:", err);
                return res.status(500).json({ error: "Error al cerrar sesión" });
            }
            res.clearCookie('connect.sid');
            console.log("Redirecting")
            return res.redirect('/auth/login');
        });
    }

    

    static async register(req, res) {
        const { email, fullName, phone, facultyID, password, roleID } = req.body;
    
        const isValidRegister = validateRegisterCredentials(req.body);
        if (!isValidRegister.valid) {
            return res.status(400).json({ error: isValidRegister.message });
        }
    
        try {
            const selectUserQuery = "SELECT * FROM User WHERE Email = ?";
            const insertUserQuery = "INSERT INTO User (Email, FullName, Phone, FacultyID) VALUES (?, ?, ?, ?)";
            const insertAuthQuery = "INSERT INTO UserAuthentication (Email, Password, RoleID) VALUES (?, ?, ?)";
    
            const [existingUser] = await pool.query(selectUserQuery, [email]);
            if (existingUser.length > 0) {
                return res.status(400).json({ error: "El usuario ya está registrado" });
            }
    
            await pool.query(insertUserQuery, [email, fullName, phone, facultyID]);
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            await pool.query(insertAuthQuery, [email, hashedPassword, roleID]);
    
            req.session.user = { email, role: roleID };
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error en el registro:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
    

    static async modifyUserInfo(req, res) {
        const { email } = req.session.user;  
        const { fullName, phone, facultyID } = req.body;

        const isValid = validateModifyUserInfo(req.body);
        if (!isValid.valid) {
            return res.status(400).json({ error: isValid.message });
        }

        try {
            let updateQuery = "UPDATE User SET ";
            let updateValues = [];

            if (fullName) {
                updateQuery += "FullName = ?, ";
                updateValues.push(fullName);
            }

            if (phone) {
                updateQuery += "Phone = ?, ";
                updateValues.push(phone);
            }

            if (facultyID) {
                updateQuery += "FacultyID = ?, ";
                updateValues.push(facultyID);
            }

            updateQuery = updateQuery.slice(0, -2);

            updateQuery += " WHERE Email = ?";

            updateValues.push(email);

            console.log("Modifying user, this are the values to update ", updateValues)

            const [result] = await pool.query(updateQuery, updateValues);

            if (result.affectedRows > 0) {
                return res.status(200).json({ message: "Información actualizada con éxito." });
            } else {
                return res.status(404).json({ error: "No se encontró el usuario o no se hicieron cambios." });
            }
        } catch (error) {
            console.error("Error al actualizar la información del usuario:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}


const verifyPassword = async (email, plainPassword) => {
    try {
        const [results] = await pool.query(
            'SELECT Password, RoleID FROM UserAuthentication WHERE Email = ?', 
            [email]
        );

        if (results.length === 0) {
            return { isMatch: false };
        }

        const { Password: hashedPassword, RoleID } = results[0];

        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

        return { isMatch, RoleID };
    } catch (err) {
        console.error('Error en la verificación de la contraseña:', err);
        throw new Error('Error al verificar la contraseña');
    }
};

