"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { acceptInvite } from "@/lib/actions/invite.actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Suspense } from "react";

type InviteStatus = "loading" | "needsAuth" | "accepting" | "success" | "error";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const initialStatus: InviteStatus = token ? "loading" : "error";
  const [status, setStatus] = useState<InviteStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState(token ? "" : "Invalid invite link");
  const didRun = useRef(false);

  useEffect(() => {
    if (!token || didRun.current) return;
    didRun.current = true;

    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setStatus("needsAuth");
        return;
      }

      setStatus("accepting");
      try {
        const result = await acceptInvite(token!);
        if (cancelled) return;

        if (result.alreadyMember) {
          toast.info("You are already a member of this board");
        } else {
          toast.success("Invite accepted!");
        }
        setStatus("success");

        const supabaseInner = createClient();
        const { data: board } = await supabaseInner
          .from("boards")
          .select("slug")
          .eq("id", result.boardId)
          .single();

        if (board) {
          router.push(`/boards/${board.slug}`);
        } else {
          router.push("/boards");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to accept invite");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token || status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">
            {token ? "Error" : "Invalid Link"}
          </CardTitle>
          <CardDescription>
            {errorMessage || "This invite link is not valid."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/boards")}>
            Go to Boards
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "loading" || status === "accepting") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">
            {status === "loading" ? "Checking invite..." : "Accepting invite..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "needsAuth") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <LayoutDashboard className="h-10 w-10" />
          </div>
          <CardTitle>You&apos;ve been invited!</CardTitle>
          <CardDescription>
            Sign in or create an account to accept this invite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full"
            onClick={() => router.push(`/login?next=/invite?token=${token}`)}
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/signup?next=/invite?token=${token}`)}
          >
            Create account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        }
      >
        <InviteContent />
      </Suspense>
    </div>
  );
}
