"use client";

import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { User, Info, Award, MapPin, LogOut } from "lucide-react";
import { useState } from "react";

interface ProfilePopupProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
  onSignOut?: () => void;
}

export function ProfilePopup({ user, onSignOut }: ProfilePopupProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");
  const [activePanel, setActivePanel] = useState<
    "information" | "achievements" | "pins" | "logout" | null
  >(null);

  const player = {
    name: user?.name ?? "Username",
    avatar:
      user?.image ??
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop",
  };

  const friends = [
    {
      name: "Friend 1",
      avatar:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop",
      status: "offline" as const,
    },
    {
      name: "Friend 2",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      status: "offline" as const,
    },
    {
      name: "Friend 3",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      status: "online" as const,
    },
  ];

  return (
    <div className="w-full max-w-5xl rounded-2xl border-2 border-[#06b6d4] bg-[#17233d] p-6 text-white shadow-2xl">
      <div className="mb-6 flex gap-2 border-b border-white/20">
        <button
          className={`flex-1 h-11 text-sm transition-all ${
            activeTab === "profile"
              ? "text-white border-b-2 border-[#06b6d4]"
              : "text-white/70 border-b-2 border-transparent hover:text-white"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button
          className={`flex-1 h-11 text-sm transition-all ${
            activeTab === "friends"
              ? "text-white border-b-2 border-[#06b6d4]"
              : "text-white/70 border-b-2 border-transparent hover:text-white"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
      </div>

      {activeTab === "profile" ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24 border-4 border-[#06b6d4]/40">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback className="bg-[#0f172a] text-white">
                {player.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h1 className="text-2xl font-semibold text-white">
                {player.name}
              </h1>
            </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              onClick={() => setActivePanel("information")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#06b6d4]/30 bg-[#0f172a]/60 transition-all hover:scale-110 hover:border-[#06b6d4] hover:bg-[#06b6d4]/10">
                <Info className="size-7 text-[#06b6d4]" />
              </div>
              <span className="text-xs text-white/70">Info</span>
            </button>

            <button
              onClick={() => setActivePanel("achievements")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#06b6d4]/30 bg-[#0f172a]/60 transition-all hover:scale-110 hover:border-[#06b6d4] hover:bg-[#06b6d4]/10">
                <Award className="size-7 text-[#06b6d4]" />
              </div>
              <span className="text-xs text-white/70">Achievements</span>
            </button>

            <button
              onClick={() => setActivePanel("pins")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#06b6d4]/30 bg-[#0f172a]/60 transition-all hover:scale-110 hover:border-[#06b6d4] hover:bg-[#06b6d4]/10">
                <MapPin className="size-7 text-[#06b6d4]" />
              </div>
              <span className="text-xs text-white/70">My Pins</span>
            </button>

            <button
              onClick={() => setActivePanel("logout")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-red-400/30 bg-[#0f172a]/60 transition-all hover:scale-110 hover:border-red-400 hover:bg-red-400/10">
                <LogOut className="size-7 text-red-400" />
              </div>
              <span className="text-xs text-white/70">Logout</span>
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0f172a]/60 p-4">
            {activePanel === null && (
              <div className="flex items-center gap-3 text-white/80">
                <User className="size-5 text-[#06b6d4]" />
                <p>Select an option to view more details.</p>
              </div>
            )}

            {activePanel === "information" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#06b6d4]">
                  Information
                </h2>
                <div className="rounded-lg border border-white/10 bg-[#0f172a]/60 p-3">
                  <p className="text-sm text-white/80">
                    <span className="font-semibold text-[#06b6d4]">
                      Username:
                    </span>{" "}
                    {player.name}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#0f172a]/60 p-3">
                  <p className="text-sm text-white/80">
                    <span className="font-semibold text-[#06b6d4]">
                      Member Since:
                    </span>{" "}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#0f172a]/60 p-3">
                  <p className="text-sm text-white/80">
                    <span className="font-semibold text-[#06b6d4]">
                      Status:
                    </span>{" "}
                    Online
                  </p>
                </div>
              </div>
            )}

            {activePanel === "achievements" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#06b6d4]">
                  Achievements
                </h2>
                {[
                  "First Pin Discovered",
                  "First Pin Placed",
                  "10% Explored",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f172a]/60 p-3"
                  >
                    <Award className="size-6 flex-shrink-0 text-[#06b6d4]" />
                    <div>
                      <p className="font-semibold text-white">{item}</p>
                      <p className="text-xs text-white/70">
                        Achievement unlocked on *Date*
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "pins" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#06b6d4]">
                  My Pins
                </h2>
                {["My Pin 1", "My Pin 2", "Friend 4's Pin"].map((pin) => (
                  <div
                    key={pin}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f172a]/60 p-3"
                  >
                    <MapPin className="size-6 flex-shrink-0 text-[#06b6d4]" />
                    <div>
                      <p className="font-semibold text-white">{pin}</p>
                      <p className="text-xs text-white/70">Made on *Date*</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "logout" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-red-300">Logout</h2>

                <p className="text-sm text-white/80">
                  Are you sure you want to logout?
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActivePanel(null)}
                    className="rounded-xl border border-white/20 bg-[#0f172a]/60 px-4 py-2 text-white/70 hover:bg-[#0f172a]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={onSignOut}
                    className="rounded-xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#06b6d4]">Friends</h2>
          {friends.map((friend) => (
            <div
              key={friend.name}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f172a]/60 p-3"
            >
              <Avatar className="size-12 flex-shrink-0 border-2 border-[#06b6d4]/30">
                <AvatarImage src={friend.avatar} />
                <AvatarFallback className="bg-[#0f172a] text-white">
                  {friend.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white">
                  {friend.name}
                </p>
                <p
                  className={`text-xs ${
                    friend.status === "online"
                      ? "text-[#06b6d4]"
                      : "text-white/60"
                  }`}
                >
                  {friend.status === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )
    </div>
  );
}
