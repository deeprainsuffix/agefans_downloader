export interface I_Meta {
    detailUrl: string;
    range: 'all' | Array<number | [number, number]>;
    // M3U82MP4: boolean; // todo
}

export const meta: I_Meta = {
    // detailUrl: 'https://www.agedm.org/detail/20060044',
    detailUrl: 'https://www.agedm.org/detail/20180161', // 资源详情页地址，例如: https://www.agedm.org/detail/20110006
    range: 'all', // 下载全部
    // range: [2, 3, [5, 8], 10], // 下载部分
    // range: [1, [5, 7]], // 少点测试
    // range: [2, 5, 10],
    // range: [2], // 这是个m3u8
    // range: [1], // 这是个mp4
}