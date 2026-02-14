import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../config/env';
import { AppError } from '../shared/errors/app-error';

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: env.r2Endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey
    }
  });

  return r2Client;
}

function toStorageSignError(message: string, error?: unknown): AppError {
  return new AppError(500, 'STORAGE_SIGN_FAILED', message, {
    cause: error instanceof Error ? error.message : String(error ?? '')
  });
}

function toStorageCheckError(message: string, error?: unknown): AppError {
  return new AppError(500, 'STORAGE_CHECK_FAILED', message, {
    cause: error instanceof Error ? error.message : String(error ?? '')
  });
}

export async function createSignedStorageObjectUrl(
  bucket: string,
  objectPath: string,
  expiresInSeconds: number = env.signedUrlTtlSeconds
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectPath
    });

    return await getSignedUrl(getR2Client(), command, {
      expiresIn: expiresInSeconds
    });
  } catch (error) {
    throw toStorageSignError('Failed to create signed storage URL', error);
  }
}

export async function createSignedStorageUploadUrl(
  bucket: string,
  objectPath: string,
  expiresInSeconds: number = env.signedUrlTtlSeconds
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectPath
    });

    return await getSignedUrl(getR2Client(), command, {
      expiresIn: expiresInSeconds
    });
  } catch (error) {
    throw toStorageSignError('Failed to create signed storage upload URL', error);
  }
}

export async function doesStorageObjectExist(
  bucket: string,
  objectPath: string
): Promise<boolean> {
  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: objectPath
      })
    );

    return true;
  } catch (error: unknown) {
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode;
    const errorName = (error as { name?: string })?.name;

    if (statusCode === 404 || errorName === 'NotFound') {
      return false;
    }

    throw toStorageCheckError('Failed to verify object in storage', error);
  }
}

export async function deleteStorageObject(bucket: string, objectPath: string): Promise<void> {
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectPath
      })
    );
  } catch (error) {
    throw new AppError(500, 'STORAGE_DELETE_FAILED', 'Failed to delete object from storage', {
      cause: error instanceof Error ? error.message : String(error ?? '')
    });
  }
}
