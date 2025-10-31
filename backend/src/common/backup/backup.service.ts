/**
 * Backup and Recovery Service
 * Handles automated backups, restoration, and data migration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  type: 'full' | 'incremental';
  status: 'success' | 'failed';
  path: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private backupHistory: BackupMetadata[] = [];

  constructor(private readonly config: ConfigService) {
    this.backupDir = this.config.get<string>('BACKUP_DIR') || './backups';
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(type: 'full' | 'incremental' = 'full'): Promise<BackupMetadata> {
    const timestamp = new Date();
    const backupId = `backup_${timestamp.getTime()}`;
    const fileName = `${backupId}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    try {
      this.logger.log(`Creating ${type} backup: ${backupId}`);

      const databaseUrl = this.config.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract database connection details from DATABASE_URL
      const dbUrl = new URL(databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';

      // Create PostgreSQL backup using pg_dump
      const dumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F c -b -v -f "${filePath}" ${dbName}`;

      await execAsync(dumpCommand);

      const stats = fs.statSync(filePath);
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        size: stats.size,
        type,
        status: 'success',
        path: filePath,
      };

      this.backupHistory.push(metadata);
      this.logger.log(
        `Backup created successfully: ${backupId} (${this.formatBytes(stats.size)})`,
      );

      // Cleanup old backups
      await this.cleanupOldBackups();

      return metadata;
    } catch (error) {
      this.logger.error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        size: 0,
        type,
        status: 'failed',
        path: filePath,
      };

      this.backupHistory.push(metadata);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backupHistory.find((b) => b.id === backupId);
    if (!backup || backup.status !== 'success') {
      throw new Error(`Backup not found or invalid: ${backupId}`);
    }

    if (!fs.existsSync(backup.path)) {
      throw new Error(`Backup file not found: ${backup.path}`);
    }

    try {
      this.logger.log(`Restoring backup: ${backupId}`);

      const databaseUrl = this.config.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbUrl = new URL(databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';

      // Restore using pg_restore
      const restoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${backup.path}"`;

      await execAsync(restoreCommand);

      this.logger.log(`Backup restored successfully: ${backupId}`);
    } catch (error) {
      this.logger.error(
        `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * List all backups
   */
  listBackups(): BackupMetadata[] {
    return this.backupHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get backup details
   */
  getBackup(backupId: string): BackupMetadata | undefined {
    return this.backupHistory.find((b) => b.id === backupId);
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backup = this.backupHistory.find((b) => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    try {
      if (fs.existsSync(backup.path)) {
        fs.unlinkSync(backup.path);
      }

      this.backupHistory = this.backupHistory.filter((b) => b.id !== backupId);
      this.logger.log(`Backup deleted: ${backupId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Cleanup old backups (keep last N backups)
   */
  private async cleanupOldBackups(): Promise<void> {
    const maxBackups = this.config.get<number>('MAX_BACKUPS') || 10;
    
    if (this.backupHistory.length <= maxBackups) {
      return;
    }

    const backupsToDelete = this.backupHistory
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, this.backupHistory.length - maxBackups);

    for (const backup of backupsToDelete) {
      try {
        await this.deleteBackup(backup.id);
        this.logger.log(`Cleaned up old backup: ${backup.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to cleanup backup ${backup.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Schedule automated backups
   */
  scheduleAutomatedBackups(): void {
    const interval = this.config.get<number>('BACKUP_INTERVAL_HOURS') || 24;
    const intervalMs = interval * 60 * 60 * 1000;

    this.logger.log(`Scheduling automated backups every ${interval} hours`);

    setInterval(async () => {
      try {
        await this.createBackup('full');
      } catch (error) {
        this.logger.error(
          `Automated backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }, intervalMs);
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Export data to JSON format
   */
  async exportData(tables: string[]): Promise<Record<string, unknown[]>> {
    // This is a placeholder implementation
    // In production, use Prisma to export data from specified tables
    this.logger.log(`Exporting data from tables: ${tables.join(', ')}`);
    return {};
  }

  /**
   * Import data from JSON format
   */
  async importData(data: Record<string, unknown[]>): Promise<void> {
    // This is a placeholder implementation
    // In production, use Prisma to import data into specified tables
    this.logger.log(`Importing data into ${Object.keys(data).length} tables`);
  }
}
