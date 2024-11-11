
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
    }));


app.post("/api/auth/login", (req, res) => {
    console.log("The body ", req.body)
    res.status(200).send(req.body)
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});