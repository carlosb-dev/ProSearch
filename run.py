import os
import sys
import json
import asyncio
import datetime
import webview
from core.security import encrypt_config, decrypt_config
from research_agent import run_agent_api

def get_app_dir():
    app_name = "ProSearch"
    if sys.platform == 'win32':
        app_data = os.environ.get('APPDATA')
        if not app_data:
            app_data = os.path.expanduser('~')
        path = os.path.join(app_data, app_name)
    else:
        path = os.path.join(os.path.expanduser('~'), f".{app_name.lower()}")
    
    if not os.path.exists(path):
        os.makedirs(path)
    return path

APP_DIR = get_app_dir()
HISTORY_FILE = os.path.join(APP_DIR, 'history.json')
CONFIG_FILE = os.path.join(APP_DIR, 'config.json')

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'rb') as f:
                return decrypt_config(f.read())
        except Exception as e:
            print(f"Error loading config: {repr(e)}")
            import traceback
            traceback.print_exc()
            pass
    return {
        "depth": 6,
        "llmUrl": "http://localhost:1234/v1",
        "modelName": "google/gemma-4-e4b",
        "tavilyApiKey": "",
        "llmApiKey": ""
    }

def save_config(config):
    try:
        encrypted_data = encrypt_config(config)
        with open(CONFIG_FILE, 'wb') as f:
            f.write(encrypted_data)
        return {"success": True}
    except Exception as e:
        print(f"Error saving config: {e}")
        return {"success": False, "error": str(e)}

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_history(history):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

class Api:
    def resize(self, width, height):
        try:
            window = webview.windows[0]
            if len(webview.screens) > 0:
                screen = webview.screens[0]
                new_x = int((screen.width - width) / 2)
                remaining_y = screen.height - height
                new_y = int(remaining_y / 3)
                window.resize(width, height)
                window.move(new_x, new_y)
            else:
                window.resize(width, height)
        except Exception as e:
            print(f"Resize error: {e}")

    def close(self):
        try:
            webview.windows[0].destroy()
        except Exception as e:
            print(f"Close error: {e}")

    def import_history(self):
        try:
            window = webview.windows[0]
            file_types = ('JSON files (*.json)', 'All files (*.*)')
            result = window.create_file_dialog(webview.FileDialog.OPEN, allow_multiple=False, file_types=file_types)
            if result:
                file_path = result[0]
                with open(file_path, 'r', encoding='utf-8') as f:
                    new_data = json.load(f)
                if isinstance(new_data, list):
                    save_history(new_data)
                    return {"success": True}
                else:
                    return {"success": False, "error": "El archivo JSON no tiene un formato válido."}
            return {"success": False, "error": "Operación cancelada."}
        except Exception as e:
            print(f"Import error: {e}")
            return {"success": False, "error": str(e)}

    def export_history(self):
        try:
            window = webview.windows[0]
            file_types = ('JSON files (*.json)', 'All files (*.*)')
            result = window.create_file_dialog(webview.FileDialog.SAVE, allow_multiple=False, file_types=file_types, save_filename='prosearch_history.json')
            if result:
                save_path = result[0]
                history_data = load_history()
                with open(save_path, 'w', encoding='utf-8') as f:
                    json.dump(history_data, f, ensure_ascii=False, indent=2)
                return {"success": True}
            return {"success": False, "error": "Operación cancelada."}
        except Exception as e:
            print(f"Export error: {e}")
            return {"success": False, "error": str(e)}

    def get_config(self):
        return load_config()

    def save_config(self, data):
        return save_config(data)

    def get_history(self):
        return {"history": load_history()}

    def clear_history(self):
        return save_history([])

    def delete_history_item(self, item_id):
        history = load_history()
        history = [item for item in history if item.get("id") != item_id]
        return save_history(history)

    def research(self, data):
        import threading
        def run_task():
            query = data.get("query")
            depth = data.get("depth", 6)
            llm_url = data.get("llmUrl", "http://localhost:1234/v1")
            model_name = data.get("modelName", "google/gemma-4-e4b")
            
            if not query:
                try:
                    webview.windows[0].evaluate_js(f"window.dispatchEvent(new CustomEvent('research_error', {{detail: 'La consulta está vacía.'}}))")
                except: pass
                return
                
            try:
                config = load_config()
                tavily_key = config.get("tavilyApiKey")
                if tavily_key:
                    os.environ["TAVILY_API_KEY"] = tavily_key
                    
                llm_api_key = config.get("llmApiKey", "local-key")

                result = asyncio.run(run_agent_api(query, depth, llm_url, model_name, llm_api_key))
                
                history = load_history()
                new_item = {
                    "id": len(history) + 1,
                    "query": query,
                    "response": result["summary"],
                    "sources": result["urls"],
                    "depth": depth,
                    "elapsed_time": result.get("elapsed_time"),
                    "date": datetime.datetime.now(datetime.UTC).isoformat().replace('+00:00', 'Z')
                }
                history.insert(0, new_item)
                save_history(history)
                
                import json
                json_string = json.dumps(result)
                webview.windows[0].evaluate_js(f"window.dispatchEvent(new CustomEvent('research_complete', {{detail: {json_string} }}))")
                
            except Exception as e:
                print(f"Error en research: {e}")
                import json
                safe_error = json.dumps(str(e))
                try:
                    webview.windows[0].evaluate_js(f"window.dispatchEvent(new CustomEvent('research_error', {{detail: {safe_error} }}))")
                except: pass

        t = threading.Thread(target=run_task)
        t.start()
        return {"success": True, "message": "Investigación iniciada"}

def get_entrypoint():
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, 'frontend', 'dist', 'index.html')
    else:
        local_dist = os.path.join(os.path.dirname(__file__), 'frontend', 'dist', 'index.html')
        if os.path.exists(local_dist):
            return local_dist
        return 'http://localhost:5173'

def main():
    api = Api()
    entrypoint = get_entrypoint()

    webview.create_window(
        "ProSearch",
        entrypoint,
        js_api=api,
        width=1200,
        height=800,
        resizable=True,
        fullscreen=False,
        frameless=True,
        transparent=True,
        background_color='#18181b',
        easy_drag=False,
    )
    webview.start(http_server=True)

if __name__ == "__main__":
    main()