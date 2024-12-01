import { Router } from "express";
export const themeRouter = Router();


themeRouter.post('/color', (req, res) => {
    console.log("saving theme ", req.body)
    const { theme } = req.body;
    req.session.theme = {
        color: theme,
        letter: req.session.theme?.letter || ''
    }
    res.status(200).send({ message: 'Tema guardado' });
});
 
themeRouter.post('/font-size', (req, res) => {
    console.log("saving theme ", req.body)
    const { theme } = req.body;
    req.session.theme = {
        color: req.session.theme?.color || '',
        letter: theme
    }
    res.status(200).send({ message: 'Tema guardado' });
});