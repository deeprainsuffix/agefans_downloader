import { download_dir } from './config.js'
import { createWriteStream } from 'fs';
import { formatEpi } from './utls.js'

type T_result = boolean | ArrayBuffer | null;

interface I_ComponentBase {
    url_source: string;
    epi: string;
    result: T_result;
}


abstract class ComponentBase implements I_ComponentBase {
    url_source: string;
    epi: string;
    result: T_result;

    constructor(url_source: string, epi: string) {
        this.url_source = url_source;
        this.epi = epi;
        this.result = null;
    }

    abstract isManager(): boolean;
    abstract run(): Promise<void>;
    abstract dealPool(): Promise<any>;
    abstract setResult_manager(originRes: T_result): void;
    abstract retry(): Promise<void>;
}





abstract class DownloadBase extends ComponentBase {
    constructor(url_source: string, epi: string) {
        super(url_source, epi);
        if (!this.vaildateUrl(url_source)) {
            throw '下载地址不是以http或https开头';
        }
    }

    isManager(): boolean {
        return false
    }

    abstract vaildateUrl(url: string): boolean;

    log(msg: string, ...args: any[]) {
        console.log(msg, ...args);
    }
}

export class DownloadM3U8 extends DownloadBase {
    constructor(url_source: string, epi: string) {
        super(url_source, epi);
    }

    async run(): Promise<any> {
        const response = await fetch(this.url_source, {
            headers: {
                'Content-Type': 'application/octet-stream',
            }
        });

        const originRes = await response.arrayBuffer();
        if (originRes.byteLength <= 0) {
            throw '片段' + this.epi + '无内容'
        }

        this.setResult_manager(originRes);
    }

    fixedBuffer(arrayBuffer: ArrayBuffer) {
        const len = arrayBuffer.byteLength,
            startIndex = 16 * 16;
        if (len < startIndex) {
            return null
        }

        return Buffer.from(arrayBuffer, startIndex);
    }

    async dealPool(): Promise<any> {
        this.result = null;
    }

    setResult_manager(originRes: ArrayBuffer) {
        this.result = this.fixedBuffer(originRes);
    }

    async retry(): Promise<void> {

    }



    vaildateUrl(url: string) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            return false
        }

        return true
    }
}



















interface I_poolItem<DownloadClass> {
    begin: boolean; // 没用 todo
    success: boolean;
    runner: DownloadClass;
}

interface I_ManagerBase<DownloadClass> {
    pool: I_poolItem<DownloadClass>[];
    poolSize: number;
    concurrentLen: number;
    pool_concurrent: (Promise<void> | null)[];

    taskId_run_next: number;
    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
    failCount_retry: number;
    lastFailedTaskId_retry: number;
    stopTask_retry: boolean;
    result_manager: boolean;
}

abstract class ManagerBase<DownloadClass> implements I_ManagerBase<DownloadClass> {
    pool: I_poolItem<DownloadClass>[];
    poolSize: number;
    pool_concurrent: (Promise<void> | null)[];
    concurrentLen: number;
    taskId_run_next: number;

    failCount_run: number;
    lastFailedTaskId_run: number;
    stopTask_run: boolean;

    errorSet: Set<number>;
    tempErrorSet2Arr: number[];
    taskIdIndex_retry_next: number;
    retryRound: number;
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

        this.failCount_run = 0;
        this.lastFailedTaskId_run = 0;
        this.stopTask_run = false;

        this.errorSet = new Set();
        this.tempErrorSet2Arr = [...this.errorSet];
        this.taskIdIndex_retry_next = 0;
        this.retryRound = 0;
        this.failCount_retry = 0;
        this.lastFailedTaskId_retry = 0;
        this.stopTask_retry = false;
        this.result_manager = false;
    }

    abstract logInfo(...args: any[]): void;
    abstract logError(...args: any[]): string;
    abstract task_run(taskId: number): Promise<any>;
    abstract run(): Promise<void>;
    abstract task_retry(taskId: number): Promise<any>;
    abstract retry(): Promise<void>;
    abstract dealPool(): Promise<any>;
    abstract final(): void;
}

interface I_Manager_M3U8 {
    url_m3u8: string;
    epi: string;
    urls_ts: string[];
}

export class Manager_M3U8 extends ManagerBase<DownloadM3U8> implements I_Manager_M3U8 {
    url_m3u8: string;
    epi: string;
    urls_ts: string[]; // 没用 todo

    static DownloadClass = DownloadM3U8;

    constructor(url_m3u8: string, epi: string) {
        super();
        this.url_m3u8 = url_m3u8;
        this.epi = epi;
        this.urls_ts = [];
    }

    async init() {
        // 把contructor中逻辑的各个初始化逻辑加进来，可以考虑原型模式
        try {
            const urls_ts = await this.resolve_url_m3u8();
            this.urls_ts = urls_ts;
            this.pool = urls_ts.map((url_ts, epi) => ({
                begin: false,
                success: false,
                runner: new Manager_M3U8.DownloadClass(url_ts, formatEpi(epi + 1, urls_ts.length)),
            }));
            this.poolSize = urls_ts.length;
            this.concurrentLen = 8;
            this.pool_concurrent = new Array(this.concurrentLen).fill(null);

            this.retryRound = 3;
        } catch (err) {
            throw this.logError('init失败', err);
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
            const msg = '解析url_m3u8失败' + err;
            throw msg
        }
    }

    async task_run(taskId: number): Promise<void> {
        try {
            // taskIndex比对应epi小1，且格式也不对应，在log时不统一 todo
            this.logInfo('开始下载片段', taskId);
            const poolItem = this.pool[taskId];
            poolItem.begin = true;
            await poolItem.runner.run();

            if (!poolItem.runner.result) {
                throw '片段' + taskId + 'result为null';
            }

            poolItem.success = true;

            if (!this.stopTask_run && this.taskId_run_next < this.poolSize) {
                return this.task_run(this.taskId_run_next++)
            }
        } catch (err) {
            this.errorSet.add(taskId);
            this.logError('task_run error', err);

            // 判断是否5个连续的taskId失败
            if (taskId > this.lastFailedTaskId_run + 1) {
                this.failCount_run = 0;
            }
            this.lastFailedTaskId_run = taskId;
            this.failCount_run++;
            if (this.failCount_run === 5 && taskId !== this.poolSize - 1) {
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

            if (this.errorSet.size) {
                this.logInfo('有下载失败的片段，共%s个，准备重新下载', this.errorSet.size);
                await this.retry();
            }

            await this.dealPool();

            if (!this.errorSet.size) {
                this.setResult_manager(true);
            }
        } catch (err) {
            throw this.logError('run失败', err);
        }
    }

    async task_retry(taskId: number): Promise<void> {
        try {
            this.logInfo('重新下载片段%s', taskId);
            const poolItem = this.pool[taskId];
            await poolItem.runner.run();
            if (!poolItem.runner.result) {
                throw '片段' + taskId + '重新下载失败';
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
            if (this.failCount_retry === 3) {
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
                // @ts-ignore
                this.currRetryRound = currRetryRound; // todo
                this.tempErrorSet2Arr = [...errorSet];
                this.taskIdIndex_retry_next = 0;
                this.failCount_retry = 0;
                this.lastFailedTaskId_retry = 0;
                const sumTask_retry = errorSet.size;
                this.logInfo('第%s轮重新下载开始，共有%s个', currRetryRound + 1, sumTask_retry);
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

            if (this.errorSet.size) {
                throw this.logError(`仍然后有下载失败的片段，共${this.errorSet.size}个`);
            }

            this.logInfo('所有下载失败的片段重新下载成功');
        } catch (err) {
            throw this.logError('retry中出错', err);
        }
    }

    async dealPool(): Promise<void> {
        return new Promise<void>((re, rj) => {
            try {
                this.logInfo('开始dealPool');
                const fileName = download_dir + '/' + this.epi + '.ts';
                const fileWriteStream = createWriteStream(fileName);
                for (const { runner } of this.pool) {
                    const buffer = runner.result; // 最好在写之前做一下检查 todo
                    fileWriteStream.write(buffer);
                }
                fileWriteStream.end();
                fileWriteStream.on('error', (err) => {
                    rj('写入流错误: ' + err);
                });
                fileWriteStream.on('finish', () => {
                    this.logInfo('下载完成', '这是同步在写'); // todo
                    re();
                });
            } catch (err) {
                rj('dealPool出错: ' + err);
            }
        })
            .finally(() => {
                this.final();
            })
    }

    setResult_manager(result: boolean) {
        this.result_manager = result;
    }

    releasePool() {
        this.logInfo('释放pool');
        this.pool.length = 0;
    }

    releasePool_concurrent() {
        this.logInfo('释放pool_concurrent');
        this.pool_concurrent.fill(null);
    }

    final(): void {
        this.releasePool();
        this.releasePool_concurrent();
    }

    // unknown ?? todo 在catch中
    // logErrorNoConsole
    logError(...args: any[]) {
        const msg = args.join(' -> ');
        console.log('Error: 第%s集(Manager_M3U8) -> ', this.epi, msg);
        return msg
    }

    logInfo(msg: string, ...args: any[]) {
        console.log('第%s集 -> ' + msg, this.epi, ...args);
    }
}










