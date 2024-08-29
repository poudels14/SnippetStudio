"use client";
import { Theme } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutGrid,
  Mail,
  Calendar,
  Settings,
  Users,
  BarChart,
  FileJson,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import "./style.css";

const miniApps = [{ name: "JSON Filter", icon: FileJson, path: "/jsonfilter" }];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <html lang="en">
      <body>
        <Theme>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Snippet Studio
                </h1>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <nav className="space-y-2 p-2">
                  {miniApps.map((app) => (
                    <Button
                      key={app.name}
                      variant={
                        pathname.startsWith(app.path) ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => router.push(app.path, { scroll: false })}
                    >
                      <app.icon className="mr-2 h-4 w-4" />
                      {app.name}
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </aside>
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </Theme>
      </body>
    </html>
  );
}
