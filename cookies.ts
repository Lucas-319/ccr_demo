type ConsentValue = 'accepted' | 'declined';

// Simple cookie management using native API
const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
};

const getCookie = (name: string): string | undefined => {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
        }
    }
    return undefined;
};

const removeCookie = (name: string) => {
    setCookie(name, '', -1);
};

const CONSENT_COOKIE = 'ccr_cookie_consent';
const LOGIN_COOKIE = 'ccr_login';
const PASSWORD_COOKIE = 'ccr_password';

export const getCookieConsent = (): ConsentValue | undefined => {
    return getCookie(CONSENT_COOKIE) as ConsentValue | undefined;
};

export const setCookieConsent = (value: ConsentValue) => {
    setCookie(CONSENT_COOKIE, value, 365);
};

export const clearLoginCookies = () => {
    removeCookie(LOGIN_COOKIE);
    removeCookie(PASSWORD_COOKIE);
};

export const setLoginCookies = (login: string, password: string) => {
    setCookie(LOGIN_COOKIE, login, 30);
    setCookie(PASSWORD_COOKIE, password, 30);
};

export const getLoginCookies = (): { login?: string; password?: string } => {
    return {
        login: getCookie(LOGIN_COOKIE),
        password: getCookie(PASSWORD_COOKIE),
    };
};
