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
import path from 'path';
import { DownloadMp4 } from './scripts/downloadMp4.js';
import { Manager_M3U8, DownloadM3U8 } from './scripts/downloadComposition.js';

const download_dir = path.resolve('download');

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

    const url_m3u8 = 'https://43.240.156.118:8443/playurl/fa44c2c2f3074e0c105ca021ca3f960e.m3u8?ckey=9BB8DA7E0DA4ECAB147FE5A672907295CA2656946E4BBEFACE6C945D3350A64E4EDD0CB0C7EE78AA804714F2A6925C6047E8D17895536EFE780F6E7CB5A689F3B14594D0934D3038CFF345B65F8D55C98D9034937BD7BA1B91EDAC24AE60C69D0FCA5CFB4F725147A9BAC725646CE9F03FF71D6E8142EEB297923EADC7A5CA15480DC5E9E92F38DEC3077DA378E8A31501B28BE7373DCB87FAF49A77EDA7F5613BEE15BF647017150327EDB4A4577D8AAAF7A101A34BF88A3067E2BF8262AFD62D938D14A41C5113D41D2A8008ACE42D81E752EBE7EAB6C3A7987885085AE07B225E9817F9C0EE52D8741798A5E99E4C&time=1721829448&client_netip=111.30.245.145&media_type=jpg';

    const manaM3 = new Manager_M3U8(url_m3u8, '02');
    await manaM3.init();
    await manaM3.run();
}

run();


