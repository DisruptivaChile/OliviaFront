const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde frontend
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/styles', express.static(path.join(__dirname, 'frontend/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend/scripts')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Rutas específicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/index.html'));
});

app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/productos.html'));
});

app.get('/ejemplos-marca', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/ejemplos-marca.html'));
});

app.get('/mujer', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/mujer.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('  🎨 OLIVIA MERINO - Frontend Server');
    console.log('==========================================');
    console.log(`✓ Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`✓ Inicio: http://localhost:${PORT}/`);
    console.log(`✓ Productos: http://localhost:${PORT}/productos`);
    console.log(`✓ Mujer: http://localhost:${PORT}/mujer`);
    console.log(`✓ Manual de Marca: http://localhost:${PORT}/ejemplos-marca`);
    console.log('==========================================');
    console.log('📁 Estructura modular activada');
    console.log('Presiona Ctrl+C para detener el servidor');
});
