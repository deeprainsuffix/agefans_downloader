import { fork } from 'node:child_process';
import { meta } from '../meta.js';
import { type T_message_process_child, type_process_download_end } from "./type.message.js";
import { child_modulePath, download_dir } from '../scripts_main/config.js';
import { AGE_Anime_spider_auto } from '../scripts_spider/index.js';


process.on('uncaughtException', (error) => {
    console.error('主进程中，未捕获异常：', error);
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('主进程中，未处理的拒绝：', promise, '原因：', reason);
    // process.exit(1);
});

export async function launch() {
    const controller = new AbortController();
    const { signal } = controller;

    const child = fork(child_modulePath, ['process_download'], { signal });
    try {
        child.on('error', (err) => {
            console.log('下载进程报错: ', err);
            controller.abort();
        });
        child.on('message', (message: T_message_process_child) => {
            if (message.type === type_process_download_end) {
                const { epi_success } = message.record;
                console.log('\n下载结束');
                console.log('下载文件夹目录', download_dir);
                instance_spider.summary(epi_success);
                child.kill();
            }
        });

        const instance_spider = new AGE_Anime_spider_auto(meta);
        await instance_spider.init(child); // 简单点，直接把child给它就行
        await instance_spider.run();
    } catch (err) {
        child.kill();
        console.log('launch出错 -> ', err);
    }
}