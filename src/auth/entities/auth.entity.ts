import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from './timestamp.entity';

@Entity('auth')
export class Auth extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;
}
