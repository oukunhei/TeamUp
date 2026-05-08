export interface User {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  role: "USER" | "TEACHER" | "ADMIN";
  createdAt: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  type: "OPEN" | "COURSE";
  courseCode?: string;
  courseName?: string;
  semester?: string;
  joinCode?: string;
  isPublic: boolean;
  ownerId: string;
  owner?: User;
  members?: SpaceMember[];
  ideas?: Idea[];
  _count?: { members: number; ideas: number };
  createdAt: string;
}

export interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  role: "MEMBER" | "TEACHER" | "TA";
  joinedAt: string;
  user?: User;
}

export interface Idea {
  id: string;
  title: string;
  summary: string;
  detail?: string;
  requiredSkills: string[];
  teamSize?: number;
  status: "DRAFT" | "PUBLISHED" | "RECRUITING" | "IN_PROGRESS" | "COMPLETED";
  hash?: string;
  timestampedAt?: string;
  holderId: string;
  holder?: User;
  spaceId?: string;
  space?: Space;
  members?: IdeaMember[];
  applications?: Application[];
  documents?: Document[];
  _count?: { applications: number; members: number };
  createdAt: string;
  updatedAt: string;
  // 前端权限标记
  viewerMode?: boolean;
  canEdit?: boolean;
  canUpload?: boolean;
  canDownload?: boolean;
}

export interface IdeaMember {
  id: string;
  ideaId: string;
  userId: string;
  role: "HOLDER" | "MEMBER";
  joinedAt: string;
  user?: User;
}

export interface Application {
  id: string;
  ideaId: string;
  userId: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  reply?: string;
  isViewer: boolean;
  createdAt: string;
  updatedAt: string;
  idea?: Idea;
  user?: User;
}

export interface Document {
  id: string;
  ideaId: string;
  name: string;
  type: string;
  mimeType: string;
  path: string;
  size: number;
  fileHash?: string;
  version: number;
  uploadedBy: string;
  uploader?: User;
  createdAt: string;
  updatedAt: string;
  _count?: { versions: number };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageKey: string;
  fileSize: number;
  fileHash?: string;
  uploadedBy: string;
  comment?: string;
  createdAt: string;
  uploader?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content?: string;
  meta?: string;
  isRead: boolean;
  createdAt: string;
}

export interface TimestampCertificate {
  hash: string;
  title: string;
  summary: string;
  holder?: User;
  timestampedAt?: string;
  verified: boolean;
}
