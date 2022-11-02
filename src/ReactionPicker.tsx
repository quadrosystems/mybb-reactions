import React from 'react';
import * as EmojiMart from 'emoji-mart';
import cx from 'classnames';

import * as emojiUtils from './utils/emoji';

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 32 448 448"
    width="14"
    height="14"
    style={{
      color: '#464646',
    }}
  >
    <path
      fill="currentColor"
      d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
    />
  </svg>
)

// -----------------------------------------------------------------------------

type ReactionPickerProps = {
  disabled: boolean;
  onSelected?: (reactionCode: string) => void;
};


const ReactionPicker: React.FC<ReactionPickerProps> = (props) => {
  const { onSelected, disabled } = props;

  const [isOpen, setIsOpen] = React.useState(false);

  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    const checkIfClickedOutside = (ev: MouseEvent) => {
      if (isOpen && ref.current && !ref.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", checkIfClickedOutside);
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  }, [isOpen]);

  // хак из-за несвежего `@types/emoji-mart` в котором не все пропы
  const EmojiMartPicker = EmojiMart.Picker as any;

  return (
    <div className="reaction-picker" ref={ref}>
      <button
        className={cx(
          'reaction-picker-button',
          'reaction-chip',
          // { "reaction-chip--clicked": isOpen },
          { 'reaction-chip--disabled': disabled },
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
      >
        {/* <span>{'+'}</span> */}
        <PlusIcon />
      </button>
      {isOpen && (
        <div className="reaction-picker-panel">
          <EmojiMartPicker
            set='apple'
            showSkinTones={false}
            showPreview={false}
            emojiTooltip={true}
            emojiSize={20}
            custom={emojiUtils.getCustomEmojiDataAll()}
            onSelect={(emoji: EmojiMart.EmojiData) => {
              setIsOpen(false);
              onSelected && onSelected(emoji.id);
            }}
            include={emojiUtils.getCategoriesOrder()}
            i18n={emojiUtils.getI18nConfig()}
          />
        </div>
      )}
    </div>
  );
}

export default ReactionPicker;
