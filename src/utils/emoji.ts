import * as EmojiMart from 'emoji-mart';
import EmojiMartDataAll from 'emoji-mart/data/all.json';

import { Config } from '../ReactionsPlugin';
import logger from '../utils/logger';

// -----------------------------------------------------------------------------

const EMOJIMART_DATA_IDS_IN_CANONICAL_ORDER: string[] = [];
EmojiMartDataAll.categories.forEach(({ id, emojis }: { id: string, emojis: string[] }) => {
  EMOJIMART_DATA_IDS_IN_CANONICAL_ORDER.push(...emojis);
});

const CUSTOM_EMOJIS_DATA: Map<string, EmojiMart.CustomEmoji> = new Map();

let INCLUDE_NORMAL_CATEGORIES: string[] = [];

// -----------------------------------------------------------------------------

const makeCustomEmojiData = (customEmoji: Config['customEmojis'][number]) => {
  return {
    name: customEmoji.id.slice(1),
    short_names: [customEmoji.id],
    imageUrl: customEmoji.url,
    ...({ customCategory: customEmoji.category } || {}),
  };
}

export const setConfig = (config: Config) => {
  const { customEmojis } = config;
  CUSTOM_EMOJIS_DATA.clear();
  customEmojis.forEach((customEmoji) => {
    CUSTOM_EMOJIS_DATA.set(customEmoji.id, makeCustomEmojiData(customEmoji));
  });

  INCLUDE_NORMAL_CATEGORIES = [...config.includeCategories];
}

// -----------------------------------------------------------------------------

export const getIdsInCanonicalOrder = () => {
  return [
    ...Array.from(CUSTOM_EMOJIS_DATA.keys()),
    ...EMOJIMART_DATA_IDS_IN_CANONICAL_ORDER,
  ];
};


export const getCustomEmojiDataAll = (): EmojiMart.CustomEmoji[] => {
  return Array.from(CUSTOM_EMOJIS_DATA.values());
};

export const getCustomEmojiDataById = (id: string): EmojiMart.CustomEmoji => {
  return CUSTOM_EMOJIS_DATA.get(id);
};


export const getCategoriesOrder = () => {
  const customCategories: string[] = [];
  Array.from(CUSTOM_EMOJIS_DATA.values()).forEach((emojiData) => {
    const customCategory = (emojiData as any /* хак из-за несвежего `@types/emoji-mart` */).customCategory;
    if (!customCategories.includes(customCategory)) {
      customCategories.push(`custom-${customCategory}`);
    }
  });

  return [
    'search',
    'recent',

    'custom',
    ...customCategories,

    ...INCLUDE_NORMAL_CATEGORIES,
  ];
};

// -----------------------------------------------------------------------------

export const getI18nConfig = () => {
  const userLanguage = (window as any)['UserLanguage'];

  if (userLanguage !== 'ru') {
    return undefined;
  }

  return {
    search: 'Поиск',
    clear: 'Отчистить', // Accessible label on "clear" button
    notfound: 'Ничего не найдено',
    categories: {
      search: 'Результаты поиска',
      recent: 'Недавно использованное',
      smileys: 'Смайлы',
      people: 'Люди',
      nature: 'Животные и природа',
      foods: 'Еда и напитки',
      activity: 'Активности',
      places: 'Места',
      objects: 'Предметы',
      symbols: 'Символы',
      flags: 'Флаги',
      custom: 'Кастомные',
    },
    categorieslabel: 'Категории',
  }
}

// -----------------------------------------------------------------------------
