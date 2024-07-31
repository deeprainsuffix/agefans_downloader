import { existsSync, rmSync, mkdirSync } from 'fs';
import { download_dir } from './config.js';
import { launch } from '../scripts_process/process_spider.js';

function redir_download_dir() {
    if (existsSync(download_dir)) {
        rmSync(download_dir, { recursive: true, force: true });
    }
    mkdirSync(download_dir);
}

function launch_before() {
    redir_download_dir();
}

launch_before();
launch();