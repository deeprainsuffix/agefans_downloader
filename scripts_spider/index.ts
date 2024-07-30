import { type I_Meta } from '../meta.js';
import puppeteer from "puppeteer";
import { overrideXHROpen, waitForElementVideo } from './runInBrowser.js';
import { get_episode_wanted } from './util.js';

type outOfReturnPromise<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>;

interface I_AGE_Anime_Download_auto {
    meta: I_Meta;
    browser: outOfReturnPromise<typeof puppeteer.launch>;
    page: outOfReturnPromise<I_AGE_Anime_Download_auto['browser']['newPage']>; // 用一个page行了
    episode_existingMap: Map<number, { url_play: string }>;
    episode_existing_final: number;
    episode_wanted: number[];
}

export class AGE_Anime_Download_auto implements I_AGE_Anime_Download_auto {
    meta: I_AGE_Anime_Download_auto['meta'];
    browser: I_AGE_Anime_Download_auto['browser'];
    page: I_AGE_Anime_Download_auto['page'];
    episode_existingMap: I_AGE_Anime_Download_auto['episode_existingMap'];
    episode_existing_final: I_AGE_Anime_Download_auto['episode_existing_final'];
    episode_wanted: I_AGE_Anime_Download_auto['episode_wanted'];

    constructor(meta: I_Meta) {
        this.meta = { ...meta };
        this.browser = {} as I_AGE_Anime_Download_auto['browser'];
        this.page = {} as I_AGE_Anime_Download_auto['page'];

        this.episode_existingMap = new Map();
        this.episode_existing_final = 0;
        this.episode_wanted = [];
    }

    async init() {
        try {
            // this.browser = await puppeteer.launch();
            this.browser = await puppeteer.launch({ headless: false });
            this.page = await this.browser.newPage();
        } catch (err) {
            throw 'init出错 -> ' + err;
        }
    }

    async run() {
        // run中任务不并行，一个一个来，拿到mp4地址或m3u8地址往另一个下载进程抛，
        // 当然可能出现某个任务卡住导致后面排队的情况，但几乎不可能，看了一下，网站速度很快
        // 这里测试的时候看一下从运行到拿到地址时的平均时间是多少，设置下载进程轮询时间时好有个数 todo
        try {
            await this.step1_episode();

            for (let epi of this.episode_wanted) {
                try {
                    const url_source = await this.step2_epi_url_source(epi);
                    console.log('todo 准备将url_source发送到下载进程');
                    console.log(url_source);
                } catch (err) {
                    this.printError(`第${epi}集下载失败`);
                    this.printError('失败原因: ' + err);
                }
            }

            await this.step3_Shutdown();
        } catch (err) {
            throw 'run中出错' + err;
        }
    }

    async step1_episode() {
        // 获取总集数
        try {
            const { detailUrl, range } = this.meta;
            await this.get_episode_existing(detailUrl);

            const episode_wanted = get_episode_wanted(range, this.episode_existing_final);
            if (!episode_wanted.length) {
                this.printError('配置的range范围不正确');
                throw '配置的range范围不正确';
            }
            this.episode_wanted = episode_wanted;
        } catch (err) {
            throw 'step1_episode出错 -> ' + err;
        }
    }

    async get_episode_existing(detailUrl: I_Meta['detailUrl']) {
        try {
            const errMsg = '该页面没有可下载的动画剧集';

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

    async step2_epi_url_source(epi: number) {
        const errMsg = `动画没有第${epi}集`;
        try {
            const episodeInfo = this.episode_existingMap.get(epi);
            if (!episodeInfo) {
                throw errMsg;
            }

            const { url_play } = episodeInfo;
            const url_video = await this.get_url_video(await this.get_url_iframe(url_play) || '');
            if (!url_video) {
                throw errMsg;
            }

            return url_video
        } catch (err) {
            throw 'step2_epi_url_source出错 -> ' + err;
        }
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
            throw 'get_iframeUrl出错' + err;
        }
    }

    async get_url_video(url_iframe: string) {
        try {
            const errMsg = '获取url_video失败';

            const page = this.page;
            await page.evaluateOnNewDocument(overrideXHROpen);
            await page.goto(url_iframe);
            const url_video = await page.evaluate(waitForElementVideo);
            if (!url_video) {
                throw errMsg;
            }

            return url_video
        } catch (err) {
            throw 'get_url_video出错' + err;
        }
    }

    async step3_Shutdown() {
        try {
            await this.browser.close();
        } catch (err) {
            throw 'step3_Shutdown出错' + err;
        }
    }

    printError(errMsg: string) {
        console.log('\n' + errMsg);
    }
}
