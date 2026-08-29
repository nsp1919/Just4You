# Just4You Search and AI Discovery Setup

Technical SEO and GEO make Just4You eligible to be crawled, understood, indexed, and cited. They do not guarantee a ranking or inclusion in ChatGPT, Gemini, Google AI Overviews, or another answer engine.

## Implemented In The Application

- Canonical URLs, unique titles, descriptions, Open Graph, and Twitter cards on primary acquisition pages
- A 1200x630 sitewide social preview image
- Organization, WebSite, Service, Offer, Audience, Breadcrumb, WebPage, and FAQ structured data
- Stable XML sitemap with private login/register routes excluded
- Explicit public access for major search and AI crawlers while private routes remain blocked
- `llms.txt` and `llms-full.txt` factual product summaries
- Visible internal links from the homepage to six occasion pages and five focused guides
- No fabricated ratings, reviews, customer counts, or unsupported business claims

## 1. Deploy First

Push all SEO changes to the GitHub `main` branch and wait for Hostinger deployment. Confirm these URLs return HTTP 200:

```text
https://just4you.buzz/robots.txt
https://just4you.buzz/sitemap.xml
https://just4you.buzz/llms.txt
https://just4you.buzz/llms-full.txt
https://just4you.buzz/opengraph-image
```

## 2. Google Search Console

1. Open https://search.google.com/search-console
2. Add `just4you.buzz` as a Domain property when possible.
3. Add the DNS TXT verification record Google provides in Hostinger DNS.
4. If using the HTML-tag verification method instead, copy only the `content` value into Hostinger as `GOOGLE_SITE_VERIFICATION` and redeploy.
5. Open **Sitemaps** and submit:

```text
https://just4you.buzz/sitemap.xml
```

6. Use **URL inspection** to request indexing for the homepage, pricing, wedding, birthday, and five focused intent pages.

## 3. Bing Webmaster Tools

1. Open https://www.bing.com/webmasters
2. Import the verified property from Google Search Console or add the domain manually.
3. If Bing supplies an `msvalidate.01` meta value, add only its content value to Hostinger as `BING_SITE_VERIFICATION` and redeploy.
4. Submit the same sitemap URL.
5. Inspect the homepage and focused pages for crawl/index errors.

## 4. Important URLs To Request First

```text
https://just4you.buzz/
https://just4you.buzz/pricing
https://just4you.buzz/birthday
https://just4you.buzz/wedding
https://just4you.buzz/birthday-website-for-girlfriend
https://just4you.buzz/birthday-surprise-for-best-friend
https://just4you.buzz/anniversary-website-for-husband
https://just4you.buzz/online-wedding-invitation
https://just4you.buzz/last-minute-birthday-surprise
```

## 5. Entity Consistency

Use the same facts everywhere the company appears:

- Product: Just4You / Just4You.buzz
- Legal operator: Novantix Innovation Technologies Private Limited
- Public company name: Novantix Technologies
- Location: Hyderabad, Telangana, India
- Official product URL: https://just4you.buzz
- Official company URL: https://novantixtech.com
- Support email: info@novantixtech.com
- Official Instagram URL: the value configured in `NEXT_PUBLIC_INSTAGRAM_URL`

Keep these names and links consistent on Instagram, business directories, press mentions, and company profiles. Entity consistency helps search and answer engines distinguish the real product from similarly named services.

## 6. Content And Authority Work

Technical changes alone will not create competitive rankings. Publish useful, original evidence over time:

- Obtain explicit customer permission and feature real celebrations in the Wall of Love.
- Add genuine reaction posts and link back to the most relevant occasion page.
- Answer real customer questions with specific examples, prices, delivery constraints, and screenshots.
- Earn relevant mentions from wedding vendors, event planners, photographers, gifting sites, and local business publications.
- Keep focused pages materially different; do not generate hundreds of near-duplicate location or keyword pages.

## 7. Measure Weekly

In Search Console and Bing Webmaster Tools, monitor:

- Indexed page count and excluded-page reasons
- Queries containing birthday website, online wedding invitation, and related terms
- Impressions, clicks, click-through rate, and average position by page
- Structured-data parsing and crawl errors
- Referring domains and links to focused pages

Use Analytics to measure visits from organic search through demo views, free cards, registration, checkout, and paid orders.

## 8. AI Search Reality

The site explicitly permits common AI/search crawlers and provides factual summaries, but each platform independently decides whether to crawl or cite a page. The strongest long-term signals are:

- Publicly crawlable, technically sound pages
- Clear first-party facts and consistent entity identity
- Original examples and verified customer proof
- Relevant third-party links and mentions
- Content that directly answers a specific user question
- Regular updates when products, prices, or policies change

Do not create fake reviews, fake statistics, repetitive AI-generated pages, or claims that cannot be verified. Those tactics weaken both search trust and AI citation quality.