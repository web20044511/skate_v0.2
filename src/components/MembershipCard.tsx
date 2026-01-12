import { Membership, UserMembership } from "@/types/database";
import { Calendar, Gift, Crown, Star, Flame, Zap, Trophy, Heart, Award, Copy, QrCode, Share2, Download } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface MembershipCardProps {
  userMembership: (UserMembership & { membership: Membership | null }) & {
    status?: "active" | "expired" | "pending" | "queued";
    queuePosition?: number | null;
    nextActivationDate?: string | null;
  };
  onRenew?: () => void;
  onManage?: () => void;
}

const iconMap: Record<string, any> = {
  Star,
  Crown,
  Flame,
  Zap,
  Gift,
  Trophy,
  Heart,
  Award,
};

const colorMap: Record<string, string> = {
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  blue: "#3B82F6",
  purple: "#A855F7",
  emerald: "#10B981",
};

const gradientMap: Record<string, string> = {
  silver: "from-slate-100 to-slate-50",
  gold: "from-amber-100 to-yellow-50",
  platinum: "from-gray-100 to-slate-50",
  blue: "from-blue-100 to-cyan-50",
  purple: "from-purple-100 to-pink-50",
  emerald: "from-emerald-100 to-green-50",
};

const MembershipCard = ({
  userMembership,
  onRenew,
  onManage,
}: MembershipCardProps) => {
  const membership = userMembership.membership;
  const [showBenefits, setShowBenefits] = useState(false);

  if (!membership) {
    console.warn("[MEMBERSHIP_CARD] Missing membership data for user membership:", userMembership);
    return null;
  }

  const IconComponent = iconMap[membership.icon || "Star"] || Star;
  const color = colorMap[membership.color || "silver"];
  const gradientClass = gradientMap[membership.color || "silver"];

  const startDate = new Date(userMembership.start_date);
  const endDate = new Date(userMembership.end_date);
  const now = new Date();

  // Use status from queue processing if available, otherwise calculate
  const membershipStatus = userMembership.status || (userMembership.is_active && now <= endDate ? "active" : "expired");
  const isActive = membershipStatus === "active";
  const isQueued = membershipStatus === "queued";
  const isPending = membershipStatus === "pending";

  const daysRemaining = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const percentageRemaining = Math.max(
    0,
    Math.min(100, (daysRemaining / membership.duration_days) * 100)
  );

  // For queued memberships, calculate days until activation
  const nextActivationDate = userMembership.nextActivationDate ? new Date(userMembership.nextActivationDate) : null;
  const daysUntilActivation = nextActivationDate
    ? Math.ceil((nextActivationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleCopyMembershidId = () => {
    navigator.clipboard.writeText(userMembership.id.toString());
    toast.success("Membership ID copied!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${membership.name} Membership`,
        text: `Check out the ${membership.name} membership at our store!`,
        url: window.location.href,
      });
    } else {
      toast.info("Share functionality not supported on this device");
    }
  };

  const membershipNumber = String(userMembership.id).padStart(6, "0");

  return (
    <div className="perspective">
      {/* Main Card */}
      <div
        className={`relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 ${
          isActive
            ? `bg-gradient-to-br ${gradientClass} border-2 border-green-200`
            : "bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-300"
        }`}
        style={{
          boxShadow: isActive
            ? `0 8px 20px ${color}25`
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${color}, transparent 50%), radial-gradient(circle at 80% 80%, ${color}, transparent 50%)`,
              pointerEvents: "none",
            }}
          />
        </div>

        <div className="relative p-4 sm:p-6 md:p-8">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <span
              className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {isActive ? "🟢 ACTIVE" : "⚪ EXPIRED"}
            </span>
            <span className="text-xs font-mono text-gray-500 truncate">
              ID: {membershipNumber}
            </span>
          </div>

          {/* Header with Icon and Title */}
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300"
              style={{
                backgroundColor: color + "20",
                border: `2px solid ${color}`,
              }}
            >
              <IconComponent className="w-7 h-7 sm:w-9 sm:h-9" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                {membership.name}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                {isActive ? "Your premium membership" : "Membership expired"}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4 sm:mb-6" />

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Price */}
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold tracking-wider mb-1">
                Plan Price
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹{membership.price.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                for {membership.duration_days} days
              </p>
            </div>

            {/* Validity */}
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold tracking-wider mb-1">
                Status
              </p>
              {isActive ? (
                <div>
                  <p
                    className={`text-lg sm:text-2xl font-bold ${
                      daysRemaining <= 7 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {daysRemaining}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">days remaining</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-400">Expired</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.abs(daysRemaining)} days ago
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isActive && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-semibold">
                  Time Remaining
                </p>
                <p className="text-xs text-gray-600 font-semibold">
                  {Math.round(percentageRemaining)}%
                </p>
              </div>
              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${percentageRemaining}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}66`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                  Start Date
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {startDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                  Expiry Date
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {endDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          {membership.benefits && (membership.benefits as any)?.list?.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowBenefits(!showBenefits)}
                className="w-full flex items-center justify-between p-3 bg-white/50 rounded-lg transition-colors"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Benefits & Perks
                </span>
                <span className={`transition-transform duration-300 ${showBenefits ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {showBenefits && (
                <div className="mt-3 p-3 sm:p-4 bg-white/40 rounded-lg backdrop-blur-sm">
                  <ul className="space-y-2 sm:space-y-3">
                    {(membership.benefits as any).list.map(
                      (benefit: string, index: number) => (
                        <li
                          key={index}
                          className="flex gap-3 items-start text-xs sm:text-sm text-gray-700"
                        >
                          <span
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          {benefit}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm transition-colors"
              onClick={handleCopyMembershidId}
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Copy ID</span>
              <span className="sm:hidden">ID</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm transition-colors"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">Share</span>
            </Button>

            {isActive && onRenew && (
              <Button
                size="sm"
                className="col-span-2 gap-1 sm:gap-2 text-xs sm:text-sm bg-gradient-to-r transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${color}, ${color}dd)`,
                }}
                onClick={onRenew}
              >
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Renew Membership
              </Button>
            )}

            {!isActive && onRenew && (
              <Button
                size="sm"
                className="col-span-2 gap-1 sm:gap-2 text-xs sm:text-sm bg-gradient-to-r transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${color}, ${color}dd)`,
                }}
                onClick={onRenew}
              >
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Reactivate Membership
              </Button>
            )}

            {onManage && (
              <Button
                variant="ghost"
                size="sm"
                className="col-span-2 text-xs sm:text-sm transition-colors"
                onClick={onManage}
              >
                Manage Settings
              </Button>
            )}
          </div>
        </div>

        {/* Decorative corner accent */}
        <div
          className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 opacity-5"
          style={{
            background: `radial-gradient(circle, ${color}, transparent)`,
          }}
        />
      </div>
    </div>
  );
};

export default MembershipCard;
