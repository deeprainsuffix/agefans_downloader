export const video_type_MP4 = 'MP4',
    video_type_M3U8 = 'M3U8';

export const type_spider_download = 'spider_download';
export type T_message_spider_download = {
    type: typeof type_spider_download;
    epi: string;
    video_type: typeof video_type_MP4 | typeof video_type_M3U8;
    url_source: string;
};

export type T_prepared_videoInfo = Omit<T_message_spider_download, 'type'>;
export type T_prepared_videoInfo_without_epi = Omit<T_prepared_videoInfo, 'epi'>;

export const type_spider_end = 'spider_end';
export type T_message_spider_end = {
    type: typeof type_spider_end;
}

export type T_message_spider = T_message_spider_download | T_message_spider_end;

export type T_record = {
    count_download: number;
    count_success: number;
    epi_success: number[];
}

export const type_process_download_end = 'download_end';
type T_message_process_child_kill = {
    type: typeof type_process_download_end;
    record: T_record;
}

export type T_message_process_child = T_message_process_child_kill;

