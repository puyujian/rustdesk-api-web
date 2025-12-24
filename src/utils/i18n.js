import en from '@/utils/i18n/en.json'
import fr from '@/utils/i18n/fr.json'
import zhCN from '@/utils/i18n/zh_CN.json'
import ko from '@/utils/i18n/ko.json'
import ru from '@/utils/i18n/ru.json'
import es from '@/utils/i18n/es.json'
import zhTW from '@/utils/i18n/zh_TW.json'
import { useAppStore } from '@/store/app'

const trans = {
  en,
  fr,
  'zh-CN': zhCN,
  ko,
  ru,
  es,
  'zh-TW': zhTW,
}

export function T (key, params = {}, num = 0) {
  const appStore = useAppStore()
  const lang = appStore.setting.lang
  const tran = trans[lang]?.[key]
  if (!tran) {
    return key
  }

  const msg = num > 1 ? (tran.Other ? tran.Other : tran.One) : tran.One
  const safeParams = (params && typeof params === 'object') ? params : {}

  // msg 形如："{name} is name"，params 形如：{ name: "zhangsan" }
  return msg.replace(/{(\w+)}/g, (match, placeholderKey) => {
    if (Object.prototype.hasOwnProperty.call(safeParams, placeholderKey)) {
      return String(safeParams[placeholderKey])
    }
    return match
  })
}
