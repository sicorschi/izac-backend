import { Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  create(createDeviceDto: CreateDeviceDto) {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  findAll() {
    return this.deviceRepository.find();
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
}
