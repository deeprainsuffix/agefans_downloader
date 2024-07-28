// 手动测了一下大致流程，这里先不写了，太花时间

/**
 * test_item_1
 * assert失败
 * Downloader_MP4
 * done 1、地址错误
 * done 2、响应码错误
 * done 3、内容量小于10kb
 * done 4、run失败
 */


/**
 * test_item_2
 * assert失败
 * Downloader_M3U8_ts
 * done 1、地址错误
 * done 2、响应码错误
 * done 3、内容量小于10kb
 * done 4、run失败
 */


/**
 * test_item_3
 * assert失败
 * Manager_M3U8
 * done 1、m3u8地址错误
 * done 2、m3u8地址响应码错误
 * done 3、m3u8地址未解析出ts视频片段地址
 * done 4、任意一个ts下载失败
 * done 6、连续threshold_run个Downloader_M3U8_ts的run失败
 * done 7、retry环节，所有轮次，任意 < threshold_retry个task_retry失败
 * done 8、retry环节，任意轮次，threshold_retry个task_retry失败
 * done 9、run失败
 */

/**
 * test_item_3
 * assert成功
 * Manager_M3U8
 * done 5、任意非连续threshold_run个Downloader_M3U8_ts的run失败，retry成功
 */


/**
 * test_item_4
 * assert失败(不影响之前已下载到本地的)
 * Manager_AGEAnime
 * done 2、init_pool失败
 * done 4、连续threshold_run个Downloader_MP4的run失败
 * done 6、retry环节，任意轮次，threshold_retry个task_retry失败
 * done 8、在非达成4和6条件下，任意Manager_M3U8和Downloader_MP4下载失败，retry失败
 * done 9、run中失败
 */

/**
 * test_item_4
 * assert成功
 * Manager_AGEAnime
 * done 1、init_pool任意Manager_M3U8或Downloader_MP4初始化失败
 * done 3、任意非连续threshold_run个Downloader_MP4的run失败，retry成功
 * done 5、retry环节，任意 < threshold_retry个task_retry失败
 * done 7、在非达成4和6条件下，任意Manager_M3U8和Downloader_MP4下载失败，retry成功
 * done 10、无论失败与否，summary准确输出
 */