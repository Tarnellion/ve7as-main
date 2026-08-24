"""Краул ve7as.com: коды, мета, hreflang, ссылки, структура.

usage: crawl.py <paths.json> <out.json>
  paths.json — список путей, обычно извлечённый из sitemap.xml
  out.json   — куда сложить результат
"""
import asyncio, json, re, sys, unicodedata
from urllib.parse import urljoin, urlparse, unquote
import httpx
from selectolax.parser import HTMLParser

BASE = "https://ve7as.com"
UA = "Mozilla/5.0 (compatible; Ve7asSEOAudit/1.0; +owner-run)"
CONCURRENCY = 4

INVISIBLE = {0x200B,0x200C,0x200D,0x2060,0xFEFF,0x00AD,0x200E,0x200F}

def bad_chars(s):
    out = []
    for ch in unquote(s):
        cp = ord(ch)
        if cp in INVISIBLE or unicodedata.category(ch) in ("Cf","Cc"):
            out.append(f"U+{cp:04X}")
    return out

async def fetch(client, url, sem, results):
    async with sem:
        try:
            r = await client.get(url, follow_redirects=False)
        except Exception as e:
            results[url] = {"url": url, "error": repr(e)}
            return
        rec = {
            "url": url,
            "status": r.status_code,
            "location": r.headers.get("location"),
            "elapsed_ms": round(r.elapsed.total_seconds() * 1000),
            "bytes": len(r.content),
            "content_type": r.headers.get("content-type"),
            "x_robots_tag": r.headers.get("x-robots-tag"),
            "cache_control": r.headers.get("cache-control"),
            "cf_cache": r.headers.get("cf-cache-status") or r.headers.get("x-edge-cache"),
            "bad_chars_in_url": bad_chars(urlparse(url).path),
        }
        if r.status_code == 200 and "html" in (r.headers.get("content-type") or ""):
            t = HTMLParser(r.text)
            def attr(sel, a):
                n = t.css_first(sel)
                return n.attributes.get(a) if n else None
            title = t.css_first("title")
            rec["title"] = title.text(strip=True) if title else None
            rec["description"] = attr('meta[name="description"]', "content")
            rec["robots_meta"] = attr('meta[name="robots"]', "content")
            rec["canonical"] = attr('link[rel="canonical"]', "href")
            rec["html_lang"] = attr("html", "lang")
            rec["og"] = {n.attributes.get("property"): n.attributes.get("content")
                         for n in t.css('meta[property^="og:"]')}
            rec["hreflang"] = [(n.attributes.get("hreflang"), n.attributes.get("href"))
                               for n in t.css('link[rel="alternate"][hreflang]')]
            rec["headings"] = [(n.tag, n.text(strip=True)[:120])
                               for n in t.css("h1,h2,h3")]
            rec["h1"] = [n.text(strip=True) for n in t.css("h1")]
            rec["jsonld"] = []
            for n in t.css('script[type="application/ld+json"]'):
                try:
                    d = json.loads(n.text())
                    rec["jsonld"].append(d.get("@type") if isinstance(d, dict) else "array")
                except Exception:
                    rec["jsonld"].append("PARSE_ERROR")
            main = t.css_first("main") or t.body
            text = main.text(separator=" ", strip=True) if main else ""
            rec["words"] = len(re.findall(r"\w+", text, flags=re.UNICODE))
            links, ext = set(), set()
            for a in t.css("a[href]"):
                href = (a.attributes.get("href") or "").strip()
                if not href or href.startswith(("#","mailto:","tel:","javascript:")):
                    continue
                absu = urljoin(url, href)
                p = urlparse(absu)
                if p.netloc == urlparse(BASE).netloc:
                    links.add(p.path)
                else:
                    ext.add(absu)
            rec["internal_links"] = sorted(links)
            rec["external_links"] = sorted(ext)
            rec["nofollow_ext"] = [a.attributes.get("href") for a in t.css('a[rel*="nofollow"]')]
            rec["images_no_alt"] = sum(1 for i in t.css("img") if not (i.attributes.get("alt") or "").strip())
            rec["images"] = len(t.css("img"))
        results[url] = rec

async def main():
    paths = json.load(open(sys.argv[1]))
    sem = asyncio.Semaphore(CONCURRENCY)
    results = {}
    async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=30) as c:
        await asyncio.gather(*(fetch(c, BASE + p, sem, results) for p in paths))
    out = sys.argv[2] if len(sys.argv) > 2 else "crawl.json"
    json.dump(results, open(out, "w"), ensure_ascii=False, indent=1)
    print(f"crawled {len(results)}")

asyncio.run(main())
