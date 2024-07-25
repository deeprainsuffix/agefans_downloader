export function overrideXHROpen() {
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

const uniqueStrElementId = 'veryUnique';
const M3U8UrlProp = 'data-M3U8Url';
const M3U8EndStr = 'playurl/m3u8';

function filterM3U8Url(url: string) {
    if (url.indexOf(M3U8EndStr)) {
        return true
    }

    return false
}

function setTipEleM3U8Url(m3u8Url: string) {
    // 不需要去重
    const id = uniqueStrElementId;
    const div = document.createElement('div');
    div.setAttribute('id', id);
    div.setAttribute(M3U8UrlProp, m3u8Url);
    document.body.appendChild(div);
}

function getTipEleM3U8Url() {
    const div = document.getElementById(uniqueStrElementId);
    if (!div) {
        throw '没有uniqueStrElementId对应元素'
    }

    return div.getAttribute(M3U8UrlProp)
}