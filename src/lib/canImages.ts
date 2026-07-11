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
import blackberry60 from "@/assets/cans/60mg-blackberry-cbn.png.asset.json";
import bloodOrange60 from "@/assets/cans/60mg-blood-orange-cbg.png.asset.json";
import blueberryLemonade60 from "@/assets/cans/60mg-blueberry-lemonade.png.asset.json";
import passionfruitMango60 from "@/assets/cans/60mg-passionfruit-mango.png.asset.json";
import strawberryKiwi60 from "@/assets/cans/60mg-strawberry-kiwi-thcv.png.asset.json";
import wildCherryPeach60 from "@/assets/cans/60mg-wild-cherry-peach.png.asset.json";

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
  "60mg-blackberry-cbn": blackberry60.url,
  "60mg-blood-orange-cbg": bloodOrange60.url,
  "60mg-blueberry-lemonade": blueberryLemonade60.url,
  "60mg-passionfruit-mango": passionfruitMango60.url,
  "60mg-strawberry-kiwi-thcv": strawberryKiwi60.url,
  "60mg-wild-cherry-peach": wildCherryPeach60.url,
};

export function getCanImage(slug: string): string | undefined {
  return CAN_IMAGES[slug];
}