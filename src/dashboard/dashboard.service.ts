import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  findAllDevices() {
    return `This action returns all devices`;
  }

  findOneDevice(id: number) {
    return `This action returns a #${id} device`;
  }

  findAllSensors() {
    return `This action returns all sensors`;
  }

  findOneSensor(id: number) {
    return `This action returns a #${id} sensor`;
  }
}
