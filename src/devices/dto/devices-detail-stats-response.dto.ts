export class DeviceDetailResponse {
  createdAt!: Date;
  updatedAt!: Date;
  id!: number;
  name!: string;
  type!: string;
  status!: string;
  location!: string;
  ip!: string;
  uptime!: string;
  temperature!: string | number;
  version!: string;
  memory!: string;
  humidity!: string;
}

export class DevicesDetailStatsResponseDto {
  totalDevices!: number;
  activeDevices!: DeviceDetailResponse[];
  offlineDevices!: DeviceDetailResponse[];
}
