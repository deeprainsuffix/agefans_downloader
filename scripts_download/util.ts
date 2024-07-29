import node_fetch from 'node-fetch';

export function formatEpi(epi: number, sum: number) {
    if (!(epi >= 1 && epi <= sum)) {
        throw `epi不属于[1, ${sum}], epi: ${epi}`;
    }

    let result = String(epi);
    let l = Math.floor(Math.log10(epi)) + 1;
    const r = Math.floor(Math.log10(sum)) + 1;
    while (l < r) {
        result = '0' + result;
        l++;
    }

    return result
}

type T_Param_fetch = Parameters<typeof node_fetch>;
export type T_Response = Awaited<ReturnType<typeof node_fetch>>;
export type T_returnType = {
    response: T_Response | null;
    errMsg: string;
}
export async function fetch(url: T_Param_fetch[0], init?: T_Param_fetch[1]): Promise<T_returnType> {
    const result: T_returnType = {
        response: null,
        errMsg: '',
    }
    try {
        const response = await node_fetch(url, init);
        if (response.status === 200) {
            result.response = response;
        } else {
            result.errMsg = `请求失败: ${response.status} ${response.statusText}`;
        }
    } catch (err) {
        result.errMsg = '' + err;
    }

    return result
}