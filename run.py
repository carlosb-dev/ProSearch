import os
import sys

if sys.platform == 'win32':
    if sys.stdout is not None:
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr is not None:
        sys.stderr.reconfigure(encoding='utf-8')

import json
import asyncio
import datetime
# pyrefly: ignore [missing-import]
import webview
# pyrefly: ignore [missing-import]
import pystray
# pyrefly: ignore [missing-import]
import keyboard
import threading
# pyrefly: ignore [missing-import]
from PIL import Image
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
        "llmApiKey": "",
        "hotkey": "alt+space"
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

is_window_hidden = False

def force_foreground():
    import ctypes
    if sys.platform == 'win32':
        try:
            user32 = ctypes.windll.user32
            hwnd = user32.FindWindowW(None, "ProSearch")
            if hwnd:
                user32.SetWindowPos(hwnd, -1, 0, 0, 0, 0, 0x0043)
                fg_hwnd = user32.GetForegroundWindow()
                if fg_hwnd and fg_hwnd != hwnd:
                    fg_thread = user32.GetWindowThreadProcessId(fg_hwnd, None)
                    current_thread = ctypes.windll.kernel32.GetCurrentThreadId()
                    if fg_thread != current_thread:
                        user32.AttachThreadInput(current_thread, fg_thread, True)
                        user32.SetForegroundWindow(hwnd)
                        user32.SetFocus(hwnd)
                        user32.AttachThreadInput(current_thread, fg_thread, False)
                    else:
                        user32.SetForegroundWindow(hwnd)
                        user32.SetFocus(hwnd)
                else:
                    user32.SetForegroundWindow(hwnd)
                    user32.SetFocus(hwnd)
        except Exception as e:
            print("Foreground error:", e)

def show_window_from_tray(icon, item):
    global is_window_hidden
    if len(webview.windows) > 0:
        webview.windows[0].show()
        force_foreground()
        is_window_hidden = False

def exit_app_from_tray(icon, item):
    icon.stop()
    if len(webview.windows) > 0:
        webview.windows[0].destroy()
    os._exit(0)

def setup_tray():
    try:
        icon_path = os.path.join(os.path.dirname(__file__), 'assets', 'icon.png')
        if os.path.exists(icon_path):
            image = Image.open(icon_path)
        else:
            image = Image.new('RGB', (64, 64), color=(73, 109, 137))

        menu = pystray.Menu(
            pystray.MenuItem('Mostrar ProSearch', show_window_from_tray, default=True),
            pystray.MenuItem('Salir', exit_app_from_tray)
        )
        tray_icon = pystray.Icon("ProSearch", image, "ProSearch", menu)
        tray_icon.run()
    except Exception as e:
        print(f"Error en tray: {e}")

current_hotkey = None

def update_hotkey(new_hotkey):
    global current_hotkey
    if current_hotkey:
        try:
            keyboard.remove_hotkey(current_hotkey)
        except Exception:
            pass
    if new_hotkey:
        try:
            keyboard.add_hotkey(new_hotkey, toggle_window)
            current_hotkey = new_hotkey
        except Exception as e:
            print(f"Error register hotkey: {e}")

def toggle_window():
    global is_window_hidden
    if len(webview.windows) > 0:
        window = webview.windows[0]
        if is_window_hidden:
            window.show()
            force_foreground()
            is_window_hidden = False
        else:
            window.hide()
            is_window_hidden = True

def on_closing():
    global is_window_hidden
    if len(webview.windows) > 0:
        webview.windows[0].hide()
        is_window_hidden = True
    return False

def on_shown():
    import ctypes
    if sys.platform == 'win32':
        try:
            hwnd = ctypes.windll.user32.FindWindowW(None, "ProSearch")
            if hwnd:
                GWL_EXSTYLE = -20
                WS_EX_APPWINDOW = 0x00040000
                WS_EX_TOOLWINDOW = 0x00000080
                ex_style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
                ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, (ex_style & ~WS_EX_APPWINDOW) | WS_EX_TOOLWINDOW)
                # SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED
                ctypes.windll.user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0027)
        except Exception as e:
            print(f"Error hiding taskbar icon: {e}")

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
        global is_window_hidden
        try:
            if len(webview.windows) > 0:
                webview.windows[0].hide()
                is_window_hidden = True
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
        res = save_config(data)
        if res.get("success") and "hotkey" in data:
            update_hotkey(data["hotkey"])
        return res

    def hide_window(self):
        global is_window_hidden
        try:
            if len(webview.windows) > 0:
                webview.windows[0].hide()
                is_window_hidden = True
        except Exception as e:
            print(f"Hide error: {e}")

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

    # Registrar el atajo de teclado
    config = load_config()
    update_hotkey(config.get("hotkey", "alt+space"))
    
    # Iniciar el tray en un hilo
    t = threading.Thread(target=setup_tray, daemon=True)
    t.start()

    window = webview.create_window(
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
        on_top=True,
    )
    
    window.events.closing += on_closing
    window.events.shown += on_shown
    
    webview.start(http_server=True)

if __name__ == "__main__":
    main()