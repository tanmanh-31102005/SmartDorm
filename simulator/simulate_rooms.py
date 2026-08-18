"""
Smart Dormitory — Python Room Simulator
Giả lập N phòng KTX gửi dữ liệu MQTT đồng thời
Dùng để test hệ thống ở quy mô lớn (Load testing)

Cách chạy:
  pip install paho-mqtt
  python simulate_rooms.py

Cấu hình:
  NUM_ROOMS: số phòng giả lập
  BROKER: địa chỉ MQTT broker
"""

import paho.mqtt.client as mqtt
import json
import random
import time
import threading
import math
from datetime import datetime

# ==================== CẤU HÌNH ====================
BROKER = "broker.emqx.io"   # Dùng public broker EMQX tốc độ cao
# BROKER = "localhost"          # Uncomment khi có Mosquitto local
PORT = 1883
NUM_ROOMS = 20         # Số phòng giả lập (tăng lên 100 khi cần load test)
PUBLISH_INTERVAL = 3   # Giây giữa mỗi lần gửi dữ liệu

BUILDINGS = ["A", "B", "C"]
FLOORS = [1, 2, 3, 4, 5]

# Danh sách thẻ RFID mô phỏng
CARD_IDS = [
    "CARD_A1B2C3D4", "CARD_E5F6G7H8", "CARD_I9J0K1L2",
    "CARD_M3N4O5P6", "CARD_Q7R8S9T0", "CARD_U1V2W3X4",
]

# ==================== SINH DỮ LIỆU NGẪU NHIÊN ====================
class RoomSimulator:
    def __init__(self, room_id: str, building: str, floor: int, room_num: str):
        self.room_id  = room_id
        self.building = building
        self.floor    = floor
        self.room_num = room_num
        self.topic_base = f"dormitory/{building}/{floor}/{room_num}"

        # Trạng thái thiết bị & năng lượng
        self.light_on   = random.choice([True, False])
        self.fan_on     = random.choice([True, False])
        self.door_open  = False
        self.alarm      = False
        self.energy_kwh = random.uniform(5.0, 25.0) # Điện tích lũy ban đầu
        self.is_occupied = self.light_on or self.fan_on

        # Biến môi trường ban đầu (dao động xung quanh giá trị nền)
        self.base_temp  = random.uniform(25.0, 32.0)
        self.base_humid = random.uniform(55.0, 80.0)
        self.base_gas   = random.uniform(5.0, 20.0)

        # Đếm chu kỳ để tạo sự kiện ngẫu nhiên
        self.cycle = 0

        # MQTT client riêng cho mỗi phòng
        self.client = mqtt.Client(client_id=f"sim-{room_id}", clean_session=True)
        self.client.on_connect    = self._on_connect
        self.client.on_message    = self._on_message
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            # Subscribe lệnh từ Backend
            cmd_topic = f"{self.topic_base}/command/#"
            client.subscribe(cmd_topic)
            # Publish trạng thái online
            self._publish_status()
            print(f"  ✅ Room {self.building}{self.floor}-{self.room_num} connected")
        else:
            print(f"  ❌ Room {self.room_num} connect failed: rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        print(f"  📴 Room {self.room_num} disconnected")

    def _on_message(self, client, userdata, msg):
        """Nhận lệnh từ Backend và thực thi"""
        topic   = msg.topic
        payload = json.loads(msg.payload.decode())
        action  = payload.get("action", "")
        cmd_id  = payload.get("command_id", "unknown")

        if topic.endswith("/command/light"):
            self.light_on = (action == "on")
            print(f"  💡 [{self.room_num}] Light → {action}")
        elif topic.endswith("/command/fan"):
            self.fan_on = (action == "on")
            print(f"  🌀 [{self.room_num}] Fan → {action}")
        elif topic.endswith("/command/door"):
            self.door_open = (action in ["unlock", "open"])
            print(f"  🚪 [{self.room_num}] Door → {action}")
        elif topic.endswith("/command/alarm"):
            self.alarm = (action == "on")
            print(f"  🚨 [{self.room_num}] Alarm → {action}")


        # Gửi ACK
        ack = {
            "command_id": cmd_id,
            "status": "success",
            "timestamp": int(time.time())
        }
        client.publish(f"{self.topic_base}/command/ack", json.dumps(ack))
        self._publish_status()

    def _generate_sensor_data(self) -> dict:
        """Tạo dữ liệu cảm biến giả lập với dao động tự nhiên"""
        self.cycle += 1

        # Dao động sin để mô phỏng thực tế hơn
        sin_factor = math.sin(self.cycle * 0.1)
        temperature = self.base_temp + sin_factor * 2 + random.uniform(-0.3, 0.3)
        humidity    = self.base_humid + sin_factor * 5 + random.uniform(-1, 1)
        gas_level   = self.base_gas + random.uniform(-2, 2)

        # Tăng nhiệt độ nếu quạt tắt và đèn bật
        if not self.fan_on and self.light_on:
            temperature += 1.5

        # Tính toán công suất tiêu thụ điện (W)
        # 3 đèn (20W mỗi đèn) + quạt (60W) + standby (5W)
        power_w = 5.0
        if self.light_on:
            power_w += 60.0
        if self.fan_on:
            power_w += 60.0

        # Mô phỏng Device Anomaly (xác suất 0.5% - dòng tải tăng bất thường)
        if random.random() < 0.005:
            power_w += random.uniform(80.0, 150.0)
            print(f"  ⚡ [{self.room_num}] ANOMALOUS POWER SPIKE: {power_w:.1f}W")

        # Tích lũy điện năng kWh theo interval (3s / 3600h = 0.000833h)
        self.energy_kwh += (power_w * (PUBLISH_INTERVAL / 3600.0)) / 1000.0

        # Random event: Gas leak (xác suất 1% mỗi chu kỳ)
        if random.random() < 0.01:
            gas_level = random.uniform(75.0, 95.0)
            print(f"  ⚠️  [{self.room_num}] GAS SPIKE: {gas_level:.1f}%")

        # Clamp values
        temperature = max(15.0, min(50.0, temperature))
        humidity    = max(20.0, min(100.0, humidity))
        gas_level   = max(0.0, min(100.0, gas_level))

        return {
            "deviceId":        f"ESP32-SIM-{self.room_id}",
            "source":          "SIMULATOR",
            "temperature":     round(temperature, 1),
            "humidity":        round(humidity, 1),
            "gas_level":       round(gas_level, 1),
            "gas_alert":       gas_level > 70.0,
            "temp_alert":      temperature > 38.0,
            "powerW":          round(power_w, 1),
            "energyKwh":       round(self.energy_kwh, 4),
            "occupancySignal": self.light_on or self.fan_on,
            "light_1":         self.light_on,
            "light_2":         self.light_on,
            "light_3":         self.light_on,
            "fan":             self.fan_on,
            "door":            "open" if self.door_open else "locked",
            "alarm":           self.alarm,
            "timestamp":       int(time.time()),
            "room":            f"{self.building}{self.floor}-{self.room_num}",
        }

    def _publish_status(self):

        status = {
            "online":  True,
            "light_1": self.light_on,
            "fan":     self.fan_on,
            "door":    "open" if self.door_open else "locked",
            "alarm":   self.alarm,
        }
        self.client.publish(f"{self.topic_base}/status", json.dumps(status), retain=True)

    def _simulate_rfid_access(self):
        """Random RFID event mỗi 30-60 giây"""
        card = random.choice(CARD_IDS + ["CARD_INVALID_XXX"])
        authorized = card in CARD_IDS[:4]  # 4 thẻ đầu là hợp lệ

        log = {
            "card_id":    card,
            "authorized": authorized,
            "action":     "entry" if authorized else "denied",
            "room":       self.room_num,
            "building":   self.building,
            "timestamp":  int(time.time()),
        }
        self.client.publish(f"{self.topic_base}/access/rfid", json.dumps(log))
        print(f"  🪪 [{self.room_num}] RFID: {card[:12]}... → {'GRANT' if authorized else 'DENY'}")

    def run(self):
        """Vòng lặp chính của simulator phòng"""
        try:
            self.client.connect(BROKER, PORT, keepalive=60)
            self.client.loop_start()

            rfid_counter = 0
            rfid_interval = random.randint(10, 20)  # Mỗi 30-60 giây

            while True:
                # Publish sensor data
                data = self._generate_sensor_data()
                self.client.publish(
                    f"{self.topic_base}/sensor/data",
                    json.dumps(data),
                    retain=True
                )

                # Publish emergency nếu cần
                if data["gas_alert"]:
                    emerg = {
                        "type": "GAS_LEAK", "level": "critical",
                        "value": data["gas_level"], "room": self.room_num,
                        "building": self.building,
                    }
                    self.client.publish(f"{self.topic_base}/emergency", json.dumps(emerg))

                # Random RFID event
                rfid_counter += 1
                if rfid_counter >= rfid_interval:
                    self._simulate_rfid_access()
                    rfid_counter = 0
                    rfid_interval = random.randint(10, 20)

                time.sleep(PUBLISH_INTERVAL)

        except KeyboardInterrupt:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception as e:
            print(f"  ❌ Room {self.room_num} error: {e}")


# ==================== MAIN ====================
def create_rooms(num: int) -> list:
    """Tạo danh sách phòng giả lập (Bắt đầu từ Phòng 102, nhường Phòng 101 cho ESP32 Wokwi thật)"""
    rooms = []
    for i in range(num):
        building  = BUILDINGS[i % len(BUILDINGS)]
        floor     = FLOORS[(i // len(BUILDINGS)) % len(FLOORS)]
        room_num  = str(100 + (i % 19) + 2)  # Phòng 102 -> 120 (Phòng 101 dành riêng cho ESP32 Wokwi)
        room_id   = f"{building}{floor}{room_num}"
        rooms.append(RoomSimulator(room_id, building, floor, room_num))
    return rooms


def main():
    print("=" * 60)
    print("🏠 Smart Dormitory — Room Simulator")
    print(f"   Broker: {BROKER}:{PORT}")
    print(f"   Rooms:  {NUM_ROOMS} phòng ảo")
    print(f"   Interval: {PUBLISH_INTERVAL}s/lần")
    print("=" * 60)
    print()

    rooms = create_rooms(NUM_ROOMS)

    # Chạy mỗi phòng trong thread riêng
    threads = []
    for i, room in enumerate(rooms):
        t = threading.Thread(target=room.run, name=f"Room-{room.room_id}", daemon=True)
        threads.append(t)
        t.start()
        time.sleep(0.1)  # Stagger kết nối để không bị flood broker

    print(f"\n✅ {NUM_ROOMS} phòng đang chạy. Nhấn Ctrl+C để dừng.\n")

    try:
        while True:
            # Stats mỗi 30 giây
            time.sleep(30)
            alive = sum(1 for t in threads if t.is_alive())
            print(f"\n📊 [{datetime.now().strftime('%H:%M:%S')}] Rooms active: {alive}/{NUM_ROOMS}")
    except KeyboardInterrupt:
        print("\n\n🛑 Simulator stopped.")


if __name__ == "__main__":
    main()
