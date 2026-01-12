import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserForeignKeysForDeletion1771000000000 implements MigrationInterface {
    name = 'FixUserForeignKeysForDeletion1771000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix departures.created_by_id FK
        const fkDeparturesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_created_by'
            )
        `);
        if (fkDeparturesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_created_by"`);
        }
        await queryRunner.query(`ALTER TABLE "departures" ALTER COLUMN "created_by_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix departures.sealed_by_id FK
        const fkDeparturesSealedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_sealed_by'
            )
        `);
        if (fkDeparturesSealedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_sealed_by"`);
        }
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_sealed_by" 
            FOREIGN KEY ("sealed_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix departures.closed_by_id FK
        const fkDeparturesClosedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_closed_by'
            )
        `);
        if (fkDeparturesClosedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_closed_by"`);
        }
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_closed_by" 
            FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix expenses.created_by_id FK
        const fkExpensesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_expenses_created_by'
            )
        `);
        if (fkExpensesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_created_by"`);
        }
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "created_by_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "expenses" 
            ADD CONSTRAINT "FK_expenses_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix drivers.created_by_id FK
        const fkDriversCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_drivers_created_by'
            )
        `);
        if (fkDriversCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_created_by"`);
        }
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "created_by_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "drivers" 
            ADD CONSTRAINT "FK_drivers_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix vehicles.created_by_id FK
        const fkVehiclesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_vehicles_created_by'
            )
        `);
        if (fkVehiclesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_created_by"`);
        }
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_by_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "vehicles" 
            ADD CONSTRAINT "FK_vehicles_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert departures.created_by_id
        const fkDeparturesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_created_by'
            )
        `);
        if (fkDeparturesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_created_by"`);
        }
        await queryRunner.query(`UPDATE "departures" SET "created_by_id" = 1 WHERE "created_by_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "departures" ALTER COLUMN "created_by_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert departures.sealed_by_id
        const fkDeparturesSealedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_sealed_by'
            )
        `);
        if (fkDeparturesSealedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_sealed_by"`);
        }
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_sealed_by" 
            FOREIGN KEY ("sealed_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert departures.closed_by_id
        const fkDeparturesClosedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_departures_closed_by'
            )
        `);
        if (fkDeparturesClosedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "departures" DROP CONSTRAINT "FK_departures_closed_by"`);
        }
        await queryRunner.query(`
            ALTER TABLE "departures" 
            ADD CONSTRAINT "FK_departures_closed_by" 
            FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert expenses.created_by_id
        const fkExpensesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_expenses_created_by'
            )
        `);
        if (fkExpensesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_created_by"`);
        }
        await queryRunner.query(`UPDATE "expenses" SET "created_by_id" = 1 WHERE "created_by_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "created_by_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "expenses" 
            ADD CONSTRAINT "FK_expenses_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert drivers.created_by_id
        const fkDriversCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_drivers_created_by'
            )
        `);
        if (fkDriversCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_created_by"`);
        }
        await queryRunner.query(`UPDATE "drivers" SET "created_by_id" = 1 WHERE "created_by_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "created_by_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "drivers" 
            ADD CONSTRAINT "FK_drivers_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert vehicles.created_by_id
        const fkVehiclesCreatedByExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_vehicles_created_by'
            )
        `);
        if (fkVehiclesCreatedByExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_created_by"`);
        }
        await queryRunner.query(`UPDATE "vehicles" SET "created_by_id" = 1 WHERE "created_by_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_by_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "vehicles" 
            ADD CONSTRAINT "FK_vehicles_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
