import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDriversTable1767036000000 implements MigrationInterface {
    name = 'CreateDriversTable1767036000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create driver_status enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."drivers_status_enum" AS ENUM(
                    'actif',
                    'inactif'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create drivers table if it doesn't exist
        const driversTableExists = await queryRunner.hasTable("drivers");
        if (!driversTableExists) {
            await queryRunner.query(`
                CREATE TABLE "drivers" (
                    "id" SERIAL NOT NULL,
                    "first_name" character varying(100) NOT NULL,
                    "last_name" character varying(100) NOT NULL,
                    "phone" character varying(20) NOT NULL,
                    "license_number" character varying(50) NOT NULL,
                    "email" character varying(255),
                    "address" text,
                    "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'actif',
                    "created_by_id" integer NOT NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_drivers" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_drivers_license_number" UNIQUE ("license_number")
                )
            `);

            // Create indexes
            await queryRunner.query(`CREATE INDEX "IDX_drivers_license_number" ON "drivers" ("license_number")`);
            await queryRunner.query(`CREATE INDEX "IDX_drivers_status" ON "drivers" ("status")`);
            await queryRunner.query(`CREATE INDEX "IDX_drivers_created_at" ON "drivers" ("created_at")`);

            // Check if users table exists before creating foreign key
            const usersTableExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'users'
                )
            `);

            if (usersTableExists[0].exists) {
                // Create foreign key
                await queryRunner.query(`
                    ALTER TABLE "drivers" 
                    ADD CONSTRAINT "FK_drivers_created_by" 
                    FOREIGN KEY ("created_by_id") 
                    REFERENCES "users"("id") 
                    ON DELETE NO ACTION 
                    ON UPDATE NO ACTION
                `);
            }
        } else {
            // Table exists but FK might not - check and add it if users table exists
            const fkExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_drivers_created_by'
                )
            `);

            if (!fkExists[0].exists) {
                const usersTableExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = 'users'
                    )
                `);

                if (usersTableExists[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE "drivers" 
                        ADD CONSTRAINT "FK_drivers_created_by" 
                        FOREIGN KEY ("created_by_id") 
                        REFERENCES "users"("id") 
                        ON DELETE NO ACTION 
                        ON UPDATE NO ACTION
                    `);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("drivers");
        if (table) {
            // Drop foreign key
            const foreignKey = table.foreignKeys.find(fk => fk.name === "FK_drivers_created_by");
            if (foreignKey) {
                await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_created_by"`);
            }

            // Drop indexes
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_drivers_created_at"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_drivers_status"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_drivers_license_number"`);

            // Drop table
            await queryRunner.query(`DROP TABLE "drivers"`);
        }

        // Drop enums (only if no other tables use them)
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."drivers_status_enum"`);
    }
}



