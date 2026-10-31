// Checks each password rule. Used by signup and reset-password.
export function checkPassword(password: string) {
  return {
    length: password.length > 8, // more than 8 = at least 9
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function allRulesPass(password: string) {
  const r = checkPassword(password);
  return r.length && r.upper && r.lower && r.special;
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={ok ? "text-green-600" : "text-gray-400"}>
      {ok ? "✓" : "○"} {text}
    </li>
  );
}

export function PasswordChecklist({ password }: { password: string }) {
  const r = checkPassword(password);
  return (
    <ul className="mt-2 space-y-1 text-xs">
      <Rule ok={r.length} text="More than 8 characters (at least 9)" />
      <Rule ok={r.upper} text="One uppercase letter" />
      <Rule ok={r.lower} text="One lowercase letter" />
      <Rule ok={r.special} text="One special character (like ! @ # $)" />
    </ul>
  );
}