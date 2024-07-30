import { fork } from 'node:child_process';
import { meta } from '../meta.js';
import { type T_message_process_child, type_process_download_end } from "./type.message.js";
import { child_modulePath } from '../scripts_main/config.js';
import { AGE_Anime_spider_auto } from '../scripts_spider/index.js';

export async function launch() {
    try {
        const controller = new AbortController();
        const { signal } = controller;

        const child = fork(child_modulePath, ['process_download'], { signal });
        child.on('error', (err) => {
            console.log('下载进程报错: ', err);
            controller.abort();
        });
        child.on('message', (message: T_message_process_child) => {
            if (message.type === type_process_download_end) {
                console.log('下载进程关闭');
                child.kill();
            }
        });

        const instance_spider = new AGE_Anime_spider_auto(meta);
        await instance_spider.init(child);
        await instance_spider.run();
    } catch (err) {
        console.log('launch出错 -> ', err);
    }
}