import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";

@Entity("settings")
export class Settings {
  @PrimaryColumn({ type: "varchar", length: 50, default: "company" })
  id!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  company_logo_url!: string | null;

  @UpdateDateColumn()
  updated_at!: Date;
}


