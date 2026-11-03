// app/FieldError.tsx — フォームの欄の下に出す検証エラー（react-hook-form の errors を渡す。#70）

export default function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;
    return (
        <p id={id} role="alert" className="text-sm text-left text-red-500">
            {message}
        </p>
    );
}
