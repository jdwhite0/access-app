import { DAY_START_MINUTES, NIGHT_START_MINUTES, STORAGE_KEY } from './config'

/** Inline script for layout — prevents theme flash before React hydrates. */
export function getThemeBootScript(): string {
  return `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var p=localStorage.getItem(k);var d=${DAY_START_MINUTES};var n=${NIGHT_START_MINUTES};var m=new Date();var t=m.getHours()*60+m.getMinutes();var mode='night';if(p==='day')mode='day';else if(p==='night')mode='night';else if(t>=d&&t<n)mode='day';document.documentElement.setAttribute('data-theme',mode);}catch(e){document.documentElement.setAttribute('data-theme','night');}})();`
}
