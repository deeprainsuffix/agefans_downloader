import { createWriteStream } from 'fs';
import { pipeline } from 'node:stream/promises';
import progressStream from 'progress-stream';
import { download_dir } from './config.js';
import fetch, { type Response as NodeFetchResponse } from 'node-fetch'; // 没看懂原生fetch是怎么将response推断为ReadableStream<Uint8Array>的 todo

type T_result = boolean | ArrayBuffer | null;

interface I_DownloaderBase {
    url_source: string;
    taskId: number;
    result: T_result;
}

export abstract class DownloaderBase implements I_DownloaderBase {
    url_source: string;
    taskId: number;
    result: boolean | ArrayBuffer | null;

    constructor(url_source: string, taskId: number) {
        if (!this.vaildateUrl(url_source)) {
            throw '下载地址不是以http或https开头';
        }

        this.url_source = url_source;
        this.taskId = taskId;

        this.result = null;
    }

    abstract vaildateUrl(url: string): boolean;
    abstract run(): Promise<void>;
}

export class Downloader_M3U8 extends DownloaderBase {
    result: ArrayBuffer | null;

    constructor(url_source: string, taskId: number) {
        super(url_source, taskId);

        this.result = null;
    }

    vaildateUrl(url: string) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            return false
        }

        return true
    }

    async run(): Promise<any> {
        try {
            const response = await fetch(this.url_source, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                }
            });

            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength <= 0) {
                throw '片段' + this.taskId + '无数据'
            }

            this.result = this.fixedBuffer(arrayBuffer);
        } catch (err) {
            throw err;
        }
    }

    fixedBuffer(arrayBuffer: ArrayBuffer): Buffer | null {
        const len = arrayBuffer.byteLength,
            startIndex = 16 * 16;
        if (len < startIndex) {
            return null
        }

        return Buffer.from(arrayBuffer, startIndex);
    }
}


interface I_Downloader_MP4 {
    epi: string;
}

export class Downloader_MP4 extends DownloaderBase implements I_Downloader_MP4 {
    result: boolean | null;
    epi: string;

    constructor(url_source: string, taskId: number, epi: string) {
        super(url_source, taskId);
        this.result = null;

        this.epi = epi;
    }

    vaildateUrl(url: string) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            return false
        }

        return true
    }

    async run(): Promise<void> {
        try {
            const response = await fetch(this.url_source, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                }
            });

            if (!response.body) {
                throw '无数据';
            }

            await this.genFile(response);
            this.result = true;
        } catch (err) {
            throw err;
        }
    }

    async genFile(response: NodeFetchResponse) {
        return new Promise((re, rj) => {
            try {
                const total = response.headers.get("content-length");
                const progress = progressStream({
                    length: total !== null ? +total : undefined,
                    time: 5 * 1000,
                });
                progress.on('err', (err) => {
                    rj('过程提示出错: ' + err);
                });
                progress.on('progress', (progressData) => {
                    let percentage = Math.round(progressData.percentage) + '%';
                    this.logInfo('当前进度: %s', percentage);
                });

                const fileName = download_dir + '/' + this.epi + '.mp4';
                const fileWriteStream = createWriteStream(fileName);
                fileWriteStream.on('error', (err) => {
                    rj('写入文件出错: ' + err);
                });
                fileWriteStream.on('finish', () => {
                    this.logInfo('下载完成', '这是同步在写'); // todo
                    re(true);
                });

                pipeline(
                    response.body!,
                    progress,
                    fileWriteStream,
                );
            } catch (err) {
                rj(err);
            }
        })
    }

    logInfo(msg: string, ...args: any[]) {
        console.log('第%s集 -> ' + msg, this.epi, ...args);
    }
}
