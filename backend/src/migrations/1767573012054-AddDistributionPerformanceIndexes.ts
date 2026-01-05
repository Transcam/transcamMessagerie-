import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDistributionPerformanceIndexes1767573012054 implements MigrationInterface {
    name = 'AddDistributionPerformanceIndexes1767573012054'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if departures table exists
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        if (departuresTableExists[0].exists) {
            // Check if index on sealed_at exists
            const sealedAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'departures' 
                    AND indexname = 'IDX_departures_sealed_at'
                )
            `);

            if (!sealedAtIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_departures_sealed_at" ON "departures" ("sealed_at")`);
            }

            // Check if composite index on status and sealed_at exists
            const statusSealedAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'departures' 
                    AND indexname = 'IDX_departures_status_sealed_at'
                )
            `);

            if (!statusSealedAtIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_departures_status_sealed_at" ON "departures" ("status", "sealed_at")`);
            }
        }

        // Check if shipments table exists
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            // Check if index on is_cancelled exists
            const isCancelledIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_is_cancelled'
                )
            `);

            if (!isCancelledIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_shipments_is_cancelled" ON "shipments" ("is_cancelled")`);
            }

            // Check if composite index on departure_id, is_cancelled, nature exists
            const departureCancelledNatureIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_departure_id_is_cancelled_nature'
                )
            `);

            if (!departureCancelledNatureIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_shipments_departure_id_is_cancelled_nature" ON "shipments" ("departure_id", "is_cancelled", "nature")`);
            }

            // Check if composite index on departure_id, is_cancelled, nature, weight exists
            const departureCancelledNatureWeightIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_departure_id_is_cancelled_nature_weight'
                )
            `);

            if (!departureCancelledNatureWeightIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_shipments_departure_id_is_cancelled_nature_weight" ON "shipments" ("departure_id", "is_cancelled", "nature", "weight")`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes from departures table
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        if (departuresTableExists[0].exists) {
            const sealedAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'departures' 
                    AND indexname = 'IDX_departures_sealed_at'
                )
            `);

            if (sealedAtIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_departures_sealed_at"`);
            }

            const statusSealedAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'departures' 
                    AND indexname = 'IDX_departures_status_sealed_at'
                )
            `);

            if (statusSealedAtIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_departures_status_sealed_at"`);
            }
        }

        // Drop indexes from shipments table
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            const isCancelledIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_is_cancelled'
                )
            `);

            if (isCancelledIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shipments_is_cancelled"`);
            }

            const departureCancelledNatureIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_departure_id_is_cancelled_nature'
                )
            `);

            if (departureCancelledNatureIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shipments_departure_id_is_cancelled_nature"`);
            }

            const departureCancelledNatureWeightIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = 'shipments' 
                    AND indexname = 'IDX_shipments_departure_id_is_cancelled_nature_weight'
                )
            `);

            if (departureCancelledNatureWeightIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shipments_departure_id_is_cancelled_nature_weight"`);
            }
        }
    }
}


