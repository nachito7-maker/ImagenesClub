import {RECIPES,type DrinkId} from '../core/catalog';
export function drinkIcon(id:DrinkId,size=34):string {
 const r=RECIPES[id];const beer=r.category==='Cerveza',shot=r.category==='Shot',cocktail=id==='mojito',round=id==='gintonic';
 const glass=beer?'<path d="M10 10h19v23q0 4-4 4H14q-4 0-4-4z"/><path d="M29 15h5v15h-5" fill="none"/>':shot?'<path d="M12 17h20l-3 20H15z"/>':round?'<path d="M10 10h24q3 20-12 20T10 10"/><path d="M22 30v8m-7 0h14"/>':'<path d="M10 8h24l-3 30H13z"/>';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 44 44" aria-label="${r.name}" role="img"><g fill="${r.color}" stroke="#f4e8cd" stroke-width="1.8" stroke-linejoin="round">${glass}</g>${beer?'<path d="M11 10h17v7H11z" fill="#fff2cd"/>':shot?'':`<path d="M15 16l5-2 3 5-5 3zm9 7l5-2 2 4-5 3z" fill="#fff" opacity=".4"/><path d="M27 6l-7 20" stroke="#f4e8cd" stroke-width="2"/>`}${cocktail?'<path d="M23 15q-9-9-9 2 6 5 9-2m0 8q10-9 9 1-7 5-9-1" fill="#365f33"/><circle cx="33" cy="11" r="6" fill="#a5ce67" stroke="#e5f0b8"/>':round?'<circle cx="32" cy="10" r="6" fill="#e2d577" stroke="#f1e8ba"/>':''}${id==='orange'?'<circle cx="33" cy="10" r="6" fill="#ffba53" stroke="#ffda8a"/>':''}</svg>`;
}
export const symbol={waiting:'◷',ordering:'!',preparing:'◌',carrying:'↗',served:'✓',satisfaction:'♥',clean:'✦',museum:'♬',stairs:'↟',pay:'€'};
