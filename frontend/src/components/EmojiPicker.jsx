import EmojiPicker from "emoji-picker-react";

function EmojiPickerComponent({ onEmojiClick }) {
  const handleEmojiClick = (emojiData) => {
    onEmojiClick(emojiData.emoji);
  };

  return <EmojiPicker onEmojiClick={handleEmojiClick} />;
}

export default EmojiPickerComponent;