# ProSearch 🔎

ProSearch es una aplicación de escritorio diseñada para automatizar la investigación profunda en la web mediante Inteligencia Artificial. Combina un potente backend de orquestación en Python (impulsado por **LangChain** y **LangGraph**) con una elegante interfaz gráfica construida en **React**, **Vite** y **Framer Motion**, todo empaquetado nativamente gracias a **PyWebView**.

## Características Principales ✨

*   **Investigación Autónoma:** El agente lee, filtra y sintetiza información en múltiples fuentes de forma simultánea usando la API de *Tavily Search* y el parser *BeautifulSoup4*.
*   **Agnóstico al Modelo:** Configura y conecta tu LLM favorito al instante. Por defecto está optimizado para funcionar con modelos locales (ej. LM Studio con `google/gemma-4-e4b`), pero soporta cualquier proveedor compatible.
*   **Seguridad Nivel Hardware:** Tu configuración y tus API Keys no viajan a ninguna parte. Se encriptan y atan al hardware de tu PC usando `cryptography.fernet`.
*   **Historial Persistente:** Todas tus consultas y las fuentes originales se guardan automáticamente en la ruta segura de tu sistema operativo (`AppData` en Windows). Exporta o importa tu conocimiento con un clic.
*   **Interfaz Glassmorphism Dinámica:** Renderizado *Markdown* enriquecido, barra lateral con las fuentes extraídas, y un veloz efecto visual de *typing* con soporte para animaciones fluidas.
*   **Ejecución en Segundo Plano (System Tray):** La aplicación reside silenciosamente en la bandeja del sistema en lugar de estorbar en tu barra de tareas, manteniéndose siempre lista.
*   **Atajo Global Personalizable:** Invoca o esconde el panel de investigación de forma instantánea en cualquier momento con un atajo de teclado global (por defecto `Alt + Space`).

## Requisitos Previos ⚙️

Antes de arrancar, asegúrate de tener instalados en tu sistema:
1.  **Node.js y npm** (Para compilar la interfaz de usuario).
2.  **Python 3.10+** (Para el motor lógico de investigación).
3.  Una **Tavily API Key** (La capa de búsqueda inteligente).

## Instalación y Ejecución 🚀

### Opción A: Compilar el Ejecutable (Recomendado) 📦
ProSearch incluye un script automatizado (`build.py`) que se encarga de compilar el frontend en React y empaquetar toda la aplicación junto a Python en un único archivo ejecutable (`.exe`).

Simplemente ejecuta:
```bash
python build.py
```
Una vez finalizado, encontrarás tu aplicación lista para usar en la carpeta `dist/ProSearch.exe`.

### Opción B: Ejecución en Modo Desarrollo 🛠️
Si deseas probar la aplicación sin empaquetarla o vas a modificar el código:

1. **Prepara y Compila el Frontend:**
   Primero debemos compilar React:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

2. **Inicia ProSearch:**
   Con la carpeta `frontend/dist` lista, ejecuta el entrypoint principal:
   ```bash
   python run.py
   ```

*(Nota: Al iniciar por primera vez, haz clic en el engranaje ⚙️ en la barra de búsqueda para configurar tu LLM URL y tu clave de Tavily).*

---

*Diseñado y vibecodeado por [Carlos Bello](https://github.com/carlosb-dev/) junto a Gemini Pro 3.1.*
