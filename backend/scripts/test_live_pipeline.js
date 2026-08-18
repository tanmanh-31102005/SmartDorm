const { io } = require('socket.io-client');
const mqtt = require('mqtt');



console.log('--- TEST LIVE PIPELINE (MQTT -> Backend -> WebSocket) ---');

// 1. Connect to Backend WebSocket
const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  console.log('✅ Connected to Backend WebSocket (ID:', socket.id, ')');

  // 2. Connect to MQTT Broker
  const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883', {
    clientId: 'test_pipeline_' + Date.now(),
  });

  mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT Broker (broker.hivemq.com:1883)');


    // 3. Publish Test RFID Event
    const rfidPayload = {
      card_id: 'CARD_A1B2C3D4',
      authorized: true,
      action: 'entry',
      room: '101',
      timestamp: Date.now(),
    };

    console.log('📤 Publishing MQTT RFID to dormitory/A/1/101/access/rfid...');
    mqttClient.publish('dormitory/A/1/101/access/rfid', JSON.stringify(rfidPayload), { qos: 1 }, (err) => {
      if (err) console.error('❌ MQTT Publish Error:', err);
      else console.log('✅ MQTT RFID Published!');
    });

    // 4. Publish Test Sensor Data
    setTimeout(() => {
      const sensorPayload = {
        temperature: 31.8,
        humidity: 62.5,
        gas_level: 24.0,
        gas_alert: false,
        temp_alert: false,
        room: '101',
      };
      console.log('📤 Publishing MQTT Sensor to dormitory/A/1/101/sensor/data...');
      mqttClient.publish('dormitory/A/1/101/sensor/data', JSON.stringify(sensorPayload), { qos: 1 });
    }, 1000);
  });
});

socket.on('access:log', (data) => {
  console.log('\n🎉 [WEBSOCKET RECEIVED access:log]:', JSON.stringify(data, null, 2));
});

socket.on('sensor:update', (data) => {
  console.log('\n🎉 [WEBSOCKET RECEIVED sensor:update]:', JSON.stringify(data, null, 2));
});

socket.on('connect_error', (err) => {
  console.error('❌ WebSocket Connection Error:', err.message);
});

setTimeout(() => {
  console.log('\nPipeline test completed.');
  process.exit(0);
}, 6000);
