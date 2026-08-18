"""
Smart Dormitory - Demo Script
Chay: python demo_quick.py
"""
import json
import time

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Cai dat paho-mqtt truoc: python -m pip install paho-mqtt")
    exit(1)

BROKER = "broker.hivemq.com"
PORT   = 1883


connected = False

def on_connect(client, userdata, flags, rc, properties=None):
    global connected
    if rc == 0:
        connected = True
        print(f"[OK] Ket noi MQTT thanh cong: {BROKER}:{PORT}")
    else:
        print(f"[LOI] Ket noi that bai, ma loi: {rc}")

try:
    # paho-mqtt >= 2.0
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"smart_dorm_demo_{int(time.time())}")
except AttributeError:
    # paho-mqtt < 2.0
    client = mqtt.Client(client_id=f"smart_dorm_demo_{int(time.time())}")

client.on_connect = on_connect
client.connect(BROKER, PORT, 60)
client.loop_start()

# Cho ket noi
for i in range(10):
    if connected:
        break
    print(f"Dang ket noi MQTT... ({i+1}/10)")
    time.sleep(1)

if not connected:
    print("[LOI] Khong ket noi duoc! Thu broker: broker.emqx.io")
    client.loop_stop()
    exit(1)

def pub(topic, data):
    client.publish(topic, json.dumps(data))
    print(f"  -> Published: {topic}")

print()
print("============================================")
print("  DEMO 1: Du lieu cam bien binh thuong")
print("============================================")
for i in range(5):
    pub("dormitory/A/1/101/sensor/data", {
        "temperature": 24 + i,
        "humidity":    60 + i,
        "gas_level":   10 + i,
        "gas_alert":   False,
        "temp_alert":  False
    })
    print(f"  [Room A101] Nhiet do: {24+i}C | Do am: {60+i}% | Gas: {10+i}%")
    time.sleep(1.5)

print()
print("============================================")
print("  DEMO 2: Ra/vao RFID")
print("============================================")
time.sleep(1)
pub("dormitory/A/1/101/access/rfid", {
    "card_id": "CARD_A1B2C3D4",
    "action": "entry",
    "authorized": True
})
print("  The Nguyen Van An -> CHO PHEP VAO [Xem tab Access Log]")
time.sleep(2)

pub("dormitory/A/1/101/access/rfid", {
    "card_id": "CARD_E5F6G7H8",
    "action": "entry",
    "authorized": True
})
print("  The Tran Thi Binh -> CHO PHEP VAO")
time.sleep(2)

pub("dormitory/A/1/101/access/rfid", {
    "card_id": "CARD_HACKER_X99",
    "action": "entry",
    "authorized": False
})
print("  The UNKNOWN -> BI TU CHOI [Alert goc tren phai]")
time.sleep(2)

print()
print("============================================")
print("  DEMO 3: CANH BAO KHI GAS (Strategy Pattern)")
print("============================================")
print("  [!] Xem trang Emergency tai: http://localhost:3000/dashboard/emergency")
time.sleep(1)
pub("dormitory/A/1/101/sensor/data", {
    "temperature": 29,
    "humidity":    55,
    "gas_level":   82,
    "gas_alert":   True,
    "temp_alert":  False
})
print("  [ALERT] Gas level = 82% -> GasLeakStrategy chay!")
print("  -> Con coi bat, Cua mo khoa, WebSocket broadcast den dashboard")
time.sleep(4)

print()
print("============================================")
print("  DEMO 4: CANH BAO CHAY (Strategy Pattern)")
print("============================================")
pub("dormitory/A/1/102/sensor/data", {
    "temperature": 68,
    "humidity":    25,
    "gas_level":   12,
    "gas_alert":   False,
    "temp_alert":  True
})
print("  [ALERT] Nhiet do = 68C -> FireStrategy chay!")
print("  -> Con coi bat, Cua mo khoa, Telegram alert, Dashboard do")
time.sleep(4)

print()
print("============================================")
print("  DEMO 5: Tro lai binh thuong")
print("============================================")
for room, b, f in [("101","A","1"), ("102","A","1"), ("201","A","2"), ("101","B","1")]:
    pub(f"dormitory/{b}/{f}/{room}/sensor/data", {
        "temperature": 26,
        "humidity":    65,
        "gas_level":   8,
        "gas_alert":   False,
        "temp_alert":  False
    })
    time.sleep(0.5)
print("  Tat ca phong ve binh thuong")

client.loop_stop()
print()
print("============================================")
print("  DEMO HOAN TAT!")
print("  Dashboard: http://localhost:3000/dashboard")
print("  Emergency: http://localhost:3000/dashboard/emergency")
print("  AccessLog: http://localhost:3000/dashboard/access-log")
print("============================================")
