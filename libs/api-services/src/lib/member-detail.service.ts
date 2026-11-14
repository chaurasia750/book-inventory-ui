import { Injectable, signal } from '@angular/core';

export interface MemberDetail {
  id: number;
  loginId: string;
  fullName: string;
  memberId: string;
  userName: string;
  email: string;
  phone: string;
  whatsapp: string;
  rank: string;
  packageName: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Blocked';
  sponsorName: string;
  sponsorId: string;
  sponsorPhone: string;
  placement: string;
  joiningDate: string;
  activationDate: string;
  address: string;
  state: string;
  district: string;
  country: string;
  pan: string;
  aadhaar: string;
  nominee: string;
  walletBalance: number;
  totalIncome: number;
  todayIncome: number;
  totalBusiness: number;
  leftBV: number;
  rightBV: number;
  carryForwardBV: number;
  directMembers: number;
  teamMembers: number;
  currentRank: string;
  currentPackage: string;
}

@Injectable({ providedIn: 'root' })
export class MemberDetailService {
  readonly member = signal<MemberDetail | null>(null);
  readonly loading = signal(true);

  loadMember(memberId: string): void {
    this.loading.set(true);

    const mock: MemberDetail = {
      id: 1,
      loginId: 'RAJESH001',
      fullName: 'Rajesh Kumar Sharma',
      memberId,
      userName: 'RAJESH001',
      email: 'rajesh.sharma@email.com',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      rank: 'Gold Executive',
      packageName: 'Premium Business Pack',
      status: 'Active',
      sponsorName: 'Amit Singh',
      sponsorId: 'MEM000001',
      sponsorPhone: '+91 98765 12345',
      placement: 'Left Team',
      joiningDate: '15 Jan 2025',
      activationDate: '18 Jan 2025',
      address: '123, MG Road, Indira Nagar, Lucknow',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      country: 'India',
      pan: 'ABCDE1234F',
      aadhaar: 'XXXX-XXXX-1234',
      nominee: 'Sunita Sharma (Spouse)',
      walletBalance: 45250,
      totalIncome: 189500,
      todayIncome: 1250,
      totalBusiness: 875000,
      leftBV: 425000,
      rightBV: 450000,
      carryForwardBV: 15000,
      directMembers: 24,
      teamMembers: 156,
      currentRank: 'Gold Executive',
      currentPackage: 'Premium Business Pack',
    };

    setTimeout(() => {
      this.member.set(mock);
      this.loading.set(false);
    }, 300);
  }

  clear(): void {
    this.member.set(null);
    this.loading.set(true);
  }
}
