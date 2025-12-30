import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeparturesAddDriverRelation1767036000001 implements MigrationInterface {
    name = 'UpdateDeparturesAddDriverRelation1767036000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if departures and drivers tables exist before modifying
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        const driversTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'drivers'
            )
        `);

        if (departuresTableExists[0].exists && driversTableExists[0].exists) {
            // Check if column exists before adding
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'departures' AND column_name = 'driver_id'
                )
            `);

            if (!columnExists[0].exists) {
                // Add driver_id column
                await queryRunner.query(`
                    ALTER TABLE "departures" 
                    ADD COLUMN "driver_id" integer
                `);
            }

            // Check if index exists before creating
            const indexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'departures' AND indexname = 'IDX_departures_driver_id'
                )
            `);

            if (!indexExists[0].exists) {
                // Create index on driver_id
                await queryRunner.query(`CREATE INDEX "IDX_departures_driver_id" ON "departures" ("driver_id")`);
            }

            // Check if foreign key exists before creating
            const fkExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_departures_driver'
                )
            `);

            if (!fkExists[0].exists) {
                // Create foreign key
                await queryRunner.query(`
                    ALTER TABLE "departures" 
                    ADD CONSTRAINT "FK_departures_driver" 
                    FOREIGN KEY ("driver_id") 
                    REFERENCES "drivers"("id") 
                    ON DELETE SET NULL 
                    ON UPDATE NO ACTION
                `);
            }
        }

        // Note: We keep the old "driver_name" column for now to preserve data
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
                    WHERE constraint_name = 'FK_departures_driver'
                )
            `);

            if (fkExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_driver"`);
            }

            // Check if index exists before dropping
            const indexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'departures' AND indexname = 'IDX_departures_driver_id'
                )
            `);

            if (indexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_departures_driver_id"`);
            }

            // Check if column exists before dropping
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'departures' AND column_name = 'driver_id'
                )
            `);

            if (columnExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "departures" DROP COLUMN "driver_id"`);
            }
        }
    }
}

