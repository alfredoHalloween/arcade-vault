"use server";
import { createClient } from "@/lib/supabase/server";
export type SubmitScoreState = { ok: boolean; error?: string };
const MAX_NAME = 16;
const MAX_SCORE = 9_999_999;
const GENERIC_ERROR = "No se pudo guardar la puntuación. Inténtalo de nuevo.";
export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<SubmitScoreState> {
  if (typeof gameId !== "string" || !gameId) {
    return { ok: false, error: "Juego no válido." };
  }
  if (typeof playerName !== "string") {
    return { ok: false, error: "Escribe un nombre de 1 a 16 caracteres." };
  }
  const name = playerName.trim().toUpperCase();
  if (name.length < 1 || [...name].length > MAX_NAME) {
    return { ok: false, error: "Escribe un nombre de 1 a 16 caracteres." };
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { ok: false, error: "Puntuación no válida." };
  }
  try {
    const supabase = await createClient();
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .maybeSingle();
    if (gameError) {
      console.error("[submitScore] Error al consultar games:", gameError);
      return { ok: false, error: GENERIC_ERROR };
    }
    if (!game) return { ok: false, error: "Juego no válido." };
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: gameId, player_name: name, score });
    if (error) {
      console.error("[submitScore] Error al insertar en scores:", error);
      return { ok: false, error: GENERIC_ERROR };
    }
  } catch (err) {
    console.error("[submitScore] Error inesperado:", err);
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true };
}
