export class ActiveSensorsResponseDto {
  id!: number;
  type!: string;
  location!: string;
  uptime!: string;
  version!: string;
  unit!: string;
  value!: string;
  threshold!: number;
}

export class OfflineSensorsResponseDto {
  id!: number;
  type!: string;
  location!: string;
  version!: string;
  unit!: string;
  value!: string;
  threshold!: number;
}

export class SensorsStatsResponseDto {
  totalSensors!: number;
  activeSensors!: ActiveSensorsResponseDto[];
  offlineSensors!: OfflineSensorsResponseDto[];
}
