import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeparturesAddVehicleRelation1767034219289 implements MigrationInterface {
    name = 'UpdateDeparturesAddVehicleRelation1767034219289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if departures and vehicles tables exist before modifying
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        const vehiclesTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'vehicles'
            )
        `);

        if (departuresTableExists[0].exists && vehiclesTableExists[0].exists) {
            // Check if vehicle_id column exists before adding
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'departures' AND column_name = 'vehicle_id'
                )
            `);

            if (!columnExists[0].exists) {
                // Add vehicle_id column
                await queryRunner.query(`
                    ALTER TABLE "departures" 
                    ADD COLUMN "vehicle_id" integer
                `);
            }

            // Check if index exists before creating
            const indexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'departures' AND indexname = 'IDX_departures_vehicle_id'
                )
            `);

            if (!indexExists[0].exists) {
                // Create index on vehicle_id
                await queryRunner.query(`CREATE INDEX "IDX_departures_vehicle_id" ON "departures" ("vehicle_id")`);
            }

            // Check if foreign key exists before creating
            const fkExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_departures_vehicle'
                )
            `);

            if (!fkExists[0].exists) {
                // Create foreign key
                await queryRunner.query(`
                    ALTER TABLE "departures" 
                    ADD CONSTRAINT "FK_departures_vehicle" 
                    FOREIGN KEY ("vehicle_id") 
                    REFERENCES "vehicles"("id") 
                    ON DELETE SET NULL 
                    ON UPDATE NO ACTION
                `);
            }
        }

        // Note: We keep the old "vehicle" column for now to preserve data
        // It can be removed in a future migration after data migration
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if departures table exists
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        if (departuresTableExists[0].exists) {
            // Check if foreign key exists before dropping
            const fkExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_departures_vehicle'
                )
            `);

            if (fkExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_vehicle"`);
            }

            // Check if index exists before dropping
            const indexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'departures' AND indexname = 'IDX_departures_vehicle_id'
                )
            `);

            if (indexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_departures_vehicle_id"`);
            }

            // Check if column exists before dropping
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'departures' AND column_name = 'vehicle_id'
                )
            `);

            if (columnExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "departures" DROP COLUMN "vehicle_id"`);
            }
        }
    }
}



