import Parser from 'rss-parser';
import { unstable_cache } from 'next/cache';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

const FEEDS = [
  { url: 'https://africachessmedia.com/feed/', name: 'Africa Chess Media' },
];

export async function getChessNews(): Promise<NewsItem[]> {
  return await unstable_cache(
    async () => {
      const allNews: NewsItem[] = [];

      const promises = FEEDS.map(async (feed) => {
        try {
          const feedResult = await parser.parseURL(feed.url);
          feedResult.items.forEach((item: any) => {
            if (item.title && item.link) {
              // Extract Image
              let imageUrl = '';
              
              // 1. Check enclosure
              if (item.enclosure && item.enclosure.url) {
                imageUrl = item.enclosure.url;
              }
              
              // 2. Check media:content (often used by WP)
              if (!imageUrl && item['media:content'] && item['media:content'].$) {
                imageUrl = item['media:content'].$.url;
              }

              // 3. Extract first img tag from content if still no image
              if (!imageUrl && (item.content || item['content:encoded'])) {
                const content = item['content:encoded'] || item.content;
                const match = content.match(/<img[^>]+src="([^">]+)"/);
                if (match && match[1]) {
                  imageUrl = match[1];
                }
              }

              allNews.push({
                title: item.title,
                link: item.link,
                content: (item.contentSnippet || item.content || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
                pubDate: item.pubDate || new Date().toISOString(),
                source: feed.name,
                imageUrl: imageUrl || undefined
              });
            }
          });
        } catch (error) {
          console.error(`Error fetching feed ${feed.name}:`, error);
        }
      });

      await Promise.all(promises);

      return allNews.sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      ).slice(0, 20); // Return top 20
    },
    ['chess-news-feed-with-images'],
    { revalidate: 600, tags: ['news'] } // Cache for 10 minutes
  )();
}
