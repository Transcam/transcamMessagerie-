import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeToShipments1767047483698 implements MigrationInterface {
    name = 'AddTypeToShipments1767047483698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create shipment_type enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."shipments_type_enum" AS ENUM(
                    'express',
                    'standard'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Check if column exists
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'type'
            )
        `);

        if (!columnExists[0].exists) {
            // Add column with default value
            await queryRunner.query(`
                ALTER TABLE "shipments" 
                ADD COLUMN "type" "public"."shipments_type_enum" NOT NULL DEFAULT 'standard'
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'type'
            )
        `);

        if (columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "shipments" DROP COLUMN "type"`);
        }

        // Check if enum exists before dropping
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'shipments_type_enum'
            )
        `);

        if (enumExists[0].exists) {
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."shipments_type_enum"`);
        }
    }
}
