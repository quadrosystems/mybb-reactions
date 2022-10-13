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
  customEmojis: {
    id: string,
    url: string,
    category?: string,
  }[],
  includeCategories: NormalCategory[],
  elemSelector: string,
  debug: boolean,
  disable: boolean,
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
  customEmojis: [],
  includeCategories: ALL_NORMAL_CATEGORIES,
  elemSelector: '.post-body',
  debug: process.env.NODE_ENV === 'development' ? true : false,
  disable: false,
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
    return
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

export default {
  config,

  init,
  setConfig,
}
