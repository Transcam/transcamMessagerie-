import { httpService } from "./http-service";
import { UserRole } from "@/types/role";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  role?: UserRole;
}

export const userService = {
  list: async (): Promise<User[]> => {
    const response = await httpService.get("/users");
    return response.data.data;
  },

  getOne: async (id: number): Promise<User> => {
    const response = await httpService.get(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserDTO): Promise<User> => {
    const response = await httpService.post("/users", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserDTO): Promise<User> => {
    const response = await httpService.patch(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpService.delete(`/users/${id}`);
  },
};

