import { transitionPhase } from "./phaseTransition";
async function clearRound(game) {
  if (game.currentRound.partner.id) {
    game.previousTeam.partner = game.currentRound.partner.id;
  }

  if (game.currentRound.associate.id) {
    game.previousTeam.associate = game.currentRound.associate.id;
  }

  if (game.currentRound.paralegal.id) {
    game.previousTeam.paralegal = game.currentRound.paralegal.id;
  }

  game.currentRound.partner.id = null;
  game.currentRound.associate.id = null;
  game.currentRound.paralegal.id = null;
  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;
  await game.save();
}

export async function resetRoundAndTransition(game, phase) {
  await clearRound(game);
  await transitionPhase(game, phase);
}
