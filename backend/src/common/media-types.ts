import * as path from 'path';

// Audio formats that can be mixed with white noise.
export const AUDIO_EXTENSIONS = ['.mp3'];

// Video formats (films / series). The video stream is copied untouched and
// only the audio track is mixed with white noise.
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.m4v', '.webm'];

// Every media file we know how to process.
export const MEDIA_EXTENSIONS = [...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS];

// Archive formats we can extract media files from.
export const ARCHIVE_EXTENSIONS = ['.zip', '.rar'];

export type MediaType = 'audio' | 'video';

const ext = (fileName: string): string => path.extname(fileName).toLowerCase();

export const isVideoFile = (fileName: string): boolean =>
  VIDEO_EXTENSIONS.includes(ext(fileName));

export const isAudioFile = (fileName: string): boolean =>
  AUDIO_EXTENSIONS.includes(ext(fileName));

export const isMediaFile = (fileName: string): boolean =>
  MEDIA_EXTENSIONS.includes(ext(fileName));

export const isArchiveFile = (fileName: string): boolean =>
  ARCHIVE_EXTENSIONS.includes(ext(fileName));

export const getMediaType = (fileName: string): MediaType =>
  isVideoFile(fileName) ? 'video' : 'audio';

// Audio codec to use when re-encoding the mixed track, chosen by output
// container so the result stays playable (WebM needs Opus, the rest take AAC).
export const audioCodecForContainer = (fileName: string): string =>
  ext(fileName) === '.webm' ? 'libopus' : 'aac';
