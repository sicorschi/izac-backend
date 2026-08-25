import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from './entities/device.entity';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device]), MqttModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
