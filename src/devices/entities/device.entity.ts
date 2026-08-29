import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TimestampedEntity } from '../../auth/entities/timestamp.entity';

@Entity('device')
export class Device extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ nullable: true, default: 'offline' })
  status!: string;

  @Column({ nullable: true, default: 'unknown' })
  location!: string;

  @Column({ nullable: true, default: 'unknown' })
  ip!: string;

  @Column({ nullable: true, default: 'unknown' })
  uptime!: string;

  @Column({ nullable: true, default: 'unknown' })
  temperature!: string;

  @Column({ nullable: true, default: 'unknown' })
  version!: string;

  @Column({ nullable: true, default: 'unknown' })
  memory!: string;
}
