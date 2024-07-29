const uniqueStrElementId = 'veryUnique';
const M3U8UrlProp = 'data-M3U8Url';

// 这个函数是给浏览器用的，里面用到的变量必须局限在函数内部
export function runInChrome() {
    function overrideXHROpen() {
        const open = XMLHttpRequest.prototype.open;
        function overrideOpen(method: string, url: string | URL): void;
        function overrideOpen(method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
        function overrideOpen(this: XMLHttpRequest, method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
            const M3U8Url = url.toString();
            if (filterM3U8Url(M3U8Url)) {
                setTipEleM3U8Url(M3U8Url);
            }

            if (async !== undefined) {
                open.call(this, method, url, async, username, password);
            } else {
                open.call(this, method, url, true);
            }
        }

        XMLHttpRequest.prototype.open = overrideOpen;
    }

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

    overrideXHROpen();
}

export function getTipEleM3U8Url() {
    // 不能这么用，报错，应该使用puppeteer来获取
    const div = document.getElementById(uniqueStrElementId);
    if (!div) {
        throw '没有uniqueStrElementId对应元素'
    }

    return div.getAttribute(M3U8UrlProp)
}