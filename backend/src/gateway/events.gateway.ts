import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Observer Pattern Implementation
 * EventsGateway = Subject
 * Connected clients (Frontend) = Observers
 * Khi có sự kiện từ MQTT, Gateway tự động notify tất cả Observers
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Broadcast sensor data to all connected clients */
  broadcastSensorData(roomId: string, data: any) {
    this.server.emit('sensor:update', { roomId, ...data });
    // Also notify room-specific subscribers
    this.server.to(`room:${roomId}`).emit('room:sensor', data);
  }

  /** Broadcast emergency alert */
  broadcastEmergency(alert: any) {
    this.logger.warn(`EMERGENCY BROADCAST: ${JSON.stringify(alert)}`);
    this.server.emit('emergency:alert', alert);
  }

  /** Broadcast emergency resolved */
  broadcastEmergencyResolved(id: string) {
    this.server.emit('emergency:resolved', { id, isResolved: true, resolvedAt: new Date().toISOString() });
  }

  /** Broadcast device status change */
  broadcastDeviceStatus(roomId: string, status: any) {
    this.server.emit('device:status', { roomId, ...status });
  }

  /** Broadcast real-time command log entry to all connected clients */
  broadcastCommandLog(log: any) {
    this.server.emit('command:new', log);
    this.server.emit('command:log', log);
  }

  /** Broadcast access log event */
  broadcastAccessLog(log: any) {
    this.server.emit('access:log', log);
  }

  /** Broadcast AI Anomaly Detected */
  broadcastAiAnomaly(anomaly: any) {
    this.logger.warn(`AI ANOMALY BROADCAST: ${JSON.stringify(anomaly)}`);
    this.server.emit('ai:anomaly', anomaly);
  }

  /** Broadcast AI Recommendation Generated */
  broadcastAiRecommendation(rec: any) {
    this.server.emit('ai:recommendation', rec);
  }

  /** Broadcast AI Model Status Update */
  broadcastAiModelUpdate(model: any) {
    this.server.emit('ai:model_update', model);
  }

  /** Broadcast AI Energy Forecast Update */
  broadcastAiForecast(forecast: any) {
    this.server.emit('ai:forecast', forecast);
  }

  /** Client can subscribe to a specific room */
  @SubscribeMessage('room:subscribe')
  handleRoomSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(`room:${roomId}`);
    this.logger.log(`Client ${client.id} subscribed to room ${roomId}`);
    return { event: 'room:subscribed', data: roomId };
  }

  /** Get current connected count */
  getConnectedCount(): number {
    return this.server.sockets.sockets.size;
  }
}
