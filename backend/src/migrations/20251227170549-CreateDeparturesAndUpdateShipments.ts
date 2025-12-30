import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeparturesAndUpdateShipments20251227170549 implements MigrationInterface {
    name = 'CreateDeparturesAndUpdateShipments20251227170549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create departures_status enum (if not exists)
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'departures_status_enum'
            )
        `);
        
        if (!enumExists[0].exists) {
            await queryRunner.query(`CREATE TYPE "public"."departures_status_enum" AS ENUM('open', 'sealed', 'closed')`);
        }
        
        // Check if departures table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);
        
        if (!tableExists[0].exists) {
            // Create departures table
            await queryRunner.query(`CREATE TABLE "departures" (
                "id" SERIAL NOT NULL,
                "general_waybill_number" character varying(50),
                "pdf_path" character varying(500),
                "status" "public"."departures_status_enum" NOT NULL DEFAULT 'open',
                "route" character varying(255),
                "vehicle" character varying(255),
                "driver_name" character varying(255),
                "notes" text,
                "sealed_at" TIMESTAMP,
                "closed_at" TIMESTAMP,
                "created_by_id" integer NOT NULL,
                "sealed_by_id" integer,
                "closed_by_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_departures" PRIMARY KEY ("id")
            )`);

            // Create indexes for departures
            await queryRunner.query(`CREATE INDEX "IDX_departures_status" ON "departures" ("status")`);
            await queryRunner.query(`CREATE INDEX "IDX_departures_created_at" ON "departures" ("created_at")`);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_departures_general_waybill_number" ON "departures" ("general_waybill_number") WHERE "general_waybill_number" IS NOT NULL`);
        } else {
            // Check and create indexes if they don't exist
            const statusIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_status'
                )
            `);
            if (!statusIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_departures_status" ON "departures" ("status")`);
            }

            const createdAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_created_at'
                )
            `);
            if (!createdAtIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_departures_created_at" ON "departures" ("created_at")`);
            }

            const waybillIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_general_waybill_number'
                )
            `);
            if (!waybillIndexExists[0].exists) {
                await queryRunner.query(`CREATE UNIQUE INDEX "IDX_departures_general_waybill_number" ON "departures" ("general_waybill_number") WHERE "general_waybill_number" IS NOT NULL`);
            }
        }

        // Check and add foreign key constraints for departures
        const fkCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_created_by'
            )
        `);
        if (!fkCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" ADD CONSTRAINT "FK_departures_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

        const fkSealedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_sealed_by'
            )
        `);
        if (!fkSealedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" ADD CONSTRAINT "FK_departures_sealed_by" FOREIGN KEY ("sealed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

        const fkClosedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_closed_by'
            )
        `);
        if (!fkClosedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" ADD CONSTRAINT "FK_departures_closed_by" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

        // Check if shipments table exists before trying to modify it
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            // Check if departure_id column exists in shipments
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shipments' AND column_name = 'departure_id'
                )
            `);

            if (!columnExists[0].exists) {
                // Add departure_id column to shipments
                await queryRunner.query(`ALTER TABLE "shipments" ADD "departure_id" integer`);
            }

            // Check and create index for departure_id on shipments
            const departureIdIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_shipments_departure_id'
                )
            `);
            if (!departureIdIndexExists[0].exists) {
                await queryRunner.query(`CREATE INDEX "IDX_shipments_departure_id" ON "shipments" ("departure_id")`);
            }

            // Check and add foreign key constraint for shipments departure
            const fkShipmentDepartureExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_shipments_departure'
                )
            `);
            if (!fkShipmentDepartureExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_shipments_departure" FOREIGN KEY ("departure_id") REFERENCES "departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if shipments table exists before trying to modify it
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            // Drop foreign key constraint for shipments
            const fkShipmentDepartureExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_shipments_departure'
                )
            `);
            if (fkShipmentDepartureExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_shipments_departure"`);
            }

            // Drop index for shipments departure_id
            const departureIdIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_shipments_departure_id'
                )
            `);
            if (departureIdIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_shipments_departure_id"`);
            }

            // Check if departure_id column exists before dropping it
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shipments' AND column_name = 'departure_id'
                )
            `);
            if (columnExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP COLUMN "departure_id"`);
            }
        }

        // Drop foreign key constraints for departures
        const fkClosedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_closed_by'
            )
        `);
        if (fkClosedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_closed_by"`);
        }

        const fkSealedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_sealed_by'
            )
        `);
        if (fkSealedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_sealed_by"`);
        }

        const fkCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_created_by'
            )
        `);
        if (fkCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_created_by"`);
        }

        // Check if departures table exists before dropping indexes and table
        const departuresTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'departures'
            )
        `);

        if (departuresTableExists[0].exists) {
            // Drop indexes for departures
            const waybillIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_general_waybill_number'
                )
            `);
            if (waybillIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_departures_general_waybill_number"`);
            }

            const createdAtIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_created_at'
                )
            `);
            if (createdAtIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_departures_created_at"`);
            }

            const statusIndexExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_departures_status'
                )
            `);
            if (statusIndexExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_departures_status"`);
            }

            // Drop departures table
            await queryRunner.query(`DROP TABLE "departures"`);
        }

        // Drop departures_status enum if it exists
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'departures_status_enum'
            )
        `);
        if (enumExists[0].exists) {
            await queryRunner.query(`DROP TYPE "public"."departures_status_enum"`);
        }
    }
}

