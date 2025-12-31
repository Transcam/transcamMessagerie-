import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExpensesTable1767025976194 implements MigrationInterface {
    name = 'CreateExpensesTable1767025976194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if enum exists before creating
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'expenses_category_enum'
            )
        `);
        
        if (!enumExists[0].exists) {
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
        }

        // Check if expenses table exists before creating
        const expensesTableExists = await queryRunner.hasTable("expenses");
        if (!expensesTableExists) {
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
        }

        // Check if users table exists before adding foreign keys
        const usersTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            )
        `);

        if (usersTableExists[0].exists) {
            const expensesTableExists = await queryRunner.hasTable("expenses");
            if (expensesTableExists) {
                // Check if foreign keys exist before creating
                const fkCreatedByExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_expenses_created_by'
                    )
                `);
                if (!fkCreatedByExists[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE "expenses" 
                        ADD CONSTRAINT "FK_expenses_created_by" 
                        FOREIGN KEY ("created_by_id") 
                        REFERENCES "users"("id") 
                        ON DELETE NO ACTION 
                        ON UPDATE NO ACTION
                    `);
                }

                const fkUpdatedByExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_expenses_updated_by'
                    )
                `);
                if (!fkUpdatedByExists[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE "expenses" 
                        ADD CONSTRAINT "FK_expenses_updated_by" 
                        FOREIGN KEY ("updated_by_id") 
                        REFERENCES "users"("id") 
                        ON DELETE NO ACTION 
                        ON UPDATE NO ACTION
                    `);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const expensesTableExists = await queryRunner.hasTable("expenses");
        if (expensesTableExists) {
            // Drop foreign keys if they exist
            const fkUpdatedByExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_expenses_updated_by'
                )
            `);
            if (fkUpdatedByExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_updated_by"`);
            }

            const fkCreatedByExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_expenses_created_by'
                )
            `);
            if (fkCreatedByExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_created_by"`);
            }

            // Drop indexes if they exist
            const index1Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_expenses_created_by_id'
                )
            `);
            if (index1Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_expenses_created_by_id"`);
            }

            const index2Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_expenses_created_at'
                )
            `);
            if (index2Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_expenses_created_at"`);
            }

            const index3Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_expenses_category'
                )
            `);
            if (index3Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_expenses_category"`);
            }

            // Drop table
            await queryRunner.query(`DROP TABLE "expenses"`);
        }

        // Drop enum type if it exists
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'expenses_category_enum'
            )
        `);
        if (enumExists[0].exists) {
            await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
        }
    }
}



