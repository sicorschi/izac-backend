import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/devices')
  findAllDevices() {
    return this.dashboardService.findAllDevices();
  }

  @Get('/devices/stats')
  findAllDevicesStats() {
    return this.dashboardService.findAllDevicesStats();
  }
}
