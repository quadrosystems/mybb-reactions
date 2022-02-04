import React from 'react';
import Tippy from '@tippyjs/react';
import * as EmojiMart from 'emoji-mart';
import cx from 'classnames';

import * as emojiUtils from './utils/emoji';
import * as api from './api';

// -----------------------------------------------------------------------------

const ReactionCounterTooltipContent: React.FC<{ users: api.UserData[] }> = (props) => {
  const { users } = props;

  const TOOLTIP_NAMES_MAX = 5;
  const currentUserId: number = (window as any)['UserID'];

  const names = [];
  let skippedCount = 0;

  for (let ix = 0; ix < users.length; ix++) {
    if (users[ix].userId !== currentUserId) {
      if (names.length < TOOLTIP_NAMES_MAX) {
        names.push(users[ix].userLogin);
      } else {
        skippedCount += 1;
      }
    } else {
      if (names.length < TOOLTIP_NAMES_MAX) {
        names.unshift('Вы');
      } else {
        names.pop();
        names.unshift('Вы');
      }
    }
  }

  const parts: [string, string, React.CSSProperties['fontWeight']][] = [];
  parts.push(['Прореагировали ', `part-1`, 'normal']);
  names.forEach((name, ix) => {
    parts.push([name, `part-name-${name}`, 'bold']);
    if (ix !== names.length-1) {
      if (ix === names.length-2 && skippedCount === 0) {
        parts.push([' и ', `part-sep-${ix}-и`, 'normal']);
      } else {
        parts.push([', ', `part-sep-${ix}-,`, 'normal']);
      }
    }
  })
  if (skippedCount > 0) {
    parts.push([' и ещё ', `part-2`, 'normal']);
    parts.push([`${skippedCount}`, `part-skippedCount`, 'bold']);
    parts.push([' пользователей', `part-3`, 'normal']);
  }
  parts.push(['.', `part-4`, 'normal']);

  return (
    <div className='reaction-counter-tooltip-content'>
      {parts.map(([text, key, fontWeight]) => (
        <span key={key} style={{ fontWeight }}>{text}</span>
      ))}
    </div>
  );

}

// -----------------------------------------------------------------------------

type ReactionCounterProps = {
  reactionCode: string;
  users: api.UserData[];
  disabled: boolean;
  onClick?: (reactionCode: string) => void;
};

const ReactionCounter: React.FC<ReactionCounterProps> = (props) => {
  const { reactionCode, users, disabled, onClick } = props;

  const handleClick = () => {
    if (!disabled) {
      onClick && onClick(reactionCode);
    }
  }

  const currentUserId: number = (window as any)['UserID'];

  const count = users.length;
  const reacted = users.find((user) => (user.userId === currentUserId)) !== undefined;


  const renderedTooltipContent = (
    <ReactionCounterTooltipContent users={users} />
  );

  const emojiData = reactionCode[0] !== '_' ? reactionCode : emojiUtils.getCustomEmojiDataById(reactionCode);

  const renderedButton = (
    <button
      className={cx(
        "reaction-counter",
        'reaction-chip',
        { "reaction-chip--clicked": reacted },
        { 'reaction-chip--disabled': disabled },
      )}
      onClick={handleClick}
    >
      <span className="reaction-counter__emoji">
        <EmojiMart.Emoji
          // emoji={':' + reactionCode + ':'}
          emoji={emojiData}
          set={'apple'}
          size={20}
        />
      </span>
      <span className="reaction-counter__count">
        {count.toString()}
      </span>
    </button>
  )

  return (
    <Tippy content={renderedTooltipContent}>
      {renderedButton}
    </Tippy>

  );
}

export default ReactionCounter;