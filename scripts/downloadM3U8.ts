import { download_dir } from './config'

interface I_downloadBase {
    url_source: string;
    epi: string;
    result: any;
}

abstract class DownloadBase implements I_downloadBase {
    url_source: string;
    epi: string;
    result: any;

    constructor(url_source: string, epi: number) {
        this.result = null;
        if (!this.vaildateUrl(url_source)) {
            throw '下载地址不是以http或https开头';
        }

        this.url_source = url_source;
        this.epi = (epi < 10 ? '0' : '') + String(epi);
    }

    abstract vaildateUrl(url: string): boolean;
    abstract download(): Promise<any>;
    abstract log(msg: string, ...args: any[]): void;
}

class DownloadM3U8 extends DownloadBase {
    constructor(url_source: string, epi: number) {
        super(url_source, epi);
    }

    vaildateUrl(url: string) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            return false
        }

        return true
    }

    download(): Promise<any> {
        return new Promise(async (re, rj) => {
            try {
                this.log('开始下载第%s集', this.epi);
                const response = await fetch(this.url_source, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    }
                });

                if (!response.body) {
                    rj('ts视频无body');
                    return
                }

                this.result = await response.arrayBuffer();
                re(true);
            } catch (err) {
                rj(err);
            }
        })
    }

    log(msg: string, ...args: any[]) {
        console.log(msg, ...args);
    }
}




interface I_poolItem<RunClass> {
    begin: boolean;
    success: boolean;
    runner: RunClass;
}

interface I_ManagerBase<RunClass> {
    pool: I_poolItem<RunClass>[];
    errorSet: Set<number>;
    retryNum: number;
}

abstract class ManagerBase<RunClass> implements I_ManagerBase<RunClass> {
    pool: I_poolItem<RunClass>[];
    errorSet: Set<number>;
    retryNum: number;

    constructor(urls: string[], c: { new(url_source: string, epi: number): RunClass }) {
        let epi = 0;
        this.pool = [];
        this.errorSet = new Set();
        this.retryNum = 0;

        this.init(urls, c);
    }

    abstract init(urls: string[], c: { new(url_source: string, epi: number): RunClass }): void;
    abstract run(): Promise<void>;
    abstract retry(): Promise<void>;
}

class Manager_M3U8 extends ManagerBase<DownloadM3U8> {
    constructor(urls: string[], c: { new(url_source: string, epi: number): DownloadM3U8 }) {
        super(urls, c);
    }

    init(urls: string[], c: new (url_source: string, epi: number) => DownloadM3U8): void {
        let epi = 0;
        this.pool = new Array<I_poolItem<DownloadM3U8>>(urls.length).fill({
            begin: false,
            success: false,
            runner: new c(urls[epi++], epi),
        });
    }

    async run(): Promise<void> {

    }

    async retry(): Promise<void> {

    }
}