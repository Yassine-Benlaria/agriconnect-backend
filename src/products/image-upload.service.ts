import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { diskStorage, Options as MulterOptions } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

/** §11 — allowed MIME types */
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** §11 — max 5 MB */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/** §11 — max 5 images per product */
export const MAX_IMAGES_PER_PRODUCT = 5;

export const UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');
export const UPLOAD_URL_PREFIX = '/uploads/products';

/**
 * Handles disk storage configuration and file lifecycle for product images.
 * OnModuleInit ensures the upload directory exists at startup.
 */
@Injectable()
export class ImageUploadService implements OnModuleInit {
  onModuleInit() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  /** Multer options passed to FilesInterceptor in the controller. */
  get multerOptions(): MulterOptions {
    return {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (
        _req,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WEBP images are allowed',
            ),
            false,
          );
        }
      },
    };
  }

  /** Builds the public URL path for a stored file. */
  buildUrl(filename: string): string {
    return `${UPLOAD_URL_PREFIX}/${filename}`;
  }

  /** Deletes a file from disk by its stored URL path. Safe — swallows ENOENT. */
  deleteFile(url: string): void {
    try {
      const filename = url.split('/').pop()!;
      unlinkSync(join(UPLOAD_DIR, filename));
    } catch {
      // File already gone — not an error worth propagating
    }
  }

  /** Deletes multiple files — used for cleanup on partial upload failure. */
  deleteFiles(files: Express.Multer.File[]): void {
    files.forEach((f) => this.deleteFile(this.buildUrl(f.filename)));
  }
}
