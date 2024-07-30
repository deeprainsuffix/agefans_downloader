import {
    type T_message_spider, type T_message_process_child,
    type_spider_download, type_spider_end, type_process_child_end,
    type T_prepared_videoInfo,
} from "./config.js";

if (process.argv[2] === 'process_download') {
    startWork();
}

function startWork() {
    console.log('我是下载进程，开始工作');
    const prepared_videoInfo: T_prepared_videoInfo[] = []; // todo
    process.on('message', (message: T_message_spider) => {
        const { type } = message;
        if (type === type_spider_end) {
            console.log('看下所有的', prepared_videoInfo);

            const msg_kill: T_message_process_child = {
                type: type_process_child_end,
            };
            process.send!(msg_kill) //todo 把!去掉
            return
        }

        if (type === type_spider_download) {
            prepared_videoInfo.push({
                epi: message.epi,
                video_type: message.video_type,
                url_source: message.url_source,
            });
        }
    });
}