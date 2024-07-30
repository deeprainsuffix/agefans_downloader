import { fork } from 'node:child_process';
import { meta } from './meta.js';
import { type T_message_process_child, type_process_child_end } from "./config.js";
import { child_modulePath } from './config.js';
import { AGE_Anime_Download_auto } from './scripts_spider/index.js';

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
            console.log('来自子进程的消息:', message);
            if (message.type === type_process_child_end) {
                console.log('下载进程关闭');
                child.kill();
            }
        });

        const instance = new AGE_Anime_Download_auto(meta);
        await instance.init(child);
        await instance.run();
    } catch (err) {
        console.log('launch出错 -> ', err);
    }
}