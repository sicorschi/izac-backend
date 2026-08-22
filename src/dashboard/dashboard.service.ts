import { Injectable } from '@nestjs/common';
import { Sensor } from '../sensors/entities/sensor.entity';
import { Device } from '../devices/entities/device.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DevicesStatsResponseDto } from '../devices/dto/devices-stats-response.dto';
import { SensorsStatsResponseDto } from '../sensors/dto/sensors-stats-response.dto';
import { DevicesDetailStatsResponseDto } from '../devices/dto/devices-detail-stats-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async findAllDevices(): Promise<DevicesStatsResponseDto> {
    const allDevices = await this.deviceRepository.find();
    const onlineDevices = allDevices.filter(
      (device) => device.status === 'online',
    );
    const offlineDevices = allDevices.filter(
      (device) => device.status === 'offline',
    );
    return {
      totalDevices: allDevices.length,
      activeDevices: onlineDevices.length,
      offlineDevices: offlineDevices.length,
    };
  }

  async findAllSensors(): Promise<SensorsStatsResponseDto> {
    const allSensors = await this.sensorRepository.find();
    const activeSensors = allSensors
      .filter((sensor) => sensor.status === 'online')
      .map(
        ({
          id,
          name,
          type,
          status,
          location,
          uptime,
          temperature,
          version,
          unit,
          value,
          threshold,
        }) => ({
          id,
          name,
          type,
          status,
          location,
          uptime,
          temperature,
          version,
          unit,
          value,
          threshold,
        }),
      );
    const inactiveSensors = allSensors
      .filter((sensor) => sensor.status === 'offline')
      .map(
        ({
          id,
          name,
          type,
          status,
          location,
          uptime,
          temperature,
          version,
          unit,
          value,
          threshold,
        }) => ({
          id,
          name,
          type,
          status,
          location,
          uptime,
          temperature,
          version,
          unit,
          value,
          threshold,
        }),
      );
    return {
      totalSensors: allSensors.length,
      activeSensors: activeSensors,
      offlineSensors: inactiveSensors,
    };
  }

  async findAllDevicesDetailStats(): Promise<DevicesDetailStatsResponseDto> {
    const devices = await this.deviceRepository.find();
    const activeDevices = devices
      .filter((device) => device.status === 'online')
      .map(({ id, type, ip, uptime, version }) => ({
        id,
        type,
        ip,
        uptime,
        version,
      }));
    const offlineDevices = devices
      .filter((device) => device.status === 'offline')
      .map(({ id, type, ip, version }) => ({
        id,
        type,
        ip,
        version,
      }));
    return {
      totalDevices: devices.length,
      activeDevices,
      offlineDevices,
    };
  }
}
