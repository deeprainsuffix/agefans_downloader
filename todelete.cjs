const fs = require('fs');
const path = require('path');

// 目标文件夹路径
const targetDirs = [
    'D:/second_study/project/age_animation_cache',
    'D:/second_study/project/age_animation_cache/scripts_download',
    'D:/second_study/project/age_animation_cache/scripts_spider',
];

// 异步函数，删除目标文件夹中的所有.js文件
async function deleteJsFiles(dir) {
    // 读取目录中的所有文件和目录
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && path.extname(fullPath) === '.js') {
            // 是文件且扩展名为.js，则删除该文件
            await fs.promises.unlink(fullPath);
        }
    }
}

targetDirs.forEach(targetDir => {
    // 执行删除操作
    deleteJsFiles(targetDir)
        .then(() => console.log('所有.js文件删除完毕'))
        .catch(error => console.error('删除.js文件时发生错误:', error));
})

