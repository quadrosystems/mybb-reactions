import React from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';

import ReactionCounter from './ReactionCounter';
import ReactionPicker from './ReactionPicker';
import LoadingIcon from './LoadingIcon';
import * as api from './api';
import * as emojiUtils from './utils/emoji';
import logger from './utils/logger';

// =============================================================================

// Сортировка по кол-ву и дате, в убывающем порядке.
const reactionsComparator = (reactionA: api.ReactionData, reactionB: api.ReactionData) => {
  const countA = reactionA.users.length;
  const countB = reactionB.users.length;

  const lastReactedAtA = Math.max( ...reactionA.users.map(({ reactedAt }) => reactedAt) );
  const lastReactedAtB = Math.max( ...reactionB.users.map(({ reactedAt }) => reactedAt) );

  if (countA > countB) {
    return -1;
  }
  if (countA < countB) {
    return 1;
  }
  if (countA === countB) {
    return lastReactedAtB - lastReactedAtA;
  }
}

// =============================================================================

type ReactionsContainerProps = {
  postId: number,
  reactions: Record<string, api.ReactionData>,
};

const ReactionsContainer: React.FC<ReactionsContainerProps> = (props) => {
  const { postId, reactions: initialReactions } = props;

  const [reactions, setReactions] = React.useState<Record<string, api.ReactionData>>(initialReactions);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const currentUserId: number = (window as any)['UserID'];
  const currentUserLogin: string = (window as any)['UserLogin'];

  const currentBoardID: number = (window as any)['BoardID'];


  const toggleReaction = (reactionCode: string) => {
    const currentUserReactionCodes = Object.values(reactions).reduce<string[]>((acc, { reactionCode, users }) => {
      const user = users.find(({ userId }) => (userId === currentUserId));
      if (user) {
        acc.push(reactionCode);
      }
      return acc;
    }, []);

    if (currentUserReactionCodes.includes(reactionCode)) {
      // delete

      const newReactions = {
        ...reactions,
        [reactionCode]: {
          reactionCode,
          users: reactions[reactionCode].users.filter(({ userId }) => (userId !== currentUserId)),
        }
      };
      if (newReactions[reactionCode].users.length === 0) {
        delete newReactions[reactionCode];
      }

      setIsLoading(true);
      api.reactionsDelete(currentBoardID, currentUserId, postId, reactionCode)
        .then(() => {
          setReactions(newReactions);
          setIsLoading(false);
        });

    } else {
      // add

      const newUser = {
        userId: currentUserId,
        userLogin: currentUserLogin,
        reactedAt: Math.floor(Date.now() / 1000),
      };

      const newReaction = reactions[reactionCode] ? ({
        reactionCode,
        users: [...reactions[reactionCode].users, newUser],
      }) : ({
        reactionCode,
        users: [newUser],
      });

      const newReactions = {
        ...reactions,
        [reactionCode]: newReaction,
      };

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

  const reactionsSortedArr = Object.values(reactions).sort(reactionsComparator);

  const renderedReactionCounters = reactionsSortedArr.map((reactionData) => (
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
    <Flipper flipKey={reactionsSortedArr.map((reactionData) => reactionData.reactionCode).join('')}>
      <div className="reactions-container">
        {(currentUserId !== 1) && (
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
          ) : (
            null
          )}
        </div>
      </div>
    </Flipper>
  );
}

export default ReactionsContainer;
