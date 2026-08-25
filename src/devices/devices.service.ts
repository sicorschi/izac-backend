import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class DevicesService {
  private readonly mqttStatusCache = new Map<
    string,
    { status: string; lastSeen: number }
  >();

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly mqttService: MqttService,
  ) {}

  private readonly handleDeviceStatus = (topic: string, payload: Buffer) => {
    try {
      const message = JSON.parse(payload.toString()) as {
        deviceName?: string;
        status?: string;
        timestamp?: string;
      };

      if (!message.deviceName || !message.status) {
        return;
      }

      this.mqttStatusCache.set(message.deviceName, {
        status: String(message.status).toLowerCase(),
        lastSeen: Date.now(),
      });

      console.log(`Device status updated from MQTT topic ${topic}:`, message);
    } catch (error) {
      console.error('Could not parse MQTT device status payload:', error);
    }
  };

  create(createDeviceDto: CreateDeviceDto) {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAll() {
    const devices = await this.deviceRepository.find();

    return devices.map((device) => {
      const lastStatus = this.mqttStatusCache.get(device.name);
      const status =
        lastStatus && Date.now() - lastStatus.lastSeen < 30000
          ? lastStatus.status
          : (device.status ?? 'offline');

      return {
        ...device,
        status,
        port: Number(device.port ?? 80),
      };
    });
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

  // sendDeviceUpdate() {
  //   this.mqttService.publish('izac/devices/update', {
  //     deviceId: 1,
  //     status: 'online',
  //     timestamp: new Date().toISOString(),
  //   });
  // }

  onModuleInit() {
    this.mqttService.subscribe('izac/devices/status', this.handleDeviceStatus);
  }
}
