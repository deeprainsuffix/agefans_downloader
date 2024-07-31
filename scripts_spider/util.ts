import { type I_Meta } from '../meta.js'

export function get_episode_wanted(metaRange: I_Meta['range'], sum: number) {
    const set = new Set<number>();
    if (sum === 0) {
        return [];
    }

    if (metaRange === 'all') {
        for (let epi = 1; epi <= sum; epi++) {
            set.add(epi);
        }
    }

    if (Array.isArray(metaRange)) {
        for (const epiOrRange of metaRange) {
            if (typeof epiOrRange === "number") {
                if (epiOrRange >= 0 && epiOrRange <= sum) {
                    set.add(epiOrRange);
                }
            } else {
                for (let epi = Math.max(epiOrRange[0], 1); epi <= Math.min(epiOrRange[1], sum); epi++) {
                    set.add(epi);
                }
            }
        }
    }

    return [...set]
}

export function formatEpi(epi: number, sum: number): string {
    if (!(epi >= 1 && epi <= sum)) {
        return String(epi)
    }

    let result = String(epi);
    let l = Math.floor(Math.log10(epi)) + 1;
    const r = Math.floor(Math.log10(sum)) + 1;
    while (l < r) {
        result = '0' + result;
        l++;
    }

    return result
}