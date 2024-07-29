import path from 'path';

export const download_dir = path.resolve('download'); // 这个download要从外边提取 todo

export const Type_MP4 = 'mp4',
    Type_M3U8 = 'm3u8';

export const Min_content_length_TS = 10 * 1000,
    Min_content_length_MP4 = 10 * 1000;

export const progressInterval = 3 * 1000;