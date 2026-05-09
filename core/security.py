import os
import json
import uuid
import hashlib
import base64
import subprocess
from cryptography.fernet import Fernet

def get_hardware_key():
    try:
        mac = uuid.getnode()
        # Intentar obtener el UUID del sistema (en Windows)
        try:
            output = subprocess.check_output('powershell -Command "(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID"', shell=True, stderr=subprocess.DEVNULL).decode().strip()
            system_uuid = output if output else "default_uuid"
        except:
            system_uuid = "default_uuid"
            
        combined = f"{mac}-{system_uuid}".encode('utf-8')
        # Crear un hash de 32 bytes para Fernet
        key_hash = hashlib.sha256(combined).digest()
        fernet_key = base64.urlsafe_b64encode(key_hash)
        return fernet_key
    except Exception as e:
        print(f"Error generando clave de hardware: {e}")
        # Llave de respaldo genérica en caso extremo
        return base64.urlsafe_b64encode(hashlib.sha256(b"prosearch_fallback_key").digest())

def encrypt_config(data: dict) -> bytes:
    key = get_hardware_key()
    f = Fernet(key)
    json_data = json.dumps(data).encode('utf-8')
    return f.encrypt(json_data)

def decrypt_config(encrypted_data: bytes) -> dict:
    key = get_hardware_key()
    f = Fernet(key)
    json_data = f.decrypt(encrypted_data)
    return json.loads(json_data.decode('utf-8'))
