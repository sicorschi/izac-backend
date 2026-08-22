import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as net from 'node:net';
import { Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { Sensor } from '../sensors/entities/sensor.entity';
import { DevicesStatsResponseDto } from '../devices/dto/devices-stats-response.dto';
import { DevicesDetailStatsResponseDto } from '../devices/dto/devices-detail-stats-response.dto';
import { SensorsStatsResponseDto } from '../sensors/dto/sensors-stats-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  private async isDeviceReachable(ip: string, port = 80): Promise<boolean> {
    if (!ip?.trim()) {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 300);

      socket.once('connect', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.once('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  async findAllDevices(): Promise<DevicesStatsResponseDto> {
    const devices = await this.deviceRepository.find();

    const liveDeviceStatuses = await Promise.all(
      devices.map(async (device) => {
        const port = Number(device.port ?? 80);
        const reachable = device.ip
          ? await this.isDeviceReachable(device.ip, port)
          : false;

        return {
          ...device,
          effectiveStatus: reachable ? 'online' : 'offline',
          port,
        };
      }),
    );

    const onlineDevices = liveDeviceStatuses.filter(
      (device) => device.effectiveStatus === 'online',
    );
    const offlineDevices = liveDeviceStatuses.filter(
      (device) => device.effectiveStatus === 'offline',
    );

    return {
      totalDevices: devices.length,
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
