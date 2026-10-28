import { createClient } from "@/lib/supabase/server";
import type { ScoreRow } from "@/app/data/types";
// Solo servidor: usa el cliente de servidor (cookies()), así que debe llamarse
// desde un contexto dinámico, dentro de <Suspense>.
export type Board = { id: "global" | string; title: string; rows: ScoreRow[] };
const TOP = 10;
function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
export async function getGameBoard(gameId: string): Promise<ScoreRow[] | null> {
  const supabase = await createClient();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle();
  if (gameError) throw new Error(`getGameBoard: ${gameError.message}`);
  if (!game) return null;
  return fetchGameRows(supabase, gameId);
}
export async function getBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const [gamesRes, globalRes] = await Promise.all([
    supabase
      .from("games")
      .select("id, title")
      .order("created_at", { ascending: true }),
    supabase
      .from("global_leaderboard")
      .select("player_name, total_score, updated_at")
      .order("total_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(TOP),
  ]);
  if (gamesRes.error) throw new Error(`getBoards: ${gamesRes.error.message}`);
  if (globalRes.error) throw new Error(`getBoards: ${globalRes.error.message}`);
  const globalRows: ScoreRow[] = globalRes.data.map((r, i) => ({
    rank: i + 1,
    name: r.player_name ?? "",
    score: Number(r.total_score ?? 0),
    date: formatDate(r.updated_at),
  }));
  const gameBoards = await Promise.all(
    gamesRes.data.map(async (g) => ({
      id: g.id,
      title: g.title,
      rows: await fetchGameRows(supabase, g.id),
    })),
  );
  return [{ id: "global", title: "GLOBAL", rows: globalRows }, ...gameBoards];
}
async function fetchGameRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameId: string,
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("game_leaderboard")
    .select("player_name, best_score, created_at")
    .eq("game_id", gameId)
    .order("best_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(TOP);
  if (error) throw new Error(`fetchGameRows(${gameId}): ${error.message}`);
  return data.map((r, i) => ({
    rank: i + 1,
    name: r.player_name ?? "",
    score: r.best_score ?? 0,
    date: formatDate(r.created_at),
  }));
}
