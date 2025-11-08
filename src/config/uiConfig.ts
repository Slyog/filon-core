export type ContextPosition = "bottom" | "side";

const config = {
  contextPosition: "bottom" as ContextPosition,
  contextMaxItems: 250,
  collapseMiniGraphBelow: 768,
};

export const uiConfig = config;

export const setContextPosition = (position: ContextPosition) => {
  config.contextPosition = position;
};

