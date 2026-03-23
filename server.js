const express = require('express');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(bodyParser.json());
// Sirve los archivos HTML, CSS y JS automáticamente
app.use(express.static(path.join(__dirname)));

// 2. Configuración de Base de Datos
const db = new Database(path.join(__dirname, 'estudiantes.db'));
console.log("Conectado a la base de datos SQLite");

// 3. Crear tablas si no existen e insertar admin
db.exec(`
CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    edad INTEGER,
    carrera TEXT,
    genero TEXT
);
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  );
`);

const adminExistente = db.prepare("SELECT * FROM usuarios WHERE username = ?").get("admin");
if (!adminExistente) {
    db.prepare("INSERT INTO usuarios (username, password) VALUES (?, ?)")
      .run("admin", "1234");
    console.log("Usuario admin creado por defecto");
}

// 4. Rutas de la API

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM usuarios WHERE username=? AND password=?").get(username, password);
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

// Insertar estudiante
// Reemplaza temporalmente tu app.post con esto:
app.post('/estudiantes', (req, res) => {
    console.log("--> LLEGÓ AL SERVIDOR:", req.body); // Esto DEBE salir en la terminal negra
    const { nombre, edad, carrera, genero } = req.body;
    try {
        const result = db.prepare("INSERT INTO estudiantes (nombre, edad, carrera, genero) VALUES (?, ?, ?, ?)").run(nombre, edad, carrera, genero);
        console.log("--> GUARDADO CON ID:", result.lastInsertRowid);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        console.error("--> ERROR DE SQL:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Actualizar estudiante
// Actualizar estudiante (CORREGIDO)
app.put('/estudiantes/:id', (req, res) => {
    const { nombre, edad, carrera, genero } = req.body;
    const { id } = req.params;
    
    // Agregamos "genero=?" y ahora hay 5 "?" para que coincidan con las 5 variables del .run()
    db.prepare("UPDATE estudiantes SET nombre=?, edad=?, carrera=?, genero=? WHERE id=?")
      .run(nombre, edad, carrera, genero, id);

    res.json({ mensaje: "Actualizado" });
});

// Eliminar estudiante
app.delete('/estudiantes/:id', (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM estudiantes WHERE id=?").run(id);
    res.json({ mensaje: "Eliminado" });
});

// 5. Ruta para servir el Frontend (Siempre al final de las rutas)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// 6. Encendido del Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});