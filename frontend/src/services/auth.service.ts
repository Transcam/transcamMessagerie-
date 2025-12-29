import { httpService } from "./http-service";
import { UserRole } from "@/types/role";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: UserRole;
    created_at: string;
  };
}

export interface LoginDTO {
  username: string;
  password: string;
}

export const authService = {
  login: async (data: LoginDTO): Promise<LoginResponse> => {
    const response = await httpService.post("/users/login", data);
    return response.data;
  },
};

