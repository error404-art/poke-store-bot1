import fetch from 'node-fetch';
import { createServer } from 'http';

// URL de la aplicación en Railway (se completará automáticamente con la URL asignada por Railway)
const APP_URL = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || null;

// Intervalo de ping en ms (5 minutos)
const PING_INTERVAL = 5 * 60 * 1000;

// Función para mantener la aplicación activa
const keepAlive = async () => {
  if (!APP_URL) {
    console.log('⚠️ No se encontró URL para keep-alive. El servicio podría hibernar.');
    return;
  }

  try {
    // Ping a /api/status para verificar el estado del bot
    const response = await fetch(`https://${APP_URL}/api/status`);
    const data = await response.json();
    
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] Keep-alive ping exitoso. Bot conectado: ${data.connected}`);
  } catch (error) {
    console.error('❌ Error en keep-alive ping:', error.message);
  }
};

// Crear un pequeño servidor HTTP que responda a peticiones de health check
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Keep-alive service running' }));
});

const PORT = process.env.KEEP_ALIVE_PORT || 8080;

// Iniciar el servicio
const startKeepAlive = () => {
  // Iniciar el servidor HTTP
  server.listen(PORT, () => {
    console.log(`🔄 Servicio keep-alive iniciado en puerto ${PORT}`);
  });

  // Realizar ping inmediatamente al inicio
  keepAlive();

  // Programar pings periódicos
  setInterval(keepAlive, PING_INTERVAL);
};

export default startKeepAlive;