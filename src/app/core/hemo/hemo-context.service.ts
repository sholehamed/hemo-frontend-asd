import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService as CompanyAuthService } from '../../Shared/Services/AuthService';
import { environment } from '../../../environments/environment';
import type { AdmissionCapabilities } from '../auth/auth.service';
import type { RequestCapabilities } from '../../features/blood-requests/blood-request-model';
import type { BankCapabilities } from '../../features/blood-bank/bank-model';
import type { TransferCapabilities } from '../../features/transfusion/transfer-model';
import type { HvCapabilities } from '../../features/hemovigilance/hv-model';
import type { QualityCapabilities } from '../../features/quality/quality-model';

interface HemoCapabilities {
  admission: AdmissionCapabilities | null;
  requests: RequestCapabilities | null;
  bank: BankCapabilities | null;
  transfer: TransferCapabilities | null;
  hv: HvCapabilities | null;
  quality: QualityCapabilities | null;
}
const empty = (): HemoCapabilities => ({
  admission: null, requests: null, bank: null, transfer: null, hv: null, quality: null
});

/**
 * HEMO UI capabilities only. Company AuthService owns login, role and token;
 * company AuthInterceptor owns headers, refresh and error handling.
 * No authentication, role selection, menu construction or browser storage here.
 * Wiring into navigation/role lifecycle is a separate R02 integration step.
 */
@Injectable({ providedIn: 'root' })
export class HemoContextService {
  private readonly auth = inject(CompanyAuthService);
  private readonly http = inject(HttpClient);
  private readonly data = signal<HemoCapabilities>(empty());
  private readonly loading = signal(false);
  private generation = 0;
  private role = 0;
  // In-memory comparison marker only: invalidate cached capabilities when the
  // company session changes. Never persisted or used to authorize a request.
  private sessionMarker: string | null = null;

  private isCurrent(): boolean {
    return this.role > 0 && this.auth.UserIsAthenticated() &&
      this.auth.GetUserRole() === this.role &&
      this.auth.GetAccessToken() === this.sessionMarker;
  }

  read(): HemoCapabilities {
    return this.isCurrent() ? this.data() : empty();
  }
  checking(): boolean {
    return this.isCurrent() && this.loading();
  }
  reset(): void {
    ++this.generation;
    this.role = 0;
    this.sessionMarker = null;
    this.data.set(empty());
    this.loading.set(false);
  }

  async refresh(): Promise<boolean> {
    this.reset();
    const role = this.auth.GetUserRole();
    const token = this.auth.GetAccessToken();
    if (!Number.isFinite(role) || role <= 0 || !token || !this.auth.UserIsAthenticated()) return false;
    this.role = role;
    this.sessionMarker = token;
    const generation = this.generation;
    this.loading.set(true);
    const get = <T>(module: string): Promise<T | null> =>
      firstValueFrom(this.http.get<T>(environment.apiUrl.replace(/\/+$/, '') + '/Identity/' + module + '/Capabilities'))
        .catch(() => null);
    try {
      const [admission, requests, bank, transfer, hv, quality] = await Promise.all([
        get<AdmissionCapabilities>('PatientAdmission'),
        get<RequestCapabilities>('BloodRequest'),
        get<BankCapabilities>('BloodBank'),
        get<TransferCapabilities>('Transfusion'),
        get<HvCapabilities>('Hemovigilance'),
        get<QualityCapabilities>('HemoQuality')
      ]);
      if (generation !== this.generation || !this.isCurrent()) return false;
      this.data.set({ admission, requests, bank, transfer, hv, quality });
      return true;
    } finally {
      if (generation === this.generation) {
        if (!this.isCurrent()) this.reset();
        else this.loading.set(false);
      }
    }
  }
}
