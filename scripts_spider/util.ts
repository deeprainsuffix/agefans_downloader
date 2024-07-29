import { type I_Meta } from '../meta.js'

export function getEpisode(metaRange: I_Meta['range'], sum: number) {
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