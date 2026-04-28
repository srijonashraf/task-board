import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createBoard } from "@/lib/actions/board.actions";

export default function NewBoardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create a new board</CardTitle>
            <CardDescription>
              Give your board a name and start collaborating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBoard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Board name</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Sprint Planning"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Create Board
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
