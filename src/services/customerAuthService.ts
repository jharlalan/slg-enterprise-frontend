import { apiClient } from "@/services/apiClient";
import { tokenStorage } from "@/services/tokenStorage";

interface CustomerLoginResponse {
  access_token: string;
  token_type: string;
  customer_id: string;
  full_name: string;
}

export const customerAuthService = {
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
    return data;
  },

  logout(): void {
    tokenStorage.clear();
  },
};
