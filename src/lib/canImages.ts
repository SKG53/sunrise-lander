// Slug → CDN URL map for product can photography. Populated as art lands.
// Missing slugs render as a blank flavor-colored frame (see FlavorCan usage).

import strawberry10 from "@/assets/cans/10mg-strawberry.png.asset.json";
import watermelon10 from "@/assets/cans/10mg-watermelon.png.asset.json";
import lemonade10 from "@/assets/cans/10mg-lemonade.png.asset.json";
import peachMango30 from "@/assets/cans/30mg-peach-mango.png.asset.json";
import cherryLimeade30 from "@/assets/cans/30mg-cherry-limeade.png.asset.json";
import orangeLemonade30 from "@/assets/cans/30mg-orange-lemonade.png.asset.json";
import kiwiWatermelon30 from "@/assets/cans/30mg-kiwi-watermelon-cbg.png.asset.json";
import blueberryPom30 from "@/assets/cans/30mg-blueberry-pomegranate-cbn.png.asset.json";
import strawberryWatermelon30 from "@/assets/cans/30mg-strawberry-watermelon-thcv.png.asset.json";

export const CAN_IMAGES: Record<string, string> = {
  "10mg-strawberry": strawberry10.url,
  "10mg-watermelon": watermelon10.url,
  "10mg-lemonade": lemonade10.url,
  "30mg-peach-mango": peachMango30.url,
  "30mg-cherry-limeade": cherryLimeade30.url,
  "30mg-orange-lemonade": orangeLemonade30.url,
  "30mg-kiwi-watermelon-cbg": kiwiWatermelon30.url,
  "30mg-blueberry-pomegranate-cbn": blueberryPom30.url,
  "30mg-strawberry-watermelon-thcv": strawberryWatermelon30.url,
};

export function getCanImage(slug: string): string | undefined {
  return CAN_IMAGES[slug];
}