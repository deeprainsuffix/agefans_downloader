# todo

* 下载前判断wifi还是流量，应该是在puppeteer启动前
* todo 可以自定义哪些集数下载
* todo 记录过程时间
* todo 内存，测试下载mp4时，下载进程内容在30M左右，而下载M3U8，因为将ts都存在内存的原因，峰值到了800M，一集300~400M
* todo Manager_AGEAnime的printError中要记录错误到文件吗？或者在更外层
* done 下载速度 我自己电脑WIFI下是6-7M/s
* todo check meta.ts
* todo 突然看到puppeteer可以运行在chrome插件中(试验阶段)，可以考虑开发插件
* todo puppeteer内存
* done dispose其实不需要，因为导航时会自动释放
* todo 怎么打开两个tab页？
* todo page.isJavaScriptEnabled
* todo beforeRun checkMeta()
* todo 把字段的注释信息加一下
* todo 组织一下文件
* done 网站的mp4视频经常403，是网站的问题
