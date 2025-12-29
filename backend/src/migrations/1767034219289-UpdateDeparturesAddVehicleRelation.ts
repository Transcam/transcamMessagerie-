import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeparturesAddVehicleRelation1767034219289 implements MigrationInterface {
    name = 'UpdateDeparturesAddVehicleRelation1767034219289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add vehicle_id column
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD COLUMN "vehicle_id" integer
        `);

        // Create index on vehicle_id
        await queryRunner.query(`CREATE INDEX "IDX_departures_vehicle_id" ON "departures" ("vehicle_id")`);

        // Create foreign key
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_vehicle" 
            FOREIGN KEY ("vehicle_id") 
            REFERENCES "vehicles"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Note: We keep the old "vehicle" column for now to preserve data
        // It can be removed in a future migration after data migration
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_vehicle"`);

        // Drop index
        await queryRunner.query(`DROP INDEX "public"."IDX_departures_vehicle_id"`);

        // Drop column
        await queryRunner.query(`ALTER TABLE "departures" DROP COLUMN "vehicle_id"`);
    }
}

