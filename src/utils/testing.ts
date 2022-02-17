import * as api from '../api';

// не используется уже давно
export const TEST_DATA2: api.PostData = {
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

export const _testAddFakeUsers = (reactions: Record<string, api.ReactionData>) => {
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

export const TEST_CUSTOM_EMOJIS = [
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

export const TEST_CONFIG = {
  customEmojis: TEST_CUSTOM_EMOJIS,
  // debug: true,
  includeCategories: ['people', 'foods', 'objects', 'symbols'],
}
