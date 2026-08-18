import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/devices')
  findAllDevices() {
    return this.dashboardService.findAllDevices();
  }

  @Get('/devices/:id')
  findOneDevice(@Param('id') id: string) {
    return this.dashboardService.findOneDevice(+id);
  }
  @Get('/sensors')
  findAllSensors() {
    return this.dashboardService.findAllSensors();
  }

  @Get('/sensors/:id')
  findOneSensor(@Param('id') id: string) {
    return this.dashboardService.findOneSensor(+id);
  }
}
