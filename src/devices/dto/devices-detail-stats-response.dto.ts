export class ActiveDevicesResponseDto {
  id!: number;
  type!: string;
  ip!: string;
  uptime!: string;
  version!: string;
}

export class OfflineDevicesResponseDto {
  id!: number;
  type!: string;
  ip!: string;
  version!: string;
}

export class DevicesDetailStatsResponseDto {
  totalDevices!: number;
  activeDevices!: ActiveDevicesResponseDto[];
  offlineDevices!: OfflineDevicesResponseDto[];
}
