import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehiclesTable1767034219288 implements MigrationInterface {
    name = 'CreateVehiclesTable1767034219288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create vehicle_type enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."vehicles_type_enum" AS ENUM(
                    'bus',
                    'coaster',
                    'minibus'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create vehicle_status enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."vehicles_status_enum" AS ENUM(
                    'actif',
                    'inactif'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create vehicles table if it doesn't exist
        const vehiclesTableExists = await queryRunner.hasTable("vehicles");
        if (!vehiclesTableExists) {
            await queryRunner.query(`
                CREATE TABLE "vehicles" (
                    "id" SERIAL NOT NULL,
                    "registration_number" character varying(50) NOT NULL,
                    "name" character varying(255) NOT NULL,
                    "type" "public"."vehicles_type_enum" NOT NULL,
                    "status" "public"."vehicles_status_enum" NOT NULL DEFAULT 'actif',
                    "created_by_id" integer NOT NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_vehicles_registration_number" UNIQUE ("registration_number")
                )
            `);

            // Create indexes
            await queryRunner.query(`CREATE INDEX "IDX_vehicles_registration_number" ON "vehicles" ("registration_number")`);
            await queryRunner.query(`CREATE INDEX "IDX_vehicles_status" ON "vehicles" ("status")`);
            await queryRunner.query(`CREATE INDEX "IDX_vehicles_type" ON "vehicles" ("type")`);
            await queryRunner.query(`CREATE INDEX "IDX_vehicles_created_at" ON "vehicles" ("created_at")`);

            // Create foreign key
            await queryRunner.query(`
                ALTER TABLE "vehicles" 
                ADD CONSTRAINT "FK_vehicles_created_by" 
                FOREIGN KEY ("created_by_id") 
                REFERENCES "users"("id") 
                ON DELETE NO ACTION 
                ON UPDATE NO ACTION
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("vehicles");
        if (table) {
            // Drop foreign key
            const foreignKey = table.foreignKeys.find(fk => fk.name === "FK_vehicles_created_by");
            if (foreignKey) {
                await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_created_by"`);
            }

            // Drop indexes
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_vehicles_created_at"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_vehicles_type"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_vehicles_status"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_vehicles_registration_number"`);

            // Drop table
            await queryRunner.query(`DROP TABLE "vehicles"`);
        }

        // Drop enums (only if no other tables use them)
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicles_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicles_type_enum"`);
    }
}

