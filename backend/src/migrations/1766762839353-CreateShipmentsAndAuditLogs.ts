import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateShipmentsAndAuditLogs1766762839353 implements MigrationInterface {
    name = 'CreateShipmentsAndAuditLogs1766762839353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if enum exists before creating
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'shipments_status_enum'
            )
        `);
        
        if (!enumExists[0].exists) {
            await queryRunner.query(`CREATE TYPE "public"."shipments_status_enum" AS ENUM('pending', 'confirmed', 'assigned', 'cancelled')`);
        }

        // Check if shipments table exists before creating
        const shipmentsTableExists = await queryRunner.hasTable("shipments");
        if (!shipmentsTableExists) {
            await queryRunner.query(`CREATE TABLE "shipments" ("id" SERIAL NOT NULL, "waybill_number" character varying(50) NOT NULL, "sender_name" character varying(255) NOT NULL, "sender_phone" character varying(50) NOT NULL, "receiver_name" character varying(255) NOT NULL, "receiver_phone" character varying(50) NOT NULL, "description" text, "weight" numeric(10,2) NOT NULL, "declared_value" numeric(10,2) NOT NULL DEFAULT '0', "price" numeric(10,2) NOT NULL, "route" character varying(255) NOT NULL, "status" "public"."shipments_status_enum" NOT NULL DEFAULT 'pending', "is_confirmed" boolean NOT NULL DEFAULT false, "confirmed_at" TIMESTAMP, "confirmed_by_id" integer, "is_cancelled" boolean NOT NULL DEFAULT false, "cancelled_at" TIMESTAMP, "cancelled_by_id" integer, "cancellation_reason" text, "created_by_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7e4395763330c058c1a742a9129" UNIQUE ("waybill_number"), CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_a7017e8920bde2638310718ad8" ON "shipments" ("created_at") `);
            await queryRunner.query(`CREATE INDEX "IDX_6a19baf6dd62cac42fbb40a518" ON "shipments" ("status") `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7e4395763330c058c1a742a912" ON "shipments" ("waybill_number") `);
        }

        // Check if audit_logs table exists before creating
        const auditLogsTableExists = await queryRunner.hasTable("audit_logs");
        if (!auditLogsTableExists) {
            await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" integer NOT NULL, "action" character varying(50) NOT NULL, "old_values" jsonb, "new_values" jsonb, "user_id" integer NOT NULL, "reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `);
            await queryRunner.query(`CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON "audit_logs" ("entity_type", "entity_id") `);
        }

        // Check if users table exists before adding foreign keys
        const usersTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            )
        `);

        if (usersTableExists[0].exists) {
            // Add foreign keys to shipments if they don't exist
            const shipmentsTableExists = await queryRunner.hasTable("shipments");
            if (shipmentsTableExists) {
                const fkConfirmedByExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_0877554bcfd1ef48795349161b1'
                    )
                `);
                if (!fkConfirmedByExists[0].exists) {
                    await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_0877554bcfd1ef48795349161b1" FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                }

                const fkCancelledByExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_004e18bd44bf6a8d105fd6a091e'
                    )
                `);
                if (!fkCancelledByExists[0].exists) {
                    await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                }

                const fkCreatedByExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_d8796c5355aa510504b1ae7e40b'
                    )
                `);
                if (!fkCreatedByExists[0].exists) {
                    await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                }
            }

            // Add foreign key to audit_logs if it doesn't exist
            const auditLogsTableExists = await queryRunner.hasTable("audit_logs");
            if (auditLogsTableExists) {
                const fkAuditLogsUserExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_bd2726fd31b35443f2245b93ba0'
                    )
                `);
                if (!fkAuditLogsUserExists[0].exists) {
                    await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys if they exist
        const auditLogsTableExists = await queryRunner.hasTable("audit_logs");
        if (auditLogsTableExists) {
            const fkExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_bd2726fd31b35443f2245b93ba0'
                )
            `);
            if (fkExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
            }
        }

        const shipmentsTableExists = await queryRunner.hasTable("shipments");
        if (shipmentsTableExists) {
            const fkCreatedByExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_d8796c5355aa510504b1ae7e40b'
                )
            `);
            if (fkCreatedByExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b"`);
            }

            const fkCancelledByExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_004e18bd44bf6a8d105fd6a091e'
                )
            `);
            if (fkCancelledByExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e"`);
            }

            const fkConfirmedByExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_0877554bcfd1ef48795349161b1'
                )
            `);
            if (fkConfirmedByExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_0877554bcfd1ef48795349161b1"`);
            }

            // Drop indexes if they exist
            const index1Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_7e4395763330c058c1a742a912'
                )
            `);
            if (index1Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_7e4395763330c058c1a742a912"`);
            }

            const index2Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_6a19baf6dd62cac42fbb40a518'
                )
            `);
            if (index2Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_6a19baf6dd62cac42fbb40a518"`);
            }

            const index3Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_a7017e8920bde2638310718ad8'
                )
            `);
            if (index3Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_a7017e8920bde2638310718ad8"`);
            }

            await queryRunner.query(`DROP TABLE "shipments"`);
        }

        if (auditLogsTableExists) {
            // Drop indexes if they exist
            const index4Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_7421efc125d95e413657efa3c6'
                )
            `);
            if (index4Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_7421efc125d95e413657efa3c6"`);
            }

            const index5Exists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'IDX_2cd10fda8276bb995288acfbfb'
                )
            `);
            if (index5Exists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`);
            }

            await queryRunner.query(`DROP TABLE "audit_logs"`);
        }

        // Drop enum if it exists
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'shipments_status_enum'
            )
        `);
        if (enumExists[0].exists) {
            await queryRunner.query(`DROP TYPE "public"."shipments_status_enum"`);
        }
    }

}
