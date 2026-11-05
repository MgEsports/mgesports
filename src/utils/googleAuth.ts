/**
 * Google Identity Services & OAuth 2.0 Client Utility
 * Provides native Google Sign-In popup and fallback authentication flows.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number | string;
            }
          ) => void;
          prompt: (notification?: (notification: any) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: {
              access_token: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export interface GoogleUserProfile {
  token?: string;
  credential?: string;
  email: string;
  name?: string;
  picture?: string;
  googleId?: string;
}

export const getGoogleClientId = (): string => {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (typeof envId === "string" && envId.trim().length > 0 && !envId.includes("your-google-client-id")) {
    return envId.trim();
  }
  return "";
};

export const isGoogleClientConfigured = (): boolean => {
  return getGoogleClientId().length > 0;
};

/**
 * Trigger official Google OAuth 2.0 Popup
 * Resolves with Google user profile (email, name, picture, access_token)
 */
export const openGoogleOAuthPopup = (): Promise<GoogleUserProfile> => {
  return new Promise((resolve, reject) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(new Error("GOOGLE_CLIENT_ID_NOT_CONFIGURED"));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity Services script not yet loaded. Please check your internet connection."));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          try {
            // Fetch verified profile directly from Google
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!userInfoRes.ok) {
              throw new Error("Failed to retrieve Google profile");
            }

            const profile = await userInfoRes.json();
            resolve({
              token: tokenResponse.access_token,
              email: profile.email,
              name: profile.name || profile.given_name,
              picture: profile.picture,
              googleId: profile.sub,
            });
          } catch (err: any) {
            reject(err);
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
};

/**
 * Redirect browser to Google Accounts sign-in page
 */
export const redirectToGoogleAccounts = (returnUrl?: string, role: string = "PLAYER"): void => {
  const currentUrl = returnUrl || window.location.href;
  const redirectTarget = `/api/auth/google?returnUrl=${encodeURIComponent(currentUrl)}&role=${role}`;
  window.location.href = redirectTarget;
};

