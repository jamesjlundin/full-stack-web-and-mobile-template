import { Menu } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

import { SignOutMenuItem } from "./sign-out-menu-item";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  user?: {
    email?: string;
    name?: string;
  } | null;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

export function Header({ user }: HeaderProps) {
  const isAuthenticated = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-2 md:flex">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/app/home">App</Link>
                </Button>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(user?.name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.name && (
                          <p className="font-medium">{user.name}</p>
                        )}
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/app/home">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <SignOutMenuItem />
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Create account</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col space-y-4 mt-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-2 pb-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(user?.name, user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          {user?.name && (
                            <p className="font-medium">{user.name}</p>
                          )}
                          {user?.email && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/app/home"
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        App
                      </Link>
                      <Link
                        href="/app/home"
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        Dashboard
                      </Link>
                      <div className="pt-4 border-t">
                        <SignOutMenuItem asMobileLink />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
