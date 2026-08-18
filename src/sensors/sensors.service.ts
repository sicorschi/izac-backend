import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sensor } from './entities/sensor.entity';

@Injectable()
export class SensorsService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}
  create(createSensorDto: CreateSensorDto) {
    const sensor = this.sensorRepository.create(createSensorDto);
    return this.sensorRepository.save(sensor);
  }

  findAll() {
    return this.sensorRepository.find();
  }

  findOne(id: number) {
    return this.sensorRepository.findOneBy({ id });
  }

  async update(id: number, updateSensorDto: UpdateSensorDto) {
    await this.sensorRepository.update(id, updateSensorDto);
    return this.sensorRepository.findOneBy({ id });
  }

  remove(id: number) {
    return this.sensorRepository.delete(id);
  }
}
