import type {
  DataFeedConfig,
  DataSnapshot,
  WeatherData,
  NewsData,
  OnChainData,
  CalendarData,
  SocialData,
} from "./types";
import { cacheDataFeed, getCachedDataFeed } from "./db";

// ============================================================
// Data Feed Fetchers — 3-tier fallback per feed
// ============================================================

const FETCH_TIMEOUT_MS = 15_000;

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// --- Weather (OpenWeatherMap) ---

function getDefaultWeather(): WeatherData {
  return {
    temp: 28,
    feelsLike: 30,
    humidity: 50,
    condition: "clear",
    description: "clear sky",
    windSpeed: 10,
    visibility: 10000,
    sunrise: "06:00",
    sunset: "18:00",
  };
}

async function fetchWeather(
  config: DataFeedConfig
): Promise<WeatherData | null> {
  if (!config.weatherEnabled) return null;

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  // 1. Primary API
  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${config.location.lat}&lon=${config.location.lon}&appid=${apiKey}&units=metric`;
      const res = await fetch(url, { signal: withTimeout(FETCH_TIMEOUT_MS) });

      if (res.ok) {
        const raw = await res.json();
        const parsed: WeatherData = {
          temp: raw.main?.temp ?? 28,
          feelsLike: raw.main?.feels_like ?? 30,
          humidity: raw.main?.humidity ?? 50,
          condition: raw.weather?.[0]?.main ?? "clear",
          description: raw.weather?.[0]?.description ?? "clear sky",
          windSpeed: raw.wind?.speed ?? 10,
          visibility: raw.visibility ?? 10000,
          sunrise: raw.sys?.sunrise
            ? new Date(raw.sys.sunrise * 1000).toISOString()
            : "06:00",
          sunset: raw.sys?.sunset
            ? new Date(raw.sys.sunset * 1000).toISOString()
            : "18:00",
        };
        await cacheDataFeed(config.mirrorType, "weather", parsed);
        return parsed;
      }
    } catch (err) {
      console.error(`[${config.mirrorType}] Weather API error:`, err);
    }
  }

  // 2. Cache fallback
  const cached = await getCachedDataFeed(config.mirrorType, "weather");
  if (cached) return cached as WeatherData;

  // 3. Static default
  return getDefaultWeather();
}

// --- News (NewsAPI) ---

function getDefaultNews(): NewsData {
  return { headlines: [], topKeyword: "" };
}

async function fetchNews(config: DataFeedConfig): Promise<NewsData | null> {
  const apiKey = process.env.NEWSAPI_KEY;

  // 1. Primary API
  if (apiKey) {
    try {
      const query = config.newsKeywords.join(" OR ");
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
      const res = await fetch(url, { signal: withTimeout(FETCH_TIMEOUT_MS) });

      if (res.ok) {
        const raw = await res.json();
        const articles = raw.articles ?? [];
        const parsed: NewsData = {
          headlines: articles.slice(0, 5).map(
            (a: { title?: string; source?: { name?: string }; description?: string }) => ({
              title: a.title ?? "",
              source: a.source?.name ?? "",
              description: a.description ?? "",
            })
          ),
          topKeyword:
            config.newsKeywords[0] ?? "",
        };
        await cacheDataFeed(config.mirrorType, "news", parsed);
        return parsed;
      }
    } catch (err) {
      console.error(`[${config.mirrorType}] News API error:`, err);
    }
  }

  // 2. Cache fallback
  const cached = await getCachedDataFeed(config.mirrorType, "news");
  if (cached) return cached as NewsData;

  // 3. Static default
  return getDefaultNews();
}

// --- On-Chain Data (CoinGecko) ---

function getDefaultOnChain(): OnChainData {
  return {
    solPrice: 150,
    sol24hChange: 0,
    solMarketCap: 0,
    solVolume: 0,
    trendingCoins: [],
  };
}

async function fetchOnChainData(
  config: DataFeedConfig
): Promise<OnChainData | null> {
  if (!config.onChainEnabled) return null;

  // 1. Primary: CoinGecko (works without API key on free tier)
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true";
    const headers: Record<string, string> = {};
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }
    const res = await fetch(url, {
      headers,
      signal: withTimeout(FETCH_TIMEOUT_MS),
    });

    if (res.ok) {
      const raw = await res.json();
      const sol = raw.solana ?? {};
      const parsed: OnChainData = {
        solPrice: sol.usd ?? 150,
        sol24hChange: sol.usd_24h_change ?? 0,
        solMarketCap: sol.usd_market_cap ?? 0,
        solVolume: sol.usd_24h_vol ?? 0,
        trendingCoins: [],
      };

      // Also fetch trending if possible
      try {
        const trendRes = await fetch(
          "https://api.coingecko.com/api/v3/search/trending",
          { headers, signal: withTimeout(FETCH_TIMEOUT_MS) }
        );
        if (trendRes.ok) {
          const trendRaw = await trendRes.json();
          parsed.trendingCoins = (trendRaw.coins ?? [])
            .slice(0, 5)
            .map((c: { item?: { name?: string } }) => c.item?.name ?? "");
        }
      } catch {
        // Trending is optional
      }

      await cacheDataFeed(config.mirrorType, "onchain", parsed);
      return parsed;
    }
  } catch (err) {
    console.error(`[${config.mirrorType}] CoinGecko API error:`, err);
  }

  // 2. Cache fallback
  const cached = await getCachedDataFeed(config.mirrorType, "onchain");
  if (cached) return cached as OnChainData;

  // 3. Static default
  return getDefaultOnChain();
}

// --- Calendar Events (Calendarific + custom) ---

function getDefaultCalendar(): CalendarData {
  return { holidays: [], customEvents: [] };
}

async function fetchCalendarEvents(
  config: DataFeedConfig
): Promise<CalendarData | null> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Check custom events from config (always available, no API needed)
  const activeCustomEvents = config.customEvents.filter((event) => {
    const start = event.startMonth * 100 + event.startDay;
    const end = event.endMonth * 100 + event.endDay;
    const current = month * 100 + day;

    // Handle events spanning year boundary (e.g., Dec 15 → Jan 28)
    if (start > end) {
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  });

  const customEvents = activeCustomEvents.map((e) => ({
    name: e.name,
    description: e.description,
    visualImpact: e.visualImpact,
  }));

  // Fetch public holidays from Calendarific
  const apiKey = process.env.CALENDARIFIC_API_KEY;
  let holidays: { name: string; type: string }[] = [];

  if (apiKey) {
    try {
      const year = now.getFullYear();
      const url = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${config.calendarCountry}&year=${year}&month=${month}&day=${day}`;
      const res = await fetch(url, { signal: withTimeout(FETCH_TIMEOUT_MS) });

      if (res.ok) {
        const raw = await res.json();
        holidays = (raw.response?.holidays ?? []).map(
          (h: { name?: string; type?: string[] }) => ({
            name: h.name ?? "",
            type: h.type?.[0] ?? "public",
          })
        );
      }
    } catch (err) {
      console.error(`[${config.mirrorType}] Calendarific API error:`, err);
    }
  }

  const result: CalendarData = { holidays, customEvents };
  await cacheDataFeed(config.mirrorType, "calendar", result);
  return result;
}

// --- Social (placeholder for MVP — skip Google Trends) ---

function getDefaultSocial(): SocialData {
  return { trendingSearches: [], interestScore: 50 };
}

// ============================================================
// Main Aggregator
// ============================================================

/**
 * Fetch all data feeds for a mirror type in parallel.
 * Each feed independently falls back on failure.
 */
export async function fetchMirrorData(
  config: DataFeedConfig
): Promise<DataSnapshot> {
  const [weather, news, onChain, calendar] = await Promise.allSettled([
    fetchWeather(config),
    fetchNews(config),
    fetchOnChainData(config),
    fetchCalendarEvents(config),
  ]);

  return {
    weather:
      weather.status === "fulfilled" ? weather.value : getDefaultWeather(),
    news: news.status === "fulfilled" ? news.value : getDefaultNews(),
    onChain:
      onChain.status === "fulfilled" ? onChain.value : getDefaultOnChain(),
    social: getDefaultSocial(),
    calendar:
      calendar.status === "fulfilled"
        ? calendar.value
        : getDefaultCalendar(),
    fetchedAt: new Date().toISOString(),
  };
}
