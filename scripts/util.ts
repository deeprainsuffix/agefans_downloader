export function formatEpi(epi: number, sum: number) {
    if (!(epi >= 1 && epi <= sum)) {
        throw `epi不属于[1, ${sum}], epi: ${epi}`;
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