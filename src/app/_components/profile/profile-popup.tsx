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
    progress: 63.3,
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
    <div className="w-full max-w-5xl rounded-2xl border-2 border-[#656A73]/40 bg-gradient-to-b from-blue-950 to-blue-900 p-6 text-white shadow-2xl">
      <div className="mb-6 flex gap-2 border-b border-[#656A73]/40">
        <button
          className={`flex-1 h-11 text-sm transition-all ${
            activeTab === "profile"
              ? "text-purple-100 border-b-2 border-[#656A73]/40"
              : "text-purple-300 border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button
          className={`flex-1 h-11 text-sm transition-all ${
            activeTab === "friends"
              ? "text-purple-100 border-b-2 border-[#656A73]/40"
              : "text-purple-300 border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
      </div>

      {activeTab === "profile" ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24 border-4 border-[#656A73]/40">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback>{player.name[0]}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h1 className="text-2xl font-semibold text-purple-100">
                {player.name}
              </h1>
            </div>

            <div className="w-full max-w-md space-y-1">
              <div className="flex justify-end">
                <span className="text-xs text-purple-300">
                  {player.progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${player.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              onClick={() => setActivePanel("information")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-blue-400/30 bg-black/20 transition-all hover:scale-110 hover:border-blue-400 hover:bg-blue-400/20">
                <Info className="size-7 text-blue-400" />
              </div>
              <span className="text-xs text-purple-300">Info</span>
            </button>

            <button
              onClick={() => setActivePanel("achievements")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-orange-400/30 bg-black/20 transition-all hover:scale-110 hover:border-orange-400 hover:bg-orange-400/20">
                <Award className="size-7 text-orange-400" />
              </div>
              <span className="text-xs text-purple-300">Achievements</span>
            </button>

            <button
              onClick={() => setActivePanel("pins")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-green-400/30 bg-black/20 transition-all hover:scale-110 hover:border-green-400 hover:bg-green-400/20">
                <MapPin className="size-7 text-green-400" />
              </div>
              <span className="text-xs text-purple-300">My Pins</span>
            </button>

            <button
              onClick={() => setActivePanel("logout")}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-red-400/30 bg-black/20 transition-all hover:scale-110 hover:border-red-400 hover:bg-red-400/20">
                <LogOut className="size-7 text-red-400" />
              </div>
              <span className="text-xs text-purple-300">Logout</span>
            </button>
          </div>

          <div className="rounded-xl bg-black/20 p-4">
            {activePanel === null && (
              <div className="flex items-center gap-3 text-purple-200">
                <User className="size-5 text-blue-300" />
                <p>Select an option to view more details.</p>
              </div>
            )}

            {activePanel === "information" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-blue-300">
                  Information
                </h2>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold text-blue-400">
                      Username:
                    </span>{" "}
                    {player.name}
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold text-blue-400">
                      Member Since:
                    </span>{" "}
                    January 2026
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold text-blue-400">Status:</span>{" "}
                    Online
                  </p>
                </div>
              </div>
            )}

            {activePanel === "achievements" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-orange-300">
                  Achievements
                </h2>
                {[
                  "First Pin Discovered",
                  "First Pin Placed",
                  "10% Explored",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg bg-black/20 p-3"
                  >
                    <Award className="size-6 flex-shrink-0 text-yellow-400" />
                    <div>
                      <p className="font-semibold text-purple-100">{item}</p>
                      <p className="text-xs text-purple-300">
                        Achievement unlocked on *Date*
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "pins" && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-green-300">My Pins</h2>
                {["My Pin 1", "My Pin 2", "Friend 4's Pin"].map((pin) => (
                  <div
                    key={pin}
                    className="flex items-center gap-3 rounded-lg bg-black/20 p-3"
                  >
                    <MapPin className="size-6 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="font-semibold text-purple-100">{pin}</p>
                      <p className="text-xs text-purple-300">Made on *Date*</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "logout" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-red-300">Logout</h2>
                <p className="text-sm text-purple-200">
                  Are you sure you want to logout?
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setActivePanel(null)}
                    className="bg-black/20 text-purple-300 hover:bg-black/30"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-red-400 text-white hover:bg-red-500">
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-green-300">Friends</h2>
          {friends.map((friend) => (
            <div
              key={friend.name}
              className="flex items-center gap-3 rounded-lg bg-black/20 p-3"
            >
              <Avatar className="size-12 flex-shrink-0 border-2 border-[#656A73]/40">
                <AvatarImage src={friend.avatar} />
                <AvatarFallback>{friend.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-purple-100">
                  {friend.name}
                </p>
                <p
                  className={`text-xs ${
                    friend.status === "online"
                      ? "text-green-400"
                      : "text-purple-400"
                  }`}
                >
                  {friend.status === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
