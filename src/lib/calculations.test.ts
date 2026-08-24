import { describe, expect, it } from 'vitest'
import { calculateShoppingItems, mergeIngredients, missingForRecipe, scaleIngredients } from './calculations'
import type { MealPlan, Recipe, StockItem } from '../types'

const recipe: Recipe = { id:'r',name:'测试菜',category:'home',description:'',servings:2,ingredients:[{name:'鸡蛋',quantity:4,unit:'piece'},{name:'番茄',quantity:200,unit:'g'}],steps:[],createdAt:'',updatedAt:'' }
const stock: StockItem[] = [{id:'s',name:'鸡蛋',quantity:2,unit:'piece',createdAt:'',updatedAt:''}]

describe('core calculations', () => {
  it('scales recipe ingredients by diners', () => expect(scaleIngredients(recipe,3)[0].quantity).toBe(6))
  it('merges only same-name same-unit ingredients', () => expect(mergeIngredients([{name:'鸡蛋',quantity:2,unit:'piece'},{name:'鸡蛋',quantity:3,unit:'piece'},{name:'鸡蛋',quantity:100,unit:'g'}])).toHaveLength(2))
  it('subtracts existing stock from shopping needs', () => {
    const plan: MealPlan={id:'p',date:'2026-08-24',meal:'dinner',diners:3,confirmed:true,dishes:[{recipeId:'r',orderedBy:['a'],votes:[],confirmed:true,completed:false}]}
    expect(calculateShoppingItems([plan],[recipe],stock).find(i=>i.name==='鸡蛋')?.quantity).toBe(4)
  })
  it('returns exact missing ingredients', () => expect(missingForRecipe(recipe,2,stock)).toEqual([{name:'鸡蛋',quantity:2,unit:'piece'},{name:'番茄',quantity:200,unit:'g'}]))
})
