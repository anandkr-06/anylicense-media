import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
// import * as ClamScan from 'clamscan';
import NodeClam from 'clamscan';

@Injectable()
export class VirusScanService implements OnModuleInit {
  private clamscan: any;
  private readonly logger = new Logger(VirusScanService.name);

  async onModuleInit() {
    try {
      this.clamscan = await new NodeClam().init({
        removeInfected: false,
        quarantineInfected: false,
        debugMode: false,

        clamdscan: {
          socket: false,
          host: 'clamav',   // 🔥 important
          port: 3310,
          timeout: 30000,
        },

        clamscan: {
          path: null,
        },
      });

      this.logger.log('ClamAV initialized successfully');
    } catch (err) {
      this.logger.error('ClamAV initialization failed', err);
      throw err;
    }
  }

  async scanFile(filePath: string): Promise<boolean> {
    if (!this.clamscan) {
      throw new Error('ClamAV not initialized');
    }

    try {
      this.logger.log(`Scanning file: ${filePath}`);

      const { isInfected, viruses } = await this.clamscan.scanFile(filePath);

      if (isInfected) {
        this.logger.warn(`Virus detected in file: ${filePath} → ${viruses}`);
      }

      return isInfected;
    } catch (err) {
      this.logger.error(`Scan failed for file: ${filePath}`, err);
      throw err;
    }
  }
}