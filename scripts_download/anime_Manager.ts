import { download_dir } from '../scripts_main/config.js';
import { type T_prepared_videoInfo, video_type_MP4, type T_record } from '../scripts_process/type.message.js';
import { createWriteStream } from 'fs';
import { fetch, progressInterval } from './util.js'
import { Downloader_M3U8_ts, Downloader_MP4 } from './anime_Downloader.js';

interface I_ManagerBase<T_poolItem> {
    pool: T_poolItem[];
    poolSize: number;
    concurrentLen: number;
    pool_concurrent: Array<(() => Promise<any>) | null>;

    taskId_run_next: number;
    threshold_run: number;
    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
    threshold_retry: number;
    failCount_retry: number;
    lastFailedTaskId_retry: number;
    stopTask_retry: boolean;
    result: boolean;
}

abstract class ManagerBase<T_poolItem> implements I_ManagerBase<T_poolItem> {
    pool: T_poolItem[];
    poolSize: number;
    pool_concurrent: Array<(() => Promise<any>) | null>;
    concurrentLen: number;

    taskId_run_next: number;
    threshold_run: number;
    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
    threshold_retry: number;
    failCount_retry: number;
    lastFailedTaskId_retry: number;
    stopTask_retry: boolean;
    result: boolean;

    constructor() {
        this.pool = [];
        this.poolSize = 0;
        this.concurrentLen = 0;
        this.pool_concurrent = [];

        this.taskId_run_next = 0;
        this.threshold_run = 0;
        this.failCount_run = 0;
        this.lastFailedTaskId_run = 0;
        this.stopTask_run = false;

        this.errorSet = new Set();
        this.tempErrorSet2Arr = [...this.errorSet];
        this.taskIdIndex_retry_next = 0;
        this.retryRound = 0;
        this.threshold_retry = 0;
        this.failCount_retry = 0;
        this.lastFailedTaskId_retry = 0;
        this.stopTask_retry = false;
        this.result = false;

        this.init_config();
    }

    abstract init_config(): void;
    abstract init_pool(...args: any): Promise<void>;
    abstract task_run(taskId: number): () => Promise<any>;
    abstract ifThreshold_task_run(taskId: number): void;
    abstract run(): Promise<void>;
    abstract step_retry(): Promise<void>;
    abstract task_retry(taskId: number): () => Promise<any>;
    abstract ifThreshold_task_retry(taskId: number): void;
    abstract retry(): Promise<void>;
    // abstract releasePool: void;
    // abstract releasePool_concurrent: void;
    abstract printInfo(...args: any[]): void;

    releasePool() {
        this.pool.length = 0;
        this.poolSize = 0;
    }

    releasePool_concurrent() {
        this.pool_concurrent.fill(null);
    }
}


interface I_progress_M3U8 {
    epi: string;
    tsCount_sum: number;
    tsCount_began: number;
    tsCount_success: number;
    mute: boolean;
    tipper: NodeJS.Timeout | null;
}

class Progress_M3U8 implements I_progress_M3U8 {
    epi: string;
    tsCount_sum: number;
    tsCount_began: number;
    tsCount_success: number;
    mute: boolean;
    tipper: NodeJS.Timeout | null;


    constructor(epi: string) {
        this.epi = epi;
        this.tsCount_sum = 0;
        this.tsCount_began = 0;
        this.tsCount_success = 0;
        this.mute = true;
        this.tipper = null;
    }

    init(tsCount_sum: number) {
        this.tsCount_sum = tsCount_sum;
    }

    printProgress() {
        // const percentage_begon = Math.floor(this.tsCount_began / this.tsCount_sum * 100),
        //     percentage_success = Math.floor(this.tsCount_success / this.tsCount_began * 100);
        const percentage = Math.floor(this.tsCount_success / this.tsCount_sum * 100);
        console.log(`第${this.epi}集 -> ` + `当前进度: ${percentage}%`);
    }

    addOne(success?: boolean) {
        if (this.mute) {
            return
        }

        this.tsCount_began++;
        if (success) {
            this.tsCount_success++;
        }

        if (this.tsCount_began === this.tsCount_sum) {
            this.printProgress();
            this.destroy();
            return
        }
    }

    fire() {
        this.tipper = setInterval(() => {
            this.printProgress();
        }, progressInterval);
        this.mute = false;
    }

    destroy() {
        // @ts-ignore node类型推断好像有点问题，Stream、fetch也是
        clearInterval(this.tipper);
        this.mute = true;
    }
}

type T_poolItem_Manager_M3U8 = {
    taskId: number;
    success: boolean;
    runner: Downloader_M3U8_ts;
};

interface I_Manager_M3U8 {
    url_m3u8: string;
    epi: string;
    progress_M3U8: Progress_M3U8;
}

export class Manager_M3U8 extends ManagerBase<T_poolItem_Manager_M3U8> implements I_Manager_M3U8 {
    url_m3u8: string;
    epi: string;
    progress_M3U8: Progress_M3U8;

    constructor(url_m3u8: string, epi: string) {
        super();

        if (!this.vaildateUrl(url_m3u8)) {
            throw 'm3u8地址不是以“https://”开头';
        }

        this.url_m3u8 = url_m3u8;
        this.epi = epi;
        this.progress_M3U8 = new Progress_M3U8(epi);
    }

    vaildateUrl(url_m3u8: string) {
        // 要伪装的话任意地址都可以
        if (!url_m3u8.startsWith('https://')) {
            return false
        }

        return true
    }

    init_config(): void {
        this.concurrentLen = 8;
        this.pool_concurrent = new Array(this.concurrentLen).fill(null);

        this.threshold_run = 5;
        this.retryRound = 3;
        this.threshold_retry = 3;
    }

    async init_pool() {
        try {
            const urls_ts = await this.resolve_url_m3u8(), size = urls_ts.length;
            this.poolSize = size;
            this.pool = urls_ts.map<T_poolItem_Manager_M3U8>((url_ts, taskId) => ({
                taskId,
                success: false,
                runner: new Downloader_M3U8_ts(url_ts),
            }));
            this.progress_M3U8.init(size);
        } catch (err) {
            throw 'init_pool失败 -> ' + err;
        }
    }

    async resolve_url_m3u8() {
        return new Promise<string[]>(async (re, rj) => {
            const timeout = 10 * 1000,
                errMsg_Timeout = 'response.text()超时';
            const timer = setTimeout(() => {
                rj(errMsg_Timeout);
            }, timeout);

            try {
                const url_m3u8 = this.url_m3u8;
                const { response, errMsg } = await fetch(url_m3u8, {
                    timeout: 3 * 1000,
                    errMsg_Timeout: '获取ts视频列表超时',
                });
                if (!response) {
                    return rj(errMsg);
                }

                const fakeText = await response.text();
                const urls_ts = fakeText.split('\n').filter(s => s.startsWith('https'));
                if (!urls_ts.length) {
                    return rj('ts视频数量为0');
                }

                re((clearTimeout(timer), urls_ts));
            } catch (err) {
                rj('解析url_m3u8失败 -> ' + err);
            }
        })
    }

    task_run(taskId: number) {
        return async (): Promise<any> => {
            try {
                const poolItem = this.pool[taskId];
                await poolItem.runner.run();
                if (!poolItem.runner.result) {
                    throw `片段${taskId}下载失败`;
                }

                poolItem.success = true;
                this.progress_M3U8.addOne(true);
            } catch (err) {
                this.errorSet.add(taskId);
                this.progress_M3U8.addOne(false);
                this.ifThreshold_task_run(taskId);
            }

            if (!this.stopTask_run && this.taskId_run_next < this.poolSize) {
                return this.task_run(this.taskId_run_next++)()
            }
        }
    }

    ifThreshold_task_run(taskId: number) {
        // 如果有threshold_run个连续的taskId失败(除非恰好是最后失败的threshold_run个)，则不再继续task_run
        if (taskId > this.lastFailedTaskId_run + 1) {
            this.failCount_run = 0;
        }
        this.lastFailedTaskId_run = taskId;
        this.failCount_run++;
        if (this.failCount_run === this.threshold_run && taskId !== this.poolSize - 1) {
            this.stopTask_run = true;
        }
    }

    async run(): Promise<void> {
        // 最多并行concurrentLen个任务
        try {
            const sumTask_run = this.poolSize,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent;
            this.progress_M3U8.fire();

            while (this.taskId_run_next < sumTask_run) {
                if (this.stopTask_run) {
                    throw `连续5次ts片段下载失败，最近一次: ts片段${this.lastFailedTaskId_run}`;
                }

                let currConcurrentLen = Math.min(sumTask_run - this.taskId_run_next, concurrentLen);
                for (let i = 0; i < currConcurrentLen; i++) {
                    pool_concurrent[i] = this.task_run(this.taskId_run_next++);
                }

                await Promise.allSettled(pool_concurrent.map(task => task && task()));
                this.releasePool_concurrent();
            }

            await this.step_retry();
            await this.step_dealPool();
            this.step_setResult();
        } catch (err) {
            this.progress_M3U8.destroy();
            throw 'run失败 -> ' + err;
        }
    }

    async step_retry() {
        try {
            if (!this.errorSet.size) {
                return
            }

            this.printInfo(`有部分ts片段下载失败，准备重新下载...`);
            await this.retry();

            if (this.errorSet.size) {
                throw '重新下载失败';
            }
        } catch (err) {
            throw 'step_retry出错 -> ' + err;
        }
    }

    task_retry(taskId: number) {
        return async (): Promise<any> => {
            try {
                const poolItem = this.pool[taskId];
                await poolItem.runner.run();
                if (!poolItem.runner.result) {
                    throw `片段${taskId}重新下载失败`;
                }

                poolItem.success = true;
                this.errorSet.delete(taskId);
            } catch (err) {
                this.ifThreshold_task_retry(taskId);
            }

            if (!this.stopTask_retry && this.taskIdIndex_retry_next < this.errorSet.size) {
                return this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++])()
            }
        }
    }

    ifThreshold_task_retry(taskId: number) {
        // 在每一轮中，有任意threshold_retry个失败，则不再继续task_retry，failCount_retry在每轮开始前重置
        this.lastFailedTaskId_retry = taskId;
        this.failCount_retry++;
        if (this.failCount_retry === this.threshold_retry) {
            this.stopTask_retry = true;
        }
    }

    async retry(): Promise<void> {
        // 最多进行retryRound重试
        // 最多并行concurrentLen个任务
        try {
            const errorSet = this.errorSet,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent,
                retryRound = this.retryRound;

            for (let currRetryRound = 0; currRetryRound < retryRound && errorSet.size; currRetryRound++) {
                this.tempErrorSet2Arr = [...errorSet];
                this.taskIdIndex_retry_next = 0;
                this.failCount_retry = 0;
                const sumTask_retry = errorSet.size;
                while (this.taskIdIndex_retry_next < sumTask_retry) {
                    if (this.stopTask_retry) {
                        throw `${this.threshold_retry}次重新下载失败，最近一次: ts片段${this.lastFailedTaskId_retry}`;
                    }

                    let currConcurrentLen = Math.min(sumTask_retry - this.taskIdIndex_retry_next, concurrentLen);
                    for (let i = 0; i < currConcurrentLen; i++) {
                        pool_concurrent[i] = this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++]);
                    }

                    await Promise.allSettled(pool_concurrent.map(task => task && task()));
                    this.releasePool_concurrent();
                }
            }

            this.tempErrorSet2Arr.length = 0;
        } catch (err) {
            throw 'retry中出错 -> ' + err;
        }
    }

    async step_dealPool(): Promise<void> {
        return new Promise<void>((re, rj) => {
            try {
                const fileName = download_dir + '/' + this.epi + '.ts';
                const fileWriteStream = createWriteStream(fileName);
                for (const { success, taskId, runner } of this.pool) {
                    if (!success) {
                        throw `片段'${taskId}下载失败`;
                    }
                    fileWriteStream.write(runner.result);
                }
                fileWriteStream.end();
                fileWriteStream.on('error', (err) => {
                    rj('step_dealPool出错 -> 写入文件出错' + err);
                });
                fileWriteStream.on('finish', () => {
                    this.printInfo(`☆☆☆下载成功(第${this.epi}集)`);
                    re();
                });
            } catch (err) {
                rj('step_dealPool出错 -> ' + err);
            }
        })
            .finally(() => {
                this.releasePool();
                this.releasePool_concurrent();
            })
    }

    step_setResult(): void {
        this.result = true;
    }

    printInfo(info: string) {
        console.log(`第${this.epi}集 -> ` + info);
    }
}


interface T_poolItem_Manager_AGEAnime_base {
    taskId: number;
    epi: string;
    success: boolean;
    isManager: boolean;
    runner: Manager_M3U8 | Downloader_MP4 | null;
}
interface T_poolItem_Manager_AGEAnime_M3U8 extends T_poolItem_Manager_AGEAnime_base {
    isManager: true;
    runner: Manager_M3U8 | null;
};
interface T_poolItem_Manager_AGEAnime_MP4 extends T_poolItem_Manager_AGEAnime_base {
    isManager: false;
    runner: Downloader_MP4 | null;
};
type T_poolItem_Manager_AGEAnime = T_poolItem_Manager_AGEAnime_M3U8 | T_poolItem_Manager_AGEAnime_MP4;

interface I_Manager_AGEAnime {
    busy: boolean;
    record: T_record;
}

export class Manager_AGEAnime extends ManagerBase<T_poolItem_Manager_AGEAnime> implements I_Manager_AGEAnime {
    busy: I_Manager_AGEAnime['busy'];
    record: I_Manager_AGEAnime['record'];

    constructor() {
        super();
        this.busy = false;
        this.record = {
            count_download: 0,
            count_success: 0,
            epi_success: [],
        };
    }

    init_config(): void {
        this.concurrentLen = 2;
        this.pool_concurrent = new Array(this.concurrentLen).fill(null);

        this.threshold_run = 5;
        this.retryRound = 3;
        this.threshold_retry = 3;
    }

    async init_pool(prepared_videoInfo: T_prepared_videoInfo[]): Promise<void> {
        this.busy = true;
        try {
            const size = prepared_videoInfo.length;
            if (!size) {
                throw 'prepared_videoInfo不能为空';
            }
            this.record_make({ type: 'add', count: size });

            this.pool = prepared_videoInfo.map((videoInfo, taskId) => ({
                taskId,
                epi: videoInfo.epi,
                success: false,
                isManager: false,
                runner: null,
            })); // 为了保证this.pool[taskId]不为空
            this.poolSize = size;

            for (let taskId = 0; taskId < size; taskId++) {
                const epi = this.pool[taskId].epi;
                try {
                    // 这里怎么使用ts推断？
                    if (prepared_videoInfo[taskId].video_type === video_type_MP4) {
                        const runner = new Downloader_MP4(prepared_videoInfo[taskId].url_source, epi);
                        this.pool[taskId].runner = runner;
                    } else {
                        this.pool[taskId].isManager = true;
                        const runner = new Manager_M3U8(prepared_videoInfo[taskId].url_source, epi);
                        await runner.init_pool();
                        this.pool[taskId].runner = runner;
                    }
                } catch (err: any) {
                    const which_runner = this.pool[taskId].runner ? 'Manager_M3U8' : 'Downloader_MP4';
                    const errMsg = `下载失败(第${epi}集): 初始化失败: Error${which_runner} ${err}`;
                    this.printError(errMsg);
                }
            }
        } catch (err) {
            this.busy = false;
            throw '初始化失败 -> ' + err;
        }
    }

    before_run() {
        this.taskId_run_next = 0;
        this.failCount_run = 0;
        this.lastFailedTaskId_run = 0;
        this.stopTask_run = false;

        this.errorSet.clear();
        this.tempErrorSet2Arr = [...this.errorSet];
        this.taskIdIndex_retry_next = 0;
        this.failCount_retry = 0;
        this.lastFailedTaskId_retry = 0;
        this.stopTask_retry = false;
        this.result = false;
    }

    task_run(taskId: number) {
        return async (): Promise<any> => {
            const poolItem = this.pool[taskId];
            this.printInfo(`第${poolItem.epi}集下载开始 ————————`);
            try {
                if (poolItem.runner) {
                    await poolItem.runner.run();
                    if (!poolItem.runner.result) {
                        throw `无结果`;
                    }

                    poolItem.success = true;
                }
            } catch (err) {
                this.printError(`下载失败(第${poolItem.epi}集): ` + err);
                if (!poolItem.isManager) {
                    this.errorSet.add(taskId);
                }
                this.ifThreshold_task_run(taskId);
            }

            if (!this.stopTask_run && this.taskId_run_next < this.poolSize) {
                return this.task_run(this.taskId_run_next++)()
            }
        }
    }

    ifThreshold_task_run(taskId: number): void {
        // 如果有threshold_run个连续的taskId失败(除非恰好是最后失败的threshold_run个)，则不再继续task_run
        if (taskId > this.lastFailedTaskId_run + 1) {
            this.failCount_run = 0;
        }
        this.lastFailedTaskId_run = taskId;
        this.failCount_run++;
        if (this.failCount_run === this.threshold_run && taskId !== this.poolSize - 1) {
            this.stopTask_run = true;
        }
    }

    async run(): Promise<void> {
        // 最多并行concurrentLen个任务
        this.busy = true;
        this.before_run();
        try {
            const sumTask_run = this.poolSize,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent;

            while (this.taskId_run_next < sumTask_run) {
                if (this.stopTask_run) {
                    throw `连续${this.threshold_run}个视频下载失败，最近一次失败: 第${this.pool[this.lastFailedTaskId_run].epi}集`;
                }

                let currConcurrentLen = Math.min(sumTask_run - this.taskId_run_next, concurrentLen);
                for (let i = 0; i < currConcurrentLen; i++) {
                    pool_concurrent[i] = this.task_run(this.taskId_run_next++);
                }

                await Promise.allSettled(pool_concurrent.map(task => task && task()));
                this.releasePool_concurrent();
            }

            await this.step_retry();
        } catch (err) {
            throw this.printError('run失败 -> ' + err);
        }

        this.record_make({ type: 'success' });
        this.releasePool_concurrent();
        this.releasePool();
        this.busy = false;
    }

    async step_retry(): Promise<void> {
        try {
            if (!this.errorSet.size) {
                return
            }

            this.printInfo(`有下载失败的mp4，共计${this.errorSet.size}个，准备重新下载`);
            await this.retry();

            if (this.errorSet.size) {
                throw `仍然有下载失败的mp4，共${this.errorSet.size}个`;
            }
        } catch (err) {
            // throw 'step_retry出错 -> ' + err; // 不让失败以不影响最终统计数量
        }
    }

    task_retry(taskId: number) {
        return async (): Promise<any> => {
            try {
                interface Temp_PoolItem extends T_poolItem_Manager_AGEAnime_MP4 {
                    runner: Downloader_MP4;
                }
                const poolItem = this.pool[taskId] as Temp_PoolItem; // run中逻辑保证
                await poolItem.runner.run();
                if (!poolItem.runner.result) {
                    throw `重新下载失败`;
                }

                poolItem.success = true;
                this.errorSet.delete(taskId);
            } catch (err) {
                this.ifThreshold_task_retry(taskId);
            }

            if (!this.stopTask_retry && this.taskIdIndex_retry_next < this.errorSet.size) {
                return this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++])()
            }
        }
    }

    ifThreshold_task_retry(taskId: number): void {
        // 在每一轮中，有任意threshold_retry个失败，则不再继续task_retry，failCount_retry在每轮开始前重置
        this.lastFailedTaskId_retry = taskId;
        this.failCount_retry++;
        if (this.failCount_retry === this.threshold_retry) {
            this.stopTask_retry = true;
        }
    }

    async retry(): Promise<void> {
        // 最多进行retryRound重试
        // 最多并行concurrentLen个任务
        try {
            const errorSet = this.errorSet,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent,
                retryRound = this.retryRound;

            for (let currRetryRound = 0; currRetryRound < retryRound && errorSet.size; currRetryRound++) {
                this.tempErrorSet2Arr = [...errorSet];
                this.taskIdIndex_retry_next = 0;
                this.failCount_retry = 0;
                const sumTask_retry = errorSet.size;
                while (this.taskIdIndex_retry_next < sumTask_retry) {
                    if (this.stopTask_retry) {
                        throw `${this.threshold_retry}次重新下载失败，最近一次: 第${this.pool[this.lastFailedTaskId_retry].epi}集`;
                    }

                    let currConcurrentLen = Math.min(sumTask_retry - this.taskIdIndex_retry_next, concurrentLen);
                    for (let i = 0; i < currConcurrentLen; i++) {
                        pool_concurrent[i] = this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++]);
                    }

                    await Promise.allSettled(pool_concurrent.map(task => task && task()));
                    this.releasePool_concurrent();
                }
            }

            this.tempErrorSet2Arr.length = 0;
        } catch (err) {
            throw 'retry中出错 -> ' + err;
        }
    }

    record_make(action: { type: 'add', count: number } | { type: 'success' }) {
        switch (action.type) {
            case 'add':
                this.record.count_download += action.count;
                break;
            case 'success':
                this.pool.forEach(({ success, epi }) => {
                    if (success) {
                        this.record.count_success++;
                        this.record.epi_success.push(+epi);
                    }
                });
                break;
        }
    }

    printError(errMsg: string) {
        console.log('\nError ———— ' + errMsg);
    }

    printInfo(info: string) {
        console.log('\n' + info + '\n');
    }
}
