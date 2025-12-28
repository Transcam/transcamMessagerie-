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
import { Shipment } from "./shipment.entity";

export enum DepartureStatus {
  OPEN = "open",
  SEALED = "sealed",
  CLOSED = "closed",
}

@Entity("departures")
@Index(["status"])
@Index(["general_waybill_number"], { unique: true, where: '"general_waybill_number" IS NOT NULL' })
@Index(["created_at"])
export class Departure {
  @PrimaryGeneratedColumn()
  id!: number;

  // General Waybill Number (Bordereau Général) - generated on SEAL
  @Column({ type: "varchar", length: 50, unique: true, nullable: true })
  general_waybill_number!: string | null;

  // PDF file path (stored on file system)
  @Column({ type: "varchar", length: 500, nullable: true })
  pdf_path!: string | null;

  // Status
  @Column({
    type: "enum",
    enum: DepartureStatus,
    default: DepartureStatus.OPEN,
  })
  status!: DepartureStatus;

  // Departure metadata
  @Column({ type: "varchar", length: 255, nullable: true })
  route!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  vehicle!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  driver_name!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  // Timestamps
  @Column({ type: "timestamp", nullable: true })
  sealed_at!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  closed_at!: Date | null;

  // User tracking
  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  created_by!: User;

  @Column()
  created_by_id!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "sealed_by_id" })
  sealed_by!: User | null;

  @Column({ nullable: true })
  sealed_by_id!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "closed_by_id" })
  closed_by!: User | null;

  @Column({ nullable: true })
  closed_by_id!: number | null;

  // Relations
  @OneToMany(() => Shipment, (shipment) => shipment.departure)
  shipments!: Shipment[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

