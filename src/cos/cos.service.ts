// src/cos/cos.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as COS from 'cos-nodejs-sdk-v5';

@Injectable()
export class CosService {
  private cos: any;

  constructor(private configService: ConfigService) {
    this.cos = new COS({
      SecretId: this.configService.get<string>('COS_SECRET_ID'),
      SecretKey: this.configService.get<string>('COS_SECRET_KEY'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileKey = `avatars/${Date.now()}-${file.originalname}`;

    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.configService.get<string>('COS_BUCKET'),
          Region: this.configService.get<string>('COS_REGION'),
          Key: fileKey,
          Body: file.buffer,
          ContentLength: file.size,
        },
        (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            // 返回文件访问URL
            resolve(
              `https://${this.configService.get<string>('COS_BUCKET')}.cos.${this.configService.get<string>('COS_REGION')}.myqcloud.com/${fileKey}`,
            );
          }
        },
      );
    });
  }
}
