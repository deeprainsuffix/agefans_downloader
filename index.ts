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
    // 

    // await mp4.downloadMp4();

    const arr = [
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188215228245b9ee8e504af59377f7cb70319ce4045559.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188216189965b9ee8e504af59377f7cb70319ce4045965.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217175675b9ee8e504af59377f7cb70319ce40451658.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217430855b9ee8e504af59377f7cb70319ce40456580.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188218173645b9ee8e504af59377f7cb70319ce40457896.jpg',
    ];

    const url_mp4_01 = 'https://upos-sz-mirrorhw.bilivideo.com/upgcxcode/21/83/94678321/94678321_da8-1-208.mp4?e=ig8euxZM2rNcNbNBnWdVhwdlhbUHhwdVhoNvNC8BqJIzNbfqXBvEuENvNC8aNEVEtEvE9IMvXBvE2ENvNCImNEVEIj0Y2J_aug859r1qXg8gNEVE5XREto8z5JZC2X2gkX5L5F1eTX1jkXlsTXHeux_f2o859IMvNC8xNbLEkF6MuwLStj8fqJ0EkX1ftx7Sqr_aio8_&ua=tvproj&uipk=5&nbs=1&deadline=1722006785&gen=playurlv2&os=bcache&oi=1879385489&trid=0000d59e2b59f0d84febbb59d41bbce2564cT&mid=0&og=hw&upsig=58fe68d428c026ae29e1f6307ee3d40c&uparams=e,ua,uipk,nbs,deadline,gen,os,oi,trid,mid,og&cdnid=40013&bvc=vod&nettype=0&bw=259795&orderid=0,3&buvid=&build=2040100&mobi_app=android_i&f=T_0_0&logo=80000000';
    const url_m3u8_02 = 'https://43.240.156.118:8443/playurl/9a1a1f9b230cee3b6904a61e0410f5ec.m3u8?ckey=C8A05B1966E3406B134F15D42D8E6BEF20F8153DD83E9562BAE068C0B580A73450BA113EAE52CDEABD19317A4D06B633A3F89CBC0C5BB1B4BBAFD245FE3B26BBE3E3C99D7FA42534CB987E394694175CB904BBFC0B9C2E5559ED4EA1F68784C2DE23322B7CFBED6C7278BBB15711EA0DAED0E26D6AB68E41C7F672EC6728371F4FE26879E2A2916039B01491101FEE14734497E93A1E65940644182DFCE76124C4ED6F2E939B58139D3D9103FE784B43FF249FFE1B1AC06E9802CAB5C770574EF272EAC445F3293C8895753105DE0CE7BCA329E6C0B1A61C161F74B70A7E9B4A868413ABFBA6670ECBE8378EF0970514&time=1722005994&client_netip=111.30.245.145&media_type=jpg';

    // const manaM3 = new Manager_M3U8(url_m3u8, '02');
    // await manaM3.init();
    // await manaM3.run();

    // todo 下载前判断wifi还是流量，应该是在puppeteer启动前
    // todo node-fetch和原生fetch，原生fetch要大于node >= 18 稳定要更靠后
    // todo 所有的提示消息和报错消息
    // todo m3u8加进度提示
    // todo manager分区分，并考虑downloader是否也要区分开


    const manager_AGEAnime = new Manager_AGEAnime(
        [
            { type: 'mp4', url_source: url_mp4_01 },
            { type: 'm3u8', url_source: url_m3u8_02 },
        ]);
    await manager_AGEAnime.init_pool();
    await manager_AGEAnime.run();


}

run();


