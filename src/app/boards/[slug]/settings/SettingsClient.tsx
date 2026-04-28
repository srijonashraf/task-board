"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2, UserMinus } from "lucide-react";
import { updateBoard, deleteBoard } from "@/lib/actions/board.actions";
import { updateMemberRole, removeMember } from "@/lib/actions/invite.actions";
import { toast } from "sonner";
import type { Board, BoardMember, Invite, BoardRole } from "@/types/supabase";

interface SettingsClientProps {
  board: Board;
  members: BoardMember[];
  invites: Invite[];
  role: BoardRole;
  currentUserId: string;
}

export function SettingsClient({
  board,
  members,
  invites,
  role,
  currentUserId,
}: SettingsClientProps) {
  const [title, setTitle] = useState(board.title);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleUpdateTitle() {
    if (!title.trim() || title.trim() === board.title) return;
    setSaving(true);
    try {
      await updateBoard(board.id, title.trim());
      toast.success("Board updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBoard() {
    if (!confirm("Delete this board? This action cannot be undone.")) return;
    try {
      await deleteBoard(board.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleRoleChange(memberId: string, newRole: BoardRole) {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success("Role updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(memberId);
      toast.success("Member removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/boards/${board.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to board
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Board Settings</CardTitle>
            <CardDescription>Manage your board configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardTitle">Board name</Label>
              <div className="flex gap-2">
                <Input
                  id="boardTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Button onClick={handleUpdateTitle} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>Manage who has access to this board</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {member.user_id === currentUserId ? "You" : "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user_id === currentUserId ? "You" : member.user_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "owner" ? (
                      <Badge>Owner</Badge>
                    ) : (
                      <>
                        {role === "owner" && (
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              handleRoleChange(member.id, v as BoardRole)
                            }
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {role !== "owner" && <Badge variant="secondary">{member.role}</Badge>}
                        {(role === "owner" || role === "admin") &&
                          member.user_id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites ({invites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites
                  .filter((i) => !i.accepted_at)
                  .map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{invite.role}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {role === "owner" && (
          <>
            <Separator />
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete this board and all its data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleDeleteBoard}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Board
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
