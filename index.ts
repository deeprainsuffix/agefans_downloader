// 1、启动browser
// 2、修改XHR的open，将m3u8地址插入dom
// 3、导航主页面，获取iframeUrl，再导航到iframe页面，找到video，的src，
// 3.1 如果是blob，拿到dom中的m3u8地址，解析出所有的.ts列表，下载拼接
// 3.2 如果是https，直接下

// import puppeteer from "puppeteer";

// const iframeUrl = 'https://43.240.156.118:8443/vip/?url=age_2676p1orVCfnILSYZcwm02IkyCeV7usiIuPd1dnMyEEaowQ32hGUQWYA7BdOF%2BuMdV42f2tl5WKw9SjOprKwWihbm8IHsu8FedP8';

// const obj = {};


// async function test() {

//     // const browser = await puppeteer.launch();
//     const browser = await puppeteer.launch({ headless: false });

//     const page = await browser.newPage();
//     const result = await page.evaluateOnNewDocument(function () {
//         // 这里面使用的变量必须限制在该function中
//         // 方式1: 找找看能不能让tab与node进行通信
//         // 方式2: 将url作为一个dom标签插进去
//         console.log('执行前');

//         function getUrl(url: string | URL) {
//             console.log('拿到的url', typeof url);
//         }

//         const open = XMLHttpRequest.prototype.open;
//         function overrideOpen(method: string, url: string | URL): void;
//         function overrideOpen(method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
//         function overrideOpen(this: XMLHttpRequest, method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
//             getUrl(url);
//             if (async !== undefined) {
//                 open.call(this, method, url, async, username, password);
//             } else {
//                 open.call(this, method, url, true);
//             }
//         }
//         XMLHttpRequest.prototype.open = overrideOpen;

//         return 1
//     });

//     await page.goto(iframeUrl);


//     // ...
// }

import { existsSync, rmSync, mkdirSync } from 'fs';
import { Manager_AGEAnime } from './scripts/anime_Manager.js';
import { download_dir } from './scripts/config.js';

function beforeRun() {
    if (existsSync(download_dir)) {
        rmSync(download_dir, { recursive: true, force: true });
    }
    mkdirSync(download_dir);
}

async function run() {
    beforeRun();

    // const url = 'https://sf16-sg-default.akamaized.net/obj/tos-alisg-v-0000/ogNBI8BfWBsbkriBFjDgAoQTSphDRecAnbaLDg';
    // const mp4 = new DownloadMp4(url, 3, download_dir);
    // console.log('继续进行');
    // console.log('mp4::', mp4);

    // await mp4.downloadMp4();

    const arr = [
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188215228245b9ee8e504af59377f7cb70319ce4045559.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188216189965b9ee8e504af59377f7cb70319ce4045965.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217175675b9ee8e504af59377f7cb70319ce40451658.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217430855b9ee8e504af59377f7cb70319ce40456580.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188218173645b9ee8e504af59377f7cb70319ce40457896.jpg',
    ];

    const url_m3u8 = 'https://43.240.156.118:8443/playurl/c457f0ccade82fdc7543976cf8a92153.m3u8?ckey=6332DDDFC51BC1D38287C185D27DD370D87C2FEA4865393E3E21340F156400B746491C9C17CC0773AF8CE92CDE1C51E0D1756AEA82099E986B427F2C5FA27B70863752344985ED0F89E476CB542528794B4E5B659AE695EE8D3485EE4406CAD94501451B3C5514BD18247AD8DB0C221E670364AB2C322B223B07D132F612AE9D6F6A26179FB3F2F10727F9B25DBF99D4AA149D252268C57D7F1ABD0BACC1206D731F597F9FB26B6936E5422F952171722DF7F2B33A5DC2668BA5EEBFE246EB6408A859B34C8B40D956A867A74F208814C2A355D9B7576863F49FCB45C283EF7C88448854799DD04CF0D5A9CA1E074161&time=1721919397&client_netip=111.30.245.145&media_type=jpg';

    // const manaM3 = new Manager_M3U8(url_m3u8, '02');
    // await manaM3.init();
    // await manaM3.run();

    // todo 下载前判断wifi还是流量，应该是在puppeteer启动前
    // todo node-fetch和原生fetch，原生fetch要大于node >= 18 稳定要更靠后


    const manager_AGEAnime = new Manager_AGEAnime([{ type: 'm3u8', url_source: url_m3u8 }]);
    await manager_AGEAnime.init_pool();
    await manager_AGEAnime.run();


}

run();


