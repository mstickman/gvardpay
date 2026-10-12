/**
 * Цены токенов в USD — CoinGecko public API.
 * Кэш на минуту, чтобы не дёргать API на каждый рендер, и не падать
 * с ошибкой, если сеть недоступна или лимит запросов исчерпан —
 * в этом случае просто отдаём последнее известное значение (или 0).
 */

const CACHE_TTL_MS = 60_000;
let cache: { data: Record<string, number>; ts: number } | null = null;

export const getPricesUsd = async (coingeckoIds: string[]): Promise<Record<string, number>> => {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const ids = [...new Set(coingeckoIds)].join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    );
    if (!res.ok) throw new Error(`CoinGecko вернул ${res.status}`);
    const json = await res.json();

    const data: Record<string, number> = {};
    for (const id of coingeckoIds) {
      data[id] = json[id]?.usd ?? cache?.data[id] ?? 0;
    }
    cache = { data, ts: Date.now() };
    return data;
  } catch (error) {
    console.warn('[Price] Не удалось получить курс, использую последнее известное значение:', error);
    return cache?.data ?? Object.fromEntries(coingeckoIds.map((id) => [id, 0]));
  }
};

export const getSolPriceUsd = async (): Promise<number> => {
  const prices = await getPricesUsd(['solana']);
  return prices.solana ?? 0;
};

let kztCache: { rate: number; ts: number } | null = null;

/**
 * Сколько тенге за 1 доллар. CoinGecko отдаёт цену SOL сразу в USD и KZT —
 * делим одно на другое, отдельный источник курса не нужен.
 * Возвращает 0, если курс получить не удалось (вызывающий решает, что делать).
 */
export const getKztPerUsd = async (): Promise<number> => {
  if (kztCache && Date.now() - kztCache.ts < CACHE_TTL_MS) return kztCache.rate;
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,kzt');
    if (!res.ok) throw new Error(`CoinGecko вернул ${res.status}`);
    const json = await res.json();
    const usd = json?.solana?.usd;
    const kzt = json?.solana?.kzt;
    if (!usd || !kzt) throw new Error('нет данных по usd/kzt');
    kztCache = { rate: kzt / usd, ts: Date.now() };
    return kztCache.rate;
  } catch (error) {
    console.warn('[Price] Не удалось получить курс тенге:', error);
    return kztCache?.rate ?? 0;
  }
};
