import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSettingsTable1767551439035 implements MigrationInterface {
    name = 'CreateSettingsTable1767551439035'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if settings table exists
        const tableExists = await queryRunner.hasTable("settings");
        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "settings",
                    columns: [
                        {
                            name: "id",
                            type: "varchar",
                            length: "50",
                            isPrimary: true,
                            default: "'company'",
                        },
                        {
                            name: "company_logo_url",
                            type: "varchar",
                            length: "500",
                            isNullable: true,
                        },
                        {
                            name: "updated_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                            onUpdate: "CURRENT_TIMESTAMP",
                        },
                    ],
                }),
                true
            );

            // Insert default settings (only if not exists)
            const settingsExists = await queryRunner.query(`
                SELECT EXISTS (SELECT 1 FROM settings WHERE id = 'company')
            `);
            if (!settingsExists[0].exists) {
                await queryRunner.query(`
                    INSERT INTO settings (id, company_logo_url, updated_at)
                    VALUES ('company', '/assets/images/Logo-Transcam.png', CURRENT_TIMESTAMP)
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("settings");
        if (tableExists) {
            await queryRunner.dropTable("settings");
        }
    }
}

