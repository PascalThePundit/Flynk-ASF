import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { BadgeStatus, UserRole } from '../../types';

interface UserBadgeProps {
  status: BadgeStatus;
  role?: UserRole;
  isForumHead?: boolean;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ status, role, isForumHead }) => {
  return (
    <div className="flex items-center gap-1">
      {status === 'gold' && (
        <CheckCircle2 className="w-4 h-4 text-[#D4A843] fill-[#D4A843]/10" />
      )}
      {status === 'grey' && (
        <CheckCircle2 className="w-4 h-4 text-gray-400 fill-gray-100" />
      )}
      {/* Forum Head indicator */}
      {isForumHead && (
        <span className="text-[#0A1628]" title="Forum Head">⭐</span>
      )}
      {/* Admin indicator (only internally visible usually, but useful for profiles) */}
      {role === 'admin' && (
        <ShieldAlert className="w-4 h-4 text-[#0A1628]" title="Admin" />
      )}
    </div>
  );
};
