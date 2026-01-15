import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsSchema1705333200000 implements MigrationInterface {
  name = 'CreateJobsSchema1705333200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "job_status_enum" AS ENUM('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')`);

    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "file_name" varchar(255) NOT NULL,
        "file_size" bigint NOT NULL,
        "file_type" varchar(16) NOT NULL,
        "status" "job_status_enum" NOT NULL DEFAULT 'PENDING',
        "progress" smallint NOT NULL DEFAULT 0,
        "priority" smallint NOT NULL DEFAULT 0,
        "callback_url" text,
        "locked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_jobs_status_fileType_createdAt" ON "jobs" ("status", "file_type", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_createdAt" ON "jobs" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE "job_results" (
        "job_id" uuid PRIMARY KEY,
        "processed_at" timestamptz,
        "output_format" varchar(32),
        "duration" integer,
        "metadata" jsonb,
        CONSTRAINT "FK_job_results_job_id" FOREIGN KEY ("job_id") REFERENCES "jobs" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "job_results"');
    await queryRunner.query('DROP INDEX "IDX_jobs_createdAt"');
    await queryRunner.query('DROP INDEX "IDX_jobs_status_fileType_createdAt"');
    await queryRunner.query('DROP TABLE "jobs"');
    await queryRunner.query('DROP TYPE "job_status_enum"');
  }
}
