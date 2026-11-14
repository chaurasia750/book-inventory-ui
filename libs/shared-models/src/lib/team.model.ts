export interface TeamSummary {
  directReferrals: number;
  indirectMembers: number;
  totalTeam: number;
}

export interface TeamMember {
  regNo: number;
  loginId: string;
  name: string;
  mobile: string | null;
  email: string | null;
  profileImage: string | null;
  sponsorName: string | null;
  sponsorLoginId: string | null;
  kitName: string | null;
  kitPV: number | null;
  joinDate: string | null;
  level: number;
  relationshipType: string;
  hasChildren: boolean;
}

export interface PagedTeamResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: TeamMember[];
}

export interface TeamApiResponse {
  data: PagedTeamResponse;
  errorCode: number;
  errorDescription: string | null;
  message: string | null;
}

export interface TeamHierarchyNode {
  regNo: number;
  loginId: string;
  name: string;
  memberId?: string;
  mobile?: string;
  joinDate?: string;
  profileImage?: string;
  status?: string;
  hasChildren: boolean;
  directReferralCount: number;
  totalTeamCount: number;
}

export interface HierarchyResponse {
  currentMember: TeamHierarchyNode | null;
  children: TeamHierarchyNode[];
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
}

export interface PagedHierarchyChildrenResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: TeamHierarchyNode[];
}

export interface TeamFilter {
  page: number;
  pageSize: number;
  search?: string;
  status?: number;
  sortBy?: 'regno' | 'name' | 'joindate';
  descending?: boolean;
  memberId?: string;
}

export interface LevelSummary {
  level: number;
  memberCount: number;
  activeMembers: number;
  inactiveMembers: number;
  totalBusiness: number;
  totalIncome: number;
}

export interface LevelMember {
  regNo: number;
  loginId: string;
  name: string;
  mobile: string;
  email: string;
  profileImage: string;
  joinDate: string | null;
  status: number;
  level: number;
  directReferralCount: number;
  totalTeamCount: number;
  kitName: string | null;
  kitPV: number | null;
}

export interface PagedLevelMemberResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  items: LevelMember[];
}

export interface LevelMemberFilter {
  level: number;
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'name' | 'joindate' | 'regno' | 'loginid';
  descending?: boolean;
  memberId?: string;
}
