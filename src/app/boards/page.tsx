import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BoardCard } from "@/components/BoardCard";
import { Navbar } from "@/components/Navbar";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BoardRole } from "@/types/supabase";

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boards } = await supabase
    .from("boards")
    .select("*, board_members!inner(role, user_id)")
    .order("created_at", { ascending: false });

  const userBoards = (boards ?? []).map((board) => {
    const membership = Array.isArray(board.board_members)
      ? board.board_members.find((m: { user_id: string }) => m.user_id === user.id)
      : board.board_members;
    return {
      ...board,
      userRole: (membership?.role ?? "viewer") as BoardRole,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Boards</h1>
          <Link href="/boards/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          </Link>
        </div>

        {userBoards.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              No boards yet
            </h2>
            <p className="text-muted-foreground mb-4">
              Create your first board to get started
            </p>
            <Link href="/boards/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBoards.map((board) => (
              <BoardCard
                key={board.id}
                title={board.title}
                slug={board.slug}
                role={board.userRole}
                createdAt={board.created_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
