import React from 'react';
import { CheckCircle2, ShieldCheck, Crown, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BadgeStatus, UserRole } from '../../types';

interface UserBadgeProps {
  status: BadgeStatus;
  role?: UserRole;
  isForumHead?: boolean;
  className?: string;
  size?: number;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ status, role, isForumHead, className, size = 14 }) => {
  if (status === 'none' && !isForumHead && role !== 'admin') return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Forum Head / Admin Special Badge */}
      {role === 'admin' && (
        <div className="bg-brand/10 p-0.5 rounded-full" title="Admin">
          <ShieldCheck size={size + 2} className="text-brand fill-brand/20" />
        </div>
      )}
      
      {isForumHead && role !== 'admin' && (
        <div className="bg-gold/10 p-0.5 rounded-full" title="Forum Head">
          <Star size={size} className="text-gold fill-gold/20" />
        </div>
      )}

      {/* Verification Ticks */}
      {status === 'gold' && (
        <CheckCircle2 
          size={size} 
          className="text-brand fill-brand/20 shadow-sm" 
          strokeWidth={3}
          title="Gold Verified Member"
        />
      )}
      
      {status === 'grey' && (
        <CheckCircle2 
          size={size} 
          className="text-gray-400 opacity-60" 
          strokeWidth={2.5}
          title="Member"
        />
      )}
    </div>
  );
};
