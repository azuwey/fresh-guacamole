import React, { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export default function Input(props: Props) {
  return (
    <input
      className="justify-center py-2 px-4 caret-emerald-600 shadow-sm text-sm rounded-md ring-1 ring-emerald-600 focus:outline-none focus:ring-2"
      {...props}
    />
  );
}