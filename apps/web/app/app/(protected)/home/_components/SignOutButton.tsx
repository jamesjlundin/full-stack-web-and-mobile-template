"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Signed out successfully");
        router.push("/");
        router.refresh();
      } else {
        toast.error("Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("An error occurred while signing out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={handleSignOut} disabled={loading}>
      {loading ? (
        <Spinner size="sm" className="mr-2" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
