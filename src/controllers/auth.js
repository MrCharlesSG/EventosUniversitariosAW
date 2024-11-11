import bcrypt from 'bcrypt';
import { pool } from "../config/db.js";
import { validateUserCredentials } from "../schemas/user.js";


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
                return res.status(500).json({ error: err.message });
            }

            if (!result.isMatch) {
                return res.status(401).json({ error: "Correo o contraseña invalida" });
            }

            const { RoleID } = result;

            req.session.user = { email, role: RoleID };
            return res.status(200);
        });
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

        if (!email || !fullName || !password || !roleID) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        try {
            const selectUserQuery = "SELECT * FROM User WHERE Email = ?";
            const insertUserQuery = "INSERT INTO User (Email, FullName, Phone, FacultyID) VALUES (?, ?, ?, ?)";
            const insertAuthQuery = "INSERT INTO UserAuthentication (Email, Password, RoleID) VALUES (?, ?, ?)";


            pool.query(selectUserQuery, email, (err, existingUser) => {
                if(err) return res.status(500).json({error: err.message});
                if (existingUser.length > 0) {
                    return res.status(400).json({ error: "El usuario ya está registrado" });
                }

                pool.query(
                    insertUserQuery, 
                    [email, fullName, phone, facultyID],
                    (err, _) => {
                        if(err) return res.status(500).json({error: err.message});
                        
                        bcrypt.hash(password, 10, (err, hashedPassword) => { 
                            if(err) return res.status(500).json({error: err.message});
                            
                            pool.query(
                                insertAuthQuery,
                                [email, hashedPassword, roleID],
                                (err, _) => {
                                    if(err) return res.status(500).json({error: err.message});
                                    req.session.user = { email, role: roleID };
                                    return res.redirect('/');
                                }
                            )
                        })
                    }
                )
            })
        } catch (error) {
            console.error("Error en el registro:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    static async modifyUserInfo(req, res) {
        const { email } = req.session.user;  
        const { fullName, phone, facultyID } = req.body;

        if (!fullName && !phone && !facultyID) {
            return res.status(400).json({ error: "No se proporcionaron datos para actualizar." });
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

            pool.query(updateQuery, updateValues, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                if (result.affectedRows > 0) {
                    return res.status(200).json({ message: "Información actualizada con éxito." });
                } else {
                    return res.status(404).json({ error: "No se encontró el usuario o no se hicieron cambios." });
                }
            });
        } catch (error) {
            console.error("Error al actualizar la información del usuario:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}


const verifyPassword = (email, plainPassword, callback) => {
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

               
                callback(null, isMatch ? { isMatch, RoleID } : { isMatch: false });
            });
        });
    });
};

