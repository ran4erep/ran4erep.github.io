import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAg9N0m22cVx_C4xz8JNLWEEEritOqML_Q",
    authDomain: "ran4erep-chat.firebaseapp.com",
    projectId: "ran4erep-chat",
    databaseURL: "https://ran4erep-chat-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "ran4erep-chat.appspot.com",
    messagingSenderId: "480010047491",
    appId: "1:480010047491:web:4bdfae90bccf9cd806fe36"
};

export const chatApp = initializeApp(firebaseConfig);
export const chatAuth = getAuth(chatApp);
export const chatDatabase = getDatabase(chatApp);
export const messagesRef = ref(chatDatabase, 'messages');

const EMAIL_DOMAIN = 'chat.local';

export function chatEmailFor(username: string): string {
    return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

/**
 * Ленивая миграция на Firebase Auth проекта чата.
 * Вызывается ТОЛЬКО после успешной проверки пароля в r4ezka,
 * поэтому создать аккаунт в Firebase Auth от чужого имени нельзя:
 * без верного пароля сюда не попасть.
 */
export async function ensureFirebaseAuthUser(username: string, password: string): Promise<void> {
    const email = chatEmailFor(username);
    try {
        await signInWithEmailAndPassword(chatAuth, email, password);
    } catch (error: any) {
        if (error && error.code === 'auth/user-not-found') {
            // Пользователь ещё не в Firebase Auth (например, регистрировался
            // в приложении) — добавляем его сейчас.
            await createUserWithEmailAndPassword(chatAuth, email, password);
            return;
        }
        // wrong-password или сетевая ошибка — не можем гарантировать доступ.
        throw error;
    }
}

export async function logoutFirebase(): Promise<void> {
    try {
        await signOut(chatAuth);
    } catch {
        // ignore
    }
}
