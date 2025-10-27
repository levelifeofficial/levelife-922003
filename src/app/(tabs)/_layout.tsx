import { User, ListTodo, Sparkles, ShoppingBag, TrendingUp, Lightbulb, Settings } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";

export default function TabLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state } = useGame();
  const iconSize = 24;
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';
  
  const tabs = [
    { path: "/", title: "Status", icon: User },
    { path: "/quests", title: "Quests", icon: ListTodo },
    { path: "/classes", title: "Classes", icon: Sparkles },
    { path: "/marketplace", title: "Market", icon: ShoppingBag },
    { path: "/progress", title: "Growth", icon: TrendingUp },
    { path: "/protips", title: "Tips", icon: Lightbulb },
    { path: "/settings", title: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      <nav 
        className="flex items-center justify-around border-t"
        style={{
          backgroundColor: '#0F0F0F',
          borderTopColor: '#1A1A1A',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const color = isActive ? themeColor : '#666';
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center py-2 px-4 min-w-0 flex-1"
            >
              <Icon size={iconSize} color={color} />
              <span 
                className="text-[11px] font-semibold mt-1"
                style={{ color }}
              >
                {tab.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
