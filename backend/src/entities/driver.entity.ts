import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Departure } from "./departure.entity";

export enum DriverStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

@Entity("drivers")
@Index(["license_number"], { unique: true })
@Index(["status"])
@Index(["created_at"])
export class Driver {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  first_name!: string;

  @Column({ type: "varchar", length: 100 })
  last_name!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  license_number!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({
    type: "enum",
    enum: DriverStatus,
    default: DriverStatus.ACTIF,
  })
  status!: DriverStatus;

  // User tracking
  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  created_by!: User;

  @Column()
  created_by_id!: number;

  // Relations
  @OneToMany(() => Departure, (departure) => departure.driver)
  departures!: Departure[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

