import node_fetch from 'node-fetch';

type T_Param_fetch = Parameters<typeof node_fetch>;
interface I_init extends NonNullable<T_Param_fetch[1]> {
    timeout?: number;
    errMsg_Timeout?: string;
}

export type T_Response = Awaited<ReturnType<typeof node_fetch>>;
export type T_returnType = {
    response: T_Response | null;
    errMsg: string;
}
export async function fetch(url: T_Param_fetch[0], init?: I_init): Promise<T_returnType> {
    const result: T_returnType = {
        response: null,
        errMsg: '',
    }

    let timer = null;
    if (init && init.timeout && init.timeout > 0) {
        const timeout = init.timeout,
            errMsg_Timeout = init.errMsg_Timeout;
        const controller = new AbortController();
        timer = setTimeout(() => {
            controller.abort();
        }, timeout);
        controller.signal.addEventListener('abort', function (e) {
            console.log(errMsg_Timeout ? errMsg_Timeout : '');
        });

        init.signal = controller.signal;
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
    } finally {
        if (timer !== null) {
            clearTimeout(timer);
        }
    }

    return result
}

export const progressInterval = 3 * 1000;