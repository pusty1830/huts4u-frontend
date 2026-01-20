import { createAxiosClient } from "./axiosConfig";
import { jwtDecode } from "jwt-decode";

const BASE_URL = 'http://localhost:8080/api/'


// const BASE_URL = 'https://api.huts4u.com/api'


export function getCurrentAccessToken() {
    return localStorage.getItem('accessToken');
}

export function isLoggedIn() {
    if (localStorage.getItem('accessToken')) {
        return true;
    }
    else {
        return false;
    }
}

export async function logout() {
    localStorage.clear();
    window.location.href = '/';
    return 0;
}


export function setCurrentAccessToken(accessToken: any) {
    return localStorage.setItem('accessToken', accessToken)
}

export function setCurrentUser(user: any) {
    return localStorage.setItem('user', user)
}


export function getphoneNumber(): string {
    let token: any = localStorage.getItem('accessToken');
    if (token) {
        let decoded: any = jwtDecode(token);
        // console.log("user Details bro!=",decoded)
        return decoded.phoneNumber || '';
    }
    else {
        return '';
    }
}

export function getUserId(): string {
    let token: any = localStorage.getItem('accessToken');
    if (token) {
        let decoded: any = jwtDecode(token);
        // console.log("user Details bro!=",decoded)
        return decoded.id || '';
    }
    else {
        return '';
    }
}

export function getUserRole(): string {
    let token: any = localStorage.getItem('accessToken');
    if (token) {
        let decoded: any = jwtDecode(token);
        // console.log("user Details bro!=",decoded)
        return decoded.role || '';
    }
    else {
        return '';
    }
}

export function getUserName():string{
    let token: any = localStorage.getItem('accessToken');
    if (token) {
        let decoded: any = jwtDecode(token);
        // console.log("user Details bro!=",decoded)
        return decoded.name || '';
        }else {
            return '';
        }

}



export const client = createAxiosClient({
    options: {
        baseURL: BASE_URL,
        timeout: 300000,
        headers: {
        }
    },
    getCurrentAccessToken,
})
