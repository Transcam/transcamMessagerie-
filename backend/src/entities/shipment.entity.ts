import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Departure } from "./departure.entity";

export enum ShipmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  ASSIGNED = "assigned",
  CANCELLED = "cancelled",
}

@Entity("shipments")
@Index(["waybill_number"], { unique: true })
@Index(["status"])
@Index(["created_at"])
@Index(["departure_id"])
export class Shipment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  waybill_number!: string;

  // Sender Information
  @Column({ type: "varchar", length: 255 })
  sender_name!: string;

  @Column({ type: "varchar", length: 50 })
  sender_phone!: string;

  // Receiver Information
  @Column({ type: "varchar", length: 255 })
  receiver_name!: string;

  @Column({ type: "varchar", length: 50 })
  receiver_phone!: string;

  // Parcel Information
  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  weight!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  declared_value!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "varchar", length: 255 })
  route!: string;

  // Status & Locking
  @Column({
    type: "enum",
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status!: ShipmentStatus;

  @Column({ type: "boolean", default: false })
  is_confirmed!: boolean;

  @Column({ type: "timestamp", nullable: true })
  confirmed_at!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "confirmed_by_id" })
  confirmed_by!: User | null;

  @Column({ nullable: true })
  confirmed_by_id!: number | null;

  @Column({ type: "boolean", default: false })
  is_cancelled!: boolean;

  @Column({ type: "timestamp", nullable: true })
  cancelled_at!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "cancelled_by_id" })
  cancelled_by!: User | null;

  @Column({ nullable: true })
  cancelled_by_id!: number | null;

  @Column({ type: "text", nullable: true })
  cancellation_reason!: string;

  // Departure relationship
  @ManyToOne(() => Departure, (departure) => departure.shipments, { nullable: true })
  @JoinColumn({ name: "departure_id" })
  departure!: Departure | null;

  @Column({ nullable: true })
  departure_id!: number | null;

  // Audit Trail
  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  created_by!: User;

  @Column()
  created_by_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

