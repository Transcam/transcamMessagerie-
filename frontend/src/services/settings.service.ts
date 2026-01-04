import { httpService } from "./http-service";

export interface Settings {
  id: string;
  company_logo_url: string | null;
  updated_at: string;
}

export interface UpdateSettingsDTO {
  company_logo_url?: string;
}

export const settingsService = {
  get: async (): Promise<Settings> => {
    const response = await httpService.get("/settings");
    return response.data.data;
  },

  update: async (data: UpdateSettingsDTO): Promise<Settings> => {
    const response = await httpService.patch("/settings", data);
    return response.data.data;
  },

  uploadLogo: async (file: File): Promise<{ company_logo_url: string }> => {
    const formData = new FormData();
    formData.append("logo", file);
    
    const response = await httpService.post("/settings/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};

