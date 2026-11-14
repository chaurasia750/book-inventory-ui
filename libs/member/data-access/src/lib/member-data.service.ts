import { Injectable, signal, computed, inject } from '@angular/core';
import { MemberDetail, MemberProfileService, MediaService } from '@org/api-services';
import { switchMap, tap, of } from 'rxjs';

export interface DashboardStats {
  todayIncome: number;
  walletBalance: number;
  teamBusiness: number;
  leftBV: number;
  rightBV: number;
  directMembers: number;
  teamMembers: number;
  totalIncome: number;
}

@Injectable({ providedIn: 'root' })
export class MemberDataService {
  private readonly profileApi = inject(MemberProfileService);
  private readonly mediaApi = inject(MediaService);
  private readonly _member = signal<MemberDetail | null>(null);
  private readonly _rawProfileImage = signal<string | number | null>(null);
  private readonly _rawSponsorProfileImage = signal<string | number | null>(null);
  private readonly _loading = signal(true);
  private readonly _imageUploading = signal(false);
  private readonly _notificationCount = signal(3);
  private readonly _profileImage = signal<string | null>(null);

  readonly member = this._member.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly imageUploading = this._imageUploading.asReadonly();
  readonly notificationCount = this._notificationCount.asReadonly();
  readonly profileImage = this._profileImage.asReadonly();

  readonly memberProfileImageUrl = computed(() => {
    const raw = this._rawProfileImage();
    if (typeof raw === 'number') return this.mediaApi.getFileUrl(raw);
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return this.mediaApi.getFileUrl(Number(raw));
    return null;
  });

  readonly sponsorProfileImageUrl = computed(() => {
    const raw = this._rawSponsorProfileImage();
    if (typeof raw === 'number') return this.mediaApi.getFileUrl(raw);
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return this.mediaApi.getFileUrl(Number(raw));
    return null;
  });

  readonly stats = computed<DashboardStats | null>(() => {
    const m = this._member();
    if (!m) return null;
    return {
      todayIncome: m.todayIncome,
      walletBalance: m.walletBalance,
      teamBusiness: m.totalBusiness,
      leftBV: m.leftBV,
      rightBV: m.rightBV,
      directMembers: m.directMembers,
      teamMembers: m.teamMembers,
      totalIncome: m.totalIncome,
    };
  });

  readonly fullName = computed(() => this._member()?.fullName ?? '');
  readonly loginId = computed(() => this._member()?.loginId ?? '');
  readonly memberId = computed(() => this._member()?.memberId ?? '');
  readonly registrationNumber = computed(() => this._member()?.memberId ?? '');
  readonly email = computed(() => this._member()?.email ?? '');
  readonly phone = computed(() => this._member()?.phone ?? '');
  readonly joiningDate = computed(() => this._member()?.joiningDate ?? '');
  readonly status = computed(() => this._member()?.status ?? 'Inactive');
  readonly sponsorName = computed(() => this._member()?.sponsorName ?? '');
  readonly sponsorId = computed(() => this._member()?.sponsorId ?? '');
  readonly sponsorPhone = computed(() => this._member()?.sponsorPhone ?? '');
  readonly address = computed(() => this._member()?.address ?? '');
  readonly initials = computed(() => {
    const name = this.fullName();
    if (!name) return '';
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  });

  loadMember(_memberId?: string): void {
    this._loading.set(true);
    this.profileApi.getProfile().subscribe({
      next: (profile) => {
        const addressParts = profile.address
          ? [profile.address.houseNo, profile.address.street, profile.address.city, profile.address.state, profile.address.zipCode].filter(Boolean)
          : [];

        const sponsorName = profile.sponsorDetails
          ? [profile.sponsorDetails.fName, profile.sponsorDetails.lName].filter(Boolean).join(' ').trim()
          : '';

        const detail: MemberDetail = {
          id: profile.id,
          loginId: profile.loginId ?? '',
          fullName: [profile.title, profile.firstName, profile.lastName].filter(Boolean).join(' ').trim(),
          memberId: profile.memberId ?? '',
          userName: profile.loginId ?? '',
          email: profile.emailId ?? '',
          phone: profile.primaryContactNumber ?? '',
          whatsapp: profile.secondaryContactNumber ?? '',
          rank: '',
          packageName: '',
          status: 'Active',
          sponsorName,
          sponsorId: profile.sponsorDetails?.loginId ?? '',
          sponsorPhone: profile.sponsorDetails?.primaryContactNumber ?? '',
          placement: profile.introSide ?? '',
          joiningDate: profile.registrationDate ?? '',
          activationDate: profile.registrationDate ?? '',
          address: addressParts.join(', '),
          state: profile.address?.state ?? '',
          district: '',
          country: '',
          pan: profile.panCard ?? '',
          aadhaar: profile.aadhaarNo ?? '',
          nominee: '',
          walletBalance: 0,
          totalIncome: 0,
          todayIncome: 0,
          totalBusiness: 0,
          leftBV: 0,
          rightBV: 0,
          carryForwardBV: 0,
          directMembers: 0,
          teamMembers: 0,
          currentRank: '',
          currentPackage: '',
        };
        this._member.set(detail);
        this._rawProfileImage.set(profile.profileImage ?? null);
        this._rawSponsorProfileImage.set(profile.sponsorDetails?.profileImage ?? null);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      },
    });
  }

  uploadProfileImage(file: File) {
    this._imageUploading.set(true);
    return this.mediaApi.tempUpload([file]).pipe(
      switchMap((result) => {
        const fileId = result.files?.[0]?.id;
        if (fileId) {
          return this.profileApi.updateProfileImage(fileId).pipe(
            tap(() => {
              this._rawProfileImage.set(fileId);
              this._profileImage.set(null);
              this._imageUploading.set(false);
            }),
          );
        }
        this._imageUploading.set(false);
        return of(null);
      }),
      tap({ error: () => this._imageUploading.set(false) }),
    );
  }

  setProfileImage(image: string | null): void {
    this._profileImage.set(image);
  }

  clear(): void {
    this._member.set(null);
    this._rawProfileImage.set(null);
    this._rawSponsorProfileImage.set(null);
    this._loading.set(true);
    this._profileImage.set(null);
  }
}
