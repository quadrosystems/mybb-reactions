import React from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import Tippy from '@tippyjs/react';
import { sticky } from 'tippy.js';

import ReactionCounter from './ReactionCounter';
import ReactionPicker from './ReactionPicker';
import LoadingIcon from './LoadingIcon';
import * as api from './api';
import logger from './utils/logger';
import { config } from './ReactionsPlugin';

// Сортировка по кол-ву и дате, в убывающем порядке.
const reactionsComparator = (reactionA: api.ReactionData, reactionB: api.ReactionData) => {
  const countA = reactionA.users.length;
  const countB = reactionB.users.length;

  const lastReactedAtA = Math.max( ...reactionA.users.map(({ reactedAt }) => reactedAt) );
  const lastReactedAtB = Math.max( ...reactionB.users.map(({ reactedAt }) => reactedAt) );

  if (countA > countB) { return -1; }
  if (countA < countB) { return 1; }
  if (countA === countB) { return lastReactedAtB - lastReactedAtA; }
}

type ReactionsContainerProps = {
  postId: number,
  reactions: api.ReactionData[],
};

const ReactionsContainer: React.FC<ReactionsContainerProps> = (props) => {
  const { postId, reactions: initialReactions } = props;

  const [reactions, setReactions] = React.useState<api.ReactionData[]>(initialReactions);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [limitTooltipVisible, setLimitTooltipVisible] = React.useState(false);

  const currentUserId: number = (window as any)['UserID'];
  const currentUserLogin: string = (window as any)['UserLogin'];
  const currentBoardID: number = (window as any)['BoardID'];


  const reactionsSorted = [...reactions].sort(reactionsComparator);

  const currentUserReactionsNumber = reactionsSorted.reduce((n, reaction) => {
    return (reaction.users.some((user) => user.userId === currentUserId)) ? (n + 1) : n;
  }, 0);
  const isReactionsLimitReached = (config.limitReactionsNumber !== 0) && (currentUserReactionsNumber >= config.limitReactionsNumber);


  const toggleReaction = (reactionCode: string) => {

    const currentUserReactionCodes = reactions.reduce<string[]>((acc, { reactionCode, users }) => {
      const user = users.find(({ userId }) => (userId === currentUserId));
      if (user) {
        acc.push(reactionCode);
      }
      return acc;
    }, []);

    if (currentUserReactionCodes.includes(reactionCode)) {
      // delete

      const newReactions = [...reactions];
      const reactionIx = newReactions.findIndex((reactionData) => reactionData.reactionCode === reactionCode);

      newReactions[reactionIx].users = newReactions[reactionIx].users.filter(({ userId }) => (userId !== currentUserId));

      if (newReactions[reactionIx].users.length === 0) {
        newReactions.splice(reactionIx, 1);
      }

      setIsLoading(true);
      api.reactionsDelete(currentBoardID, currentUserId, postId, reactionCode)
        .then(() => {
          setReactions(newReactions);
          setIsLoading(false);
        });

    } else {
      // add

      // Do not add reaction if limit is reached
      if (isReactionsLimitReached) {
        setLimitTooltipVisible(true);
        setTimeout(() => {
          setLimitTooltipVisible(false);
        }, 1500);
        return;
      }

      const newUser = {
        userId: currentUserId,
        userLogin: currentUserLogin,
        reactedAt: Math.floor(Date.now() / 1000),
      };

      const newReactions = [...reactions];
      const reactionIx = newReactions.findIndex((reactionData) => reactionData.reactionCode === reactionCode);
      if (reactionIx === -1) {
        newReactions.push({
          reactionCode,
          users: [newUser],
        });
      } else {
        newReactions[reactionIx].users = [...newReactions[reactionIx].users, newUser]
      }

      setIsLoading(true);
      api.reactionsAdd(currentBoardID, currentUserId, postId, reactionCode)
        .then(() => {
          setReactions(newReactions);
          setIsLoading(false);
        });

    }
  };


  const handleReactionCounterClick = (reactionCode: string) => {
    logger.debug('[onClick()]', reactionCode);
    toggleReaction(reactionCode);
  }

  const renderedLimitTooltipContent = (
    <div className='reaction-limit-tooltip-content'>
      {`Вы не можете оставить больше ${config.limitReactionsNumber} реакций`}
    </div>
  );

  const renderedReactionCounters = reactionsSorted.map((reactionData) => (
    <Flipped key={reactionData.reactionCode} flipId={reactionData.reactionCode}>
      <div>
        <ReactionCounter
          reactionCode={reactionData.reactionCode}
          users={reactionData.users}
          disabled={isLoading || (currentUserId === 1)}
          onClick={handleReactionCounterClick}
        />
      </div>
    </Flipped>
  ));

  return (
    <Tippy
      content={renderedLimitTooltipContent}
      className="reaction-limit-tooltip-tippy-box"
      visible={limitTooltipVisible}
      placement="bottom-start"
      arrow={false}
      sticky={true}
      plugins={[sticky]}
    >
      <div>
        <Flipper flipKey={[
          Number((currentUserId !== 1) && !isReactionsLimitReached).toString(),
          ...reactionsSorted.map((reactionData) => reactionData.reactionCode),
        ].join('|')}>
          <div className="reactions-container">
            {(currentUserId !== 1) && !isReactionsLimitReached && (
              <ReactionPicker
                disabled={isLoading || (currentUserId === 1)}
                onSelected={(reactionCode) => {
                  logger.debug('[onSelected()]', reactionCode);
                  toggleReaction(reactionCode);
                }}
              />
            )}
            <div className="reaction-counters-container">
              {renderedReactionCounters}
              {isLoading ? (
                <LoadingIcon size={26} />
              ) : null}
            </div>
          </div>
        </Flipper>
      </div>
    </Tippy>
  );
}

export default ReactionsContainer;
