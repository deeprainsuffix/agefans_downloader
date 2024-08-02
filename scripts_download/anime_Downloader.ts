import { createWriteStream } from 'fs';
import { pipeline } from 'node:stream/promises';
import progressStream from 'progress-stream';
import { download_dir } from '../scripts_main/config.js';
import { fetch, type T_Response, progressInterval } from './util.js';

const Min_content_length_TS = 10 * 1000,
    Min_content_length_MP4 = 10 * 1000;

type T_result = boolean | ArrayBuffer | null;

interface I_DownloaderBase {
    url_source: string;
    result: T_result;
}

export abstract class DownloaderBase implements I_DownloaderBase {
    url_source: string;
    result: boolean | ArrayBuffer | null;

    constructor(url_source: string) {
        if (!this.vaildateUrl(url_source)) {
            throw '下载地址不是以“https://”开头';
        }

        this.url_source = url_source;
        this.result = null;
    }

    vaildateUrl(url: string) {
        if (!url.startsWith('https://')) {
            return false
        }

        return true
    }

    abstract run(): Promise<void>;
}

export class Downloader_M3U8_ts extends DownloaderBase {
    result: ArrayBuffer | null;

    constructor(url_source: string) {
        super(url_source);

        this.result = null;
    }

    async run() {
        return new Promise<void>(async (re, rj) => {
            const timeout = 10 * 1000,
                errMsg_Timeout = 'response.arrayBuffer()超时';
            const timer = setTimeout(() => {
                rj(errMsg_Timeout);
            }, timeout);

            try {
                const { response, errMsg } = await fetch(this.url_source, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    },
                    timeout: 3 * 1000,
                    errMsg_Timeout: 'ts片段下载超时',
                });
                if (!response) {
                    return rj(errMsg);
                }

                const arrayBuffer = await response.arrayBuffer(); // response.arrayBuffer()可能挂起
                if (arrayBuffer.byteLength <= Min_content_length_TS) {
                    return rj('ts片段内容量过少');
                }

                this.result = this.fixedBuffer(arrayBuffer);

                re(clearTimeout(timer));
            } catch (err) {
                rj('Downloader_M3U8_ts run出错 -> ' + err);
            }
        })
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

    constructor(url_source: string, epi: string) {
        super(url_source);
        this.result = null;

        this.epi = epi;
    }

    async run(): Promise<void> {
        try {
            const { response, errMsg } = await fetch(this.url_source, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                }
            });
            if (!response) {
                throw errMsg;
            }

            if (Number(response.headers.get('content-length')) < Min_content_length_MP4) {
                throw 'mp4视频内容量过少';
            }

            await this.genFile(response);
            this.result = true;
        } catch (err) {
            throw 'Downloader_MP4出错 -> ' + err;
        }
    }

    async genFile(response: T_Response) {
        return new Promise<void>(async (re, rj) => {
            try {
                const total = response.headers.get("content-length");
                const progress = progressStream({
                    length: total !== null ? +total : undefined,
                    time: progressInterval,
                });
                progress.on('error', (err) => {
                    rj('过程提示出错 -> ' + err);
                });
                progress.on('progress', (progressData) => {
                    let percentage = Math.floor(progressData.percentage) + '%';
                    this.printInfo(`当前进度: ${percentage}`);
                });

                const fileName = download_dir + '/' + this.epi + '.mp4';
                const fileWriteStream = createWriteStream(fileName);
                fileWriteStream.on('error', (err) => {
                    rj('写入文件出错 -> ' + err);
                });
                fileWriteStream.on('finish', () => {
                    this.printInfo(`\n☆☆☆下载成功(第${this.epi}集)\n`);
                    re();
                });

                await pipeline(
                    response.body!,
                    progress,
                    fileWriteStream,
                );
            } catch (err) {
                rj('genFile出错 -> ' + err);
            }
        })
    }

    printInfo(info: string) {
        console.log(`第${this.epi}集 -> ` + info);
    }
}
