"use client";

/**
 * /tg-auth  — Telegram Mini App auth bridge
 *
 * Telegram bot "Open Marketplace" tugmasini bosganda shu sahifa ochiladi.
 * 1. window.Telegram.WebApp.initData ni o'qiydi
 * 2. /api/auth/telegram-webapp ga yuboradi
 * 3. JWT va user ni localStorage ga saqlaydi
 * 4. Asosiy sahifaga yo'naltiradi
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "loading" | "success" | "error";

export default function TgAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Kirish amalga oshirilmoqda...");

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;

    // Telegram WebApp kontekstida emasak — home'ga o'tkazamiz
    if (!tg || !tg.initData) {
      router.replace("/");
      return;
    }

    tg.ready();
    tg.expand();

    const initData: string = tg.initData;

    fetch("/api/auth/telegram-webapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.token) {
          // JWT va user ma'lumotlarini saqlaymiz
          localStorage.setItem("auth_token", data.data.token);
          localStorage.setItem("tg_user", JSON.stringify(data.data.user));

          setStatus("success");
          setMessage(`Xush kelibsiz, ${data.data.user.name}! ✅`);

          // 1 soniyadan keyin asosiy sahifaga o'tamiz
          setTimeout(() => router.replace("/"), 1000);
        } else {
          setStatus("error");
          setMessage(
            data.error ||
              "Kirish amalga oshmadi. Botda /start bosing va telefon raqamingizni yuboring."
          );
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Server bilan ulanishda xatolik. Qayta urinib ko'ring.");
      });
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        background: status === "error" ? "#fff5f5" : "#f5f5f5",
        textAlign: "center",
      }}
    >
      {status === "loading" && (
        <>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #e5e7eb",
              borderTopColor: "#111827",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: 20,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#374151", fontSize: 16 }}>{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <p style={{ color: "#16a34a", fontSize: 18, fontWeight: 600 }}>
            {message}
          </p>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Sahifa yuklanmoqda...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: "#dc2626", fontSize: 16, fontWeight: 600 }}>
            Kirish amalga oshmadi
          </p>
          <p style={{ color: "#374151", fontSize: 14, marginTop: 8 }}>
            {message}
          </p>
          <button
            onClick={() => router.replace("/")}
            style={{
              marginTop: 24,
              padding: "10px 24px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Baribir ochish
          </button>
        </>
      )}
    </div>
  );
}
