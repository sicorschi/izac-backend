import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as net from 'node:net';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
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

  private async mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: Array<R | undefined> = new Array<R | undefined>(
      items.length,
    );
    let index = 0;

    const workers = Array.from(
      { length: Math.min(limit, items.length) },
      async () => {
        while (index < items.length) {
          const currentIndex = index++;
          results[currentIndex] = await mapper(items[currentIndex]);
        }
      },
    );

    await Promise.all(workers);
    return results as R[];
  }

  create(createDeviceDto: CreateDeviceDto) {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAll() {
    const devices = await this.deviceRepository.find();

    return await this.mapWithConcurrency(devices, 10, async (device) => {
      const reachable = device.ip
        ? await this.isDeviceReachable(device.ip, 80)
        : false;

      const port = Number(device.port ?? 80);

      return {
        ...device,
        status: reachable ? 'online' : 'offline',
        port,
      };
    });
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
