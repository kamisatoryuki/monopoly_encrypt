export interface StorySlide {
  title: string;
  paragraphs: string[];
}

export interface CryptoniaStory {
  title: string;
  year: string;
  tagline: string;
  city: string;
  prologue: {
    kicker: string;
    slides: StorySlide[];
    startLabel: string;
    skipLabel: string;
    nextLabel: string;
    backLabel: string;
  };
  menu: {
    eyebrow: string;
    subtitle: string;
    newGame: string;
    continueGame: string;
    story: string;
    howToPlay: string;
    encryptionGuide: string;
    settings: string;
    footer: string;
  };
  setup: {
    heading: string;
    intro: string;
    nameLabel: string;
    tokenLabel: string;
    addPlayer: string;
    removePlayer: string;
    startGame: string;
    profileLabel: string;
    keyLabel: string;
    developmentWarning: string;
    developmentConfirm: string;
    demoLabel: string;
    invalidNames: string;
    duplicateNames: string;
    duplicateTokens: string;
    invalidToken: string;
    playerCount: string;
  };
  gameIntro: {
    title: string;
    text: string;
    dismiss: string;
  };
  decks: {
    chance: {
      label: string;
      framing: string;
      instruction: string;
    };
    communityChest: {
      label: string;
      framing: string;
      instruction: string;
    };
  };
  jail: {
    title: string;
    visiting: string;
    detained: string;
    entry: string;
  };
  bankruptcy: {
    title: string;
    text: string;
    settled: string;
  };
  winner: {
    title: string;
    text: string;
    neutral: string;
    playAgain: string;
    backToMenu: string;
  };
  flavor: {
    purchase: string[];
    payment: string[];
    goSalary: string[];
    auction: string[];
    jail: string[];
    build: string[];
  };
}
