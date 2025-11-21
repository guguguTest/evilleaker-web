import {createI18n} from 'vue-i18n';
import array from "@/locales/array";
import other from "@/locales/other";

const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
        zh: {
            ...array.zh,
            ...other.zh
        },
        en: {
            ...array.en,
            ...other.en
        },
        ja: {
            ...array.ja,
            ...other.ja
        }
    }
});

export default i18n;