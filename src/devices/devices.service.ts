import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';

interface StatusMQTTMessage {
  deviceName?: string;
  status?: string;
  ip?: string;
  location?: string;
  uptime?: string;
  memory?: string;
  version?: string;
  timestamp?: string;
  lastSeen: number;
}

interface TemperatureMQTTMessage {
  deviceName?: string;
  temperatureValue?: string;
  timestamp?: string;
  lastSeen: number;
}

interface HumidityMQTTMessage {
  deviceName?: string;
  humidityValue?: string;
  timestamp?: string;
  lastSeen: number;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly mqttService: MqttService,
  ) {}

  private readonly mqttStatusCache = new Map<string, StatusMQTTMessage>();
  private readonly mqttTemperatureCache = new Map<
    string,
    TemperatureMQTTMessage
  >();
  private readonly mqttHumidityCache = new Map<string, HumidityMQTTMessage>();
  private readonly handleDeviceStatus = (topic: string, payload: Buffer) => {
    try {
      const message = this.parseStatusMQTTMessage(payload);
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
      });
      Logger.log(`Device status updated from MQTT topic ${topic}:`, message);
    } catch (error) {
      Logger.error('Could not parse MQTT device status payload:', error);
    }
  };

  private readonly handleDeviceStatusTemperature = (
    topic: string,
    payload: Buffer,
  ) => {
    try {
      const message = this.parseTemperatureMQTTMessage(payload);
      if (!message?.deviceName || !message?.temperatureValue) {
        return;
      }
      this.setTemperatureInCache(
        message.deviceName,
        String(message.temperatureValue),
        message.timestamp,
      );
      Logger.log(
        `Device temperature updated from MQTT topic ${topic}:`,
        message,
      );
    } catch (error) {
      Logger.error('Could not parse MQTT device temperature payload:', error);
    }
  };

  private readonly handleDeviceStatusHumidity = (
    topic: string,
    payload: Buffer,
  ) => {
    try {
      const message = this.parseHumidityMQTTMessage(payload);
      if (!message?.deviceName || !message?.humidityValue) {
        return;
      }
      this.setHumidityInCache(
        message.deviceName,
        String(message.humidityValue),
        message.timestamp,
      );
      Logger.log(`Device humidity updated from MQTT topic ${topic}:`, message);
    } catch (error) {
      Logger.error('Could not parse MQTT device humidity payload:', error);
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
        Date.now() - deviceCache.lastSeen < 30000,
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
    if (lastStatus && Date.now() - lastStatus.lastSeen < 30000) {
      return {
        status: lastStatus.status,
        ip: lastStatus.ip,
        location: lastStatus.location,
        uptime: lastStatus.uptime,
        memory: lastStatus.memory,
        version: lastStatus.version,
        timestamp: lastStatus.timestamp,
        lastSeen: lastStatus.lastSeen,
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
    });
  }

  private getTemperatureFromCache(deviceName: string): string {
    const lastTemperature = this.mqttTemperatureCache.get(
      deviceName.toLowerCase(),
    );
    if (lastTemperature && Date.now() - lastTemperature.lastSeen < 30000) {
      return lastTemperature.temperatureValue ?? 'unknown';
    }
    return 'unknown';
  }

  private parseTemperatureMQTTMessage(
    payload: Buffer,
  ): TemperatureMQTTMessage | null {
    try {
      const message = JSON.parse(payload.toString()) as TemperatureMQTTMessage;
      if (!message.deviceName || !message.temperatureValue) {
        return null;
      }
      return message;
    } catch (error) {
      Logger.error('Could not parse MQTT device temperature payload:', error);
      return null;
    }
  }

  private setTemperatureInCache(
    deviceName: string,
    temperatureValue: string,
    timestamp?: string,
  ) {
    this.mqttTemperatureCache.set(deviceName.toLowerCase(), {
      temperatureValue,
      lastSeen: Date.now(),
      timestamp,
    });
  }

  private getHumidityFromCache(deviceName: string): string {
    const lastHumidity = this.mqttHumidityCache.get(deviceName.toLowerCase());
    if (lastHumidity && Date.now() - lastHumidity.lastSeen < 30000) {
      return lastHumidity.humidityValue ?? 'unknown';
    }
    return 'unknown';
  }

  private parseHumidityMQTTMessage(
    payload: Buffer,
  ): HumidityMQTTMessage | null {
    try {
      const message = JSON.parse(payload.toString()) as HumidityMQTTMessage;
      if (!message.deviceName || !message.humidityValue) {
        return null;
      }
      return message;
    } catch (error) {
      Logger.error('Could not parse MQTT device humidity payload:', error);
      return null;
    }
  }

  private setHumidityInCache(
    deviceName: string,
    humidityValue: string,
    timestamp?: string,
  ) {
    this.mqttHumidityCache.set(deviceName.toLowerCase(), {
      humidityValue,
      lastSeen: Date.now(),
      timestamp,
    });
  }

  private mapDeviceToDetail(device: Device) {
    const mqttStatus = this.getStatusFromCache(device.name);
    const temperature = this.getTemperatureFromCache(device.name);
    const humidity = this.getHumidityFromCache(device.name);
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
      temperature,
      version: mqttStatus?.version ?? device.version,
      memory: mqttStatus?.memory ?? device.memory,
      humidity,
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

  onModuleInit() {
    this.mqttService.subscribe('izac/devices/status', this.handleDeviceStatus);
    this.mqttService.subscribe(
      'izac/devices/status/esp32/temperature',
      this.handleDeviceStatusTemperature,
    );
    this.mqttService.subscribe(
      'izac/devices/status/esp32/humidity',
      this.handleDeviceStatusHumidity,
    );
  }
}
