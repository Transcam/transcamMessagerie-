import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeparturesAddDriverRelation1767036000001 implements MigrationInterface {
    name = 'UpdateDeparturesAddDriverRelation1767036000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        const table = await queryRunner.getTable("departures");
        const foreignKeyExists = table?.foreignKeys.some(fk => fk.name === "FK_departures_driver");

        if (!foreignKeyExists) {
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

        // Note: We keep the old "driver_name" column for now to preserve data
        // It can be removed in a future migration after data migration
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key if exists
        const table = await queryRunner.getTable("departures");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.name === "FK_departures_driver");
            if (foreignKey) {
                await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_driver"`);
            }
        }

        // Drop index if exists
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_departures_driver_id"`);

        // Drop column if exists
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

