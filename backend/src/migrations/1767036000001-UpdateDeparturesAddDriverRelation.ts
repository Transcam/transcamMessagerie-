import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeparturesAddDriverRelation1767036000001 implements MigrationInterface {
    name = 'UpdateDeparturesAddDriverRelation1767036000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add driver_id column
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD COLUMN "driver_id" integer
        `);

        // Create index on driver_id
        await queryRunner.query(`CREATE INDEX "IDX_departures_driver_id" ON "departures" ("driver_id")`);

        // Create foreign key
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_driver" 
            FOREIGN KEY ("driver_id") 
            REFERENCES "drivers"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Note: We keep the old "driver_name" column for now to preserve data
        // It can be removed in a future migration after data migration
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_driver"`);

        // Drop index
        await queryRunner.query(`DROP INDEX "public"."IDX_departures_driver_id"`);

        // Drop column
        await queryRunner.query(`ALTER TABLE "departures" DROP COLUMN "driver_id"`);
    }
}

