import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity("audit_logs")
@Index(["entity_type", "entity_id"])
@Index(["created_at"])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50 })
  entity_type!: string;

  @Column()
  entity_id!: number;

  @Column({ type: "varchar", length: 50 })
  action!: string;

  @Column({ type: "jsonb", nullable: true })
  old_values!: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  new_values!: Record<string, any>;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ nullable: true })
  user_id!: number | null;

  @Column({ type: "text", nullable: true })
  reason!: string;

  @CreateDateColumn()
  created_at!: Date;
}





