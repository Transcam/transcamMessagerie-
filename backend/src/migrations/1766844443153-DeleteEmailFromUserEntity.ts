import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteEmailFromUserEntity1766844443153 implements MigrationInterface {
    name = 'DeleteEmailFromUserEntity1766844443153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier si la contrainte existe avant de la supprimer
        const constraintExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'UQ_97672ac88f789774dd47f7c8be3'
            )
        `);
        
        if (constraintExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        }
        
        // Vérifier si la colonne existe avant de la supprimer
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
            )
        `);
        
        if (columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
    }

}
