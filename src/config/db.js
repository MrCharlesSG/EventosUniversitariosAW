import mysql from 'mysql'; 

export const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'AW_24'
});

pool.getConnection((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database.');
    }
});
