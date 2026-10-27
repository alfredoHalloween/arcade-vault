import type { RecentScore, TopPlayer } from "./types";

export const RECENT_SCORES: RecentScore[] = [
  { player: "NEONFOX", gameId: "caida", score: 184220, ago: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", gameId: "gloton", score: 96400, ago: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", gameId: "invasores", score: 54190, ago: "hace 8 min", color: "green" },
  { player: "VAULT_07", gameId: "rocas", score: 41200, ago: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", gameId: "bloque-buster", score: 28450, ago: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", gameId: "serpentina", score: 7820, ago: "hace 24 min", color: "green" },
  { player: "CYBER_LU", gameId: "ranaria", score: 18900, ago: "hace 31 min", color: "yellow" },
];

export const TOP_PLAYERS: TopPlayer[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];
