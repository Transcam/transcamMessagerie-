import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AllowManualShipmentDates1770000000000 implements MigrationInterface {
    name = 'AllowManualShipmentDates1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change created_at from auto-generated to manually settable
        // This allows agencies to register shipments with historical dates
        await queryRunner.changeColumn(
            "shipments",
            "created_at",
            new TableColumn({
                name: "created_at",
                type: "timestamp",
                default: "CURRENT_TIMESTAMP",
                isNullable: false,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert - same structure but TypeORM will handle CreateDateColumn differently
        await queryRunner.changeColumn(
            "shipments",
            "created_at",
            new TableColumn({
                name: "created_at",
                type: "timestamp",
                default: "CURRENT_TIMESTAMP",
                isNullable: false,
            })
        );
    }
}
