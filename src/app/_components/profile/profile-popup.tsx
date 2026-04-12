import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Progress } from "./progress";
import { User, Info, Award, MapPin, LogOut } from "lucide-react";
import { useState } from "react";

interface ProfilePopupProps {
  trigger?: React.ReactNode;
}

export function ProfilePopup({ trigger }: ProfilePopupProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');

  // User info
  const player = {
    name: "Username",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop",
    progress: 63.3,
  };

  // Mock friends data
  const friends = [
    {
      name: "Friend 1",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop",
      status: "offline" as const,
    },
    {
      name: "Friend 2",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      status: "offline" as const,
    },
    {
      name: "Friend 3",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      status: "online" as const,
    },
  ];

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="default">
              <User className="mr-2 size-4" />
              View Profile
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-blue-950 to-blue-900 border-2 border-[#656A73]/40">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-2 border-b border-[#656A73]/40">
            <button
              className={`flex-1 h-10 bg-transparent text-sm transition-all ${
                activeTab === 'profile'
                  ? 'text-purple-100 border-b-2 border-[#656A73]/40'
                  : 'text-purple-300 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </button>
            <button
              className={`flex-1 h-10 bg-transparent text-sm transition-all ${
                activeTab === 'friends'
                  ? 'text-purple-100 border-b-2 border-[#656A73]/40'
                  : 'text-purple-300 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
          </div>

          {activeTab === 'profile' ? (
            <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-2 sm:py-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="size-20 sm:size-24 border-4 border-[#656A73]/40">
                  <AvatarImage src={player.avatar} alt={player.name} />
                  <AvatarFallback>{player.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Player Name */}
              <div className="text-center">
                <h3 className="font-semibold text-lg sm:text-xl text-purple-100">{player.name}</h3>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-1">
                <div className="flex justify-end">
                  <span className="text-xs text-purple-300">{player.progress}%</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#38bdf8] transition-all duration-300"
                    style={{ width: `${player.progress}%` }}
                  />
                </div>
              </div>

              {/* Circular Action Buttons */}
              <div className="flex gap-3 sm:gap-4 justify-center w-full py-2">
                <button
                  onClick={() => setOpenDialog('information')}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="size-14 sm:size-16 rounded-full bg-black/20 border-2 border-blue-400/30 flex items-center justify-center hover:bg-blue-400/20 hover:border-blue-400 hover:scale-110 transition-all">
                    <Info className="size-6 sm:size-7 text-blue-400" />
                  </div>
                  <span className="text-xs text-purple-300">Info</span>
                </button>
                
                <button
                  onClick={() => setOpenDialog('achievements')}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="size-14 sm:size-16 rounded-full bg-black/20 border-2 border-orange-400/30 flex items-center justify-center hover:bg-orange-400/20 hover:border-orange-400 hover:scale-110 transition-all">
                    <Award className="size-6 sm:size-7 text-orange-400" />
                  </div>
                  <span className="text-xs text-purple-300">Achievements</span>
                </button>
                
                <button
                  onClick={() => setOpenDialog('pins')}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="size-14 sm:size-16 rounded-full bg-black/20 border-2 border-green-400/30 flex items-center justify-center hover:bg-green-400/20 hover:border-green-400 hover:scale-110 transition-all">
                    <MapPin className="size-6 sm:size-7 text-green-400" />
                  </div>
                  <span className="text-xs text-purple-300">My Pins</span>
                </button>
                
                <button
                  onClick={() => setOpenDialog('logout')}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="size-14 sm:size-16 rounded-full bg-black/20 border-2 border-red-400/30 flex items-center justify-center hover:bg-red-400/20 hover:border-red-400 hover:scale-110 transition-all">
                    <LogOut className="size-6 sm:size-7 text-red-400" />
                  </div>
                  <span className="text-xs text-purple-300">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2 sm:py-4 max-h-[400px] overflow-y-auto space-y-2">
              {friends.map((friend, index) => (
                <div key={index} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
                  <Avatar className="size-10 sm:size-12 flex-shrink-0 border-2 border-[#656A73]/40">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-purple-100 text-sm sm:text-base truncate">{friend.name}</p>
                    <p className={`text-xs ${friend.status === 'online' ? 'text-green-400' : 'text-purple-400'}`}>
                      {friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Information Dialog */}
      <Dialog open={openDialog === 'information'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-blue-950/90 to-purple-950/90 border-blue-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-blue-300">Information</DialogTitle>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-2 sm:space-y-3">
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-purple-200">
                <span className="text-blue-400 font-semibold">Username:</span> {player.name}
              </p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-purple-200">
                <span className="text-blue-400 font-semibold">Member Since:</span> January 2026
              </p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-purple-200">
                <span className="text-blue-400 font-semibold">Status:</span> Online
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievements Dialog */}
      <Dialog open={openDialog === 'achievements'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-orange-950/90 to-purple-950/90 border-orange-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-orange-300">Achievements</DialogTitle>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-2">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Award className="size-6 flex-shrink-0 text-yellow-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">First Pin Discovered</p>
                <p className="text-xs text-purple-300">Discovered your first pin on *Date*</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Award className="size-6 flex-shrink-0 text-yellow-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">First Pin Placed</p>
                <p className="text-xs text-purple-300">Placed your first pin on *Date*</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Award className="size-6 flex-shrink-0 text-yellow-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">10% Explored</p>
                <p className="text-xs text-purple-300">Explored 10% of the Total Map on *Date*</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Friends Dialog */}
      <Dialog open={openDialog === 'friends'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-green-950/50 to-purple-950/50 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-green-300">Friends</DialogTitle>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-2">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Avatar className="size-10 sm:size-12 flex-shrink-0 border-2 border-green-400">
                <AvatarImage src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop" />
                <AvatarFallback>DK</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base truncate">DragonKing</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Avatar className="size-10 sm:size-12 flex-shrink-0 border-2 border-green-400">
                <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" />
                <AvatarFallback>MW</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base truncate">MysticWizard</p>
                <p className="text-xs text-purple-400">Offline</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <Avatar className="size-10 sm:size-12 flex-shrink-0 border-2 border-green-400">
                <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" />
                <AvatarFallback>PH</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base truncate">PhoenixHero</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Pins Dialog */}
      <Dialog open={openDialog === 'pins'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-green-950/90 to-purple-950/90 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-green-300">My Pins</DialogTitle>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-2">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <MapPin className="size-6 flex-shrink-0 text-green-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">My Pin 1</p>
                <p className="text-xs text-purple-300">Made on *Date*</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <MapPin className="size-6 flex-shrink-0 text-green-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">My Pin 2</p>
                <p className="text-xs text-purple-300">Made on *Date*</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <MapPin className="size-6 flex-shrink-0 text-green-400" />
              <div className="min-w-0">
                <p className="font-semibold text-purple-100 text-sm sm:text-base">Friend 4's Pin</p>
                <p className="text-xs text-purple-300">Discovered on *Date*</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={openDialog === 'logout'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-b from-red-950/90 to-purple-950/90 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-red-300">Logout</DialogTitle>
          </DialogHeader>
          <div className="py-2 sm:py-4 space-y-2">
            <p className="text-sm text-purple-200">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setOpenDialog(null)}
                className="bg-black/20 text-purple-300 hover:bg-black/30"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setOpenDialog(null)}
                className="bg-red-400 text-white hover:bg-red-500"
              >
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
