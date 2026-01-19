import { apiClient, ApiError } from "./client";
import type {
  ChatAttachment,
  ChatAttachmentUploadResponse,
  ChatSession,
  ChatSessionDetail,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Upload a file to the chat system
 * Files are uploaded as multipart/form-data
 */
export async function uploadChatFile(
  file: File,
  sessionId?: string
): Promise<ChatAttachmentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (sessionId) {
    formData.append("session_id", sessionId);
  }

  const headers: Record<string, string> = {};

  const accessToken = apiClient.getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const businessId = apiClient.getBusinessId();
  if (businessId) {
    headers["X-Business-ID"] = businessId;
  }

  const roleId = apiClient.getRoleId();
  if (roleId) {
    headers["X-Role"] = roleId;
  }

  const response = await fetch(`${API_BASE}/chat/files`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new ApiError(response.status, error.detail || "Upload failed", error);
  }

  return response.json();
}

/**
 * Get file metadata and extracted data
 */
export async function getChatFile(fileId: string): Promise<ChatAttachment> {
  return apiClient.get<ChatAttachment>(`/chat/files/${fileId}`);
}

/**
 * Get file download URL
 */
export function getChatFileDownloadUrl(fileId: string): string {
  const accessToken = apiClient.getAccessToken();
  const businessId = apiClient.getBusinessId();
  return `${API_BASE}/chat/files/${fileId}/download?token=${accessToken}&business_id=${businessId}`;
}

/**
 * Delete an uploaded file
 */
export async function deleteChatFile(fileId: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/chat/files/${fileId}`);
}

/**
 * List uploaded files
 */
export async function listChatFiles(sessionId?: string): Promise<ChatAttachment[]> {
  const params: Record<string, string> = {};
  if (sessionId) {
    params.session_id = sessionId;
  }
  return apiClient.get<ChatAttachment[]>("/chat/files", params);
}

/**
 * List chat sessions
 */
export async function listChatSessions(): Promise<ChatSession[]> {
  return apiClient.get<ChatSession[]>("/chat/sessions");
}

/**
 * Get session with messages
 */
export async function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
  return apiClient.get<ChatSessionDetail>(`/chat/sessions/${sessionId}`);
}
