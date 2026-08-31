import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';
import { DevicesTopics } from '../mqtt/devices-topics.types';
import { DevicesSmartLightDto } from './dto/devices-smart-light.dto';

interface StatusMQTTMessage {
  deviceName?: string;
  status?: string;
  ip?: string;
  location?: string;
  uptime?: string;
  memory?: string;
  version?: string;
  timestamp?: string;
  lastSeen?: number;
  value?: string;
  temperature?: number;
}

type MqttHandler = (topic: string, payload: Buffer) => void;

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly mqttService: MqttService,
  ) {}

  private readonly mqttStatusCache = new Map<string, StatusMQTTMessage>();
  private readonly mqttSmartLightsCache = new Map<string, StatusMQTTMessage>();

  private logMqttMessage(label: string, topic: string, parsed?: unknown) {
    const parsedPayload =
      parsed !== undefined ? `\n${JSON.stringify(parsed, null, 2)}` : '\nnull';

    Logger.log(`
=========================================================================
[MQTT] ${label}
[*]Topic: ${topic}
[*]Parsed: ${parsedPayload}
=========================================================================
    `);
  }

  private readonly handleDeviceStatus = (topic: string, payload: Buffer) => {
    try {
      const message = this.parseStatusMQTTMessage(payload);
      this.logMqttMessage(
        `Device name: ${message?.deviceName ?? ''}`,
        topic,
        message,
      );

      if (!message?.deviceName || !message?.status) {
        return;
      }
      this.setStatusInCache(message.deviceName, {
        status: message.status,
        ip: message.ip,
        location: message.location,
        uptime: message.uptime,
        memory: message.memory,
        version: message.version,
        timestamp: message.timestamp,
        lastSeen: Date.now(),
        temperature: message.temperature,
      });
    } catch (error) {
      Logger.error('Could not parse MQTT device status payload:', error);
    }
  };

  create(createDeviceDto: CreateDeviceDto) {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAllStats() {
    const totalDevices = await this.deviceRepository.count();
    const activeDevices = Array.from(this.mqttStatusCache.values()).filter(
      (deviceCache) =>
        deviceCache.status === 'online' &&
        Date.now() - (deviceCache.lastSeen ? deviceCache.lastSeen : 0) < 30000,
    ).length;
    const offlineDevices = totalDevices - activeDevices;
    return {
      totalDevices,
      activeDevices,
      offlineDevices,
    };
  }

  private getStatusFromCache(deviceName: string): StatusMQTTMessage | null {
    const lastStatus = this.mqttStatusCache.get(deviceName.toLowerCase());
    if (
      lastStatus &&
      Date.now() - (lastStatus.lastSeen ? lastStatus.lastSeen : 0) < 30000
    ) {
      return {
        status: lastStatus.status,
        ip: lastStatus.ip,
        location: lastStatus.location,
        uptime: lastStatus.uptime,
        memory: lastStatus.memory,
        version: lastStatus.version,
        timestamp: lastStatus.timestamp,
        lastSeen: lastStatus.lastSeen,
        temperature: lastStatus.temperature,
      };
    }
    return null;
  }

  private parseStatusMQTTMessage(payload: Buffer): StatusMQTTMessage | null {
    try {
      const message = JSON.parse(payload.toString()) as StatusMQTTMessage;
      if (!message.deviceName || !message.status) {
        return null;
      }
      return message;
    } catch (error) {
      Logger.error('Could not parse MQTT device status payload:', error);
      return null;
    }
  }

  private setStatusInCache(deviceName: string, body: StatusMQTTMessage) {
    this.mqttStatusCache.set(deviceName.toLowerCase(), {
      status: body.status ? body.status.toLowerCase() : 'offline',
      lastSeen: Date.now(),
      ip: body.ip,
      location: body.location,
      uptime: body.uptime,
      memory: body.memory,
      version: body.version,
      timestamp: body.timestamp,
      temperature: body.temperature,
    });
  }

  private mapDeviceToDetail(device: Device) {
    const mqttStatus = this.getStatusFromCache(device.name);
    console.log('Mapping device to detail:', {
      device,
      mqttStatus,
      temperature: mqttStatus?.temperature,
    });
    const status = mqttStatus?.status ?? 'offline';
    return {
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      id: device.id,
      name: device.name,
      type: device.type,
      status,
      location: mqttStatus?.location ?? device.location,
      ip: mqttStatus?.ip ?? device.ip,
      uptime: mqttStatus?.uptime ?? device.uptime,
      temperature: mqttStatus?.temperature ?? null,
      version: mqttStatus?.version ?? device.version,
      value: mqttStatus?.value ?? null,
      memory: mqttStatus?.memory ?? device.memory,
    };
  }

  async findAll() {
    const devices = await this.deviceRepository.find();
    const activeDevices = devices
      .map((device) => this.mapDeviceToDetail(device))
      .filter((device) => device.status === 'online');
    const offlineDevices = devices
      .map((device) => this.mapDeviceToDetail(device))
      .filter((device) => device.status !== 'online');
    return {
      totalDevices: devices.length,
      activeDevices,
      offlineDevices,
    };
  }

  async findAllDevices() {
    const devices = await this.deviceRepository.find();
    return devices.map((device) => this.mapDeviceToDetail(device));
  }

  findOne(id: number) {
    return this.deviceRepository.findOneBy({ id });
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto) {
    await this.deviceRepository.update(id, updateDeviceDto);
    return this.deviceRepository.findOneBy({ id });
  }

  async remove(id: number) {
    return this.deviceRepository.delete(id);
  }

  publish(topic: string, payload: unknown) {
    const serialized =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.mqttService.publish(topic, serialized);
  }

  actionSmartLight(devicesSmartLightDto: DevicesSmartLightDto) {
    const payload = devicesSmartLightDto.action;
    console.log('Publishing smart light action:', payload);
    this.publish(DevicesTopics.SMART_LIGHT_01_COMMAND, payload);
  }

  private readonly mqttSubscriptions: Array<[string, MqttHandler]> = [
    [DevicesTopics.STATUS, this.handleDeviceStatus],
    [DevicesTopics.SMART_LIGHT_01_STATUS, this.handleDeviceStatus],
  ];

  onModuleInit() {
    this.mqttSubscriptions.forEach(([topic, handler]) => {
      this.mqttService.subscribe(topic, handler);
    });
  }
}
