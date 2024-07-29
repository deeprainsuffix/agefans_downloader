

import { existsSync, rmSync, mkdirSync } from 'fs';
import { Manager_AGEAnime, Manager_M3U8 } from './scripts/anime_Manager.js';
import { download_dir } from './scripts/config.js';
import { Downloader_M3U8_ts } from './scripts/anime_Downloader.js'

function beforeRun() {
    if (existsSync(download_dir)) {
        rmSync(download_dir, { recursive: true, force: true });
    }
    mkdirSync(download_dir);
}

async function run() {
    beforeRun();


    const mockArr = [
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188215228245b9ee8e504af59377f7cb70319ce4045559.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188216189965b9ee8e504af59377f7cb70319ce4045965.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217175675b9ee8e504af59377f7cb70319ce40451658.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188217430855b9ee8e504af59377f7cb70319ce40456580.jpg',
        'https://gimg0.baidu.com/gimg/app=2001&n=0&g=0n&src=https%3A%2F%2Fbaidu-rmb-videopic-1.bj.bcebos.com/hk/2203/16487188218173645b9ee8e504af59377f7cb70319ce40457896.jpg',
    ];
    const u403 = 'https://43.240.156.118:8443/playurl/de728d11251d793c44d760bf577a0feb.m3u8?ckey=189E47573FB683D743CAB74B3853BD8319486BE0669652466A57DD3A8D774C3390560620BCACB7364534D52A75899EF8D09B599487E06569719A609793CB3AAC146CB32831312B0746B7FE7EE1178E71B7E66D412AA5C4DC65F6F1AE64449B09A2B36DEC589FD34AF017E25B9AEED35F7CC8D44FD9F45D695DADD235B0D452C2FC3131A1DE88D4D227810CE3E149926A03BFAF6852899EC7C26DB0AB27983915AD12C80CC90F907F18AACB344FC8829BA41B77DADAC4B0B522DCACA6F9C1A044000C141292C8BA918430036D99E73FAEB556DC0C9CE2356F56E63B5D996DCB3BEF434A87D9124A423C9B7AE3B629442F&time=1722086092&client_netip=111.30.245.145&media_type=jpg';
    const url_mp4_01_from_mdn = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    const url_m3u8_02 = 'https://43.240.156.118:8443/playurl/9103977d83aa77d11e99040e6bed780e.m3u8?ckey=8EB6D4B8DFB9F80FA06EA5157AC392964B61BC3D8C3D7635FE70217581FDDF55C33BB2DAEAA3FE759D0E2AFE2FF8CC65AAC2D470A6B3DC0FC6BF8A8E4F21C6FAAE6720CAF939007DD2CB07D0EC488B4C06B2D3238894CF75196DB77CC095C99AA605FDEED4A83262C7D0526560ECFF90C250E04E8E89B16E9B117DCF8CF843EA689A2DDD731590A5AF0D8BB8DD71693E558913B7E21C090159ED725125EA78A14206EB684D00996DE1AF58B57F8B8C3C7887E581BA0F2DFA29674A46D2AEABE3A62D72614AE089BBD5CA18CA05D213AF76C862C4BF57721788C2A96F15015469E40BF5FC852F7531449127A935F3CBBA&time=1722143321&client_netip=111.30.245.244&media_type=jpg';
    const lessthan10kb = 'https://www.agedm.org/favicon.ico';

    const manager_AGEAnime = new Manager_AGEAnime(
        [
            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },

            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'm3u8', url_source: url_m3u8_02 },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },

            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },
            { type: 'mp4', url_source: url_mp4_01_from_mdn },
        ]);
    try {
        await manager_AGEAnime.init_pool();
        await manager_AGEAnime.run();
    } catch (err) {
        console.log('err::', err);
    }
    manager_AGEAnime.summary();







    // try {
    //     const downloader_M3U8_ts = new Downloader_M3U8_ts('arr[0]');
    //     await downloader_M3U8_ts.run();
    // } catch (err) {
    //     console.log('err::', err);
    // }


}

run();

