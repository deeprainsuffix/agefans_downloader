import { meta } from './meta.js';
import { AGE_Anime_Download_auto } from './scripts_spider/index.js';
async function launch() {
    try {
        const instance = new AGE_Anime_Download_auto(meta);
        await instance.init();
        await instance.run();
    } catch (err) {
        console.log('err::', err); // todo
    }
}

launch();
