import type { FoodItem } from "../types";

const FOOD_IMAGES: Record<string, string> = {
  whole_wheat_roti: "Whole Wheat Roti Stack.png", paratha: "paratha.png",
  white_rice: "white-rice.png", brown_rice: "broown-rice.png", daliya: "daliya.png",
  oats_porridge: "oats-porridge.png", whole_wheat_bread: "whole-wheat-bread.png",
  khichdi: "khichdi.png", chicken_pulao: "chicken-pulao.png", boiled_egg: "boiled-egg.png",
  omelette: "omelette.png", grilled_chicken: "grilled chicken.png", chicken_curry: "chicken curry.png",
  grilled_fish: "grilled fish.png", beef_curry_lean: "beef curry lean.png", chicken_liver: "chicken liver.png",
  besan_cheela: "besan cheela.png", masoor_daal: "masoor-daal.png", chana_daal: "chana-daal.png",
  moong_daal: "moong-daal.png", lobia: "lobia.png", chana_chaat: "chana chaat.png",
  lentil_soup: "lentil soup.png", roasted_chana: "roasted chana.png", spinach_saag: "spinach saag.png",
  mixed_vegetables: "mixed vegetables.png", aloo_gobi: "aloo gobi.png", bhindi: "bhindi.png",
  lauki: "lauki.png", kachumber_salad: "kachumer salad.png", plain_yogurt: "plain yogurt.png",
  raita: "Fresh Cucumber Raita.png", milk_low_fat: "milk low fat.png", doodh_patti: "doodh patti.png",
  apple: "apple.png", banana: "banana.png", guava: "guava.png", kinnow: "kinnow.png",
  papaya: "papaya.png", dates: "dates.png", lemon_water: "lemon water.png", almonds: "almonds.png",
  peanuts: "Roasted Shelled Peanuts.png",
};

const FOOD_ASSETS = import.meta.glob("../../../Assets/food-pics/*", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const assetUrl = (name: string) =>
  Object.entries(FOOD_ASSETS).find(([path]) => path.endsWith(`/${name}`))?.[1];

export const foodImageUrl = (food?: FoodItem) =>
  food?.imageUrl ?? (food ? assetUrl(FOOD_IMAGES[food.id] ?? "") : undefined);
