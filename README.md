# PokeStore Discord Bot

Un bot de Discord para una tienda de PokeMMO con funcionalidad de procesamiento de pedidos a través de mensajes embebidos, botones y formularios.

## Configuración para Railway

Para desplegar este bot en Railway y mantenerlo funcionando 24/7, sigue estos pasos:

### 1. Crea un proyecto en Railway

- Ve a [Railway](https://railway.app) y crea una cuenta o inicia sesión.
- Haz clic en "New Project" y selecciona "Deploy from GitHub repo".
- Conecta tu repositorio de GitHub que contiene este código.

### 2. Configura las variables de entorno

En la sección de "Variables" del proyecto en Railway, agrega:

- `DISCORD_BOT_TOKEN`: El token de tu bot de Discord
- `PORT`: 5000 (o el puerto que prefieras)

### 3. Despliega

- Railway desplegará automáticamente tu aplicación.
- El bot estará activo 24/7 gracias a:
  - Las configuraciones de reinicio automático
  - El sistema keep-alive que evita la hibernación
  - Los mecanismos de recuperación ante fallos

### Monitoreo y mantenimiento

- Railway proporciona métricas y logs para monitorear el estado del bot.
- Si el bot se cae, se reiniciará automáticamente gracias a la configuración de reinicio.
- Si necesitas realizar modificaciones, simplemente actualiza el código en GitHub y Railway desplegará los cambios automáticamente.

## Características

- Comando `/sell` para mostrar el sistema de compra.
- Validación de roles (solo usuarios con rol "CEO" pueden usar el comando).
- Formulario de pedido con múltiples campos.
- Notificaciones para clientes y staff.
- Interfaz de configuración del bot en español.

## Desarrollo local

Para ejecutar este proyecto localmente:

```bash
npm install
npm run dev
```

Asegúrate de tener un archivo `.env` en la raíz del proyecto con tu `DISCORD_BOT_TOKEN`.