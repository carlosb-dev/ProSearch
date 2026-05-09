# ProSearch 🔎

ProSearch es una aplicación de escritorio diseñada para automatizar la investigación profunda en la web mediante Inteligencia Artificial. Combina un potente backend de orquestación en Python (impulsado por **LangChain** y **LangGraph**) con una elegante interfaz gráfica construida en **React**, **Vite** y **Framer Motion**, todo empaquetado nativamente gracias a **PyWebView**.

## Características Principales ✨

*   **Investigación Autónoma:** El agente lee, filtra y sintetiza información en múltiples fuentes de forma simultánea usando la API de *Tavily Search* y el parser *BeautifulSoup4*.
*   **Agnóstico al Modelo:** Configura y conecta tu LLM favorito al instante. Por defecto está optimizado para funcionar con modelos locales (ej. LM Studio con `google/gemma-4-e4b`), pero soporta cualquier proveedor compatible.
*   **Seguridad Nivel Hardware:** Tu configuración y tus API Keys no viajan a ninguna parte. Se encriptan y atan al hardware de tu PC usando `cryptography.fernet`.
*   **Historial Persistente:** Todas tus consultas y las fuentes originales se guardan automáticamente en la ruta segura de tu sistema operativo (`AppData` en Windows). Exporta o importa tu conocimiento con un clic.
*   **Interfaz Glassmorphism Dinámica:** Renderizado *Markdown* enriquecido, barra lateral con las fuentes extraídas, y un veloz efecto visual de *typing* con soporte para animaciones fluidas.

## Requisitos Previos ⚙️

Antes de arrancar, asegúrate de tener instalados en tu sistema:
1.  **Node.js y npm** (Para compilar la interfaz de usuario).
2.  **Python 3.10+** (Para el motor lógico de investigación).
3.  Una **Tavily API Key** (La capa de búsqueda inteligente).

## Instalación y Ejecución 🚀

### 1. Prepara y Compila el Frontend
Dado que PyWebView sirve archivos estáticos por razones de rendimiento y seguridad, primero debemos compilar React:
```bash
cd frontend
npm install
npm run build
cd ..
```

### 2. Configura el Backend en Python
Es recomendable crear un entorno virtual para no ensuciar tus librerías globales:
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
venv\Scripts\activate
# (En macOS/Linux: source venv/bin/activate)

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Inicia ProSearch
Con el entorno virtual activado y la carpeta `frontend/dist` lista, simplemente ejecuta el entrypoint principal:
```bash
python run.py
```
*(Nota: Al iniciar por primera vez, haz clic en el engranaje ⚙️ en la barra de búsqueda para configurar tu LLM URL y tu clave de Tavily).*

---

*Diseñado y vibecodeado con cariño por [Carlos Bello](https://github.com/carlosb-dev/) ❤️ *
