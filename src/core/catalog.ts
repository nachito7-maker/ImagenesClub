export const SUPPLIES = ['beer', 'soda', 'spirits', 'ingredients', 'ice', 'supplies'] as const;
export type Supply = typeof SUPPLIES[number];
export type Stock = Record<Supply, number>;
export type DrinkId = 'lager' | 'amber' | 'cola' | 'orange' | 'rumcola' | 'gintonic' | 'shot' | 'mojito';
export interface Recipe { id: DrinkId; name: string; category: string; price: number; seconds: number; color: string; steps: string[]; stock: Partial<Stock>; }
export const RECIPES: Record<DrinkId, Recipe> = {
  lager: {id:'lager',name:'Cerveza rubia',category:'Cerveza',price:4,seconds:3,color:'#e6b64d',steps:['Vaso frío','Servir','Controlar espuma'],stock:{beer:1}},
  amber: {id:'amber',name:'Cerveza tostada',category:'Cerveza',price:4.5,seconds:3,color:'#ad612d',steps:['Vaso frío','Servir','Controlar espuma'],stock:{beer:1}},
  cola: {id:'cola',name:'Cola',category:'Refresco',price:3,seconds:2,color:'#4a2320',steps:['Vaso','Hielo','Refresco'],stock:{soda:1,ice:1}},
  orange: {id:'orange',name:'Naranja',category:'Refresco',price:3,seconds:2,color:'#ff9238',steps:['Vaso','Hielo','Refresco'],stock:{soda:1,ice:1}},
  rumcola: {id:'rumcola',name:'Ron · cola',category:'Cubata',price:7,seconds:5,color:'#814628',steps:['Vaso','Hielo','Ron','Cola','Mezclar'],stock:{spirits:1,soda:1,ice:1}},
  gintonic: {id:'gintonic',name:'Gin · tonic',category:'Cubata',price:7.5,seconds:5,color:'#9fcbc4',steps:['Vaso','Hielo','Ginebra','Tónica','Mezclar'],stock:{spirits:1,soda:1,ice:1}},
  shot: {id:'shot',name:'Chupito',category:'Shot',price:3.5,seconds:2,color:'#c93d50',steps:['Vaso pequeño','Dosificar','Servir'],stock:{spirits:1}},
  mojito: {id:'mojito',name:'Mojito',category:'Cóctel',price:9,seconds:7,color:'#84bd60',steps:['Lima y hierbabuena','Hielo','Ron','Agitar','Decorar'],stock:{spirits:1,ingredients:2,ice:1}}
};
export const PRODUCTS: Record<Supply, {name:string;cost:number;destination:string;color:string}> = {
  beer:{name:'Cerveza',cost:1,destination:'Nevera',color:'#dcb554'}, soda:{name:'Refrescos',cost:.65,destination:'Nevera',color:'#e37b42'},
  spirits:{name:'Destilados',cost:1.7,destination:'Estantería',color:'#bd8b5c'}, ingredients:{name:'Ingredientes',cost:.55,destination:'Despensa',color:'#91b66a'},
  ice:{name:'Hielo',cost:.25,destination:'Congelador',color:'#91cbd5'}, supplies:{name:'Suministros',cost:.2,destination:'Almacén',color:'#ac9dbd'}
};
export const EMPTY_STOCK = (): Stock => ({beer:0,soda:0,spirits:0,ingredients:0,ice:0,supplies:0});
export type EventId = 'normal' | 'dj' | 'concert' | 'museum';
export const EVENTS: Record<EventId,{name:string;cost:number;demand:number;ambience:number}> = {
  normal:{name:'Noche de club',cost:0,demand:1,ambience:0},dj:{name:'Sesión del DJ',cost:25,demand:1.15,ambience:5},
  concert:{name:'Concierto en directo',cost:75,demand:1.45,ambience:12},museum:{name:'Memoria del rock',cost:20,demand:1.1,ambience:8}
};
export const UPGRADES = {
  bar:{name:'Barra ágil',cost:180,description:'Preparación 25 % más rápida'}, storage:{name:'Almacenamiento',cost:160,description:'+100 unidades de capacidad'},
  sound:{name:'Sonido del club',cost:220,description:'+8 satisfacción musical'}, light:{name:'Luces de escenario',cost:150,description:'+5 ambiente'},
  staff:{name:'Segundo turno',cost:260,description:'Dos pedidos preparados simultáneamente'}
} as const;
export type UpgradeId = keyof typeof UPGRADES;
export function stockAvailable(stock: Stock, ingredients: Partial<Stock>, count=1): boolean {return SUPPLIES.every(k => stock[k] >= (ingredients[k] ?? 0)*count);}
