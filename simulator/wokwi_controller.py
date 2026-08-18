"""
SMART DORMITORY — INTERACTIVE WOKWI & HARDWARE CONTROLLER
Dieu khien va mo phong ESP32 / Wokwi truc tiep tu Terminal den Web UI
"""
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Vui long cai dat: python -m pip install paho-mqtt")
    sys.exit(1)

BROKER = "broker.hivemq.com"
PORT = 1883
ROOM = "101"
BUILDING = "A"
FLOOR = "1"
TOPIC_BASE = f"dormitory/{BUILDING}/{FLOOR}/{ROOM}"

connected = False

def on_connect(client, userdata, flags, rc, properties=None):
    global connected
    if rc == 0:
        connected = True
        print(f"\n✅ Da ket noi MQTT Broker: {BROKER}:{PORT}")
        print(f"📡 Phong muc tieu: {BUILDING}-{ROOM} (Topic: {TOPIC_BASE})")
    else:
        print(f"\n❌ Ket noi that bai: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"\n📥 [NHAN PHAN HOI TU WEB / BACKEND] Topic: {msg.topic}")
        print(f"   Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    except Exception:
        print(f"\n📥 [NHAN LENH] {msg.topic}: {msg.payload.decode()}")

try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"wokwi_cli_{int(time.time())}")
except AttributeError:
    client = mqtt.Client(client_id=f"wokwi_cli_{int(time.time())}")

client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, PORT, 60)
client.loop_start()

# Dang ky nhan lenh dieu khien tu Web
client.subscribe(f"{TOPIC_BASE}/command/#")

for _ in range(10):
    if connected:
        break
    time.sleep(0.5)

if not connected:
    print("❌ Khong the ket noi toi MQTT Broker")
    sys.exit(1)

def send_sensor(temp=27.5, humid=64.0, gas=18.0, gas_alert=False, temp_alert=False):
    payload = {
        "temperature": temp,
        "humidity": humid,
        "gas_level": gas,
        "gas_alert": gas_alert,
        "temp_alert": temp_alert,
        "room": ROOM,
        "building": BUILDING,
        "timestamp": int(time.time())
    }
    client.publish(f"{TOPIC_BASE}/sensor/data", json.dumps(payload), qos=0)
    print(f"📊 [SENT SENSOR]: Temp: {temp}°C | Humid: {humid}% | Gas: {gas}% (Alert: {gas_alert or temp_alert})")

def send_rfid(card_id, student_name, authorized=True, action="entry"):
    payload = {
        "card_id": card_id,
        "authorized": authorized,
        "action": action,
        "room": ROOM,
        "building": BUILDING,
        "timestamp": int(time.time() * 1000)
    }
    client.publish(f"{TOPIC_BASE}/access/rfid", json.dumps(payload), qos=0)
    status = "CHO PHEP VAO" if authorized else "TU CHOI TRUY CAP"
    print(f"🪪 [SENT RFID]: {student_name} ({card_id}) -> {status} [{action.upper()}]")

def print_menu():
    print("\n" + "="*55)
    print("🎮 BO DIEU KHIEN PHAN CUNG & WOKWI SIMULATOR")
    print("="*55)
    print(" [1] 🪪 Quet the SV001 (Nguyen Van An - CARD_A1B2C3D4)")
    print(" [2] 🪪 Quet the SV002 (Tran Thi Binh - CARD_E5F6G7H8)")
    print(" [3] 🚫 Quet the LA / KHONG HOP LE (CARD_UNKNOWN_99)")
    print(" [4] 🔥 Mo phong NHIET DO CAO / CHAY (65°C)")
    print(" [5] ⚠️ Mo phong RO RI KHI GAS (85%)")
    print(" [6] 🟢 Dat lai trang thai AN TOAN (27°C, Gas 15%)")
    print(" [7] 💡 Mo phong Bat Den phong 101")
    print(" [8] 🌑 Mo phong Tat Den phong 101")
    print(" [9] 🌀 Mo phong Bat/Tat Quat")
    print(" [0] 🔄 Chay luong gia lap du lieu tu dong lien tuc (Live)")
    print(" [q] 🚪 Thoat")
    print("="*55)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "rfid1":
            send_rfid("CARD_A1B2C3D4", "Nguyen Van An", True, "entry")
        elif cmd == "rfid2":
            send_rfid("CARD_E5F6G7H8", "Tran Thi Binh", True, "entry")
        elif cmd == "rfid_invalid":
            send_rfid("CARD_INVALID99", "The la", False, "entry")
        elif cmd == "gas_alert":
            send_sensor(31.0, 58.0, 86.5, gas_alert=True)
        elif cmd == "fire_alert":
            send_sensor(65.0, 30.0, 15.0, temp_alert=True)
        elif cmd == "normal":
            send_sensor(27.0, 65.0, 16.0, False, False)
        time.sleep(1)
        client.loop_stop()
        sys.exit(0)

    try:
        while True:
            print_menu()
            choice = input("👉 Chon thao tac (1-9, 0, q): ").strip()

            if choice == "1":
                send_rfid("CARD_A1B2C3D4", "Nguyen Van An", True, "entry")
            elif choice == "2":
                send_rfid("CARD_E5F6G7H8", "Tran Thi Binh", True, "entry")
            elif choice == "3":
                send_rfid("CARD_INVALID99", "The la (Unknown)", False, "entry")
            elif choice == "4":
                send_sensor(65.0, 30.0, 15.0, temp_alert=True)
            elif choice == "5":
                send_sensor(31.0, 58.0, 86.5, gas_alert=True)
            elif choice == "6":
                send_sensor(27.0, 65.0, 16.0, False, False)
            elif choice == "7":
                client.publish(f"{TOPIC_BASE}/command/light", json.dumps({"action": "on"}))
                print("💡 Da gui lenh BAT DEN phong 101")
            elif choice == "8":
                client.publish(f"{TOPIC_BASE}/command/light", json.dumps({"action": "off"}))
                print("🌑 Da gui lenh TAT DEN phong 101")
            elif choice == "9":
                client.publish(f"{TOPIC_BASE}/command/fan", json.dumps({"action": "on"}))
                print("🌀 Da gui lenh BAT QUAT phong 101")
            elif choice == "0":
                print("🔄 Dang phat du lieu sensor tu dong (Bam Ctrl+C de dung)...")
                try:
                    for i in range(20):
                        temp = round(26.5 + (i % 5) * 0.8, 1)
                        humid = round(60.0 + (i % 4) * 2.5, 1)
                        gas = round(15.0 + (i % 3) * 1.5, 1)
                        send_sensor(temp, humid, gas)
                        time.sleep(2)
                except KeyboardInterrupt:
                    print("\nDa dung phat tu dong.")
            elif choice.lower() == "q":
                break
            else:
                print("⚠️ Lua chon khong hop le.")
            time.sleep(0.5)

    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        client.disconnect()
        print("\n👋 Da ngat ket noi.")
