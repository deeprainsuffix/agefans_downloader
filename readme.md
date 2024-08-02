# agefans_downloader

从AGE animation下载动漫到本地观看
[AGE动漫官网，帅帅帅！！！](https://www.agedm.org)

## 项目介绍

本人看视频，不管是电影、动漫、剧集等等，基本都是下载到本地观看，不习惯在app或是网站上追。像动漫，十来集还好，集数多的话，一集集下太麻烦了，于是有了此项目。

## 用法

1. npm i
2. 改根目录下meta.ts文件
3. npm run build(别报错)
4. npm run start(第一步先清空根目录下的download文件夹，下载完成记得将download中的动漫文件移出)

### 注意

1. 下载目录：根目录下的download文件夹下
2. 启动第一步先清空download文件夹，下载完成后，如果想再下其他的，别忘了先把文件copy
3. 报错了不影响已经下载好的文件，若有下载失败的，重新下配置meta.ts，重新下载(记得copy download中已经下载的)
4. 网站的mp4视频有一些经常403，是网站的问题

## todo

* 测试下载mp4时，下载进程内存使用在30M-40M左右，而下载M3U8，因为将ts片段都存在内存的原因，峰值到了800M，一集300~400M，可制定策略降低内存使用。(这一点其实用起来没什么影响)
* 从使用上来说，还是chrome插件好，方便多了，后边有时间再做(后边有时间再做 = 不做，哈哈哈)
* 其他...

## 遵守规则

* 软件禁止任何商业用途
* 下载的视频只用于自己观看
