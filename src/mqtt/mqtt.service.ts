import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as mqtt from 'mqtt';

type MqttMessageHandler = (topic: string, payload: Buffer) => void;

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly client: mqtt.MqttClient;
  private readonly topicHandlers = new Map<string, Set<MqttMessageHandler>>();

  constructor() {
    this.client = mqtt.connect(
      process.env.MQTT_BROKER_URL ?? 'tcp://192.168.0.50:1883',
      {
        clientId: process.env.MQTT_CLIENT_ID ?? 'izac-backend',
        clean: true,
        reconnectPeriod: 1000,
      },
    );
  }

  onModuleInit() {
    this.client.on('connect', () => {
      Logger.log('MQTT connected successfully');
    });

    this.client.on('error', (err) => {
      Logger.error('MQTT error:', err.message);
    });

    this.client.on('close', () => {
      Logger.warn('MQTT connection closed');
    });

    this.client.on('message', (topic, payload) => {
      Logger.log(`MQTT message received: ${topic} ${payload.toString()}`);

      for (const [filter, handlers] of this.topicHandlers.entries()) {
        if (this.matchesTopicFilter(filter, topic)) {
          handlers.forEach((handler) => handler(topic, payload));
        }
      }
    });
  }

  private matchesTopicFilter(filter: string, topic: string): boolean {
    const filterParts = filter.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < filterParts.length; i += 1) {
      const filterPart = filterParts[i];
      const topicPart = topicParts[i];

      if (filterPart === '#') {
        return true;
      }

      if (filterPart === '+') {
        continue;
      }

      if (filterPart !== topicPart) {
        return false;
      }
    }

    return filterParts.length === topicParts.length;
  }

  subscribe(topic: string, handler?: MqttMessageHandler) {
    const handlers =
      this.topicHandlers.get(topic) ?? new Set<MqttMessageHandler>();

    if (handler) {
      handlers.add(handler);
      this.topicHandlers.set(topic, handlers);
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        Logger.error('MQTT subscribe error:', err.message);
      } else {
        Logger.log(`Subscribed to ${topic}`);
      }
    });
  }

  publish(topic: string, payload: string | Buffer) {
    this.client.publish(topic, payload, {
      qos: 0,
      retain: false,
    });
  }

  onModuleDestroy() {
    this.client.end(true);
  }
}
