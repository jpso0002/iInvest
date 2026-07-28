// Fictional news content — flavor copy only. All articles carry their own
// disclaimer; the illustrative % "move" per article isn't tied to any real
// or synthetic security (see content/assets.ts for the app's actual assets).

export interface NewsArticle {
  id: number;
  source: string;
  time: string;
  title: string;
  summary: string;
  tag: string;
  move: number;
  body: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 1,
    source: "Bloomberg Fiction",
    time: "12 min ago",
    title: "The Fed keeps rates unchanged, markets breathe again",
    summary: "Investors welcome the monetary stability expected for the quarter.",
    tag: "Central banks",
    move: 0.4,
    body: [
      "In this simulated announcement, the Federal Reserve chose to hold its benchmark interest rate steady, citing balanced risks between inflation and employment.",
      "Equity markets reacted positively, with major indices trading higher in early sessions. Bond yields eased as traders scaled back expectations of another hike this year.",
      "For a beginner investor, the takeaway is simple: when borrowing costs stay stable, companies find it easier to plan and grow, which usually supports asset prices in the short term.",
    ],
  },
  {
    id: 2,
    source: "Reuters Simulated",
    time: "42 min ago",
    title: "Broad index breaks a new symbolic milestone in this scenario",
    summary: "A rally in growth names pushes the index to a new high.",
    tag: "Indices",
    move: 1.2,
    body: [
      "A broad market index crossed a symbolic new high for the first time in this fictional scenario, driven by strong earnings from large growth companies.",
      "Growth and technology names led the rally, while defensive sectors lagged behind.",
      "Round-number milestones rarely change the underlying fundamentals, but they often attract new flows from momentum-following investors.",
    ],
  },
  {
    id: 3,
    source: "Volatility Daily",
    time: "1 h ago",
    title: "Volatile digital assets swing sharply in this scenario",
    summary: "Large simulated holders reposition despite recent turbulence.",
    tag: "Volatile assets",
    move: -0.8,
    body: [
      "In this simulation, large holders of a volatile digital-asset basket quietly repositioned over the past two weeks.",
      "Assets in this category are built to swing harder than a broad index or bond fund — that's the trade-off for their higher potential upside.",
      "History is not a guarantee, but sharp moves in either direction are normal for this asset class, not a sign that something is broken.",
    ],
  },
  {
    id: 4,
    source: "Finance Edu",
    time: "2 h ago",
    title: "Why inflation is slowing but not disappearing",
    summary: "A simple breakdown of the mechanisms keeping prices elevated.",
    tag: "Economy",
    move: 0.1,
    body: [
      "Headline inflation has cooled from its peak, yet core measures — which strip out food and energy — remain stubbornly above central bank targets.",
      "Services inflation, particularly housing and wages, tends to move slowly and keeps overall price growth elevated.",
      "For long-term investors, real returns (after inflation) matter more than nominal ones. Diversifying across asset classes helps preserve purchasing power.",
    ],
  },
  {
    id: 5,
    source: "MarketWatch Jr",
    time: "3 h ago",
    title: "A simulated growth stock announces a special payout",
    summary: "The company rewards shareholders in this simulation exercise.",
    tag: "Stocks",
    move: 2.4,
    body: [
      "In this made-up scenario, a growth-stage company surprised the market with a one-time special dividend to reward long-term shareholders.",
      "Special dividends differ from regular ones: they are exceptional payouts, often funded by excess cash, and do not commit the company to future payments.",
      "The stock jumped on the announcement, though analysts remind investors that a dividend does not create value — it simply moves cash from the company to its owners.",
    ],
  },
  {
    id: 6,
    source: "Finimize Learn",
    time: "5 h ago",
    title: "ETFs: how to diversify with a single click",
    summary: "A quick guide to understanding index funds and their fees.",
    tag: "Education",
    move: 0.0,
    body: [
      "An ETF (Exchange-Traded Fund) bundles many stocks or bonds into a single security you can buy like a share.",
      "The main advantages are instant diversification, low fees (often below 0.25% per year), and full transparency about what you own.",
      "For beginners, a broad global equity ETF is often a solid starting point — it spreads risk across hundreds of companies in a single trade.",
    ],
  },
  {
    id: 7,
    source: "Steady Income Weekly",
    time: "6 h ago",
    title: "Bond funds attract inflows in this scenario",
    summary: "Investors lean toward steadier holdings amid simulated uncertainty.",
    tag: "Bonds",
    move: 0.6,
    body: [
      "Low-volatility bond funds saw simulated inflows this week as some investors leaned toward steadier holdings.",
      "Unlike a stock, a bond fund's return is driven mostly by interest payments rather than price swings.",
      "Many portfolios hold a mix of steadier assets like bonds alongside more volatile ones, precisely so the overall ride is smoother.",
    ],
  },
];

export function getArticleById(id: number | string): NewsArticle | null {
  const num = Number(id);
  return NEWS_ARTICLES.find((a) => a.id === num) ?? null;
}
