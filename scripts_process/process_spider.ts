import { fork } from 'node:child_process';
import { meta } from '../meta.js';
import { type T_message_process_child, type_process_download_end } from "./type.message.js";
import { child_modulePath, download_dir } from '../scripts_main/config.js';
import { AGE_Anime_spider_auto } from '../scripts_spider/index.js';

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
                const { count_download, count_success, epi_success } = message.record;
                console.log('\n下载结束');
                console.log('下载文件夹目录', download_dir);

                const epi_success2num: number[] = epi_success.map(e => +e);
                const epi_fail = instance_spider.episode_wanted.filter(e => !epi_success2num.includes(e));
                console.log(`期望下载${instance_spider.episode_wanted.length}个，成功${count_success}个, 失败${epi_fail.length}个`);
                if (epi_fail.length) {
                    console.log('下载失败的分别是' + epi_fail.join(','));
                }
                console.log(`用时${((Date.now() - instance_spider.time_runStart) / 1000 / 60).toFixed(2)}`);

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