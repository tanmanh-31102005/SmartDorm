import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';

@Injectable()
export class MqttService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MqttService');
  private client: mqtt.MqttClient;
  private connected = false;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.client) this.client.end();
  }

  private async connect() {
    const brokerUrl =
      this.configService.get<string>('MQTT_BROKER_URL') ||
      process.env.MQTT_BROKER_URL ||
      'mqtt://broker.hivemq.com:1883';
    this.logger.log(`Kết nối MQTT: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: `smart_dorm_server_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      protocolVersion: 4,
    });


    this.client.on('connect', () => {
      this.connected = true;
      this.logger.log('✅ MQTT Broker connected');
      const topics = [
        'dormitory/+/+/+/sensor/data',
        'dormitory/+/+/+/access/rfid',
        'dormitory/+/+/+/emergency',
        'dormitory/+/+/+/status',
        'dormitory/+/+/+/command/ack',
      ];
      topics.forEach(topic => {
        this.client.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) this.logger.log(`Subscribed: ${topic}`);
          else this.logger.error(`Subscribe error: ${err.message}`);
        });
      });
    });

    this.client.on('message', (topic: string, payload: Buffer) => {
      try {
        const message = JSON.parse(payload.toString());
        this.emit('message', { topic, message });
      } catch (e) {
        this.logger.warn(`Invalid JSON from ${topic}`);
      }
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT Error: ' + err.message);
      this.connected = false;
    });

    this.client.on('close', () => {
      this.connected = false;
    });

    this.client.on('offline', () => {
      this.connected = false;
    });
  }

  async publish(topic: string, payload: string, options?: mqtt.IClientPublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        this.logger.warn('MQTT chưa kết nối, không thể publish');
        resolve();
        return;
      }
      this.client.publish(topic, payload, { qos: 0, ...options }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }


  isConnected(): boolean { return this.connected; }
}
