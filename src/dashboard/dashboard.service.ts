import { Injectable } from '@nestjs/common';
import { DevicesDetailStatsResponseDto } from '../devices/dto/devices-detail-stats-response.dto';
import { DevicesService } from '../devices/devices.service';
import { DevicesStatsResponseDto } from '../devices/dto/devices-stats-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly devicesService: DevicesService) {}

  async findAllDevices(): Promise<DevicesDetailStatsResponseDto> {
    return await this.devicesService.findAll();
  }

  async findAllDevicesStats(): Promise<DevicesStatsResponseDto> {
    return await this.devicesService.findAllStats();
  }
}
