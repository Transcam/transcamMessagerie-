import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuditLogsUserFK1767826163647 implements MigrationInterface {
    name = 'FixAuditLogsUserFK1767826163647'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix audit_logs.user_id FK
        const fkAuditLogsExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_bd2726fd31b35443f2245b93ba0'
            )
        `);
        if (fkAuditLogsExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        }
        // Make column nullable
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" 
            ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert audit_logs.user_id
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        // Update NULL values to a default user (1) if they exist - adjust as needed
        await queryRunner.query(`UPDATE "audit_logs" SET "user_id" = 1 WHERE "user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" 
            ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
