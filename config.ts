import path from 'path';

export const download_dir = path.resolve('download');

export const progressInterval = 3 * 1000;

export const Min_content_length_TS = 10 * 1000,
    Min_content_length_MP4 = 10 * 1000;

export const child_modulePath = path.resolve('index.process_download.js');

export const video_type_MP4 = 'MP4',
    video_type_M3U8 = 'M3U8';
export const type_spider_download = 'spider_download';
export type T_message_spider_download = {
    type: typeof type_spider_download;
    epi: number;
    video_type: typeof video_type_MP4 | typeof video_type_M3U8;
    url_source: string;
};

export type T_prepared_videoInfo = Omit<T_message_spider_download, 'type'>;

export const type_spider_end = 'spider_end';
export type T_message_spider_end = {
    type: typeof type_spider_end;
}

export type T_message_spider = T_message_spider_download | T_message_spider_end;

export const type_process_child_end = 'process_child_end';
type T_message_process_child_kill = {
    type: typeof type_process_child_end;
}

export type T_message_process_child = T_message_process_child_kill;
