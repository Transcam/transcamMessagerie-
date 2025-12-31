import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNatureToShipments1735689600000 implements MigrationInterface {
    name = 'AddNatureToShipments1735689600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier si l'enum existe déjà
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'shipments_nature_enum'
            )
        `);
        
        if (!enumExists[0].exists) {
            // Créer l'enum type
            await queryRunner.query(`
                CREATE TYPE "public"."shipments_nature_enum" AS ENUM('colis', 'courrier')
            `);
        }
        
        // Check if shipments table exists before modifying it
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            // Vérifier si la colonne existe déjà
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'nature'
                )
            `);

            if (!columnExists[0].exists) {
                // Ajouter la colonne avec valeur par défaut
                await queryRunner.query(`
                    ALTER TABLE "shipments" 
                    ADD COLUMN "nature" "public"."shipments_nature_enum" NOT NULL DEFAULT 'colis'
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if shipments table exists before modifying it
        const shipmentsTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'shipments'
            )
        `);

        if (shipmentsTableExists[0].exists) {
            // Vérifier si la colonne existe avant de la supprimer
            const columnExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'nature'
                )
            `);

            if (columnExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "shipments" DROP COLUMN "nature"`);
            }
        }

        // Vérifier si l'enum existe avant de le supprimer
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'shipments_nature_enum'
            )
        `);

        if (enumExists[0].exists) {
            await queryRunner.query(`DROP TYPE "public"."shipments_nature_enum"`);
        }
    }
}

