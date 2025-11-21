import {defineStore} from 'pinia'
import {ref} from 'vue'
import {useI18n} from 'vue-i18n';

export const useI18nStore = defineStore('i18n', () => {
    const {locale} = useI18n();
    const lang = ref('');

    function setLocale(val) {
        lang.value = val
        locale.value = val
        localStorage.setItem('locale', val)
    }

    setLocale(localStorage.getItem('locale') || locale.value);

    return {lang, setLocale};
});
