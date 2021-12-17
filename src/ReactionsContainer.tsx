import React from 'react';

import ReactionCounter from './ReactionCounter';
import ReactionPicker from './ReactionPicker';
import LoadingIcon from './LoadingIcon';
import * as api from './api';
import * as emojiUtils from './utils/emoji';
import logger from './utils/logger';

// =============================================================================

const TEST_DATA2: api.PostData = {
  "postId": 2,
  "reactions": {
    "derelict_house_building": {
      "reactionCode": "derelict_house_building",
      "users": [
        {
          "userId": 2,
          "userLogin": "alois",
        }
      ],
    },
    "grinning": {
      "reactionCode": "grinning",
      "users": [
        {
          "userId": 2,
          "userLogin": "alois",
        },
        {
          "userId": 4,
          "userLogin": "alois_test2",
        }
      ]
    },
    "woman-woman-girl-boy": {
      "reactionCode": "woman-woman-girl-boy",
      "users": [
        {
          "userId": 4,
          "userLogin": "alois_test2",
        }
      ]
    },
  },
};

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
      const newReaction = reactions[reactionCode] ? ({
        reactionCode,
        users: [...reactions[reactionCode].users, { userId: currentUserId, userLogin: currentUserLogin }],
      }) : ({
        reactionCode,
        users: [{ userId: currentUserId, userLogin: currentUserLogin }],
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



  const renderedReactionCounters = emojiUtils.getIdsInCanonicalOrder()
    .filter((reactionCode) => (reactions[reactionCode]))
    .map((reactionCode) => (
      <ReactionCounter
        key={reactionCode}
        reactionCode={reactionCode}
        users={reactions[reactionCode].users}
        disabled={isLoading || (currentUserId === 1)}
        onClick={(reactionCode) => {
          logger.debug('[onClick()]', reactionCode);
          toggleReaction(reactionCode);
        }}
      />
    ));

  return (
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
      {renderedReactionCounters}
      {isLoading ? (
        <LoadingIcon size={26} />
      ) : (
        null
      )}
    </div>
  );
}

export default ReactionsContainer;
