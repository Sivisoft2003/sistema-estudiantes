const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Base de datos
const db = new sqlite3.Database('estudiantes.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Conectado a la base de datos");
    }
});

db.serialize(() => {

    console.log("Creando tablas...");

    db.run(`
    CREATE TABLE IF NOT EXISTS estudiantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        edad INTEGER,
        carrera TEXT
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT
    )
    `);

    db.run(`
    INSERT INTO usuarios (username, password)
    SELECT 'admin', '1234'
    WHERE NOT EXISTS (
        SELECT 1 FROM usuarios WHERE username = 'admin'
    )
    `, (err) => {
        if (err) {
            console.log("Error insertando usuario:", err);
        } else {
            console.log("Usuario verificado/creado");
        }
    });

});
// Ruta principal
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});

// Insertar estudiante
app.post('/estudiantes', (req, res) => {
    const { nombre, edad, carrera } = req.body;

    db.run(
        `INSERT INTO estudiantes (nombre, edad, carrera) VALUES (?, ?, ?)`,
        [nombre, edad, carrera],
        function(err) {
            if (err) {
                res.send(err);
            } else {
                res.send({ id: this.lastID });
            }
        }
    );
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        `SELECT * FROM usuarios WHERE username=? AND password=?`,
        [username, password],
        (err, row) => {
            if (err) {
                res.send(err);
            } else if (row) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        }
    );
});
// Listar estudiantes
app.get('/estudiantes', (req, res) => {
    db.all(`SELECT * FROM estudiantes`, [], (err, rows) => {
        if (err) {
            res.send(err);
        } else {
            res.json(rows);
        }
    });
});
app.put('/estudiantes/:id', (req, res) => {
    const { nombre, edad, carrera } = req.body;
    const { id } = req.params;

    db.run(
        `UPDATE estudiantes SET nombre=?, edad=?, carrera=? WHERE id=?`,
        [nombre, edad, carrera, id],
        function(err) {
            if (err) {
                res.send(err);
            } else {
                res.send({ mensaje: "Actualizado" });
            }
        }
    );
});
app.delete('/estudiantes/:id', (req, res) => {
    const { id } = req.params;

    db.run(
        `DELETE FROM estudiantes WHERE id=?`,
        [id],
        function(err) {
            if (err) {
                res.send(err);
            } else {
                res.send({ mensaje: "Eliminado" });
            }
        }
    );
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});