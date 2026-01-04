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

export enum VehicleType {
  BUS = "bus",
  COASTER = "coaster",
  MINIBUS = "minibus",
}

export enum VehicleStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

@Entity("vehicles")
@Index(["registration_number"], { unique: true })
@Index(["status"])
@Index(["type"])
@Index(["created_at"])
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  registration_number!: string; // Ex: "LT-234-AB"

  @Column({ type: "varchar", length: 255 })
  name!: string; // Ex: "Bus 003", "Coaster Kribi"

  @Column({
    type: "enum",
    enum: VehicleType,
  })
  type!: VehicleType; // Bus, Coaster, Minibus

  @Column({
    type: "enum",
    enum: VehicleStatus,
    default: VehicleStatus.ACTIF,
  })
  status!: VehicleStatus; // ACTIF, INACTIF

  // User tracking
  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  created_by!: User;

  @Column()
  created_by_id!: number;

  // Relations
  @OneToMany(() => Departure, (departure) => departure.vehicle)
  departures!: Departure[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


