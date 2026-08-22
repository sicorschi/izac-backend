import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/devices')
  findAllDevices() {
    return this.dashboardService.findAllDevices();
  }

  @Get('/sensors')
  findAllSensors() {
    return this.dashboardService.findAllSensors();
  }

  @Get('/devices/details')
  findAllDevicesDetailStats() {
    return this.dashboardService.findAllDevicesDetailStats();
  }
}
