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

export enum ExpenseCategory {
  BOSS_EXPENSE = "depense_du_boss",
  FUEL = "carburant",
  MAINTENANCE = "maintenance",
  OFFICE_SUPPLIES = "fournitures_bureau",
  RENT = "loyer",
  SALARIES = "salaires",
  COMMUNICATION = "communication",
  INSURANCE = "assurance",
  REPAIRS = "reparations",
  UTILITIES = "charges",
  TAXES = "impots",
  MARKETING = "marketing",
  OTHER = "autre",
}

@Entity("expenses")
@Index(["category"])
@Index(["created_at"])
@Index(["created_by_id"])
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: ExpenseCategory,
  })
  category!: ExpenseCategory;

  // Audit Trail
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "created_by_id" })
  created_by!: User | null;

  @Column({ nullable: true })
  created_by_id!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by_id" })
  updated_by!: User | null;

  @Column({ nullable: true })
  updated_by_id!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


