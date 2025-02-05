# Backend API - Configuración Local

Este proyecto es una prueba tecnica para la entrevista del puesto de React Developer - Syntepro - Backend

## Requisitos previos

Antes de empezar, asegúrate de tener instalados los siguientes requisitos:

- [Node.js](https://nodejs.org/) (versión 16 o superior recomendada)
- [npm](https://www.npmjs.com/)
- Una cuenta y un proyecto en [Firebase](https://firebase.google.com/)

## Instalación

Clona el repositorio y navega al directorio del proyecto:

```sh
git clone https://github.com/KuroScar42/samla-prueba-BE.git
cd samla-prueba-BE
```

Instala las dependencias del proyecto:

```sh
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables:

```sh
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_auth_domain
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_STORAGE_BUCKET=tu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
FIREBASE_APP_ID=tu_app_id

SUSCRIPTION_KEY=tu_suscription_key
AZURE_API_URL=tu_azure_api_url

JWT_SECRET=clave_super_secreta
```

## Ejecutar en modo local

Para iniciar el servidor en modo local, ejecuta:

```sh
npm start
```

Esto iniciará el servidor en:

```
http://localhost:3131
```

## Endpoints disponibles

El backend expone las siguientes rutas:

### Autenticación
- `POST /registerUser` - Registra un usuario (requiere autenticación)

### Usuarios
- `GET /getAllUsers` - Obtiene todos los usuarios (requiere autenticación)

### Subida de imágenes
- `POST /imageUpload/:userId/:type` - Sube una imagen de documento (requiere autenticación)
- `POST /selfieUpload/:userId` - Sube una selfie (requiere autenticación)

### Reconocimiento facial
- `POST /detectFace` - Detecta un rostro en una imagen usando Azure Face API (requiere autenticación)



