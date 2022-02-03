import React from 'react';
import ReactDOM from 'react-dom';
import * as EmojiMart from 'emoji-mart';
import { LogLevel } from 'consola';

import ReactionsContainer from './ReactionsContainer';
import * as api from './api';
import * as emojiUtils from './utils/emoji';
import logger from './utils/logger';

// =============================================================================

const TEST_DEFAULT_CUSTOM_EMOJIS = [
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
];

const TEST_CONFIG = {
  customEmojis: TEST_DEFAULT_CUSTOM_EMOJIS,
  // debug: true,
  includeCategories: ['people', 'foods', 'objects', 'symbols'],
}

// =============================================================================

// не используется уже давно
const TEST_DATA2: api.PostData = {
  "postId": 2,
  "reactions": {
    "derelict_house_building": {
      "reactionCode": "derelict_house_building",
      "users": [
        {
          "userId": 2,
          "userLogin": "alois",
          "reactedAt": 1640000050,
        }
      ],
    },
    "grinning": {
      "reactionCode": "grinning",
      "users": [
        {
          "userId": 2,
          "userLogin": "alois",
          "reactedAt": 1640000032,
        },
        {
          "userId": 4,
          "userLogin": "alois_test2",
          "reactedAt": 1640000031,
        }
      ]
    },
    "woman-woman-girl-boy": {
      "reactionCode": "woman-woman-girl-boy",
      "users": [
        {
          "userId": 4,
          "userLogin": "alois_test2",
          "reactedAt": 1640000010,
        }
      ]
    },
  },
};

// =============================================================================

const _testAddFakeUsers = (reactions: Record<string, api.ReactionData>) => {
  const _randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const _createFakeUsers = (num: number) => {
    return Array.from(Array(num).keys()).map((k) => ({
      userId: 10000 + k,
      userLogin: `_fake_user_${k}`,
      reactedAt: Math.floor(Date.now() / 1000) - _randomInt(0, 60*60*24*7),
    }));
  };

  const result: Record<string, api.ReactionData> = {};
  Object.entries(reactions).forEach(([key, val]) => {
    const numFakeUsers = _randomInt(0, 10);
    const numFakeUsersBefore = _randomInt(0, numFakeUsers);

    const fakeUsers = _createFakeUsers(numFakeUsers);
    const users = [
      ...fakeUsers.slice(0, numFakeUsersBefore),
      ...val.users,
      ...fakeUsers.slice(numFakeUsersBefore),
    ];

    result[key] = { reactionCode: key, users };
  });
  return result;
}

// =============================================================================

type NormalCategory = 'people' | 'nature' | 'foods' | 'activity' | 'places' | 'objects' | 'symbols' | 'flags';

export type Config = {
  customEmojis: {
    id: string,
    url: string,
    category?: string,
  }[],
  includeCategories: NormalCategory[],
  debug: boolean,
}

const ALL_NORMAL_CATEGORIES: NormalCategory[] = ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'];


let config: Config;

// =============================================================================

const validateConfig = (config: Config) => {
  for (const item of config.customEmojis) {
    if (item.id[0] !== '_') {
      const msg = `Custom emoji id '${item.id}' is invalid. All custom emoji ids must start with '_'.`;
      logger.error(msg);
      return false;
    }
  }

  for (const normalCategory of config.includeCategories) {
    if (!ALL_NORMAL_CATEGORIES.includes(normalCategory)) {
      let msg = `Invalid config field includeCategories=${JSON.stringify(config.includeCategories)}.`
      msg += ` It must be subset of ${JSON.stringify(ALL_NORMAL_CATEGORIES)}.`;
      logger.error(msg);
      return false;
    }
  }

  return true;
}

// =============================================================================

const init = async (initConfig?: Partial<Config>) => {
  const DEFAULT_CONFIG: Config = {
    customEmojis: [],
    includeCategories: ALL_NORMAL_CATEGORIES,
    debug: process.env.NODE_ENV === 'development' ? true : false,
  };

  config = {
    ...DEFAULT_CONFIG,
    ...(initConfig || {}),
  };

  if (!validateConfig(config)) {
    return;
  }

  if (config.debug) {
    logger.level = LogLevel.Debug;
  } else {
    logger.level = LogLevel.Info;
  }

  emojiUtils.setConfig(config);

  logger.info(`[ReactionsPlugin] config:`, config);

  // ---------------------------------------------------------------------------

  const collectPagePostIds = () => {
    return Array.from(document.querySelectorAll('.post')).map((elem) => {
      return parseInt(elem.id.slice(1).toString(), 10);
    })
  }

  const boardId = (window as any)['BoardID'];
  const postIds = collectPagePostIds();

  logger.info(`[ReactionsPlugin] POST IDS ON THIS PAGE: ${collectPagePostIds().join(', ')}.`);

  const reactionsIndexData = await api.reactionsIndex(boardId, postIds);
  logger.debug(`[ReactionsPlugin] reactionsIndexData:`, reactionsIndexData);


  reactionsIndexData.forEach((postData) => {
    // Для тестирования тултипа:
    // postData.reactions = _testAddFakeUsers(postData.reactions);

    const postElem = document.getElementById(`p${postData.postId}`);

    const reactElem = document.createElement('div');
    reactElem.classList.add('reactions-root');

    let createdElement: any = React.createElement(
      ReactionsContainer,
      { postId: postData.postId, reactions: postData.reactions }
    );
    createdElement = React.createElement(React.StrictMode, null, createdElement);
    ReactDOM.render(createdElement, reactElem);

    postElem.querySelector('.post-body').append(reactElem);

  });


}

// =============================================================================

export default {
  config,
  init,

  TEST_CONFIG,
}
