import os
import subprocess
import sys
import shutil

# Fix unicode encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


def build_frontend():
    print("🚀 Construyendo el frontend (React/Vite)...")
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    
    # Check if npm is available
    if shutil.which('npm') is None:
        print("❌ Error: 'npm' no se encuentra en el PATH. Por favor instala Node.js.")
        sys.exit(1)

    try:
        # Run npm install
        print("📦 Instalando dependencias de Node.js...")
        subprocess.run('npm install', cwd=frontend_dir, check=True, shell=True)
        
        # Run npm run build
        print("🛠️  Compilando archivos estáticos...")
        subprocess.run('npm run build', cwd=frontend_dir, check=True, shell=True)
        print("✅ Frontend construido correctamente.\n")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error construyendo el frontend: {e}")
        sys.exit(1)

def build_executable():
    print("🚀 Empaquetando aplicación con PyInstaller...")
    
    # We use PyInstaller module to build it programmatically
    try:
        import PyInstaller.__main__
    except ImportError:
        print("❌ Error: PyInstaller no está instalado. Ejecuta: pip install pyinstaller")
        sys.exit(1)

    # Definir argumentos
    args = [
        'run.py',
        '--name=ProSearch',
        '--windowed',         # Correr oculto, sin consola
        '--onefile',          # Empaquetar todo en un único .exe
        '--noconfirm',        # Sobrescribir output dir si existe
        '--clean',            # Limpiar caché de PyInstaller
        '--icon=assets/icon.ico',  # Icono de la app
        
        # Añadir la carpeta dist del frontend al ejecutable
        '--add-data=frontend/dist;frontend/dist',
        
        # Hidden imports críticos
        '--hidden-import=langchain_community',
        '--hidden-import=langchain_openai',
        '--hidden-import=langchain_tavily',
        '--hidden-import=langchain_core',
        '--hidden-import=langgraph',
        '--hidden-import=pydantic',
        '--hidden-import=pydantic.deprecated.decorator',
        '--hidden-import=bs4',
        '--hidden-import=asyncio',
        '--hidden-import=dotenv',
        '--hidden-import=cryptography',
    ]

    print(f"📦 Ejecutando PyInstaller con los siguientes argumentos:\n{args}\n")
    PyInstaller.__main__.run(args)
    print("\n✅ ¡Ejecutable generado con éxito en la carpeta 'dist/'!")

if __name__ == '__main__':
    build_frontend()
    build_executable()
