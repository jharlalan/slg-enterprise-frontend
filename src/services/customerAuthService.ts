import { apiClient } from "@/services/apiClient";
import { tokenStorage } from "@/services/tokenStorage";
import type { Gender } from "@/types/customer";
import type { CustomerAddress } from "@/types/address";

interface CustomerLoginResponse {
  access_token: string;
  token_type: string;
  customer_id: string;
  full_name: string;
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  gender: Gender;
  email?: string;
  village_code: string;
  address: CustomerAddress;
  password: string;
  aadhaar_number?: string;
}

export const customerAuthService = {
  async register(payload: RegisterPayload): Promise<CustomerLoginResponse> {
    const { data } = await apiClient.post<CustomerLoginResponse>("/customer-auth/register", payload);
    tokenStorage.setToken(data.access_token);
    tokenStorage.setRoles(["CUSTOMER"]);
    tokenStorage.setDisplayName(data.full_name);
    return data;
  },

  async passwordLogin(phone: string, password: string): Promise<CustomerLoginResponse> {
    const { data } = await apiClient.post<CustomerLoginResponse>("/customer-auth/login", { phone, password });
    tokenStorage.setToken(data.access_token);
    tokenStorage.setRoles(["CUSTOMER"]);
    tokenStorage.setDisplayName(data.full_name);
    return data;
  },

  async requestOtp(phone: string): Promise<void> {
    await apiClient.post("/customer-auth/otp/request", { phone });
  },

  async verifyOtp(phone: string, otpCode: string): Promise<CustomerLoginResponse> {
    const { data } = await apiClient.post<CustomerLoginResponse>("/customer-auth/otp/verify", {
      phone,
      otp_code: otpCode,
    });
    tokenStorage.setToken(data.access_token);
    tokenStorage.setRoles(["CUSTOMER"]);
    tokenStorage.setDisplayName(data.full_name);
    return data;
  },

  logout(): void {
    tokenStorage.clear();
  },
};
