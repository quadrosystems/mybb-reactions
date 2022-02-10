
## Пример инициализации

```html
<script src="http://127.0.0.1:9000/index.js"></script>
<script>
ReactionsPlugin.setConfig({
  includeCategories: ['people', 'foods', 'objects', 'symbols', 'activity'],
  customEmojis: [
    {
      id: '_octocat',
      url: 'https://github.githubassets.com/images/icons/emoji/octocat.png',
    },
    {
      id: '_firefox',
      url: 'https://i.imgur.com/PlKtE6V.png',
      category: 'Browsers',
    },
    {
      id: '_chrome',
      url: 'https://i.imgur.com/bZyUbJ9.png',
      category: 'Browsers',
    },
    {
      id: '_popcat',
      url: 'https://cdn.betterttv.net/emote/5fa8f232eca18f6455c2b2e1/3x',
      category: 'Catgifs',
    },
    {
      id: '_catjam',
      url: 'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x',
      category: 'Catgifs',
    },
  ],
});
</script>
```

## Описание объекта конфигурации

Все свойста объекта конфигурации опциональны.

| Name | Type | Default | Description |
| ---- | :--: | ------- | ----------- |
| `debug` | _boolean_ | false | Выводить в консоль доп. инфу для разработчика |
| `disable` | _boolean_ | false | Отключить плагин |
| `includeCategories` | _Array\<String\>_ | `['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']` | Категории эмоджи которые будут отображены в пикере. Значение должно быть подмножеством дефолтного списка. |
| `customEmojis` | _Array\<Object\>_ | `[]` | Массив кастомных эмоджи. |
| `customEmojis.*.id` | _String_ | | Айдишник кастомной эмоджи. **Должен начинаться с `'_'`**. (Например: `'_popcat'`.) |
| `customEmojis.*.url` | _String_ | | Ссылка на изображение формата png или jpeg. **Изображение должно быть квадратным.** |
| `customEmojis.*.category` | _String (Optional)_ |  | Кастомная категория. Все кастомные эмоджи с одинаковой категорией будут сгрупированы в отдельные группы. (Все без указанной категории - попадут в отдельную дефолтную группу.) |


## Запуск dev-сервера

```
PORT=9000 HOST=127.0.0.1 npm run start
```
Модуль будет доступен по адресу `http://127.0.0.1:9000/index.js`.

Не рекомендую выставлять `HOST=0.0.0.0`.


## Сборка

```
npm run build
```

Собранный модуль будет доступен в папке `dist` - `dist/index.js`.
