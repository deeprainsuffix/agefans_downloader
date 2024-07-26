type T_result = boolean | ArrayBuffer | null;

interface I_DownloaderBase {
    url_source: string;
    taskId: number;
    result: T_result;
}

export abstract class DownloaderBase implements I_DownloaderBase {
    url_source: string;
    taskId: number;
    result: ArrayBuffer | null;;

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

    log(msg: string, ...args: any[]) {
        console.log(msg, ...args);
    }
}

export class Downloader_M3U8 extends DownloaderBase {
    constructor(url_source: string, taskId: number) {
        super(url_source, taskId);
    }

    async run(): Promise<any> {
        const response = await fetch(this.url_source, {
            headers: {
                'Content-Type': 'application/octet-stream',
            }
        });

        const originRes = await response.arrayBuffer();
        if (originRes.byteLength <= 0) {
            throw '片段' + this.taskId + '无内容'
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



export class Downloader_MP4 extends DownloaderBase {
    constructor(url_source: string, taskId: number) {
        super(url_source, taskId);
    }
    vaildateUrl(url: string) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            return false
        }

        return true
    }

    async run(): Promise<void> {

    }
}














// import fetch from 'node-fetch';
// import { createWriteStream } from 'fs';
// import progressStream from 'progress-stream';

// interface I_DownloadMp4 {
//     run: boolean;
//     success: boolean;
//     urlMp4: string;
//     epi: string;
//     download_dir: string;
// }

// export class DownloadMp4 implements I_DownloadMp4 {
//     run: boolean;
//     success: boolean;
//     urlMp4: string;
//     epi: string;
//     download_dir: string;

//     constructor(urlMp4: string, epi: number, download_dir: string) {
//         this.run = false;
//         this.success = false;

//         if (!this.vaildateUrl(urlMp4)) {
//             throw 'mp4地址不是以http或https开头';
//         }

//         this.urlMp4 = urlMp4;
//         this.epi = (epi < 10 ? '0' : '') + String(epi);
//         this.download_dir = download_dir;
//     }


//     vaildateUrl(url: string) {
//         if (!(url.startsWith('http') || url.startsWith('https'))) {
//             return false
//         }

//         return true
//     }

//     async downloadMp4() {
//         return new Promise(async (re, rj) => {
//             try {
//                 console.log('开始下载第%s集', this.epi);
//                 const response = await fetch(this.urlMp4, {
//                     headers: {
//                         'Content-Type': 'application/octet-stream',
//                     }
//                 });

//                 if (!response.body) {
//                     rj('mp4无body');
//                     return
//                 }

//                 const total = response.headers.get("content-length");
//                 const progress = progressStream({
//                     length: total !== null ? +total : undefined,
//                     time: 5 * 1000 /* ms */
//                 });
//                 progress.on('err', (err) => {
//                     rj('流pipe出错' + err);
//                 });
//                 progress.on('progress', (progressData) => {
//                     let percentage = Math.round(progressData.percentage) + '%';
//                     console.log('进度: %s -> %s', this.epi, percentage);
//                 });
//                 progress.on('end', () => {
//                     console.log('下载完成: 第%s集', this.epi);
//                     re(true);
//                 });

//                 const fileName = this.download_dir + '/' + this.epi + '.mp4';
//                 const fileWriteStream = createWriteStream(fileName);

//                 response.body.pipe(progress).pipe(fileWriteStream);
//             } catch (err) {
//                 rj(err);
//             }
//         })
//     }
// }

