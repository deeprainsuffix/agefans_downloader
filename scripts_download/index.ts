import { type T_prepared_videoInfo, type T_record } from '../scripts_process/type.message.js';
import { Manager_AGEAnime } from './anime_Manager.js';

interface I_AGE_Anime_download_auto {
    manager: Manager_AGEAnime;
    prepared_videoInfo_queue: T_prepared_videoInfo[];
    prepared_videoInfo_batch: T_prepared_videoInfo[];
    batchSize: number;
    signal_shutdown: boolean;

    clock: NodeJS.Timeout | null;
}

export class AGE_Anime_download_auto implements I_AGE_Anime_download_auto {
    manager: I_AGE_Anime_download_auto['manager'];
    prepared_videoInfo_queue: I_AGE_Anime_download_auto['prepared_videoInfo_queue'];
    prepared_videoInfo_batch: I_AGE_Anime_download_auto['prepared_videoInfo_batch'];
    batchSize: I_AGE_Anime_download_auto['batchSize'];
    signal_shutdown: I_AGE_Anime_download_auto['signal_shutdown'];

    clock: I_AGE_Anime_download_auto['clock'];
    private kill: (value: T_record | PromiseLike<T_record>) => void;

    constructor() {
        this.manager = new Manager_AGEAnime();
        this.prepared_videoInfo_queue = [];
        this.prepared_videoInfo_batch = [];
        this.batchSize = 10;
        this.signal_shutdown = false;

        this.clock = null;

        this.kill = () => { };
    }

    revieve(prepared_videoInfo: T_prepared_videoInfo) {
        if (this.signal_shutdown) {
            return
        }

        this.prepared_videoInfo_queue.push(prepared_videoInfo);
    }

    videoInfo_batch_fill(size?: number) {
        let n = size ? Math.min(this.batchSize, size) : this.batchSize;
        while (n--) {
            this.prepared_videoInfo_batch.push(this.prepared_videoInfo_queue.shift()!);
        }
    }

    videoInfo_batch_release() {
        this.prepared_videoInfo_batch.length = 0;
    }

    run() {
        this.clock = setInterval(() => {
            if (this.manager.busy) {
                return
            }

            const count = this.prepared_videoInfo_queue.length;
            if (count >= this.batchSize) {
                this.videoInfo_batch_fill();
                this.manager_consum();

                return
            }

            if (this.signal_shutdown) {
                if (count > 0) {
                    this.videoInfo_batch_fill(count);
                    this.manager_consum();
                }

                this.clock_release();
            }
        }, 2.5 * 2 * 1000); // 测试平均2s拿到一个videoInfo，这里设置2.5倍
    }

    async manager_consum() {
        const batch = [...this.prepared_videoInfo_batch];
        this.videoInfo_batch_release();
        try {
            await this.manager.init_pool(batch);
            await this.manager.run();
        } catch (err) { }

        if (!this.clock) {
            this.kill(this.manager.record);
        }
    }

    async shutdown(): Promise<T_record> {
        this.signal_shutdown = true;
        return new Promise<T_record>((kill, _) => {
            this.kill = kill;
        })
    }

    clock_release() {
        // @ts-ignore
        clearInterval(this.clock);
        this.clock = null;
    }
}