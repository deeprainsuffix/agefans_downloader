import {
    type T_message_spider, type T_message_process_child,
    type_spider_download, type_spider_end, type_process_download_end,
} from "./type.message.js";
import { AGE_Anime_download_auto } from '../scripts_download/index.js'

if (process.argv[2] === 'process_download') {
    process.on('uncaughtException', (error) => {
        console.error('子进程中，未捕获异常：', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('子进程中，未处理的拒绝：', promise, '原因：', reason);
    });

    startWork();
}

function startWork() {
    try {
        const instance_download = new AGE_Anime_download_auto();
        instance_download.run();
        process.on('message', async (message: T_message_spider) => {
            try {
                const { type } = message;
                if (type === type_spider_download) {
                    instance_download.revieve(message);
                    return
                }

                if (type === type_spider_end) {
                    const record = await instance_download.shutdown();
                    const msg_kill: T_message_process_child = {
                        type: type_process_download_end,
                        record,
                    };

                    process.send!(msg_kill) // send一定存在
                    return
                }
            } catch (err) {
                console.log('process_download onmessage出错 -> ', err);
            }
        });
    } catch (err) {
        console.log('startWork出错 -> ', err);
    }
}