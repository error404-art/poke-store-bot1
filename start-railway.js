import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import startKeepAlive from './.keep-alive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ejecutar el servidor en modo producción
process.env.NODE_ENV = 'production';

// Iniciar el servicio keep-alive para prevenir hibernación
startKeepAlive();

// Iniciar el servidor
console.log('Iniciando el servidor del bot PokeStore...');
const server = spawn('node', [join(__dirname, 'dist', 'server', 'index.js')], {
  stdio: 'inherit'
});

// Manejar el cierre del servidor
server.on('close', (code) => {
  console.log(`El servidor se cerró con código: ${code}`);
  if (code !== 0) {
    console.log('Reiniciando el servidor...');
    // Esperar 5 segundos antes de reiniciar
    setTimeout(() => {
      process.exit(1); // Railway reiniciará el proceso automáticamente
    }, 5000);
  }
});

// Mantener el proceso principal vivo
process.on('SIGINT', () => {
  console.log('Recibida señal de interrupción (SIGINT)');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Recibida señal de terminación (SIGTERM)');
  server.kill('SIGTERM');
});

// Prevenir que el proceso termine por cualquier error no manejado
process.on('uncaughtException', (err) => {
  console.error('Error no manejado:', err);
  // No cerrar el proceso, solo registrar el error
});