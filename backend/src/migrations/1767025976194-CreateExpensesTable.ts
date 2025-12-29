import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExpensesTable1767025976194 implements MigrationInterface {
    name = 'CreateExpensesTable1767025976194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create expense_category enum
        await queryRunner.query(`
            CREATE TYPE "public"."expenses_category_enum" AS ENUM(
                'depense_du_boss',
                'carburant',
                'maintenance',
                'fournitures_bureau',
                'loyer',
                'salaires',
                'communication',
                'assurance',
                'reparations',
                'charges',
                'impots',
                'marketing',
                'autre'
            )
        `);

        // Create expenses table
        await queryRunner.query(`
            CREATE TABLE "expenses" (
                "id" SERIAL NOT NULL,
                "description" text NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "category" "public"."expenses_category_enum" NOT NULL,
                "created_by_id" integer NOT NULL,
                "updated_by_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_expenses_category" ON "expenses" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_created_at" ON "expenses" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_created_by_id" ON "expenses" ("created_by_id")`);

        // Create foreign keys
        await queryRunner.query(`
            ALTER TABLE "expenses" 
            ADD CONSTRAINT "FK_expenses_created_by" 
            FOREIGN KEY ("created_by_id") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "expenses" 
            ADD CONSTRAINT "FK_expenses_updated_by" 
            FOREIGN KEY ("updated_by_id") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_updated_by"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_created_by"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_created_by_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_category"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "expenses"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
    }
}

