// 1、启动browser
// 2、修改XHR的open，将m3u8地址插入dom
// 3、导航主页面，获取iframeUrl，再导航到iframe页面，找到video，的src，
// 3.1 如果是blob，拿到dom中的m3u8地址，解析出所有的.ts列表，下载拼接
// 3.2 如果是https，直接下


import { meta, type I_Meta } from './meta.js';
import puppeteer from "puppeteer";
import { runInChrome, getTipEleM3U8Url } from './scripts_spider/overrideXHROpen.js';
import { episodeEleClassName } from './scripts_spider/config.js';
import { get_episode_wanted } from './scripts_spider/util.js';

const iframeUrl = 'https://43.240.156.118:8443/vip/?url=age_2676p1orVCfnILSYZcwm02IkyCeV7usiIuPd1dnMyEEaowQ32hGUQWYA7BdOF%2BuMdV42f2tl5WKw9SjOprKwWihbm8IHsu8FedP8';





type outOfReturnPromise<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>;

interface I_AGE_Anime_Download_auto {
    meta: I_Meta;
    browser: outOfReturnPromise<typeof puppeteer.launch>;
    page: outOfReturnPromise<I_AGE_Anime_Download_auto['browser']['newPage']>; // 用一个page行了
    episode_existingMap: Map<number, { href: string }>;
    episode_existing_final: number;
    episode_wanted: number[];
}

class AGE_Anime_Download_auto implements I_AGE_Anime_Download_auto {
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
            // checkMeta() todo
            this.browser = await puppeteer.launch();
            // this.browser = await puppeteer.launch({ headless: false });
            this.page = await this.browser.newPage();
        } catch (err) {
            throw 'init出错 -> ' + err;
        }
    }

    async run() {
        try {
            await this.step1_episode();
            




            // await page.evaluateOnNewDocument(runInChrome); todo
        } catch (err) {
            throw 'run中出错' + err;
        }
    }

    async get_episode_existing(detailUrl: I_Meta['detailUrl']) {
        try {
            const errMsg = '该页面没有可下载的动画剧集';
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
                                    this.episode_existingMap.set(epi, { href });
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

    printError(errMsg: string) {
        console.log('\n' + errMsg);
    }
}


async function launch() {
    try {
        const instance = new AGE_Anime_Download_auto(meta);
        await instance.init();
        await instance.run();
    } catch (err) {
        console.log('err::', err);
    }
}

launch();


