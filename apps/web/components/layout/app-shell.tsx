import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    name?: string;
  } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
