import { download_dir, Type_M3U8, Type_MP4 } from './config.js'
import { createWriteStream } from 'fs';
import { formatEpi } from './util.js'
import { type DownloaderBase, Downloader_M3U8, Downloader_MP4 } from './anime_Downloader.js';

type T_poolItem_Manager = {
    success: boolean; // 没用，实际上，Manager控制逻辑保证了处理所有success为false的情况 todo
    isManager: true;
    runner: ManagerBase; // 具体运行的下载器实例或Manger实例
};
type T_poolItem_Downloader = {
    success: boolean;
    isManager: false;
    runner: DownloaderBase;
};

type T_poolItem = T_poolItem_Manager | T_poolItem_Downloader;

interface I_ManagerBase {
    pool: T_poolItem[];
    poolSize: number;
    concurrentLen: number;
    pool_concurrent: (Promise<void> | null)[];

    taskId_run_next: number;
    threshold_run: number;
    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    errorSet_manager: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
    threshold_retry: number;
    failCount_retry: number;
    lastFailedTaskId_retry: number;
    stopTask_retry: boolean;
    result_manager: boolean;
}

abstract class ManagerBase implements I_ManagerBase {
    pool: T_poolItem[];
    poolSize: number;
    pool_concurrent: (Promise<void> | null)[];
    concurrentLen: number;

    taskId_run_next: number;
    threshold_run: number;
    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    errorSet_manager: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
    threshold_retry: number;
    failCount_retry: number;
    lastFailedTaskId_retry: number;
    stopTask_retry: boolean;
    result_manager: boolean;

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
        this.errorSet_manager = new Set();
        this.tempErrorSet2Arr = [...this.errorSet];
        this.taskIdIndex_retry_next = 0;
        this.retryRound = 0;
        this.threshold_retry = 0;
        this.failCount_retry = 0;
        this.lastFailedTaskId_retry = 0;
        this.stopTask_retry = false;
        this.result_manager = false;

        this.init_config();
    }

    abstract vaildateUrl(url: string): boolean;
    abstract init_config(): void;
    abstract init_pool(): Promise<void>;
    // abstract task_run(taskId: number): Promise<any>;
    // abstract run(): Promise<void>;
    // abstract task_retry(taskId: number): Promise<any>;
    abstract step_retry(): Promise<void>;
    // abstract retry(): Promise<void>;
    abstract step_dealPool(): Promise<void>;
    abstract step_setResult_manager(): void;
    // abstract releasePool: void;
    // abstract releasePool_concurrent: void;
    abstract logError(...args: any[]): string;
    abstract logInfo(...args: any[]): void;

    async task_run(taskId: number): Promise<void> {
        const poolItem = this.pool[taskId];
        try {
            await poolItem.runner.run();
            if (poolItem.isManager) { // 判断逻辑 -1 isManager能去掉吗？
                if (!poolItem.runner.result_manager) {
                    throw '管理器' + taskId + '的result为false';
                }
            } else {
                if (!poolItem.runner.result) {
                    throw '片段' + taskId + '的result为null';
                }
            }

            poolItem.success = true;

            if (!this.stopTask_run && this.taskId_run_next < this.poolSize) {
                return this.task_run(this.taskId_run_next++)
            }
        } catch (err) {
            if (poolItem.isManager) { // 判断逻辑 -2 // errorSet_manager好像没用 todo
                this.errorSet_manager.add(taskId);
            } else {
                this.errorSet.add(taskId);
            }
            this.logError('task_run error', err);

            // 判断是否5个连续的taskId失败
            if (taskId > this.lastFailedTaskId_run + 1) {
                this.failCount_run = 0;
            }
            this.lastFailedTaskId_run = taskId;
            this.failCount_run++;
            if (this.failCount_run === this.threshold_run && taskId !== this.poolSize - 1) {
                this.stopTask_run = true;
            }
        }
    }

    async run(): Promise<void> {
        // run中最多并行concurrentLen个任务
        // 如果有5个连续的taskId失败(除非这5个恰好是最后5个)，则不再继续task_run
        try {
            const sumTask_run = this.poolSize,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent;

            while (this.taskId_run_next < sumTask_run) {
                if (this.stopTask_run) {
                    throw '连续5次下载失败，最近一次: ts片段' + this.lastFailedTaskId_run;
                }

                let currConcurrentLen = Math.min(sumTask_run - this.taskId_run_next, concurrentLen);
                for (let i = 0; i < currConcurrentLen; i++) {
                    pool_concurrent[i] = this.task_run(this.taskId_run_next++);
                }

                await Promise.allSettled(pool_concurrent);
                this.releasePool_concurrent();
            }

            await this.step_retry();
            await this.step_dealPool();
            this.step_setResult_manager();
        } catch (err) {
            throw this.logError('run失败', err);
        }
    }

    async task_retry(taskId: number): Promise<void> {
        try {
            const poolItem = this.pool[taskId] as T_poolItem_Downloader; // run中逻辑保证
            await poolItem.runner.run();
            if (!poolItem.runner.result) {
                throw '片段' + taskId + '的result为null';
            }

            poolItem.success = true;
            this.errorSet.delete(taskId);

            if (!this.stopTask_retry && this.taskIdIndex_retry_next < this.errorSet.size) {
                return this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++])
            }
        } catch (err) {
            this.logError('task_retry error', err);

            // 判断是否3个taskId失败
            this.lastFailedTaskId_retry = taskId;
            this.failCount_retry++;
            if (this.failCount_retry === this.threshold_retry) {
                this.stopTask_retry = true;
            }
        }
    }

    async retry(): Promise<void> {
        // 和run一样，最多并行concurrentLen个任务
        // 不一样的是：retry中最多进行retryRound轮，若每一轮中有任意3个失败，则不再继续task_retry
        try {
            const errorSet = this.errorSet,
                concurrentLen = this.concurrentLen,
                pool_concurrent = this.pool_concurrent,
                retryRound = this.retryRound;

            for (let currRetryRound = 0; currRetryRound < retryRound && errorSet.size; currRetryRound++) {
                this.tempErrorSet2Arr = [...errorSet];
                this.taskIdIndex_retry_next = 0;
                this.failCount_retry = 0;
                this.lastFailedTaskId_retry = 0;
                const sumTask_retry = errorSet.size;
                this.logInfo('第%s轮重新下载开始，共计%s个', currRetryRound + 1, sumTask_retry);
                while (this.taskIdIndex_retry_next < sumTask_retry) {
                    if (this.stopTask_retry) {
                        throw '连续3次重新下载失败，最近一次: ts片段' + this.lastFailedTaskId_retry;
                    }

                    let currConcurrentLen = Math.min(sumTask_retry - this.taskIdIndex_retry_next, concurrentLen);
                    for (let i = 0; i < currConcurrentLen; i++) {
                        pool_concurrent[i] = this.task_retry(this.tempErrorSet2Arr[this.taskIdIndex_retry_next++]);
                    }

                    await Promise.allSettled(pool_concurrent);
                    this.releasePool_concurrent();
                }
            }

            this.tempErrorSet2Arr.length = 0;
        } catch (err) {
            throw this.logError('retry中出错', err);
        }
    }

    releasePool() {
        this.pool.length = 0;
    }

    releasePool_concurrent() {
        this.pool_concurrent.fill(null);
    }
}


interface I_Manager_M3U8 {
    url_m3u8: string;
    epi: string;
}

export class Manager_M3U8 extends ManagerBase implements I_Manager_M3U8 {
    pool: T_poolItem_Downloader[];

    url_m3u8: string;
    epi: string;

    constructor(url_m3u8: string, epi: string) {
        super();

        if (!this.vaildateUrl(url_m3u8)) {
            throw 'm3u8地址不正确';
        }
        this.pool = [];

        this.url_m3u8 = url_m3u8;
        this.epi = epi;
    }

    vaildateUrl(url_m3u8: string) {
        // 检测url_m3u8是否正确 todo
        if (!(url_m3u8.startsWith('http') || url_m3u8.startsWith('https'))) {
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
        // 把contructor中逻辑的各个初始化逻辑加进来，可以考虑原型模式 todo
        try {
            const urls_ts = await this.resolve_url_m3u8();
            this.pool = urls_ts.map<T_poolItem_Downloader>((url_ts, taskId) => ({
                success: false,
                isManager: false,
                runner: new Downloader_M3U8(url_ts, taskId),
            }));
            this.poolSize = urls_ts.length;

        } catch (err) {
            throw this.logError('init_pool失败', err);
        }
    }

    async resolve_url_m3u8() {
        try {
            const url_m3u8 = this.url_m3u8;
            const res = await fetch(url_m3u8);
            const fakeText = await res.text();
            const urls_ts = fakeText.split('\n').filter(s => s.startsWith('https'));
            if (!urls_ts.length) {
                throw 'ts视频数量为0';
            }

            return urls_ts
        } catch (err) {
            throw this.logError('解析url_m3u8失败', err);
        }
    }

    async step_retry() {
        try {
            if (!this.errorSet.size) {
                return
            }

            this.logInfo('有下载失败的ts片段，共计%s个，准备重新下载', this.errorSet.size); // 视频或片段，这个要定义一下 todo
            await this.retry();

            if (this.errorSet.size) {
                throw this.logError(`仍然有下载失败的片段，共${this.errorSet.size}个`);
            } else {
                this.logInfo('所有下载失败的片段重新下载成功');
            }
        } catch (err) {
            throw this.logError('step_retry出错', err);
        }
    }

    async step_dealPool(): Promise<void> {
        return new Promise<void>((re, rj) => {
            try {
                const fileName = download_dir + '/' + this.epi + '.ts';
                const fileWriteStream = createWriteStream(fileName);
                for (const { runner } of this.pool) {
                    const buffer = runner.result;
                    if (!buffer) {
                        rj('step_dealPool出错，片段' + runner.taskId + 'buffer为空');
                    }
                    fileWriteStream.write(buffer);
                }
                fileWriteStream.end();
                fileWriteStream.on('error', (err) => {
                    rj('step_dealPool出错，写入流错误: ' + err);
                });
                fileWriteStream.on('finish', () => {
                    this.logInfo('下载完成', '这是同步在写'); // todo
                    re();
                });
            } catch (err) {
                rj('step_dealPool出错: ' + err);
            }
        })
            .finally(() => {
                this.releasePool();
                this.releasePool_concurrent();
            })
    }

    step_setResult_manager(): void {
        if (!this.errorSet.size) {
            this.result_manager = true;
        }
    }

    // logErrorNoConsole todo
    logError(...args: any[]) {
        const msg = args.join(' -> ');
        console.log('Error: 第%s集(Manager_M3U8) -> ', this.epi, msg);
        return msg
    }

    logInfo(msg: string, ...args: any[]) {
        console.log('第%s集 -> ' + msg, this.epi, ...args);
    }
}


type T_urls_source = {
    type: typeof Type_MP4 | typeof Type_M3U8;
    url_source: string;
};

interface I_Manager_AGEAnime {
    urls_source: T_urls_source[];
}

export class Manager_AGEAnime extends ManagerBase implements I_Manager_AGEAnime {
    urls_source: T_urls_source[];
    constructor(urls_source: T_urls_source[]) {
        super();

        if (urls_source.length < 0) {
            throw '总集数不能小于0';
        }

        this.urls_source = urls_source;
    }

    vaildateUrl(url_prefix: string) {
        // 不需要 todo
        return true
    }

    init_config(): void {
        this.concurrentLen = 2;
        this.pool_concurrent = new Array(this.concurrentLen).fill(null);

        this.threshold_run = 5;
        this.retryRound = 3;
        this.threshold_retry = 3;
    }

    async init_pool(): Promise<void> {
        const urls_source = this.urls_source;
        try {
            for (let taskId = 0; taskId < urls_source.length; taskId++) {
                if (urls_source[taskId].type === Type_MP4) {
                    this.pool[taskId] = {
                        success: false,
                        isManager: false,
                        runner: new Downloader_MP4(urls_source[taskId].url_source, taskId),
                    };
                } else {
                    const runner = new Manager_M3U8(urls_source[taskId].url_source, formatEpi(taskId + 1, urls_source.length));
                    this.pool[taskId] = {
                        success: false,
                        isManager: true,
                        runner,
                    };
                    await runner.init_pool();
                }
            }
            this.poolSize = urls_source.length;
        } catch (err) {
            throw this.logError('init_pool失败', err);
        }
    }

    async step_retry(): Promise<void> {
        try {
            if (!this.errorSet.size) {
                return
            }

            this.logInfo('有下载失败的mp4，共计%s个，准备重新下载', this.errorSet.size); // 视频或片段，这个要定义一下 todo
            await this.retry();

            if (this.errorSet.size) {
                throw this.logError(`仍然有下载失败的mp4，共${this.errorSet.size}个`);
            } else {
                this.logInfo('所有下载失败的mp4视频重新下载成功');
            }
        } catch (err) {
            throw this.logError('step_retry出错', err);
        }
    }

    async step_dealPool(): Promise<void> {
        // nothing // todo
    }

    step_setResult_manager(): void {
        // nothing // todo
    }

    logError(...args: any[]): string {
        // todo
        const msg = args.join(' -> ');
        console.log('Error(Manager_AGEAnime): ', msg);
        return msg
    }

    logInfo(msg: string, ...args: any[]) {
        // todo
        console.log(msg, ...args);
    }
}