import * as ftp from 'basic-ftp'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(rootDir, '.env') })

const {
  FTP_HOST,
  FTP_USER,
  FTP_PASSWORD,
  FTP_PORT = 21,
} = process.env

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
  console.error('\n❌ ERROR: Faltan credenciales de FTP en el archivo .env')
  console.error('Por favor asegúrate de definir FTP_HOST, FTP_USER y FTP_PASSWORD.\n')
  process.exit(1)
}

const distPath = path.join(rootDir, 'dist')
if (!fs.existsSync(distPath)) {
  console.error('\n❌ ERROR: La carpeta "dist" no existe. Ejecuta primero "npm run build".\n')
  process.exit(1)
}

async function deploy() {
  const client = new ftp.Client()
  client.ftp.verbose = false // Para no saturar la consola con comandos raw

  try {
    console.log('\n🚀 Iniciando despliegue hacia HostGator...')
    console.log(`📡 Conectando a ${FTP_HOST}:${FTP_PORT} con usuario ${FTP_USER}...`)

    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: Number(FTP_PORT),
      secure: false, // Pure-FTPd en cPanel
    })

    console.log('✅ Conexión FTP establecida.')
    console.log('📦 Subiendo archivos de la carpeta dist/ a la raíz del servidor...')

    // Sube todo el contenido de 'dist' directamente a la raíz remota '/'
    await client.uploadFromDir(distPath, '/')

    console.log('\n🎉 ¡Despliegue completado con éxito!')
    console.log('🌐 Sitio web disponible en: https://vetbol.hostlapaz.com/\n')
  } catch (err) {
    console.error('\n❌ Error durante el despliegue:', err.message || err)
    process.exit(1)
  } finally {
    client.close()
  }
}

deploy()
