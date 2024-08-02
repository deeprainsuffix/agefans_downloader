export interface I_Meta {
    detailUrl: string; // 资源详情页地址，例如: https://www.agedm.org/detail/20110006
    range: 'all' | Array<number | [number, number]>; // 'all' 或者 [1, [3, 5], 7]
}

export const meta: I_Meta = {
    detailUrl: 'https://www.agedm.org/detail/20110006',
    range: 'all', // 下载全部
}