import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeWeightOptionalInShipments1767828790717 implements MigrationInterface {
    name = 'MakeWeightOptionalInShipments1767828790717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make weight column nullable
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "weight" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: set default value for NULL weights and make column NOT NULL
        await queryRunner.query(`UPDATE "shipments" SET "weight" = 0 WHERE "weight" IS NULL`);
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "weight" SET NOT NULL`);
    }
}
