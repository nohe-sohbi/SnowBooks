export default interface MP3File {
    name: string;
    size: number;
    duration?: number;
    blob: Blob;
}

