export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
}

export const loginApi = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const registerApi = async (
  data: RegisterData
): Promise<AuthResponse> => {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
