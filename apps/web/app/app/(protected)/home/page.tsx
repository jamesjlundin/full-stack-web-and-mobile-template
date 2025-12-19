import { Home, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getServerSession } from "../../../../lib/session";

import { SignOutButton } from "./_components/SignOutButton";

export default async function ProtectedHomePage() {
  const { user } = await getServerSession();

  const displayName = user?.name || user?.email || "User";

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your protected area
            </p>
          </div>
          <Badge variant="secondary">Protected</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your current session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Signed in as</AlertTitle>
              <AlertDescription className="font-medium">
                {displayName}
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/home">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Link>
              </Button>
              <SignOutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
