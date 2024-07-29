/**
 * 这里面的函数是给浏览器用的，里面用到的变量必须局限在函数内部
 */

export function overrideXHROpen() {
    const M3U8EndStr = 'playurl/m3u8';
    function filterM3U8Url(url: string) {
        if (url.indexOf(M3U8EndStr)) {
            return true
        }

        return false
    }

    const uniqueStrElementId_internal = 'veryUnique';
    const M3U8UrlProp_internal = 'data-M3U8Url';
    function setTipEleM3U8Url(m3u8Url: string) {
        // 不需要去重
        const id = uniqueStrElementId_internal;
        const div = document.createElement('div');
        div.setAttribute('id', id);
        div.setAttribute(M3U8UrlProp_internal, m3u8Url);
        document.body.appendChild(div);
    }

    function exec() {
        const open_initial = XMLHttpRequest.prototype.open;
        function overrideOpen(method: string, url: string | URL): void;
        function overrideOpen(method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
        function overrideOpen(this: XMLHttpRequest, method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
            const M3U8Url = url.toString();
            if (filterM3U8Url(M3U8Url)) {
                setTipEleM3U8Url(M3U8Url);
            }

            if (async !== undefined) {
                open_initial.call(this, method, url, async, username, password);
            } else {
                open_initial.call(this, method, url, true);
            }
        }

        XMLHttpRequest.prototype.open = overrideOpen;
    }

    try {
        exec();
    } catch (err) {
        throw 'overrideXHROpen出错 -> ' + err;
    }
}

export function getTipEleM3U8Url() {
    const uniqueStrElementId = 'veryUnique';
    const M3U8UrlProp = 'data-M3U8Url';
    // 不能这么用，报错，应该使用puppeteer来获取 todo
    const div = document.getElementById(uniqueStrElementId);
    if (!div) {
        throw '没有uniqueStrElementId对应元素'
    }

    return div.getAttribute(M3U8UrlProp)
}

export function waitForElementVideo() {
    const targetNode_id = 'artplayer';
    const errMsg = '探测video失败',
        timeout = 30 * 1000,
        errMsgTimeout = '探测video超时';
    return new Promise((re, rj) => {
        try {
            const observer = new MutationObserver(function (mutationsList, observer) {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            // @ts-ignore 类型有问题
                            if (node.id === targetNode_id) {
                                // @ts-ignore
                                const ele: HTMLElement = node;
                                observer.disconnect();
                                const video = ele.querySelector('video');
                                if (!video) {
                                    return rj(errMsg);
                                }

                                const src = video.getAttribute('src');
                                console.log('src::', src,); // todo mp4视频有，但m3u8没有，需要跟上边配合
                                if (!src) {
                                    return rj(errMsg);
                                }

                                re(src);
                            }
                        });
                    }
                }
            });

            const config = { childList: true };
            observer.observe(document.body, config);

            setTimeout(() => {
                observer.disconnect();
                rj(errMsgTimeout);
            }, timeout);
        } catch (err) {
            throw 'waitForElementVideo出错 -> ' + err;
        }
    })
}