import {
  isArchiveFile,
  isAudioFile,
  isMediaFile,
  isVideoFile,
  getMediaType,
  audioCodecForContainer,
} from './media-types';

describe('media-types', () => {
  it('classifies audio, video and archives by extension, case-insensitively', () => {
    expect(isAudioFile('chapter.mp3')).toBe(true);
    expect(isAudioFile('Chapter.MP3')).toBe(true);
    expect(isVideoFile('film.mkv')).toBe(true);
    expect(isVideoFile('film.WebM')).toBe(true);
    expect(isArchiveFile('book.zip')).toBe(true);
    expect(isArchiveFile('book.RAR')).toBe(true);

    expect(isMediaFile('film.mp4')).toBe(true);
    expect(isMediaFile('notes.txt')).toBe(false);
    expect(isMediaFile('book.zip')).toBe(false);
  });

  it('maps file names to their media type', () => {
    expect(getMediaType('chapter.mp3')).toBe('audio');
    expect(getMediaType('episode.mp4')).toBe('video');
  });

  it('picks an audio codec compatible with the output container', () => {
    expect(audioCodecForContainer('film.webm')).toBe('libopus');
    expect(audioCodecForContainer('film.mp4')).toBe('aac');
    expect(audioCodecForContainer('film.mkv')).toBe('aac');
  });
});
