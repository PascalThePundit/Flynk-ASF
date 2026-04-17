export type BadgeStatus = 'none' | 'grey' | 'gold';
export type UserRole = 'member' | 'forum_head' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  forumIds: string[];
  badgeStatus: BadgeStatus;
  isForumHead: boolean;
  forumHeadOf: string | null;
  birthday: number | null; // Timestamp in milliseconds
  formFilled: boolean;
  duesPaid: boolean;
  role: UserRole;
  fcmToken: string | null;
  createdAt: number;
  phone: string | null;
  department: string | null;
  level: string | null;
  bio: string | null;
}

export interface Forum {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  forumHeadId: string | null;
  iconPath?: string;
  color?: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userBadge: BadgeStatus;
  type: 'image' | 'text';
  mediaUrl?: string; // For images
  textContent?: string; // For text stories
  backgroundColor?: string;
  createdAt: number;
  expiresAt: number;
  viewers: string[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userBadge: BadgeStatus;
  content: string;
  mediaUrl?: string | null;
  createdAt: number;
  likes: string[];
}

