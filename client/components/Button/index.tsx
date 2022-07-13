import React, { ButtonHTMLAttributes } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  label: string
}

export default function Button({ label, ...props }: Props) {
  return (
    <button
      className="justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
      {...props}
    >
      {label}
    </button>
  );
}