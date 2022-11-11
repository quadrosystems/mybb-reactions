import React from 'react';
import ReactDOM from 'react-dom';
import { LogLevel } from 'consola';

import ReactionsContainer from './ReactionsContainer';
import * as api from './api';
import * as emojiUtils from './utils/emoji';
import logger from './utils/logger';
// import * as testingUtils from './utils/testing';

type NormalCategory = 'people' | 'nature' | 'foods' | 'activity' | 'places' | 'objects' | 'symbols' | 'flags';

export type Config = {
  debug: boolean,
  disable: boolean,
  elemSelector: string,
  includeCategories: NormalCategory[],
  customEmojis: {
    id: string,
    url: string,
    category?: string,
  }[],
  excludeTopicIds: number[] | null,
  includeTopicIds: number[] | null,
  excludeForumIds: number[] | null,
  includeForumIds: number[] | null,
  excludeForumCategoryIds: number[] | null,
  includeForumCategoryIds: number[] | null,
  limitReactionsNumber: number,
}

const ALL_NORMAL_CATEGORIES: NormalCategory[] = ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'];


let config: Config;

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

const DEFAULT_CONFIG: Config = {
  debug: process.env.NODE_ENV === 'development' ? true : false,
  disable: false,
  elemSelector: '.post-body',
  includeCategories: ALL_NORMAL_CATEGORIES,
  customEmojis: [],
  excludeTopicIds: null,
  includeTopicIds: null,
  excludeForumIds: null,
  includeForumIds: null,
  excludeForumCategoryIds: null,
  includeForumCategoryIds: null,
  limitReactionsNumber: 0,
};

const setConfig = (newConfig?: Partial<Config>) => {
  config = {
    ...DEFAULT_CONFIG,
    ...(newConfig || {}),
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

  logger.info(`SET CONFIG:`, config);
}

const run = async () => {
  logger.info(`Starting run(), config.disable=${config.disable}`);
  if (config.disable) {
    return;
  }


  const topicId = parseInt(document.getElementById('pun-viewtopic').getAttribute('data-topic-id'), 10);
  logger.debug([
    `Current page's topicId=${topicId};`,
    `config.excludeTopicIds=${config.excludeTopicIds && ('[' + config.excludeTopicIds.join(',') + '];')}`,
    `config.includeTopicIds=${config.includeTopicIds && ('[' + config.includeTopicIds.join(',') + '];')}`,
  ].join(' '));
  if (config.excludeTopicIds && config.includeTopicIds) {
    logger.error(`Options excludeTopicIds and includeTopicIds can't be used simultaneously.`);
    return;
  }
  if (config.excludeTopicIds && config.excludeTopicIds.includes(topicId)) {
    logger.info(`This page's topicId is in config.excludeTopicIds.`);
    return;
  }
  if (config.includeTopicIds && !config.includeTopicIds.includes(topicId)) {
    logger.info(`This page's topicId is not in config.includeTopicIds.`);
    return;
  }

  const forumId = parseInt(document.getElementById('pun-viewtopic').getAttribute('data-forum-id'), 10);
  logger.debug([
    `Current page's forumId=${forumId};`,
    `config.excludeForumIds=${config.excludeForumIds && ('[' + config.excludeForumIds.join(',') + '];')}`,
    `config.includeForumIds=${config.includeForumIds && ('[' + config.includeForumIds.join(',') + '];')}`,
  ].join(' '));
  if (config.excludeForumIds && config.includeForumIds) {
    logger.error(`Options excludeForumIds and includeForumIds can't be used simultaneously.`);
    return;
  }
  if (config.excludeForumIds && config.excludeForumIds.includes(forumId)) {
    logger.info(`This page's forumId is in config.excludeForumIds.`);
    return;
  }
  if (config.includeForumIds && !config.includeForumIds.includes(forumId)) {
    logger.info(`This page's forumId is not in config.includeForumIds.`);
    return;
  }

  const forumCategoryId = parseInt(document.getElementById('pun-viewtopic').getAttribute('data-cat-id'), 10);
  logger.debug([
    `Current page's forumCategoryId=${forumCategoryId};`,
    `config.excludeForumCategoryIds=${config.excludeForumCategoryIds && ('[' + config.excludeForumCategoryIds.join(',') + '];')}`,
    `config.includeForumCategoryIds=${config.includeForumCategoryIds && ('[' + config.includeForumCategoryIds.join(',') + '];')}`,
  ].join(' '));
  if (config.excludeForumCategoryIds && config.includeForumCategoryIds) {
    logger.error(`Options excludeForumCategoryIds and includeForumCategoryIds can't be used simultaneously.`);
    return;
  }
  if (config.excludeForumCategoryIds && config.excludeForumCategoryIds.includes(forumCategoryId)) {
    logger.info(`This page's forumCategoryId is in config.excludeForumCategoryIds.`);
    return;
  }
  if (config.includeForumCategoryIds && !config.includeForumCategoryIds.includes(forumCategoryId)) {
    logger.info(`This page's forumCategoryId is not in config.includeForumCategoryIds.`);
    return;
  }


  const collectPagePostIds = () => {
    return Array.from(document.querySelectorAll('.post')).map((elem) => {
      return parseInt(elem.id.slice(1).toString(), 10);
    })
  };

  const boardId = (window as any)['BoardID'];
  const postIds = collectPagePostIds();

  logger.info(`POST IDS ON THIS PAGE: ${collectPagePostIds().join(', ')}.`);

  let reactionsIndexData = await api.reactionsIndex(boardId, postIds);
  logger.debug(`reactionsIndexData:`, reactionsIndexData);


  // log warning about reactions not included in config
  const _warnAboutReactionsNotInConfig = () => {
    const reactionCodes = reactionsIndexData.map(({ reactions }) => reactions.map(({ reactionCode }) => reactionCode)).flat();
    const reactionCodesUnique = Array.from(new Set(reactionCodes));
    const reactionCodesNotInConfig = reactionCodesUnique.filter((reactionCode) => !emojiUtils.isReactionCodeInConfig(reactionCode));
    if (reactionCodesNotInConfig.length !== 0) {
      logger.debug(`SOME REACTION CODES PRESENT IN DB, BUT NOT INCLUDED IN CONFIG:`, reactionCodesNotInConfig);
    }
  };
  _warnAboutReactionsNotInConfig();

  // filter reactions not included in config
  reactionsIndexData = reactionsIndexData.map(({ postId, reactions }) => {
    return {
      postId,
      reactions: reactions.filter((reactionData) => emojiUtils.isReactionCodeInConfig(reactionData.reactionCode))
    };
  })


  reactionsIndexData.forEach((postData) => {
    // Для тестирования тултипа:
    // postData.reactions = testingUtils._testAddFakeUsers(postData.reactions);

    const postElem = document.getElementById(`p${postData.postId}`);

    const rootElem = document.createElement('div');
    rootElem.classList.add('reactions-root');

    let createdElement: any = React.createElement(
      ReactionsContainer,
      { postId: postData.postId, reactions: postData.reactions }
    );
    createdElement = React.createElement(React.StrictMode, null, createdElement);
    ReactDOM.render(createdElement, rootElem);

    postElem.querySelector(config.elemSelector).append(rootElem);

  });

}

const init = async () => {
  setConfig({});

  if (document.location.pathname !== '/viewtopic.php') {
    logger.debug('Page path is not "/viewtopic.php", plugin will not be loaded.')
    return
  }

  if (document.readyState === "loading") {
    window.addEventListener('DOMContentLoaded', () => {
      run();
    });
  } else {
    run();
  }
}

init();


// Так экспортировать конфиг для использования в реакт-компонентах - спорное решение,
// но самое удобное пока.
export { config };

export default {
  config,

  init,
  setConfig,
}
