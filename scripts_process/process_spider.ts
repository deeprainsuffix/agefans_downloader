import { fork } from 'node:child_process';
import { meta } from '../meta.js';
import { type T_message_process_child, type_process_download_end } from "./type.message.js";
import { child_modulePath, download_dir } from '../scripts_main/config.js';
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
                const { count_download, count_success } = message.record;
                console.log('下载结束');
                let summary = `期望下载${count_download}个，成功${count_success}个, 失败${count_download - count_success}个`;
                console.log(summary);
                console.log('下载文件夹目录', download_dir);
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