import {
    type T_message_spider, type T_message_process_child,
    type_spider_download, type_spider_end, type_process_download_end,
} from "./type.message.js";
import { AGE_Anime_download_auto } from '../scripts_download/index.js'

if (process.argv[2] === 'process_download') {
    startWork();
}

function startWork() {
    console.log('我是下载进程，开始工作');
    const instance_download = new AGE_Anime_download_auto();
    instance_download.run();

    process.on('message', async (message: T_message_spider) => {
        const { type } = message;
        if (type === type_spider_download) {
            instance_download.revieve(message);
            return
        }

        if (type === type_spider_end) {
            const record = await instance_download.shutdown(); // 这里要拿到总结信息 todo 
            const msg_kill: T_message_process_child = {
                type: type_process_download_end,
                record,
            };
            process.send!(msg_kill) //todo 把!去掉
            return
        }
    });
}