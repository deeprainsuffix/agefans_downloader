import { type T_prepared_videoInfo } from '../scripts_process/type.message.js';
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
    private kill: (value: void | PromiseLike<void>) => void;

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
                this.videoInfo_batch_release();

                return
            }

            if (count > 0 && this.signal_shutdown) {
                this.videoInfo_batch_fill(count);
                this.manager_consum();
                this.videoInfo_batch_release();
                this.clock_release();
            }
        }, 3 * 1000); // 这个时间等后边测下传递时间 todo
    }

    async manager_consum() {
        try {
            await this.manager.init_pool([...this.prepared_videoInfo_batch]);
            await this.manager.run();
        } catch (err) { }

        if (!this.clock) {
            this.kill();
        }
    }

    async shutdown() {
        this.signal_shutdown = true;
        return new Promise<void>((kill, _) => {
            this.kill = kill;
        })
    }

    clock_release() {
        // @ts-ignore
        clearInterval(this.clock);
        this.clock = null;
    }
}