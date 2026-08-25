import type { Language, Unit } from "../types";

export function chineseMeasureWord(name: string): string {
  const clean = name.trim();
  if (/牛排|羊排|猪排|豆腐|肉饼|肉块/.test(clean)) return "块";
  if (/小白菜|白菜|生菜|青菜|菠菜|香菜|油麦菜|空心菜/.test(clean)) return "把";
  if (/鸡蛋|鸭蛋|蛋|番茄|西红柿|柠檬|苹果|土豆|洋葱|橙/.test(clean))
    return "个";
  return "件";
}

export function displayUnit(
  unit: Unit,
  language: Language,
  ingredientName = "",
): string {
  if (language === "zh") {
    const chinese: Record<Unit, string> = {
      piece: chineseMeasureWord(ingredientName),
      g: "克",
      kg: "千克",
      ml: "毫升",
      l: "升",
      grain: "颗",
      slice: "片",
      pack: "包",
      box: "盒",
    };
    return chinese[unit];
  }
  const english: Record<Unit, string> = {
    piece: "piece",
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "L",
    grain: "piece",
    slice: "slice",
    pack: "pack",
    box: "box",
  };
  return english[unit];
}
