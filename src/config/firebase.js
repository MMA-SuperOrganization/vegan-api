import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const APP_NAME = "vegan-api";

/**
 * Khởi tạo Firebase Admin một lần và trả về Auth instance.
 * Ưu tiên service account từ biến môi trường; nếu không có thì dùng
 * Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, GCP runtime...).
 * @param {{ projectId: string, clientEmail?: string, privateKey?: string }} firebaseEnv
 */
export const createFirebaseAuth = ({ projectId, clientEmail, privateKey }) => {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return getAuth(existing);

  const credential =
    clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault();

  const app = initializeApp({ credential, projectId }, APP_NAME);
  return getAuth(app);
};
