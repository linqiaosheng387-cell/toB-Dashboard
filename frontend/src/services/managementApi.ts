/**
 * 权限管理服务的 HTTP client（fetch 封装）。
 * Base URL 可通过 Vite 环境变量 VITE_API_BASE 覆盖，默认指向本地后端。
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://127.0.0.1:6563/api/v1";

export type AccountStatus = "active" | "blocked";

export interface AccountDetail {
  id: number;
  account: string;
  company: string;
  status: AccountStatus;
  created_at: string;
  last_login_at: string | null;
  resource_keys: string[];
}

export interface TemplateDetail {
  id: number;
  name: string;
  description: string | null;
  is_builtin: number;
  created_at: string;
  updated_at: string;
  resource_keys: string[];
}

export interface LoginGrant {
  account: string;
  company: string;
  status: AccountStatus;
  resource_keys: string[];
}

export interface AccountCreatePayload {
  account: string;
  password: string;
  company: string;
  resource_keys: string[];
}

export interface AccountUpdatePayload {
  company?: string;
  password?: string;
  status?: AccountStatus;
  resource_keys?: string[];
}

export interface TemplateCreatePayload {
  name: string;
  description?: string | null;
  resource_keys: string[];
}

export interface TemplateUpdatePayload {
  name?: string;
  description?: string | null;
  resource_keys?: string[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.detail === "string" ? body.detail : response.statusText;
  } catch {
    return response.statusText;
  }
}

export const managementApi = {
  // 认证
  login(account: string, password: string): Promise<LoginGrant> {
    return request("/auth/login", {
      method: "POST",
      body: { account, password },
    });
  },
  changePassword(
    account: string,
    oldPassword: string,
    newPassword: string
  ): Promise<AccountDetail> {
    return request("/auth/change-password", {
      method: "POST",
      body: {
        account,
        old_password: oldPassword,
        new_password: newPassword,
      },
    });
  },

  // 账号
  listAccounts(): Promise<AccountDetail[]> {
    return request("/accounts");
  },
  getAccount(accountId: number): Promise<AccountDetail> {
    return request(`/accounts/${accountId}`);
  },
  createAccount(payload: AccountCreatePayload): Promise<AccountDetail> {
    return request("/accounts", { method: "POST", body: payload });
  },
  updateAccount(
    accountId: number,
    payload: AccountUpdatePayload
  ): Promise<AccountDetail> {
    return request(`/accounts/${accountId}`, {
      method: "PATCH",
      body: payload,
    });
  },
  deleteAccount(accountId: number): Promise<void> {
    return request(`/accounts/${accountId}`, { method: "DELETE" });
  },
  resetPassword(
    accountId: number,
    newPassword?: string
  ): Promise<AccountDetail> {
    return request(`/accounts/${accountId}/reset-password`, {
      method: "POST",
      body: { new_password: newPassword ?? null },
    });
  },
  applyTemplate(accountId: number, templateId: number): Promise<AccountDetail> {
    return request(
      `/accounts/${accountId}/apply-template?template_id=${templateId}`,
      { method: "POST" }
    );
  },

  // 模板
  listTemplates(): Promise<TemplateDetail[]> {
    return request("/templates");
  },
  getTemplate(templateId: number): Promise<TemplateDetail> {
    return request(`/templates/${templateId}`);
  },
  createTemplate(payload: TemplateCreatePayload): Promise<TemplateDetail> {
    return request("/templates", { method: "POST", body: payload });
  },
  updateTemplate(
    templateId: number,
    payload: TemplateUpdatePayload
  ): Promise<TemplateDetail> {
    return request(`/templates/${templateId}`, {
      method: "PATCH",
      body: payload,
    });
  },
  deleteTemplate(templateId: number): Promise<void> {
    return request(`/templates/${templateId}`, { method: "DELETE" });
  },
};
