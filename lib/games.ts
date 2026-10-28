import { createClient } from "@/lib/supabase/server";
// Solo servidor: usa el cliente de servidor (cookies()), así que debe llamarse
// desde un contexto dinámico, dentro de <Suspense>.
// IDs de `games` ordenados por `created_at`; `null` si la consulta falla
// (el detalle va a console.error).
export async function getStoredGameIds(): Promise<string[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games")
      .select("id")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("getStoredGameIds:", error.message);
      return null;
    }
    return data.map((g) => g.id);
  } catch (err) {
    console.error("getStoredGameIds:", err);
    return null;
  }
}
