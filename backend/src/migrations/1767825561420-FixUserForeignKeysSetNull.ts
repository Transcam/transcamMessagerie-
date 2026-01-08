import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserForeignKeysSetNull1767825561420 implements MigrationInterface {
    name = 'FixUserForeignKeysSetNull1767825561420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix shipments.confirmed_by_id FK
        const fkConfirmedExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_0877554bcfd1ef48795349161b1'
            )
        `);
        if (fkConfirmedExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_0877554bcfd1ef48795349161b1"`);
        }
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_0877554bcfd1ef48795349161b1" 
            FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix shipments.cancelled_by_id FK
        const fkCancelledExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_004e18bd44bf6a8d105fd6a091e'
            )
        `);
        if (fkCancelledExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e"`);
        }
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e" 
            FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Fix shipments.created_by_id FK - make nullable + SET NULL
        const fkCreatedExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_d8796c5355aa510504b1ae7e40b'
            )
        `);
        if (fkCreatedExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b"`);
        }
        // Make column nullable
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "created_by_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert created_by_id
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b"`);
        // Update NULL values to a default user (1) if they exist - adjust as needed
        await queryRunner.query(`UPDATE "shipments" SET "created_by_id" = 1 WHERE "created_by_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "created_by_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_d8796c5355aa510504b1ae7e40b" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert cancelled_by_id
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e"`);
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_004e18bd44bf6a8d105fd6a091e" 
            FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Revert confirmed_by_id
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_0877554bcfd1ef48795349161b1"`);
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            ADD CONSTRAINT "FK_0877554bcfd1ef48795349161b1" 
            FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
