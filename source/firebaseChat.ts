import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail, updatePassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
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
export const commentsRefFor = (projectKey: string) => ref(chatDatabase, `comments/${projectKey}`);

const EMAIL_DOMAIN = 'chat.local';

export function chatEmailFor(username: string): string {
    return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

/**
 * Ленивая миграция на Firebase Auth проекта чата.
 * Вызывается ТОЛЬКО после успешной проверки пароля в r4ezka,
 * поэтому создать аккаунт в Firebase Auth от чужого имени нельзя:
 * без верного пароля сюда не попасть.
 *
 * Если аккаунт чата уже существует (например, пароль менялся на сайте,
 * а в Firebase Auth остался старый) — молча пропускаем: это не ошибка.
 */
export async function ensureFirebaseAuthUser(username: string, password: string): Promise<void> {
    const email = chatEmailFor(username);
    try {
        await signInWithEmailAndPassword(chatAuth, email, password);
        return;
    } catch {
        // вероятно, пароль не совпал (старый в Firebase Auth) или нет аккаунта
    }

    // Проверяем, существует ли аккаунт с таким email.
    let methods: string[] = [];
    try {
        methods = await fetchSignInMethodsForEmail(chatAuth, email);
    } catch {
        // не можем проверить — не мешаем входу
        return;
    }

    if (methods.length > 0) {
        // Аккаунт есть, но пароль не совпал. Обновить без старого пароля
        // нельзя — просто оставляем как есть (чат продолжит работать со старым).
        return;
    }

    // Аккаунта нет — создаём (createUser сам выполняет вход).
    try {
        await createUserWithEmailAndPassword(chatAuth, email, password);
    } catch (e: any) {
        if (e?.code === 'auth/email-already-in-use') return; // гонка — ок
        throw e;
    }
}

export async function logoutFirebase(): Promise<void> {
    try {
        await signOut(chatAuth);
    } catch {
        // ignore
    }
}

/**
 * Смена пароля в Firebase Auth (чат). Если аккаунта в Firebase Auth нет
 * (ещё не мигрировал) — молча пропускаем: база r4ezka уже обновлена.
 */
export async function changeFirebasePassword(username: string, currentPassword: string, newPassword: string): Promise<void> {
    const email = chatEmailFor(username);
    try {
        const cred = await signInWithEmailAndPassword(chatAuth, email, currentPassword);
        await updatePassword(cred.user, newPassword);
    } catch (e: any) {
        if (e?.code === 'auth/user-not-found') return; // ещё не мигрировал — пропускаем
        console.warn('FirebaseAuth password change failed (ignored):', e?.code || e?.message || '');
    }
}
