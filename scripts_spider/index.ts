import { type I_Meta } from '../meta.js';
import puppeteer from "puppeteer";
import { type fork } from 'node:child_process';
import { overrideXHROpen, waitForElementVideo } from './runInBrowser.js';
import { get_episode_wanted, formatEpi } from './util.js';
import {
    type T_message_spider_download, type T_message_spider_end,
    type_spider_download, type_spider_end,
    type T_prepared_videoInfo_without_epi,
} from '../scripts_process/type.message.js';

type outOfReturnPromise<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>;

interface I_AGE_Anime_spider_auto {
    meta: I_Meta;
    browser: outOfReturnPromise<typeof puppeteer.launch>;
    page: outOfReturnPromise<I_AGE_Anime_spider_auto['browser']['newPage']>; // 用一个page行了
    process_download: ReturnType<typeof fork>;
    episode_existingMap: Map<number, { url_play: string }>;
    episode_existing_final: number;
    episode_wanted: number[];
}

export class AGE_Anime_spider_auto implements I_AGE_Anime_spider_auto {
    meta: I_AGE_Anime_spider_auto['meta'];
    browser: I_AGE_Anime_spider_auto['browser'];
    page: I_AGE_Anime_spider_auto['page'];
    process_download: I_AGE_Anime_spider_auto['process_download'];
    episode_existingMap: I_AGE_Anime_spider_auto['episode_existingMap'];
    episode_existing_final: I_AGE_Anime_spider_auto['episode_existing_final'];
    episode_wanted: I_AGE_Anime_spider_auto['episode_wanted'];

    constructor(meta: I_Meta) {
        this.meta = { ...meta };
        this.browser = {} as I_AGE_Anime_spider_auto['browser'];
        this.page = {} as I_AGE_Anime_spider_auto['page'];
        this.process_download = {} as I_AGE_Anime_spider_auto['process_download'];

        this.episode_existingMap = new Map();
        this.episode_existing_final = 0;
        this.episode_wanted = [];
    }

    async init(process_download: I_AGE_Anime_spider_auto['process_download']) {
        try {
            this.browser = await puppeteer.launch();
            // this.browser = await puppeteer.launch({ headless: false });
            this.page = await this.browser.newPage();

            this.process_download = process_download;
        } catch (err) {
            throw 'init出错 -> ' + err;
        }
    }

    async run() {
        // run中任务不并行，一个一个来，拿到mp4地址或m3u8地址往另一个下载进程抛，
        // 当然可能出现某个任务卡住导致后面排队的情况，但几乎不可能，看了一下，网站速度很快
        const process_download = this.process_download;
        try {
            this.printInfo('信息配置中...');
            await this.step1_episode();
            this.printInfo(`动画总集数: ${this.episode_existingMap.size} 期望下载集数: ${this.episode_wanted.length}`);
            this.printInfo('\n准备下载...');

            for (let epi of this.episode_wanted) {
                try {
                    const episodeInfo = this.episode_existingMap.get(epi);
                    if (!episodeInfo) {
                        throw `动画没有第${epi}集`;
                    }
                    const { url_play } = episodeInfo;
                    const videoInfo = await this.step2_epi_url_source(url_play);
                    const msg_download: T_message_spider_download = {
                        type: type_spider_download,
                        epi: formatEpi(epi, this.episode_existing_final), // 传给下载进程的epi改为00x的string类型
                        video_type: videoInfo.video_type,
                        url_source: videoInfo.url_source,
                    };
                    process_download.send(msg_download);
                } catch (err) {
                    this.printError(`第${epi}集下载失败，原因: ` + err);
                }
            }
            const msg_end: T_message_spider_end = {
                type: type_spider_end,
            }
            process_download.send(msg_end);

            await this.step3_Shutdown();
        } catch (err) {
            throw 'run中出错 -> ' + err;
        }
    }

    async step1_episode(): Promise<void> {
        // 获取总集数和期望下载的集数
        return new Promise(async (re, rj) => {
            try {
                const timeout = 20 * 1000,
                    errMsg_Timeout = '获取动画总集数超时';
                const timer = setTimeout(() => {
                    rj(errMsg_Timeout);
                }, timeout);

                const { detailUrl, range } = this.meta;
                await this.get_episode_existing(detailUrl);

                const episode_wanted = get_episode_wanted(range, this.episode_existing_final);
                if (!episode_wanted.length) {
                    this.printError('配置的range范围不正确');
                    throw '配置的range范围不正确';
                }
                this.episode_wanted = episode_wanted;
                re((clearTimeout(timer), void 0));
            } catch (err) {
                rj('step1_episode出错 -> ' + err);
            }
        })
    }

    async get_episode_existing(detailUrl: I_Meta['detailUrl']) {
        try {
            const errMsg = '该动画没有可下载的动画剧集';

            const episodeEleClassName = '.video_detail_episode';
            const page = this.page;
            await page.goto(detailUrl);
            const episodeUl = await page.$(episodeEleClassName);
            if (!episodeUl) {
                throw errMsg;
            }

            const episodeLis = await episodeUl.$$('li');
            if (!episodeLis.length) {
                throw errMsg;
            }

            for (const li of episodeLis) {
                try {
                    const a = await li.$('a');
                    if (a) {
                        const href = await a.evaluate(el => el.getAttribute('href'));
                        if (href) {
                            let index = href.length - 1;
                            while (index >= 0) {
                                if (href[index] === '/') {
                                    break;
                                }
                                index--;
                            }
                            if (index >= 0) {
                                const epi = +href.substring(index + 1, href.length);
                                if (epi) {
                                    this.episode_existingMap.set(epi, { url_play: href });
                                    this.episode_existing_final = epi;
                                }
                            }
                        }
                    }
                } catch (err) { }
            }

            if (!this.episode_existingMap.size) {
                this.printError(errMsg);
                throw errMsg
            }
        } catch (err) {
            throw 'get_episode_existing出错 -> ' + err;
        }
    }

    async step2_epi_url_source(url_play: string): Promise<T_prepared_videoInfo_without_epi> {
        return new Promise(async (re, rj) => {
            const timeout = 15 * 1000,
                errMsg_Timeout = '获取资源下载地址超时';
            const timer = setTimeout(() => {
                rj(errMsg_Timeout);
            }, timeout);

            try {
                const url_video = await this.get_url_video(await this.get_url_iframe(url_play) || '');
                re((clearTimeout(timer), url_video));
            } catch (err) {
                rj('step2_epi_url_source出错 -> ' + err);
            }
        });
    }

    async get_url_iframe(url_play: string) {
        try {
            const errMsg = '获取url_iframe失败';

            const page = this.page;
            await page.goto(url_play);
            const iframe = await page.$('iframe');
            if (!iframe) {
                throw errMsg;
            }

            const url_iframe = await iframe.evaluate(el => el.getAttribute('src'));
            if (!url_iframe) {
                throw errMsg;
            }

            return url_iframe
        } catch (err) {
            throw 'get_iframeUrl出错 -> ' + err;
        }
    }

    async get_url_video(url_iframe: string) {
        try {
            const page = this.page;
            await page.evaluateOnNewDocument(overrideXHROpen);
            await page.goto(url_iframe);
            return await page.evaluate(waitForElementVideo);
        } catch (err) {
            throw 'get_url_video出错 -> ' + err;
        }
    }

    async step3_Shutdown() {
        try {
            await this.browser.close();
        } catch (err) {
            throw 'step3_Shutdown出错 -> ' + err;
        }
    }

    printError(errMsg: string) {
        console.log('\n' + errMsg);
    }

    printInfo(info: string) {
        console.log(info);
    }
}
