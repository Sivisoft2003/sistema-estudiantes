const express = require('express');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Base de datos
const db = new Database('estudiantes.db');

console.log("Conectado a la base de datos");

// Crear tablas
db.exec(`
CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    edad INTEGER,
    carrera TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
);
`);

// Insertar usuario admin si no existe
const user = db.prepare("SELECT * FROM usuarios WHERE username = ?").get("admin");

if (!user) {
    db.prepare("INSERT INTO usuarios (username, password) VALUES (?, ?)")
      .run("admin", "1234");
    console.log("Usuario admin creado");
}

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Insertar estudiante
app.post('/estudiantes', (req, res) => {
    const { nombre, edad, carrera } = req.body;

    const result = db.prepare(
        "INSERT INTO estudiantes (nombre, edad, carrera) VALUES (?, ?, ?)"
    ).run(nombre, edad, carrera);

    res.json({ id: result.lastInsertRowid });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare(
        "SELECT * FROM usuarios WHERE username=? AND password=?"
    ).get(username, password);

    if (user) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Listar estudiantes
app.get('/estudiantes', (req, res) => {
    const rows = db.prepare("SELECT * FROM estudiantes").all();
    res.json(rows);
});

// Actualizar
app.put('/estudiantes/:id', (req, res) => {
    const { nombre, edad, carrera } = req.body;
    const { id } = req.params;

    db.prepare(
        "UPDATE estudiantes SET nombre=?, edad=?, carrera=? WHERE id=?"
    ).run(nombre, edad, carrera, id);

    res.json({ mensaje: "Actualizado" });
});

// Eliminar
app.delete('/estudiantes/:id', (req, res) => {
    const { id } = req.params;

    db.prepare("DELETE FROM estudiantes WHERE id=?").run(id);

    res.json({ mensaje: "Eliminado" });
});

// Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});