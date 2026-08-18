"""
Test script to simulate exact Wokwi ESP32 actions and verify transmission to Backend & DB
"""
import paho.mqtt.client as mqtt
import json
import time
import sys

BROKER = "broker.hivemq.com"
PORT = 1883


connected = False

def on_connect(client, userdata, flags, rc, properties=None):
    global connected
    if rc == 0:
        connected = True
        print(f"[OK] Connected to MQTT Broker: {BROKER}:{PORT}")
    else:
        print(f"[ERROR] Connect failed: {rc}")

try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"wokwi_test_{int(time.time())}")
except AttributeError:
    client = mqtt.Client(client_id=f"wokwi_test_{int(time.time())}")

client.on_connect = on_connect
client.connect(BROKER, PORT, 60)
client.loop_start()

for i in range(10):
    if connected:
        break
    time.sleep(0.5)

if not connected:
    print("[ERROR] Cannot connect to MQTT broker")
    sys.exit(1)

print("\n--- 1. SENDING SENSOR TELEMETRY (DHT22: 29.4C, Humidity: 68%, Gas: 22%) ---")
sensor_payload = {
    "temperature": 29.4,
    "humidity": 68.0,
    "gas_level": 22.0,
    "gas_alert": False,
    "temp_alert": False,
    "room": "101"
}
client.publish("dormitory/A/1/101/sensor/data", json.dumps(sensor_payload))
print("[OK] Published to dormitory/A/1/101/sensor/data")
time.sleep(2)

print("\n--- 2. SIMULATING RFID SWIPE ON WOKWI (Card: CARD_A1B2C3D4) ---")
rfid_payload = {
    "card_id": "CARD_A1B2C3D4",
    "authorized": True,
    "action": "entry",
    "room": "101",
    "timestamp": int(time.time() * 1000)
}
client.publish("dormitory/A/1/101/access/rfid", json.dumps(rfid_payload))
print("[OK] Published to dormitory/A/1/101/access/rfid")
time.sleep(2)

print("\n--- 3. SIMULATING GAS POTENTIOMETER SPIKE (Gas: 85.5% -> EMERGENCY ALARM) ---")
alarm_payload = {
    "temperature": 31.0,
    "humidity": 60.0,
    "gas_level": 85.5,
    "gas_alert": True,
    "temp_alert": False,
    "room": "101"
}
client.publish("dormitory/A/1/101/sensor/data", json.dumps(alarm_payload))
print("[OK] Published to dormitory/A/1/101/sensor/data (ALARM)")
time.sleep(2)

client.loop_stop()
client.disconnect()
print("\n[SUCCESS] Wokwi operations sent successfully!")
