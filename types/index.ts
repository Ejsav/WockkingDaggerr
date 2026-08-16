// SocialPlatform covers all supported content platforms
export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "twitch";

export interface Post {
  id: string;
  platform: SocialPlatform;
  external_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  embed_url: string | null;
  permalink: string | null;
  posted_at: string;
  duration_seconds: number | null;
  view_count: number | null;
  visible: boolean;
  tags: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  inventory_count: number | null;
  image_urls: string[];
  category: string;
  active: boolean;
  created_at: string;
}

export interface Drop {
  id: string;
  slug: string;
  name: string;
  description: string;
  hero_image_url: string | null;
  drops_at: string;
  ends_at: string | null;
  status: "upcoming" | "live" | "ended";
  product_ids: string[];
}

export interface Subscriber {
  id: string;
  email: string | null;
  phone: string | null;
  source: string;
  created_at: string;
  sms_consent: boolean;
  email_consent: boolean;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  email: string | null;
  total_cents: number;
  currency: string;
  status: "pending" | "paid" | "fulfilled" | "refunded" | "failed";
  line_items: { product_id: string; quantity: number; price_cents: number }[];
  created_at: string;
}
