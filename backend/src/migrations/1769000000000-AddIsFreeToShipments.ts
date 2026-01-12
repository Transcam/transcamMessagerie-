import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFreeToShipments1769000000000 implements MigrationInterface {
    name = 'AddIsFreeToShipments1769000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding it
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'shipments' 
                AND column_name = 'is_free'
            )
        `);

        if (!columnExists[0].exists) {
            // Ajouter la colonne is_free avec valeur par défaut false
            await queryRunner.query(`
                ALTER TABLE "shipments" 
                ADD COLUMN "is_free" boolean NOT NULL DEFAULT false
            `);
        }
        
        // Optionnel : Mettre à jour les envois existants avec price = 0 pour les marquer comme gratuits
        await queryRunner.query(`
            UPDATE "shipments" 
            SET "is_free" = true 
            WHERE "price" = 0 OR "price" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la colonne is_free
        await queryRunner.query(`
            ALTER TABLE "shipments" 
            DROP COLUMN "is_free"
        `);
    }
}
