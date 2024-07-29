export interface I_Meta {
    detailUrl: string;
    range: 'all' | Array<number | [number, number]>;
}

export const meta: I_Meta = {
    detailUrl: 'https://www.agedm.org/detail/20180161', // 资源详情页地址，例如: https://www.agedm.org/detail/20110006
    // range: 'all', // 下载全部
    range: [3, [5, 8], 10], // 下载部分
}