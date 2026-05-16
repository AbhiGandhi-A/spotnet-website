import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  format: string;
  audioCodec?: string;
}

function runFfmpeg(command: any): Promise<void> {
  return new Promise((resolve, reject) => {
    command.on('end', resolve);
    command.on('error', reject);
  });
}

export async function probeVideo(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error: Error | null, metadata: any) => {
      if (error) return reject(error);
      const videoStream = metadata.streams?.find((stream: any) => stream.codec_type === 'video');
      const audioStream = metadata.streams?.find((stream: any) => stream.codec_type === 'audio');
      const format = metadata.format;
      if (!videoStream || !format) {
        return reject(new Error('Unable to read video metadata'));
      }
      resolve({
        duration: Number(format.duration || 0),
        width: Number(videoStream.width || 0),
        height: Number(videoStream.height || 0),
        codec: String(videoStream.codec_name || 'unknown'),
        bitrate: Number(format.bit_rate || 0),
        format: String(format.format_name || 'unknown'),
        audioCodec: audioStream?.codec_name,
      });
    });
  });
}

export async function extractVideoMetadata(inputPath: string) {
  return probeVideo(inputPath);
}

export async function extractDuration(inputPath: string) {
  const metadata = await probeVideo(inputPath);
  return metadata.duration;
}

export async function validateMediaFile(inputPath: string) {
  const metadata = await probeVideo(inputPath);
  if (metadata.duration <= 0) {
    throw new Error('Video file contains invalid duration');
  }
  if (metadata.width === 0 || metadata.height === 0) {
    throw new Error('Video file contains invalid resolution');
  }
  return metadata;
}

export async function validateMediaMimeType(mimetype: string, size: number, allowedTypes: string[], maxSizeBytes: number) {
  if (!allowedTypes.includes(mimetype)) {
    throw new Error('Invalid media MIME type');
  }
  if (size > maxSizeBytes) {
    throw new Error('Media file exceeds maximum allowed size');
  }
}

export async function generateThumbnail(inputPath: string, outputPath: string, seekSeconds = 5) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [seekSeconds],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', reject);
  });
}

export async function generatePreviewClip(inputPath: string, outputPath: string, startSeconds = 0, durationSeconds = 15) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  return runFfmpeg(
    ffmpeg(inputPath)
      .setStartTime(startSeconds)
      .duration(durationSeconds)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-crf 23'])
  );
}

export async function transcodeToHls(inputPath: string, outputDirectory: string) {
  await fs.mkdir(outputDirectory, { recursive: true });
  const playlistPath = path.join(outputDirectory, 'master.m3u8');
  return runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions([
        '-profile:v main',
        '-vf scale=w=1280:h=720:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
        '-hls_time 6',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputDirectory, 'segment_%03d.ts'),
      ])
      .output(playlistPath)
  );
}

export async function optimizeVideo(inputPath: string, outputPath: string) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  return runFfmpeg(
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset slow', '-crf 22'])
      .save(outputPath)
  );
}
