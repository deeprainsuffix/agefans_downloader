/**
 * 这里面的函数是给浏览器用的，里面用到的变量必须局限在函数内部
 */

export function overrideXHROpen() {
    const M3U8EndStr = /playurl\/\w+\.m3u8/;
    function filterM3U8Url(url: string) {
        return M3U8EndStr.test(url)
    }

    const uniqueStrElementId = 'veryUnique',
        M3U8UrlProp = 'data-M3U8Url';
    function setTipEleM3U8Url(M3U8Url: string) {
        // 不需要去重
        const id = uniqueStrElementId;
        const div = document.createElement('div');
        div.setAttribute('id', id);
        div.setAttribute(M3U8UrlProp, M3U8Url);
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
        throw 'overrideXHROpen出错 -> ' + err; // 其实这里出错node端收不到，在puppeteer中打印
    }
}

export function waitForElementVideo() {
    const targetNode_id = 'artplayer';
    const errMsg = '探测video失败',
        timeout = 10 * 1000,
        errMsgTimeout = '探测video超时';

    const uniqueStrElementId = 'veryUnique',
        M3U8UrlProp = 'data-M3U8Url';
    function getTipEleM3U8Url() {
        return document.getElementById(uniqueStrElementId);
    }
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

                                video.addEventListener('loadstart', function handleEvent(e) {
                                    let url_source = '';
                                    const src = video.src;
                                    if (src.startsWith('blob:')) {
                                        const TipEleM3U8Url = getTipEleM3U8Url();
                                        if (TipEleM3U8Url) {
                                            url_source = TipEleM3U8Url.getAttribute(M3U8UrlProp) || '';
                                        }
                                    } else {
                                        url_source = src;
                                    }

                                    re(url_source);
                                }, false);
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