/**
 * Ready-made articles, researched from verified sources on 21 November 2026.
 * Written in our own words; every article lists its sources at the end.
 * Admins import these as drafts from /admin/starter, review, then publish.
 *
 * Keep claims attributed ("Rockstar says…", "one report…") where only the
 * company or a single outlet is the source.
 */

export type StarterArticle = {
  slug: string;
  title: string;
  /** Category slug (must exist in the Categories table) */
  category: string;
  excerpt: string;
  body: string;
};

export const STARTER_RESEARCHED_ON = "21 November 2026";

export const STARTER_ARTICLES: StarterArticle[] = [
  {
    slug: "gta-vi-out-now-ps5-xbox-series",
    title: "GTA VI is out now on PS5 and Xbox Series X|S",
    category: "news",
    excerpt:
      "After two delays and three trailers, Grand Theft Auto VI launched worldwide on 19 November 2026. Here's what you get, where to buy it, and what's still to come.",
    body: `After more than two years of trailers and two delays, Grand Theft Auto VI is finally here. Rockstar Games released the game worldwide on **Thursday, 19 November 2026** for **PlayStation 5** and **Xbox Series X|S**, unlocking at midnight local time in each region.

## What is GTA VI about?

The game is set in Leonida, Rockstar's sun-soaked take on Florida and home to Vice City. You play as Jason Duval and Lucia Caminos, a criminal duo whose plan goes wrong and pulls them into a conspiracy that stretches right across the state. It's rated M (Mature) by the ESRB.

## Where can you buy it?

GTA VI is sold through the PlayStation Store, the Microsoft Store, the Rockstar Games Store and retailers. There are two editions, **Standard** and **Ultimate**, and Standard owners can buy an Ultimate Edition upgrade as a digital add-on. When pre-orders opened in June, the US prices were reported as $79.99 for Standard and $99.99 for Ultimate.

The digital pre-order bonus has now ended. It only applied to purchases made before 20 November and included the Vintage Vice City Pack (a '55 Vapid Stanier sedan with a garage, outfits and hairstyles, and a weapon pattern) plus one month of GTA+. If you pre-ordered, redeem that GTA+ month by 31 March 2027.

## Is there a PC version?

Not yet. Rockstar hasn't announced a PC release. That's in line with its history: GTA V reached PC in 2015, about 18 months after it launched on consoles.

## What's next?

- **The music:** *Grand Theft Auto VI: The Album* is out now, and the original score by Justice follows on 11 December. [More on the soundtrack](/news/gta-vi-soundtrack-album-justice-score).
- **Online:** there's no online mode at launch, and Rockstar hasn't given a date. [Here's what we know](/news/does-gta-vi-have-online-multiplayer).
- **Questions about editions, pre-load or PC?** See our [GTA VI FAQ](/news/gta-vi-faq-price-editions-pc).

---

*Sources: [Rockstar Newswire: Grand Theft Auto VI Now Available](https://www.rockstargames.com/newswire/article/39akk424a9oo53/grand-theft-auto-vi-now-available) · [Rockstar Newswire: Pre-Order Grand Theft Auto VI on June 25](https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25) · [Rockstar Support: pre-order details](https://support.rockstargames.com/articles/46YkMi4rHxYXMeIHtZiKaE/grand-theft-auto-vi-pre-order-details) · [Yahoo Finance: Take-Two earnings](https://finance.yahoo.com/markets/stocks/articles/two-shares-gain-results-guidance-215155402.html)*`,
  },
  {
    slug: "gta-vi-day-one-sales-record",
    title: "GTA VI made $3.79 billion on day one, Rockstar says",
    category: "news",
    excerpt:
      "Rockstar and Take-Two say GTA VI is the biggest entertainment launch ever, with an estimated $3.79 billion in first-day retail sales.",
    body: `Grand Theft Auto VI didn't just launch, it set a new high-water mark. According to Rockstar and its parent company Take-Two Interactive, the game generated an estimated **$3.79 billion in worldwide retail sales on its first day**. The companies describe that as a record for any entertainment launch, across games, film and music.

Rockstar also says GTA VI sold **32.5 million units before release**, which it calls a pre-launch record across all platforms.

## How solid are the numbers?

Both figures are the companies' own estimates. They haven't said how much of the $3.79 billion came from pre-orders, or how many copies were sold on launch day itself. Independent trackers had estimated lower figures on the morning of launch, before Rockstar's announcement.

## How does it compare with GTA V?

GTA V was already a record-breaker: it took more than $800 million on its first day in September 2013. Going by Rockstar's estimate, GTA VI's first day was more than four times bigger.

## What Take-Two expected

Ten days before launch, Take-Two CEO Strauss Zelnick said pre-orders were "continuing to reach unprecedented levels" and that the company expected "an historic year". Take-Two kept its full-year outlook of $8.0–8.2 billion in net bookings.

---

*Sources: [Yahoo / AP: GTA 6 sets record with $3.79 billion in first-day sales](https://www.yahoo.com/entertainment/movies/box-office-results/articles/gta-6-sets-record-3-195125280.html) · [Men's Journal: GTA 6 day-one sales](https://www.mensjournal.com/news/gta-6-3-79-billion-day-one-sales-rockstar) · [Yahoo Finance: Take-Two Q1 2027 earnings](https://finance.yahoo.com/markets/stocks/articles/two-q1-2027-earnings-gta-132208847.html) · [Yahoo Finance: Take-Two shares rise as November 19 release confirmed](https://finance.yahoo.com/markets/stocks/articles/two-shares-rise-over-3-113921042.html) · [NBC News: Grand Theft Auto V tops $800 million on first day](https://www.nbcnews.com/tech/video-games/grand-theft-auto-v-tops-800-million-first-day-f4B11187483)*`,
  },
  {
    slug: "gta-vi-reviews-metacritic-99",
    title: "GTA VI reviews: 99 on Metacritic ties the all-time record",
    category: "news",
    excerpt:
      "Critics have given GTA VI a 99 Metascore, matching Ocarina of Time's long-standing record. Here's what reviewers loved and what they didn't.",
    body: `The reviews are in, and they're about as good as it gets. At the time of writing, the PlayStation 5 version of Grand Theft Auto VI holds a **99 on Metacritic**, built from around 150 critic reviews. That ties *The Legend of Zelda: Ocarina of Time* (1998) for the highest Metascore ever recorded for a video game, though Ocarina's 99 came from just 22 reviews. OpenCritic shows a similarly high average.

## What critics praised

Reviewers consistently singled out the scale and detail of Leonida, the world's sense of life, and the storytelling around Jason and Lucia.

## What they criticised

Even top-scoring reviews raised a few complaints. According to review roundups, some missions feel restrictive, the pacing drags in places, the controls are occasionally awkward, and the game runs at 30 frames per second on consoles.

## The user score

Player scores tell a different story for now. One report puts the Metacritic user score for the PS5 version at 5.4, amid claims of review-bombing. User reviews only open after release, so treat early user numbers with caution.

*Scores were checked on ${STARTER_RESEARCHED_ON} and may change as more reviews arrive.*

---

*Sources: [Dot Esports: GTA 6 review roundup](https://dotesports.com/gta/news/gta-6-review-roundup) · [All Things How: GTA 6 ties Ocarina of Time's record](https://allthings.how/gta-6-review-embargo-metacritic-score/) · [Yahoo: GTA 6 Metacritic score, where it ranks](https://www.yahoo.com/entertainment/movies/articles/gta-6-metacritic-score-did-124312618.html) · [Nacionale: critics vs user score](https://www.nacionale.com/en/articles/is-gta-6-good-reviews-metacritic-99-what-critics-say-complaints-30fps-pacing)*`,
  },
  {
    slug: "every-gta-vi-trailer",
    title: "Every GTA VI trailer so far, and the records they broke",
    category: "trailers",
    excerpt:
      "From the record-breaking reveal in December 2023 to the Launch Trailer in October 2026, here's every official GTA VI trailer.",
    body: `Rockstar released three main trailers before launch, and each one became an event in its own right.

## Trailer 1 (December 2023)

The reveal trailer introduced Lucia and Jason, Vice City and a 2025 release window. It became the most-watched video game reveal on YouTube, with roughly 90 million views in its first 24 hours, and it's still the most-watched video on Rockstar's channel.

## Trailer 2 (6 May 2025)

Trailer 2 arrived days after the first delay and put Jason and Lucia front and centre. Rockstar said it drew more than **475 million views across platforms in 24 hours**, calling it "the biggest video launch of all time" ahead of the *Deadpool & Wolverine* trailer's 365 million. That figure combines YouTube, Instagram, X, Facebook and other platforms. On YouTube alone, it didn't beat Trailer 1.

## Launch Trailer (15 October 2026)

The final trailer landed about a month before release. It debuted **"Flower in a Hurricane"** from the game's score composers Justice, featuring Tame Impala, SZA and King Gizzard & The Lizard Wizard.

## Watch them

You'll find official trailers on our [Videos](/videos) page as we add them.

---

*Sources: [Rockstar: Trailer 1](https://www.rockstargames.com/VI/trailer-1) · [Rockstar: Trailer 2](https://www.rockstargames.com/VI/trailer-2) · [Rockstar: Launch Trailer](https://www.rockstargames.com/VI/launch-trailer) · [The Hollywood Reporter: Trailer 2 views record](https://www.hollywoodreporter.com/business/business-news/gta-6-trailer-2-views-record-1236210396/) · [PC Gamer: biggest video launch of all time](https://pcgamer.com/games/grand-theft-auto/rockstar-says-gta-6s-second-trailer-is-now-the-biggest-video-launch-of-all-time-whatever-that-means) · [TweakTown: Trailer 2 vs Trailer 1 on YouTube](https://www.tweaktown.com/news/105101/grand-theft-auto-6-trailer-2-fails-to-beat-the-world-record-set-by-1/index.html)*`,
  },
  {
    slug: "gta-vi-characters-confirmed-cast",
    title: "GTA VI characters: Jason, Lucia and the confirmed cast",
    category: "characters",
    excerpt:
      "Meet the two protagonists of Grand Theft Auto VI and the supporting cast Rockstar introduced before launch. No story spoilers.",
    body: `GTA VI has two playable leads, and Rockstar introduced a handful of supporting characters before launch. This guide sticks to Rockstar's official profiles, so there are **no story spoilers**.

## Jason Duval

Jason grew up surrounded by grifters and crooks, and ended up in the Leonida Keys doing what he knows best: working for local drug runners. He lives rent-free in a property owned by Brian, on the condition that he helps with Brian's shakedowns.

## Lucia Caminos

Lucia went to the Leonida Penitentiary after fighting to protect her family. She's now out of prison and determined to make her plan work, this time on her own terms.

Together, Jason and Lucia find themselves on "the darkest side of the sunniest place in America", as Rockstar puts it, after an easy score goes wrong.

## Cal Hampton

Jason's friend and another of Brian's associates. Cal is happiest at home, listening in on Coast Guard radio traffic.

## Brian Heder

A veteran drug runner from the golden age of smuggling in the Keys, and Jason's landlord.

## Also introduced

**Boobie Ike**, **Dre'Quan Priest**, the rap duo **Real Dimez** and the seasoned bank robber **Raul Bautista** round out the cast Rockstar showed before launch.

---

*Sources: [Rockstar: Jason Duval](https://www.rockstargames.com/VI/only-in-leonida/jason) · [Rockstar: Lucia Caminos](https://www.rockstargames.com/VI/only-in-leonida/lucia) · [PC Gamer: GTA 6 characters](https://www.pcgamer.com/games/action/grand-theft-auto/gta6-characters) · [Insider Gaming: all confirmed characters](https://insider-gaming.com/all-confirmed-characters-in-gta-6/)*`,
  },
  {
    slug: "leonida-map-regions-explained",
    title: "Leonida explained: the regions of GTA VI's map",
    category: "map",
    excerpt:
      "Vice City, the Keys, Grassrivers and more: a guide to the six regions of Leonida that Rockstar named before launch.",
    body: `GTA VI takes place in **Leonida**, Rockstar's satirical take on Florida. Before launch, Rockstar named six regions of the state. Here's what we know about each.

## Vice City

The series' neon-lit take on Miami, and the heart of the state. Jason and Lucia's story pulls them through the city and well beyond it.

## Leonida Keys

A chain of islands with a long history of smuggling. It's where Jason works for local drug runners, and Brian is a veteran of the area's smuggling heyday.

## Grassrivers

Wild wetlands inspired by the Everglades. The in-game country station Back Country Radio broadcasts to Grassrivers and Port Gellhorn.

## Port Gellhorn

Another region covered by Back Country Radio, away from the glitz of Vice City.

## Ambrosia

Named by Rockstar in its official pre-launch material.

## Mount Kalaga

A national park, and part of Rockstar's "Only in Leonida" series.

## What about the full map?

Rockstar didn't publish a full map before launch, and "leaked" maps circulating online were never verified. Now that the game is out, we'll publish a proper explorer's guide.

---

*Sources: [Rockstar: Only in Leonida, Mount Kalaga](https://www.rockstargames.com/VI/only-in-leonida/kalaga) · [Rockstar Newswire: GTA VI in-game radio stations](https://www.rockstargames.com/newswire/article/o3982oa93a23k4/the-music-of-grand-theft-auto-vi-in-game-radio-stations) · [Rockstar: Jason Duval](https://www.rockstargames.com/VI/only-in-leonida/jason) · [Gfinity: GTA 6 map guide](https://www.gfinityesports.com/article/gta-6-map-guide-every-confirmed-location-in-leonida)*`,
  },
  {
    slug: "does-gta-vi-have-online-multiplayer",
    title: "Does GTA VI have online multiplayer? What we know",
    category: "online",
    excerpt:
      "GTA VI launched without an online mode, and Rockstar hasn't given a date. Here's what's confirmed, what's rumoured, and what happens to GTA Online.",
    body: `**Short answer:** not yet. As of ${STARTER_RESEARCHED_ON}, Grand Theft Auto VI is single-player only, and Rockstar hasn't announced an online mode or a date for one.

## What's been reported

- In September 2026, Bloomberg reported that Twitch CEO Dan Clancy expected Rockstar to launch an online mode in 2027. Clancy later said he didn't actually know when it would arrive.
- Leaked documents and datamined files have been discussed online, but none of them are confirmed. Treat specific player counts or features as rumours.

## What history suggests

Rockstar has usually followed a big story launch with multiplayer a few weeks later. GTA Online arrived about two weeks after GTA V in 2013, and Red Dead Online's beta followed Red Dead Redemption 2 by about a month in 2018. GTA VI is already past that kind of window without an announcement, which fits the reports of a later start.

## What happens to GTA Online?

Take-Two has said it will keep supporting the existing GTA Online. Nothing has been announced about moving characters, money or vehicles into GTA VI.

We'll update this page as soon as Rockstar confirms anything.

---

*Sources: [PC Gamer: GTA 6 online rumours](https://www.pcgamer.com/games/grand-theft-auto/gta-6-online-multiplayer/) · [IBTimes: Rockstar silent as reports point to 2027](https://www.ibtimes.com.au/gta-6-online-release-date-multiplayer-1878642) · [Nacionale: does GTA 6 have online at launch?](https://www.nacionale.com/en/articles/does-gta-6-have-online-multiplayer-at-launch-single-player-gta-online) · [GTABase: when is GTA 6 Online coming out?](https://www.gtabase.com/articles/gta-6/when-is-gta-6-online-coming-out)*`,
  },
  {
    slug: "gta-vi-faq-price-editions-pc",
    title: "GTA VI FAQ: price, editions, PC version and more",
    category: "guides",
    excerpt:
      "Quick answers to the most common GTA VI questions: how much it costs, which edition to get, whether it's on PC, and if there's online play.",
    body: `Quick answers to the questions we get asked most. Last checked on ${STARTER_RESEARCHED_ON}.

### When did GTA VI come out?
Thursday, 19 November 2026, worldwide.

### Which platforms is it on?
PlayStation 5 and Xbox Series X|S.

### Is GTA VI on PC?
No PC version has been announced. Rockstar usually brings its games to PC later; GTA V took about 18 months.

### How much does it cost?
When pre-orders opened, the US prices were reported as $79.99 for the Standard Edition and $99.99 for the Ultimate Edition. Prices vary by country and store.

### What are the editions?
Standard and Ultimate. If you have Standard, you can buy an Ultimate Edition upgrade as a digital add-on on PlayStation and Xbox.

### Can I still get the pre-order bonus?
No. The Vintage Vice City Pack and the free month of GTA+ only applied to digital purchases made before 20 November 2026. If you did pre-order, redeem your GTA+ month by 31 March 2027.

### Is there online multiplayer?
Not at launch, and there's no announced date. [Read our explainer](/news/does-gta-vi-have-online-multiplayer).

### What's the age rating?
M (Mature 17+) from the ESRB.

### Is there a collector's edition?
Rockstar sells a collector's box called *The Goodtime State*, listed at $399.99. It's merchandise and doesn't include the game.

### Where's the soundtrack?
*Grand Theft Auto VI: The Album* is out on streaming services, vinyl and CD. [More here](/news/gta-vi-soundtrack-album-justice-score).

---

*Sources: [Rockstar Support: platforms, editions and versions](https://support.rockstargames.com/articles/4QfG4FmZCf5W1gS8jy4UVT/grand-theft-auto-vi-platform-editions-and-versions) · [Rockstar Support: pre-order details](https://support.rockstargames.com/articles/46YkMi4rHxYXMeIHtZiKaE/grand-theft-auto-vi-pre-order-details) · [Rockstar Support: redeeming the GTA+ month](https://support.rockstargames.com/articles/3SZF8cy8dG7lHsLf38uWK1/redeeming-the-one-month-gta-membership-included-with-your-grand-theft-auto-vi-pre-order) · [Rockstar Store: The Goodtime State](https://store.rockstargames.com/merchandise/gtavi-goodtime-state-vice-city-collection) · [Yahoo Finance: Take-Two earnings and pricing](https://finance.yahoo.com/markets/stocks/articles/two-shares-gain-results-guidance-215155402.html)*`,
  },
  {
    slug: "gta-vi-soundtrack-album-justice-score",
    title: "GTA VI's music: The Album is out, and Justice's score lands 11 December",
    category: "news",
    excerpt:
      "A 34-song album featuring Dua Lipa, Lana Del Rey, Playboi Carti and Burna Boy is out now, with Justice's original score following in December.",
    body: `Music has always been a big part of GTA, and GTA VI comes with a lot of it.

## Grand Theft Auto VI: The Album

Released alongside the game on 19 November, the official album has **34 songs** from artists including **Playboi Carti, Lana Del Rey, Dua Lipa and Burna Boy**. It's available on the major streaming services, and on limited-edition vinyl and CD from Rockstar's store and other retailers.

## The original score by Justice

French electronic duo **Justice**, Grammy winners, composed GTA VI's original score. The 30-track score album is due on **11 December 2026**, including a triple black vinyl edition. Its first taste, "Flower in a Hurricane" featuring Tame Impala, SZA and King Gizzard & The Lizard Wizard, debuted in the Launch Trailer.

## A launch festival in Miami

Rockstar is celebrating with **Grand Theft Auto VI: The Festival** in Miami on Saturday, 21 November, with performances from some of the album's artists.

## In-game radio

As usual, Leonida has its own radio stations, from Back Country Radio (country music for Grassrivers and Port Gellhorn) to the city stations of Vice City.

---

*Sources: [Rockstar Newswire: The Album now available](https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available) · [Rockstar Newswire: announcing The Album](https://www.rockstargames.com/newswire/article/7599a881942544/announcing-grand-theft-auto-vi-the-album-coming-november-19) · [Rockstar Newswire: Original Score by Justice](https://www.rockstargames.com/newswire/article/39ak8a12395591/grand-theft-auto-vi-original-score-by-justice) · [Rockstar: The Music of GTA VI](https://www.rockstargames.com/VI/music) · [Rockstar Newswire: in-game radio stations](https://www.rockstargames.com/newswire/article/o3982oa93a23k4/the-music-of-grand-theft-auto-vi-in-game-radio-stations)*`,
  },
  {
    slug: "gta-vi-road-to-launch-timeline",
    title: "GTA VI's road to launch: every date that mattered",
    category: "guides",
    excerpt:
      "From Rockstar's first confirmation in 2022 to launch day and beyond, here's the full GTA VI timeline, including both delays.",
    body: `GTA VI was a long time coming. Here are the key moments, in order.

- **February 2022:** Rockstar confirms that development of the next Grand Theft Auto is "well underway".
- **September 2022:** Early development footage leaks online in one of the biggest leaks in gaming history.
- **December 2023:** Trailer 1 reveals Grand Theft Auto VI, Lucia, Jason and Vice City, with a 2025 release window.
- **May 2025:** Rockstar delays the game to **26 May 2026**. Days later, on 6 May, Trailer 2 introduces Jason and the wider cast.
- **6 November 2025:** A second delay moves launch to **19 November 2026**. Rockstar apologises for the extra wait and says the time is for polish.
- **25 June 2026:** Pre-orders open for the Standard and Ultimate Editions.
- **15 October 2026:** The Launch Trailer arrives, debuting new music from Justice.
- **10 November 2026:** Digital pre-load begins.
- **19 November 2026:** GTA VI launches worldwide on PS5 and Xbox Series X|S. Rockstar later says it took $3.79 billion on day one.
- **21 November 2026:** Grand Theft Auto VI: The Festival takes place in Miami.
- **11 December 2026:** The original score album by Justice comes out.

**Still to come:** a PC version and an online mode. Neither has been announced yet.

---

*Sources: [Rockstar Newswire: GTA VI is now coming May 26, 2026](https://www.rockstargames.com/newswire/article/258aa538o412ok/grand-theft-auto-vi-is-now-coming-may-26-2026) · [Rockstar Newswire: now set to launch November 19, 2026](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026) · [Rockstar Games on X: delay announcement](https://x.com/RockstarGames/status/1986540361011880167) · [Rockstar Newswire: pre-orders begin June 25](https://www.rockstargames.com/newswire/article/517oa135328155/grand-theft-auto-vi-pre-orders-begin-on-june-25) · [Rockstar Newswire: pre-load begins November 10](https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10) · [Rockstar: Launch Trailer](https://www.rockstargames.com/VI/launch-trailer) · [Rockstar Newswire: Grand Theft Auto VI Now Available](https://www.rockstargames.com/newswire/article/39akk424a9oo53/grand-theft-auto-vi-now-available)*`,
  },
];
